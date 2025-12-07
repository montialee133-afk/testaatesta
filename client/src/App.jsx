import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Landing from './components/Landing';
import Lobby from './components/Lobby';
import Game from './components/Game';

// Connect to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(API_URL);

function App() {
  const [stage, setStage] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [topic, setTopic] = useState('');
  const [questionData, setQuestionData] = useState(null);
  const [score, setScore] = useState({ host: 0, guest: 0 });
  const [names, setNames] = useState({ host: 'Host', guest: 'Guest' });
  const [gameStatus, setGameStatus] = useState('active');
  const [myRole, setMyRole] = useState(null); // 'host' or 'guest'

  useEffect(() => {
    socket.on('room_created', (code) => {
      setRoomCode(code);
      setStage('lobby');
      setMyRole('host');
    });

    socket.on('game_start', (data) => {
      setRoomCode(data.roomCode);
      setTopic(data.topic);
      setNames(data.names);
      setGameStatus('preparing');
      setStage('game');
      if (!myRole) setMyRole('guest'); // If not set by room_created, I must be guest
    });

    socket.on('new_question', (data) => {
      setQuestionData(data);
      setGameStatus('active');
    });

    socket.on('score_update', (newScore) => {
      setScore(newScore);
      setGameStatus('round_locked');
    });

    socket.on('game_over', (finalScore) => {
      alert(`Partita Finita! Punteggio: ${names.host}: ${finalScore.host} - ${names.guest}: ${finalScore.guest}`);
      setStage('landing');
      setRoomCode('');
      setNames({ host: 'Host', guest: 'Guest' });
      setScore({ host: 0, guest: 0 });
      setMyRole(null);
    });

    socket.on('error', (msg) => { alert(msg); });

    return () => {
      socket.off('room_created');
      socket.off('game_start');
      socket.off('new_question');
      socket.off('score_update');
      socket.off('game_over');
      socket.off('error');
    };
  }, [names, myRole]);

  const handleCreate = (selectedTopic, username) => {
    socket.emit('create_room', { topic: selectedTopic || "General", username });
  };

  const handleJoin = (code, username) => {
    if (code) socket.emit('join_room', { roomCode: code, username });
    setMyRole('guest');
  };

  const handleAnswer = (answerIndex) => {
    socket.emit('submit_answer', { roomCode, answerIndex });
    setGameStatus('round_locked');
  };

  return (
    <div className="App">
      {stage === 'landing' && <Landing onCreate={handleCreate} onJoin={handleJoin} />}
      {stage === 'lobby' && <Lobby roomCode={roomCode} topic={topic} />}
      {stage === 'game' && (
        <Game
          questionData={questionData}
          score={score}
          names={names}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
        />
      )}
    </div>
  );
}

export default App;
