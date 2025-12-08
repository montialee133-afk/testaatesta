import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Landing from './components/Landing';
import Lobby from './components/Lobby';
import Game from './components/Game';
import sounds from './hooks/useSounds';

// Connect to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(API_URL);

function App() {
  const [stage, setStage] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [topic, setTopic] = useState('');
  const [questionData, setQuestionData] = useState(null);
  const [score, setScore] = useState({ host: 0, guest: 0 });
  const [streaks, setStreaks] = useState({ host: 0, guest: 0 });
  const [names, setNames] = useState({ host: 'Host', guest: 'Guest' });
  const [gameStatus, setGameStatus] = useState('active');
  const [myRole, setMyRole] = useState(null); // 'host' or 'guest'
  const [lastReaction, setLastReaction] = useState(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);

  const [isMyFinished, setIsMyFinished] = useState(false);
  const [opponentNameForWaiting, setOpponentNameForWaiting] = useState(null);

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
      setStreaks({ host: 0, guest: 0 });
      setIsMyFinished(false);
      setOpponentNameForWaiting(null);
      setRematchRequested(false);
      setOpponentWantsRematch(false);
      setAnswerResult(null);
      if (!myRole) setMyRole('guest');
      sounds.gameStart();
    });

    socket.on('answer_result', (data) => {
      setAnswerResult(data);
      if (data.isCorrect) {
        if (data.streak > 1) {
          sounds.streak(data.streak);
        } else {
          sounds.correct();
        }
      } else {
        sounds.wrong();
      }
    });

    socket.on('new_question', (data) => {
      setQuestionData(data);
      setGameStatus('active');
      setAnswerResult(null); // Clear previous answer result
    });

    socket.on('score_update', (data) => {
      setScore(data.score);
      setStreaks(data.streaks);
      // Removed round_locked here because we don't want to lock if opponent answers
    });

    socket.on('player_finished', () => {
      setIsMyFinished(true);
      setGameStatus('waiting_for_opponent');
    });

    socket.on('opponent_finished', ({ opponentName }) => {
      setOpponentNameForWaiting(opponentName);
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
      socket.off('player_finished');
      socket.off('opponent_finished');
      socket.off('game_over');
      socket.off('reaction_received');
      socket.off('rematch_requested');
      socket.off('answer_result');
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

  const handleAnswer = (answerIndex, timeRemaining) => {
    socket.emit('submit_answer', { roomCode, answerIndex, timeRemaining });
    setGameStatus('round_locked'); // Lock locally until next question logic clears it
  };

  const handleReaction = (type) => {
    socket.emit('send_reaction', { roomCode, type });
    setLastReaction({ type, id: Date.now(), isMe: true }); // Show my own reaction too
  };

  const handleRematch = () => {
    socket.emit('request_rematch', { roomCode });
    setRematchRequested(true);
  };

  const handleGoHome = () => {
    // Reset all state and go back to landing
    setStage('landing');
    setRoomCode('');
    setTopic('');
    setQuestionData(null);
    setScore({ host: 0, guest: 0 });
    setStreaks({ host: 0, guest: 0 });
    setNames({ host: 'Host', guest: 'Guest' });
    setGameStatus('active');
    setMyRole(null);
    setLastReaction(null);
    setRematchRequested(false);
    setOpponentWantsRematch(false);
    setAnswerResult(null);
    setIsMyFinished(false);
    setOpponentNameForWaiting(null);
  };

  return (
    <div className="App">
      {stage === 'landing' && <Landing onCreate={handleCreate} onJoin={handleJoin} />}
      {stage === 'lobby' && <Lobby roomCode={roomCode} topic={topic} />}
      {stage === 'game' && (
        <Game
          questionData={questionData}
          score={score}
          streaks={streaks}
          names={names}
          myRole={myRole}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
          lastReaction={lastReaction}
          onReaction={handleReaction}
          onRematch={handleRematch}
          rematchRequested={rematchRequested}
          opponentWantsRematch={opponentWantsRematch}
          isMyFinished={isMyFinished}
          opponentNameForWaiting={opponentNameForWaiting}
          answerResult={answerResult}
          topic={topic}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}

export default App;
