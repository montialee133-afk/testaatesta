import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Share2, Volume2, VolumeX, Check, X, Home, Zap, Snowflake, Target, Skull } from 'lucide-react';
import sounds, { isSoundEnabled, setSoundEnabled } from '../hooks/useSounds';
import { fireVictoryConfetti, fireCorrectConfetti, fireStreakConfetti } from '../utils/confetti';

// Reactions
const REACTIONS = [
    { type: 'laugh', emoji: '😂' },
    { type: 'clap', emoji: '👏' },
    { type: 'angry', emoji: '🤬' },
    { type: 'poop', emoji: '💩' },
    { type: 'fire', emoji: '🔥' },
    { type: 'skull', emoji: '💀' },
    { type: 'mind', emoji: '🤯' },
    { type: 'think', emoji: '🤔' },
];

// Quick chat messages
const QUICK_CHATS = [
    'GG!', 'Wow!', 'Nooo!', 'Dai!', 'Easy!', 'Bravo!'
];

// Haptic feedback
const vibrate = (pattern = 50) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

export default function Game({
    questionData, score, streaks, names, avatars, onAnswer, gameStatus, gameMode,
    timePerQuestion = 15, myRole, lastReaction, lastChat, onReaction, onChat,
    onRematch, rematchRequested, opponentWantsRematch, isMyFinished,
    opponentNameForWaiting, answerResult, topic, onGoHome, powerUps, onPowerUp,
    eliminatedIndices, isFrozen, isDoubleActive, gameStats, isEliminated
}) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [visibleReactions, setVisibleReactions] = useState([]);
    const [visibleChats, setVisibleChats] = useState([]);
    const [timeLeft, setTimeLeft] = useState(timePerQuestion);
    const [soundOn, setSoundOn] = useState(isSoundEnabled());
    const [showShareToast, setShowShareToast] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(null);
    const [showComeback, setShowComeback] = useState(false);
    const hasPlayedVictory = useRef(false);
    const prevScoreDiff = useRef(0);

    const toggleSound = () => {
        const newState = !soundOn;
        setSoundOn(newState);
        setSoundEnabled(newState);
        if (newState) sounds.click();
    };

    // Timer
    useEffect(() => {
        setSelectedOption(null);
        setTimeLeft(questionData?.timeLimit || timePerQuestion);
        setPointsEarned(null);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                if (prev <= 6 && prev > 1) {
                    sounds.tickUrgent();
                    vibrate(30);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questionData, timePerQuestion]);

    // Answer result
    useEffect(() => {
        if (answerResult) {
            vibrate(answerResult.isCorrect ? [50, 50, 50] : [100, 50, 100]);
            if (answerResult.isCorrect) {
                setPointsEarned(answerResult.points);
                if (answerResult.streak > 2) {
                    fireStreakConfetti(answerResult.streak);
                } else {
                    fireCorrectConfetti();
                }
            }
        }
    }, [answerResult]);

    // Comeback detection
    useEffect(() => {
        const iAmHost = myRole === 'host';
        const myScore = iAmHost ? score.host : score.guest;
        const theirScore = iAmHost ? score.guest : score.host;
        const currentDiff = myScore - theirScore;

        if (prevScoreDiff.current < -50 && currentDiff > 0) {
            setShowComeback(true);
            sounds.streak(5);
            setTimeout(() => setShowComeback(false), 2000);
        }
        prevScoreDiff.current = currentDiff;
    }, [score, myRole]);

    // Reactions
    useEffect(() => {
        if (lastReaction) {
            sounds.reaction();
            vibrate(20);
            setVisibleReactions(prev => [...prev, { ...lastReaction }]);
            setTimeout(() => {
                setVisibleReactions(prev => prev.filter(r => r.id !== lastReaction.id));
            }, 2000);
        }
    }, [lastReaction]);

    // Chat messages
    useEffect(() => {
        if (lastChat) {
            sounds.click();
            setVisibleChats(prev => [...prev, { ...lastChat }]);
            setTimeout(() => {
                setVisibleChats(prev => prev.filter(c => c.id !== lastChat.id));
            }, 3000);
        }
    }, [lastChat]);

    const handleOptionClick = (index) => {
        if (selectedOption !== null || isFrozen || eliminatedIndices.includes(index)) return;
        sounds.click();
        vibrate(40);
        setSelectedOption(index);
        onAnswer(index, timeLeft);
    };

    const iAmHost = myRole === 'host';
    const leftName = iAmHost ? names.host : names.guest;
    const leftScore = iAmHost ? score.host : score.guest;
    const leftStreak = iAmHost ? streaks.host : streaks.guest;
    const leftAvatar = iAmHost ? avatars?.host : avatars?.guest;

    const rightName = iAmHost ? names.guest : names.host;
    const rightScore = iAmHost ? score.guest : score.host;
    const rightStreak = iAmHost ? streaks.guest : streaks.host;
    const rightAvatar = iAmHost ? avatars?.guest : avatars?.host;

    // My stats
    const myStats = iAmHost ? gameStats?.host : gameStats?.guest;
    const theirStats = iAmHost ? gameStats?.guest : gameStats?.host;

    // Share
    const handleShare = async () => {
        const iWon = leftScore > rightScore;
        const isDraw = leftScore === rightScore;
        const emoji = isDraw ? '🤝' : (iWon ? '🏆' : '💀');

        const text = `🧠 TESTA A TESTA ${emoji}

📚 ${topic} • ${gameMode === 'sudden_death' ? '💀 Sudden Death' : gameMode === 'speed' ? '⚡ Speed' : '🎮 Normale'}
${iWon ? '🥇' : '🥈'} ${leftName}: ${leftScore} pts
${iWon ? '🥈' : '🥇'} ${rightName}: ${rightScore} pts
${myStats ? `\n📊 ${myStats.correctAnswers}/${myStats.totalQuestions} corrette • ⏱️ ${myStats.avgTime}s avg • 🔥 ${myStats.bestStreak} streak` : ''}

🎮 Sfida i tuoi amici!`;

        try {
            if (navigator.share) {
                await navigator.share({ text });
            } else {
                await navigator.clipboard.writeText(text);
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 2000);
            }
        } catch (e) {}
    };

    // GAME OVER
    if (gameStatus === 'game_over') {
        const iWon = leftScore > rightScore;
        const isDraw = leftScore === rightScore;

        if (!hasPlayedVictory.current) {
            hasPlayedVictory.current = true;
            vibrate(iWon ? [100, 50, 100, 50, 200] : [200, 100, 200]);
            if (iWon) { sounds.victory(); fireVictoryConfetti(); }
            else if (!isDraw) { sounds.defeat(); }
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white p-4 overflow-auto">
                <button onClick={toggleSound} className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/50 z-50">
                    {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                <AnimatePresence>
                    {showShareToast && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-14 right-3 bg-green-600 px-3 py-1 rounded-lg text-xs font-bold z-50">
                            Copiato!
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <h1 className="text-4xl font-black mb-4">
                        {isDraw ? <span className="text-gray-400">Parità! 🤝</span> :
                            iWon ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Vittoria! 🏆</span> :
                            <span className="text-slate-500">Sconfitta 💀</span>}
                    </h1>

                    {/* Scores */}
                    <div className="flex justify-center items-center gap-6 mb-4 bg-slate-900/50 p-4 rounded-2xl">
                        <div className="text-center">
                            <div className="text-3xl mb-1">{leftAvatar || '😀'}</div>
                            <div className="text-cyan-400 text-xs mb-1">{leftName}</div>
                            <div className={`text-2xl font-black ${iWon ? 'text-yellow-400' : ''}`}>{leftScore}</div>
                        </div>
                        <div className="text-slate-600 text-xl">vs</div>
                        <div className="text-center">
                            <div className="text-3xl mb-1">{rightAvatar || '😀'}</div>
                            <div className="text-rose-400 text-xs mb-1">{rightName}</div>
                            <div className={`text-2xl font-black ${!iWon && !isDraw ? 'text-yellow-400' : ''}`}>{rightScore}</div>
                        </div>
                    </div>

                    {/* Stats */}
                    {myStats && (
                        <div className="bg-slate-900/30 p-3 rounded-xl mb-4 text-xs">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className="text-slate-500">Corrette</div>
                                    <div className="text-lg font-bold text-green-400">{myStats.correctAnswers}/{myStats.totalQuestions}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-slate-500">Tempo Medio</div>
                                    <div className="text-lg font-bold text-cyan-400">{myStats.avgTime}s</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-slate-500">Best Streak</div>
                                    <div className="text-lg font-bold text-orange-400">🔥 {myStats.bestStreak}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {opponentWantsRematch && !rematchRequested && (
                        <div className="text-pink-400 animate-bounce font-bold text-sm mb-2">L'avversario vuole la rivincita!</div>
                    )}

                    <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={onRematch} disabled={rematchRequested}
                            className={clsx("flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-all",
                                rematchRequested ? "bg-slate-800 text-slate-500" : "bg-gradient-to-r from-pink-600 to-purple-600 text-white active:scale-95")}>
                            <RefreshCw className={clsx("w-4 h-4", rematchRequested && "animate-spin")} />
                            {rematchRequested ? "Attesa..." : "RIVINCITA"}
                        </button>
                        <button onClick={handleShare}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white active:scale-95">
                            <Share2 className="w-4 h-4" /> CONDIVIDI
                        </button>
                        <button onClick={() => { sounds.click(); onGoHome(); }}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm bg-slate-700 text-white active:scale-95">
                            <Home className="w-4 h-4" /> HOME
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // WAITING
    if (gameStatus === 'waiting_for_opponent') {
        return (
            <div className="flex flex-col items-center justify-center h-dvh bg-[#0a0a0f] text-white p-4">
                <h1 className="text-3xl font-black text-cyan-400 animate-pulse mb-4">Hai Finito! 🚀</h1>
                <p className="text-slate-400">In attesa di <span className="text-rose-400 font-bold">{opponentNameForWaiting || "avversario"}</span>...</p>
                <div className="w-12 h-12 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin mt-6"></div>
                <div className="absolute bottom-8 flex gap-2">
                    {REACTIONS.slice(0, 4).map(r => (
                        <button key={r.type} onClick={() => onReaction(r.type)} className="text-2xl hover:scale-125 active:scale-90 transition-transform">
                            {r.emoji}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ELIMINATED
    if (isEliminated) {
        return (
            <div className="flex flex-col items-center justify-center h-dvh bg-[#0a0a0f] text-white p-4">
                <Skull className="w-20 h-20 text-red-500 mb-4" />
                <h1 className="text-3xl font-black text-red-500 mb-2">ELIMINATO!</h1>
                <p className="text-slate-400">Hai sbagliato in Sudden Death</p>
                <p className="text-slate-500 text-sm mt-4">In attesa del risultato...</p>
            </div>
        );
    }

    // LOADING
    if (!questionData) {
        return (
            <div className="flex items-center justify-center h-dvh bg-[#0a0a0f] text-white">
                <div className="animate-pulse text-cyan-400 font-bold">Caricamento...</div>
            </div>
        );
    }

    // ACTIVE GAME
    return (
        <div className="flex flex-col h-dvh w-screen bg-[#0a0a0f] text-white font-sans overflow-hidden relative">
            {/* Sound Toggle */}
            <button onClick={toggleSound} className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/50 z-50">
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Frozen Overlay */}
            <AnimatePresence>
                {isFrozen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-cyan-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
                        <div className="text-center">
                            <Snowflake className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-2" />
                            <div className="text-2xl font-black text-cyan-400">CONGELATO!</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Points Popup */}
            <AnimatePresence>
                {pointsEarned && (
                    <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                        <div className={`text-4xl font-black drop-shadow-lg ${isDoubleActive ? 'text-yellow-400' : 'text-green-400'}`}>
                            +{pointsEarned} {isDoubleActive && '(2X!)'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comeback */}
            <AnimatePresence>
                {showComeback && (
                    <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse">
                            COMEBACK! 🔥
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reactions */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                <AnimatePresence>
                    {visibleReactions.map((r) => (
                        <motion.div key={r.id} initial={{ y: '100%', opacity: 0 }} animate={{ y: '30%', opacity: 1, scale: 1.5 }}
                            exit={{ y: '-20%', opacity: 0 }} transition={{ duration: 1.5 }}
                            className="absolute bottom-0 text-5xl" style={{ left: r.isMe ? '15%' : 'auto', right: r.isMe ? 'auto' : '15%' }}>
                            {REACTIONS.find(x => x.type === r.type)?.emoji || '❓'}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Chat Messages */}
            <div className="absolute top-20 left-0 right-0 pointer-events-none z-30">
                <AnimatePresence>
                    {visibleChats.map((c) => (
                        <motion.div key={c.id} initial={{ opacity: 0, x: c.isMe ? 50 : -50 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }} className={`mx-4 mb-2 ${c.isMe ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${c.isMe ? 'bg-cyan-600' : 'bg-rose-600'}`}>
                                {c.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header */}
            <div className="flex-none flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-2 border-b border-white/5 z-20">
                <div className="flex items-center gap-2 w-1/3">
                    <span className="text-2xl">{leftAvatar || '😀'}</span>
                    <div>
                        <div className="text-cyan-400 text-[9px] font-bold uppercase truncate max-w-[60px]">{leftName}</div>
                        <div className="flex items-center gap-1">
                            <span className="text-cyan-500 font-black text-2xl">{leftScore}</span>
                            {leftStreak > 1 && <span className="text-orange-500 text-xs">🔥{leftStreak}</span>}
                        </div>
                    </div>
                </div>

                <div className="w-1/3 flex flex-col items-center gap-0.5">
                    <span className={clsx("text-xs font-mono", timeLeft <= 5 ? "text-red-500 animate-pulse font-bold" : "text-slate-400")}>
                        {timeLeft}s
                    </span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div key={questionData.question} initial={{ width: "100%" }} animate={{ width: "0%" }}
                            transition={{ duration: questionData.timeLimit || timePerQuestion, ease: "linear" }}
                            className={clsx("h-full", timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-green-500 to-yellow-500")} />
                    </div>
                    <span className="text-[9px] text-slate-500">{questionData.currentIndex}/{questionData.totalQuestions}</span>
                </div>

                <div className="flex items-center gap-2 w-1/3 justify-end">
                    <div className="text-right">
                        <div className="text-rose-400 text-[9px] font-bold uppercase truncate max-w-[60px]">{rightName}</div>
                        <div className="flex items-center gap-1 justify-end">
                            {rightStreak > 1 && <span className="text-orange-500 text-xs">🔥{rightStreak}</span>}
                            <span className="text-rose-500 font-black text-2xl">{rightScore}</span>
                        </div>
                    </div>
                    <span className="text-2xl">{rightAvatar || '😀'}</span>
                </div>
            </div>

            {/* Power-ups Bar */}
            <div className="flex-none flex justify-center gap-2 p-2 bg-slate-900/50">
                <button onClick={() => onPowerUp('fiftyFifty')} disabled={!powerUps?.fiftyFifty || selectedOption !== null}
                    className={clsx("flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        powerUps?.fiftyFifty ? "bg-purple-600 text-white active:scale-95" : "bg-slate-800 text-slate-500")}>
                    <Target className="w-3 h-3" /> 50/50 {powerUps?.fiftyFifty > 0 && `(${powerUps.fiftyFifty})`}
                </button>
                <button onClick={() => onPowerUp('freeze')} disabled={!powerUps?.freeze || selectedOption !== null}
                    className={clsx("flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        powerUps?.freeze ? "bg-cyan-600 text-white active:scale-95" : "bg-slate-800 text-slate-500")}>
                    <Snowflake className="w-3 h-3" /> Freeze {powerUps?.freeze > 0 && `(${powerUps.freeze})`}
                </button>
                <button onClick={() => onPowerUp('double')} disabled={!powerUps?.double || selectedOption !== null || isDoubleActive}
                    className={clsx("flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        isDoubleActive ? "bg-yellow-500 text-black ring-2 ring-yellow-300" :
                        powerUps?.double ? "bg-amber-600 text-white active:scale-95" : "bg-slate-800 text-slate-500")}>
                    <Zap className="w-3 h-3" /> {isDoubleActive ? '2X ATTIVO!' : `2X ${powerUps?.double > 0 ? `(${powerUps.double})` : ''}`}
                </button>
            </div>

            {/* Question */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center relative w-full max-w-lg mx-auto overflow-y-auto">
                {/* Answer feedback */}
                <AnimatePresence>
                    {answerResult && selectedOption !== null && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-2 inset-x-0 flex justify-center z-30">
                            <div className={clsx("px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold",
                                answerResult.isCorrect ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                                "bg-red-500/20 text-red-400 border border-red-500/50")}>
                                {answerResult.isCorrect ? <><Check className="w-4 h-4" /> +{answerResult.points}</> :
                                    <><X className="w-4 h-4" /> Sbagliato!</>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <h2 className="text-lg md:text-xl font-bold leading-tight text-slate-100 mb-6">{questionData.question}</h2>

                <div className="grid grid-cols-1 gap-2 w-full">
                    {questionData.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isEliminated = eliminatedIndices.includes(index);
                        const isCorrectAnswer = answerResult?.correctIndex === index;
                        const showResult = answerResult && selectedOption !== null;

                        if (isEliminated && !showResult) {
                            return (
                                <div key={index} className="w-full p-3 rounded-xl bg-slate-900/30 text-slate-600 line-through text-center">
                                    {option}
                                </div>
                            );
                        }

                        return (
                            <motion.button key={index} onClick={() => handleOptionClick(index)}
                                disabled={selectedOption !== null || isFrozen || isEliminated}
                                whileTap={{ scale: 0.98 }}
                                className={clsx("w-full p-3 rounded-xl font-bold transition-all border",
                                    showResult && isCorrectAnswer && "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400",
                                    showResult && isSelected && !answerResult.isCorrect && "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400",
                                    isSelected && !showResult && "bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-white/50",
                                    !isSelected && !showResult && "bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/5",
                                    (selectedOption !== null || isFrozen) && !isSelected && !isCorrectAnswer && "opacity-50"
                                )}>
                                <span className="flex items-center justify-center gap-2">
                                    {option}
                                    {showResult && isCorrectAnswer && <Check className="w-4 h-4" />}
                                    {showResult && isSelected && !answerResult.isCorrect && <X className="w-4 h-4" />}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Reactions + Chat Bar */}
            <div className="flex-none p-2 bg-slate-900/50 backdrop-blur-sm pb-safe">
                <div className="flex justify-center gap-1 mb-1">
                    {REACTIONS.map(r => (
                        <button key={r.type} onClick={() => { vibrate(20); onReaction(r.type); }}
                            className="text-xl hover:scale-110 active:scale-90 transition-transform p-1">
                            {r.emoji}
                        </button>
                    ))}
                </div>
                <div className="flex justify-center gap-1 flex-wrap">
                    {QUICK_CHATS.map(msg => (
                        <button key={msg} onClick={() => { vibrate(20); onChat(msg); }}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-full text-[10px] font-bold text-slate-300 active:scale-95">
                            {msg}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
