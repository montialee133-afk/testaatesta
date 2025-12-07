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
  const [lastReaction, setLastReaction] = useState(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

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
      setScore({ host: 0, guest: 0 }); // Reset score on new game
      setRematchRequested(false);
      setOpponentWantsRematch(false);
      if (!myRole) setMyRole('guest');
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
      setScore(finalScore);
      setGameStatus('game_over');
    });

    socket.on('reaction_received', (type) => {
      setLastReaction({ type, id: Date.now() });
    });

    socket.on('rematch_requested', () => {
      setOpponentWantsRematch(true);
    });

    socket.on('error', (msg) => { alert(msg); });

    return () => {
      socket.off('room_created');
      socket.off('game_start');
      socket.off('new_question');
      socket.off('score_update');
      socket.off('game_over');
      socket.off('reaction_received');
      socket.off('rematch_requested');
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

  const handleReaction = (type) => {
    socket.emit('send_reaction', { roomCode, type });
    setLastReaction({ type, id: Date.now(), isMe: true }); // Show my own reaction too
  };

  const handleRematch = () => {
    socket.emit('request_rematch', { roomCode });
    setRematchRequested(true);
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
          myRole={myRole}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
          lastReaction={lastReaction}
          onReaction={handleReaction}
          onRematch={handleRematch}
          rematchRequested={rematchRequested}
          opponentWantsRematch={opponentWantsRematch}
        />
      )}
    </div>
  );
}

export default App;
