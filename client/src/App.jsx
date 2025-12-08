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
  const [gameMode, setGameMode] = useState('normal');
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [questionData, setQuestionData] = useState(null);
  const [score, setScore] = useState({ host: 0, guest: 0 });
  const [streaks, setStreaks] = useState({ host: 0, guest: 0 });
  const [names, setNames] = useState({ host: 'Host', guest: 'Guest' });
  const [avatars, setAvatars] = useState({ host: '😀', guest: '😀' });
  const [gameStatus, setGameStatus] = useState('active');
  const [myRole, setMyRole] = useState(null);
  const [lastReaction, setLastReaction] = useState(null);
  const [lastChat, setLastChat] = useState(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [isMyFinished, setIsMyFinished] = useState(false);
  const [opponentNameForWaiting, setOpponentNameForWaiting] = useState(null);
  const [powerUps, setPowerUps] = useState({ fiftyFifty: 1, freeze: 1, double: 1 });
  const [eliminatedIndices, setEliminatedIndices] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isDoubleActive, setIsDoubleActive] = useState(false);
  const [gameStats, setGameStats] = useState(null);
  const [isEliminated, setIsEliminated] = useState(false);

  useEffect(() => {
    socket.on('room_created', (code) => {
      setRoomCode(code);
      setStage('lobby');
      setMyRole('host');
    });

    socket.on('game_start', (data) => {
      setRoomCode(data.roomCode);
      setTopic(data.topic);
      setGameMode(data.gameMode || 'normal');
      setTimePerQuestion(data.timePerQuestion || 15);
      setNames(data.names);
      setAvatars(data.avatars || { host: '😀', guest: '😀' });
      setGameStatus('preparing');
      setStage('game');
      setScore({ host: 0, guest: 0 });
      setStreaks({ host: 0, guest: 0 });
      setIsMyFinished(false);
      setOpponentNameForWaiting(null);
      setRematchRequested(false);
      setOpponentWantsRematch(false);
      setAnswerResult(null);
      setPowerUps({ fiftyFifty: 1, freeze: 1, double: 1 });
      setEliminatedIndices([]);
      setIsFrozen(false);
      setIsDoubleActive(false);
      setGameStats(null);
      setIsEliminated(false);
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
      setAnswerResult(null);
      setEliminatedIndices([]);
      if (data.powerUps) {
        setPowerUps(data.powerUps);
      }
    });

    socket.on('score_update', (data) => {
      setScore(data.score);
      setStreaks(data.streaks);
    });

    socket.on('player_finished', () => {
      setIsMyFinished(true);
      setGameStatus('waiting_for_opponent');
    });

    socket.on('opponent_finished', ({ opponentName }) => {
      setOpponentNameForWaiting(opponentName);
    });

    socket.on('game_over', (data) => {
      // Handle new format with scores and stats
      if (data.scores) {
        setScore(data.scores);
        setGameStats(data.stats);
      } else {
        // Backwards compatibility
        setScore({ host: data.host, guest: data.guest });
      }
      setGameStatus('game_over');
    });

    socket.on('reaction_received', (type) => {
      setLastReaction({ type, id: Date.now() });
    });

    socket.on('chat_received', ({ message, from }) => {
      setLastChat({ message, from, id: Date.now() });
    });

    socket.on('rematch_requested', () => {
      setOpponentWantsRematch(true);
    });

    socket.on('powerup_result', (data) => {
      sounds.click();
      if (data.type === 'fiftyFifty') {
        setEliminatedIndices(data.eliminatedIndices);
        setPowerUps(prev => ({ ...prev, fiftyFifty: data.remaining }));
      } else if (data.type === 'freeze') {
        setPowerUps(prev => ({ ...prev, freeze: data.remaining }));
      } else if (data.type === 'double') {
        setIsDoubleActive(true);
        setPowerUps(prev => ({ ...prev, double: data.remaining }));
      }
    });

    socket.on('frozen', ({ duration }) => {
      setIsFrozen(true);
      sounds.wrong();
      setTimeout(() => setIsFrozen(false), duration);
    });

    socket.on('still_frozen', () => {
      // Visual feedback that player is still frozen
    });

    socket.on('eliminated', () => {
      setIsEliminated(true);
      sounds.defeat();
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
      socket.off('chat_received');
      socket.off('rematch_requested');
      socket.off('answer_result');
      socket.off('powerup_result');
      socket.off('frozen');
      socket.off('still_frozen');
      socket.off('eliminated');
      socket.off('error');
    };
  }, [myRole]);

  const handleCreate = (selectedTopic, username, avatar, selectedGameMode) => {
    socket.emit('create_room', {
      topic: selectedTopic || "General",
      username,
      avatar: avatar || '😀',
      gameMode: selectedGameMode || 'normal'
    });
  };

  const handleJoin = (code, username, avatar) => {
    if (code) {
      socket.emit('join_room', {
        roomCode: code,
        username,
        avatar: avatar || '😀'
      });
    }
    setMyRole('guest');
  };

  const handleAnswer = (answerIndex, timeRemaining) => {
    if (isFrozen) return;
    socket.emit('submit_answer', { roomCode, answerIndex, timeRemaining });
    setGameStatus('round_locked');
    setIsDoubleActive(false);
  };

  const handleReaction = (type) => {
    socket.emit('send_reaction', { roomCode, type });
    setLastReaction({ type, id: Date.now(), isMe: true });
  };

  const handleChat = (message) => {
    socket.emit('send_chat', { roomCode, message });
    setLastChat({ message, from: 'Tu', id: Date.now(), isMe: true });
  };

  const handleRematch = () => {
    socket.emit('request_rematch', { roomCode });
    setRematchRequested(true);
  };

  const handlePowerUp = (type) => {
    if (isFrozen) return;
    socket.emit('use_powerup', { roomCode, type });
  };

  const handleGoHome = () => {
    setStage('landing');
    setRoomCode('');
    setTopic('');
    setGameMode('normal');
    setQuestionData(null);
    setScore({ host: 0, guest: 0 });
    setStreaks({ host: 0, guest: 0 });
    setNames({ host: 'Host', guest: 'Guest' });
    setAvatars({ host: '😀', guest: '😀' });
    setGameStatus('active');
    setMyRole(null);
    setLastReaction(null);
    setLastChat(null);
    setRematchRequested(false);
    setOpponentWantsRematch(false);
    setAnswerResult(null);
    setIsMyFinished(false);
    setOpponentNameForWaiting(null);
    setPowerUps({ fiftyFifty: 1, freeze: 1, double: 1 });
    setEliminatedIndices([]);
    setIsFrozen(false);
    setIsDoubleActive(false);
    setGameStats(null);
    setIsEliminated(false);
  };

  return (
    <div className="App">
      {stage === 'landing' && <Landing onCreate={handleCreate} onJoin={handleJoin} />}
      {stage === 'lobby' && <Lobby roomCode={roomCode} topic={topic} gameMode={gameMode} />}
      {stage === 'game' && (
        <Game
          questionData={questionData}
          score={score}
          streaks={streaks}
          names={names}
          avatars={avatars}
          myRole={myRole}
          onAnswer={handleAnswer}
          gameStatus={gameStatus}
          gameMode={gameMode}
          timePerQuestion={timePerQuestion}
          lastReaction={lastReaction}
          lastChat={lastChat}
          onReaction={handleReaction}
          onChat={handleChat}
          onRematch={handleRematch}
          rematchRequested={rematchRequested}
          opponentWantsRematch={opponentWantsRematch}
          isMyFinished={isMyFinished}
          opponentNameForWaiting={opponentNameForWaiting}
          answerResult={answerResult}
          topic={topic}
          onGoHome={handleGoHome}
          powerUps={powerUps}
          onPowerUp={handlePowerUp}
          eliminatedIndices={eliminatedIndices}
          isFrozen={isFrozen}
          isDoubleActive={isDoubleActive}
          gameStats={gameStats}
          isEliminated={isEliminated}
        />
      )}
    </div>
  );
}

export default App;
