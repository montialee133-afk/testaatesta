require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory store
const rooms = {};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Expecting object: { topic, username }
    // Expecting object: { topic, username }
    socket.on('create_room', (data) => {
        const topic = data.topic || "General";
        const username = data.username || "Host";

        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            host: socket.id,
            guest: null,
            hostName: username,
            guestName: null,
            topic: topic,
            status: 'waiting',
            players: {
                [socket.id]: {
                    id: socket.id,
                    score: 0,
                    streak: 0,
                    questionIndex: 0,
                    finished: false,
                    name: username
                }
            },
            questions: []
        };
        socket.join(roomCode);
        socket.emit('room_created', roomCode);
        console.log(`Room ${roomCode} created by ${username} (${socket.id})`);
    });

    // Expecting object: { roomCode, username }
    socket.on('join_room', async (data) => {
        const roomCode = data.roomCode;
        const username = data.username || "Guest";

        const room = rooms[roomCode];
        if (room && room.status === 'waiting' && !room.guest) {
            room.guest = socket.id;
            room.guestName = username;

            // Initialize Guest Player State
            room.players[socket.id] = {
                id: socket.id,
                score: 0,
                streak: 0,
                questionIndex: 0,
                finished: false,
                name: username
            };

            socket.join(roomCode);
            room.status = 'playing';

            // Emit names too
            io.to(roomCode).emit('game_start', {
                roomCode,
                topic: room.topic,
                names: { host: room.hostName, guest: room.guestName }
            });
            console.log(`Game started in room ${roomCode}: ${room.hostName} vs ${room.guestName}`);

            // Generate ALL questions at start
            await generateQuestionsBatch(roomCode, room.topic);

            // Send first question to BOTH players independently
            Object.keys(room.players).forEach(playerId => {
                sendNextQuestion(roomCode, playerId);
            });

        } else {
            socket.emit('error', 'Room not found or full');
        }
    });

    socket.on('submit_answer', ({ roomCode, answerIndex, timeRemaining }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        const playerState = room.players[socket.id];
        if (!playerState || playerState.finished) return;

        const currentQ = room.questions[playerState.questionIndex];
        if (!currentQ) return;

        const isCorrect = answerIndex === currentQ.correctIndex;

        let points = 0;
        if (isCorrect) {
            // Scoring Logic:
            // Base: 100
            // Time Bonus: up to 50 points (linear approx 3.3 pts per sec remaining, assuming 15s max)
            // Streak Bonus: 20 points per streak count
            const basePoints = 100;
            const timeBonus = Math.round((timeRemaining || 0) * 3.33);
            const streakBonus = playerState.streak * 20;

            points = basePoints + timeBonus + streakBonus;

            playerState.score += points;
            playerState.streak++;

            console.log(`Player ${socket.id} Correct! Points: ${points} (Base: ${basePoints}, Time: ${timeBonus}, Streak: ${streakBonus})`);
        } else {
            playerState.streak = 0; // Reset streak
            console.log(`Player ${socket.id} Wrong.`);
        }

        // Move to next question
        playerState.questionIndex++;

        // Notify everyone of score updates (so opponent sees progress)
        io.to(roomCode).emit('score_update', {
            score: {
                host: room.players[room.host]?.score || 0,
                guest: room.players[room.guest]?.score || 0
            },
            streaks: {
                host: room.players[room.host]?.streak || 0,
                guest: room.players[room.guest]?.streak || 0
            }
        });

        // Check if finished
        if (playerState.questionIndex >= room.questions.length) {
            playerState.finished = true;
            socket.emit('player_finished'); // Notify this player they are done

            // Check if ALL finished
            const allFinished = Object.values(room.players).every(p => p.finished);
            if (allFinished) {
                io.to(roomCode).emit('game_over', {
                    host: room.players[room.host].score,
                    guest: room.players[room.guest].score
                });
                room.status = 'finished';
            } else {
                // Notify opponent that this player is done (optional UI cue)
                socket.to(roomCode).emit('opponent_finished', { opponentName: playerState.name });
            }
        } else {
            // Send next question immediately
            sendNextQuestion(roomCode, socket.id);
        }
    });

    socket.on('send_reaction', ({ roomCode, type }) => {
        // type: 'laugh', 'angry', 'clap'
        socket.to(roomCode).emit('reaction_received', type);
    });

    socket.on('request_rematch', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;

        // Initialize rematch flags if not present
        if (!room.rematchRequests) room.rematchRequests = new Set();

        room.rematchRequests.add(socket.id);

        // Notify other player that opponent wants rematch
        socket.to(roomCode).emit('rematch_requested');

        // If both requested (assuming 2 players)
        if (room.rematchRequests.size >= 2) {
            console.log(`Starting rematch in room ${roomCode}`);

            // Reset Game State
            room.rematchRequests.clear();
            room.status = 'playing';

            // Allow processing again
            Object.values(room.players).forEach(p => {
                p.score = 0;
                p.streak = 0;
                p.questionIndex = 0;
                p.finished = false;
            });

            // Generate NEW questions
            generateQuestionsBatch(roomCode, room.topic).then(() => {
                io.to(roomCode).emit('game_start', {
                    roomCode,
                    topic: room.topic,
                    names: { host: room.hostName, guest: room.guestName }
                });
                Object.keys(room.players).forEach(playerId => {
                    sendNextQuestion(roomCode, playerId);
                });
            });
        }
    });

    socket.on('disconnect', () => {
        // Handle disconnects
    });
});

async function generateQuestionsBatch(roomCode, topic) {
    const room = rooms[roomCode];
    if (!room) return;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Reverting to stable model
        const prompt = `Genera 10 domande di cultura generale su "${topic}" in ITALIANO. 
        Ogni domanda deve avere 4 opzioni e l'indice della risposta corretta.
        Restituisci ESCLUSIVAMENTE un array JSON valido in questo formato esatto:
        [
            { "question": "Domanda 1...", "options": ["A","B","C","D"], "correctIndex": 0 },
            { "question": "Domanda 2...", "options": ["A","B","C","D"], "correctIndex": 2 }
        ]`;

        console.log(`Generating questions for ${topic}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let questionsData;
        try {
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            questionsData = JSON.parse(jsonText);

            if (Array.isArray(questionsData)) {
                room.questions = questionsData;
                console.log(`Generated ${questionsData.length} questions for room ${roomCode}`);
            } else {
                throw new Error("Response is not an array");
            }

        } catch (e) {
            console.error("Failed to parse JSON batch", e, text);
            room.questions = [
                { question: "Domanda di riserva. 2+2?", options: ["3", "4", "5", "6"], correctIndex: 1 },
                { question: "Domanda di riserva. Capitale Francia?", options: ["Lione", "Nizza", "Parigi", "Marsiglia"], correctIndex: 2 }
            ];
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        room.questions = [
            { question: "Errore connessione AI.", options: ["OK", "OK", "OK", "OK"], correctIndex: 0 }
        ];
    }
}

function sendNextQuestion(roomCode, socketId) {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[socketId];
    if (!player) return;

    if (player.questionIndex < room.questions.length) {
        const questionData = room.questions[player.questionIndex];
        // Send specific question to specific socket
        io.to(socketId).emit('new_question', {
            ...questionData,
            totalQuestions: room.questions.length, // info for progress bar
            currentIndex: player.questionIndex + 1
        });
    } else {
        // Already finished, do nothing (wait for final game_over broadcast)
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
