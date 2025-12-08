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

// Game mode configurations
const GAME_MODES = {
    normal: { timePerQuestion: 15, questions: 10 },
    speed: { timePerQuestion: 5, questions: 10 },
    sudden_death: { timePerQuestion: 10, questions: 20 } // First wrong = lose
};

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Initialize player state
const createPlayerState = (socketId, name, avatar) => ({
    id: socketId,
    name: name,
    avatar: avatar || '😀',
    score: 0,
    streak: 0,
    bestStreak: 0,
    questionIndex: 0,
    finished: false,
    eliminated: false, // For sudden death
    correctAnswers: 0,
    totalTime: 0,
    answersTime: [], // Track time for each answer
    powerUps: {
        fiftyFifty: 1,
        freeze: 1,
        double: 1
    },
    doubleActive: false,
    frozenUntil: null
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create room with game mode and avatar
    socket.on('create_room', (data) => {
        const topic = data.topic || "General";
        const username = data.username || "Host";
        const avatar = data.avatar || '😀';
        const gameMode = data.gameMode || 'normal';

        const roomCode = generateRoomCode();
        const modeConfig = GAME_MODES[gameMode] || GAME_MODES.normal;

        rooms[roomCode] = {
            host: socket.id,
            guest: null,
            hostName: username,
            hostAvatar: avatar,
            guestName: null,
            guestAvatar: null,
            topic: topic,
            gameMode: gameMode,
            timePerQuestion: modeConfig.timePerQuestion,
            questionCount: modeConfig.questions,
            status: 'waiting',
            players: {
                [socket.id]: createPlayerState(socket.id, username, avatar)
            },
            questions: [],
            rematchRequests: new Set()
        };

        socket.join(roomCode);
        socket.emit('room_created', roomCode);
        console.log(`Room ${roomCode} created by ${username} (mode: ${gameMode})`);
    });

    // Join room with avatar
    socket.on('join_room', async (data) => {
        const roomCode = data.roomCode;
        const username = data.username || "Guest";
        const avatar = data.avatar || '😀';

        const room = rooms[roomCode];
        if (room && room.status === 'waiting' && !room.guest) {
            room.guest = socket.id;
            room.guestName = username;
            room.guestAvatar = avatar;
            room.players[socket.id] = createPlayerState(socket.id, username, avatar);

            socket.join(roomCode);
            room.status = 'playing';

            // Emit game start with all info
            io.to(roomCode).emit('game_start', {
                roomCode,
                topic: room.topic,
                gameMode: room.gameMode,
                timePerQuestion: room.timePerQuestion,
                names: { host: room.hostName, guest: room.guestName },
                avatars: { host: room.hostAvatar, guest: room.guestAvatar }
            });

            console.log(`Game started in room ${roomCode}: ${room.hostName} vs ${room.guestName} (${room.gameMode})`);

            await generateQuestionsBatch(roomCode, room.topic, room.questionCount);

            Object.keys(room.players).forEach(playerId => {
                sendNextQuestion(roomCode, playerId);
            });
        } else {
            socket.emit('error', 'Stanza non trovata o piena');
        }
    });

    // Use power-up
    socket.on('use_powerup', ({ roomCode, type }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        const player = room.players[socket.id];
        if (!player || player.finished) return;

        const currentQ = room.questions[player.questionIndex];
        if (!currentQ) return;

        if (type === 'fiftyFifty' && player.powerUps.fiftyFifty > 0) {
            player.powerUps.fiftyFifty--;

            // Get two wrong options to eliminate
            const wrongIndices = currentQ.options
                .map((_, i) => i)
                .filter(i => i !== currentQ.correctIndex);

            // Shuffle and pick 2
            const toEliminate = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);

            socket.emit('powerup_result', {
                type: 'fiftyFifty',
                eliminatedIndices: toEliminate,
                remaining: player.powerUps.fiftyFifty
            });
            console.log(`Player ${socket.id} used 50/50`);
        }
        else if (type === 'freeze' && player.powerUps.freeze > 0) {
            player.powerUps.freeze--;

            // Freeze opponent for 3 seconds
            const opponentId = socket.id === room.host ? room.guest : room.host;
            if (opponentId && room.players[opponentId]) {
                room.players[opponentId].frozenUntil = Date.now() + 3000;
                io.to(opponentId).emit('frozen', { duration: 3000 });
            }

            socket.emit('powerup_result', {
                type: 'freeze',
                remaining: player.powerUps.freeze
            });
            console.log(`Player ${socket.id} used Freeze`);
        }
        else if (type === 'double' && player.powerUps.double > 0) {
            player.powerUps.double--;
            player.doubleActive = true;

            socket.emit('powerup_result', {
                type: 'double',
                remaining: player.powerUps.double
            });
            console.log(`Player ${socket.id} used Double`);
        }
    });

    // Submit answer with time tracking
    socket.on('submit_answer', ({ roomCode, answerIndex, timeRemaining }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        const playerState = room.players[socket.id];
        if (!playerState || playerState.finished || playerState.eliminated) return;

        // Check if frozen
        if (playerState.frozenUntil && Date.now() < playerState.frozenUntil) {
            socket.emit('still_frozen');
            return;
        }
        playerState.frozenUntil = null;

        const currentQ = room.questions[playerState.questionIndex];
        if (!currentQ) return;

        const isCorrect = answerIndex === currentQ.correctIndex;
        const timeUsed = room.timePerQuestion - (timeRemaining || 0);

        // Track stats
        playerState.answersTime.push(timeUsed);
        playerState.totalTime += timeUsed;

        let points = 0;
        if (isCorrect) {
            playerState.correctAnswers++;

            const basePoints = 100;
            const timeBonus = Math.round((timeRemaining || 0) * (50 / room.timePerQuestion));
            const streakBonus = playerState.streak * 20;
            points = basePoints + timeBonus + streakBonus;

            // Double points power-up
            if (playerState.doubleActive) {
                points *= 2;
                playerState.doubleActive = false;
            }

            playerState.score += points;
            playerState.streak++;
            playerState.bestStreak = Math.max(playerState.bestStreak, playerState.streak);
        } else {
            playerState.streak = 0;
            playerState.doubleActive = false;

            // Sudden death: eliminate player on wrong answer
            if (room.gameMode === 'sudden_death') {
                playerState.eliminated = true;
                playerState.finished = true;
                socket.emit('eliminated');

                // Check if other player wins
                const otherPlayerId = socket.id === room.host ? room.guest : room.host;
                const otherPlayer = room.players[otherPlayerId];

                if (otherPlayer && !otherPlayer.eliminated) {
                    endGame(roomCode);
                    return;
                }
            }
        }

        socket.emit('answer_result', {
            isCorrect,
            correctIndex: currentQ.correctIndex,
            points,
            streak: playerState.streak,
            stats: {
                correctAnswers: playerState.correctAnswers,
                avgTime: playerState.totalTime / playerState.answersTime.length,
                bestStreak: playerState.bestStreak
            }
        });

        playerState.questionIndex++;

        // Broadcast score update
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

        if (playerState.questionIndex >= room.questions.length) {
            playerState.finished = true;
            socket.emit('player_finished');

            const allFinished = Object.values(room.players).every(p => p.finished);
            if (allFinished) {
                endGame(roomCode);
            } else {
                const opponentId = socket.id === room.host ? room.guest : room.host;
                socket.to(roomCode).emit('opponent_finished', {
                    opponentName: playerState.name
                });
            }
        } else {
            sendNextQuestion(roomCode, socket.id);
        }
    });

    // Extended reactions + quick chat
    socket.on('send_reaction', ({ roomCode, type }) => {
        socket.to(roomCode).emit('reaction_received', type);
    });

    socket.on('send_chat', ({ roomCode, message }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const player = room.players[socket.id];
        socket.to(roomCode).emit('chat_received', {
            message,
            from: player?.name || 'Avversario'
        });
    });

    socket.on('request_rematch', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;

        room.rematchRequests.add(socket.id);
        socket.to(roomCode).emit('rematch_requested');

        if (room.rematchRequests.size >= 2) {
            console.log(`Starting rematch in room ${roomCode}`);
            room.rematchRequests.clear();
            room.status = 'playing';

            Object.values(room.players).forEach(p => {
                Object.assign(p, {
                    score: 0,
                    streak: 0,
                    bestStreak: 0,
                    questionIndex: 0,
                    finished: false,
                    eliminated: false,
                    correctAnswers: 0,
                    totalTime: 0,
                    answersTime: [],
                    powerUps: { fiftyFifty: 1, freeze: 1, double: 1 },
                    doubleActive: false,
                    frozenUntil: null
                });
            });

            generateQuestionsBatch(roomCode, room.topic, room.questionCount).then(() => {
                io.to(roomCode).emit('game_start', {
                    roomCode,
                    topic: room.topic,
                    gameMode: room.gameMode,
                    timePerQuestion: room.timePerQuestion,
                    names: { host: room.hostName, guest: room.guestName },
                    avatars: { host: room.hostAvatar, guest: room.guestAvatar }
                });
                Object.keys(room.players).forEach(playerId => {
                    sendNextQuestion(roomCode, playerId);
                });
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

function endGame(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const hostPlayer = room.players[room.host];
    const guestPlayer = room.players[room.guest];

    io.to(roomCode).emit('game_over', {
        scores: {
            host: hostPlayer?.score || 0,
            guest: guestPlayer?.score || 0
        },
        stats: {
            host: {
                correctAnswers: hostPlayer?.correctAnswers || 0,
                totalQuestions: hostPlayer?.questionIndex || 0,
                avgTime: hostPlayer?.answersTime.length
                    ? (hostPlayer.totalTime / hostPlayer.answersTime.length).toFixed(1)
                    : 0,
                bestStreak: hostPlayer?.bestStreak || 0,
                eliminated: hostPlayer?.eliminated || false
            },
            guest: {
                correctAnswers: guestPlayer?.correctAnswers || 0,
                totalQuestions: guestPlayer?.questionIndex || 0,
                avgTime: guestPlayer?.answersTime.length
                    ? (guestPlayer.totalTime / guestPlayer.answersTime.length).toFixed(1)
                    : 0,
                bestStreak: guestPlayer?.bestStreak || 0,
                eliminated: guestPlayer?.eliminated || false
            }
        }
    });
    room.status = 'finished';
}

async function generateQuestionsBatch(roomCode, topic, count = 10) {
    const room = rooms[roomCode];
    if (!room) return;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `Genera ${count} domande di quiz su "${topic}" in ITALIANO.
        Le domande devono essere interessanti e di difficoltà media.
        Ogni domanda deve avere 4 opzioni e l'indice della risposta corretta (0-3).
        Restituisci ESCLUSIVAMENTE un array JSON valido in questo formato esatto:
        [
            { "question": "Domanda 1...", "options": ["A","B","C","D"], "correctIndex": 0 },
            { "question": "Domanda 2...", "options": ["A","B","C","D"], "correctIndex": 2 }
        ]`;

        console.log(`Generating ${count} questions for ${topic}...`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const questionsData = JSON.parse(jsonText);

        if (Array.isArray(questionsData)) {
            room.questions = questionsData;
            console.log(`Generated ${questionsData.length} questions`);
        } else {
            throw new Error("Response is not an array");
        }
    } catch (error) {
        console.error("Question generation error:", error);
        room.questions = [
            { question: "Qual è la capitale d'Italia?", options: ["Milano", "Roma", "Napoli", "Torino"], correctIndex: 1 },
            { question: "Quanto fa 7 x 8?", options: ["54", "56", "58", "64"], correctIndex: 1 }
        ];
    }
}

function sendNextQuestion(roomCode, socketId) {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players[socketId];
    if (!player || player.eliminated) return;

    if (player.questionIndex < room.questions.length) {
        const questionData = room.questions[player.questionIndex];
        io.to(socketId).emit('new_question', {
            ...questionData,
            totalQuestions: room.questions.length,
            currentIndex: player.questionIndex + 1,
            timeLimit: room.timePerQuestion,
            powerUps: player.powerUps
        });
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
