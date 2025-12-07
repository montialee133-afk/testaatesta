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
            score: { host: 0, guest: 0 },
            questions: [],
            currentQuestionIndex: 0,
            processingAnswer: false
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

            // Send first question
            sendNextQuestion(roomCode);

        } else {
            socket.emit('error', 'Room not found or full');
        }
    });

    socket.on('submit_answer', ({ roomCode, answerIndex }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing' || room.processingAnswer) return;

        const currentQ = room.questions[room.currentQuestionIndex];
        if (!currentQ) return;

        room.processingAnswer = true; // Lock rounds

        const isCorrect = answerIndex === currentQ.correctIndex;
        const playerRole = socket.id === room.host ? 'host' : 'guest';
        const opponentRole = playerRole === 'host' ? 'guest' : 'host';

        if (isCorrect) {
            room.score[playerRole]++;
            console.log(`Point for ${playerRole} in room ${roomCode}`);
        } else {
            // Wrong answer -> Point to Opponent
            room.score[opponentRole]++;
            console.log(`Wrong answer by ${playerRole}. Point to ${opponentRole} in room ${roomCode}`);
        }

        // Notify everyone of the update
        io.to(roomCode).emit('score_update', room.score);

        // Move to next question after delay
        setTimeout(() => {
            room.currentQuestionIndex++;
            room.processingAnswer = false;
            sendNextQuestion(roomCode);
        }, 2000);
    });

    socket.on('disconnect', () => {
        // Handle disconnects
    });
});

async function generateQuestionsBatch(roomCode, topic) {
    const room = rooms[roomCode];
    if (!room) return;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
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

function sendNextQuestion(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.currentQuestionIndex < room.questions.length) {
        const questionData = room.questions[room.currentQuestionIndex];
        io.to(roomCode).emit('new_question', questionData);
    } else {
        io.to(roomCode).emit('game_over', room.score);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
