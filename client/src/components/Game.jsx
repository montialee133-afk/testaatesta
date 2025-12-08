import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Share2, Volume2, VolumeX, Check, X, Home } from 'lucide-react';
import sounds, { isSoundEnabled, setSoundEnabled } from '../hooks/useSounds';
import { fireVictoryConfetti, fireCorrectConfetti, fireStreakConfetti } from '../utils/confetti';

export default function Game({
    questionData,
    score,
    streaks,
    names,
    onAnswer,
    gameStatus,
    myRole,
    lastReaction,
    onReaction,
    onRematch,
    rematchRequested,
    opponentWantsRematch,
    isMyFinished,
    opponentNameForWaiting,
    answerResult,
    topic,
    onGoHome
}) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [visibleReactions, setVisibleReactions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(15);
    const [soundOn, setSoundOn] = useState(isSoundEnabled());
    const [showShareToast, setShowShareToast] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(null);
    const [showComeback, setShowComeback] = useState(false);
    const hasPlayedVictory = useRef(false);
    const prevScoreDiff = useRef(0);

    // Toggle sound
    const toggleSound = () => {
        const newState = !soundOn;
        setSoundOn(newState);
        setSoundEnabled(newState);
        if (newState) sounds.click();
    };

    // Reset selection and timer when question changes
    useEffect(() => {
        setSelectedOption(null);
        setTimeLeft(15);
        setPointsEarned(null);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                // Play tick sound for last 5 seconds
                if (prev <= 6 && prev > 1) {
                    sounds.tickUrgent();
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questionData]);

    // Handle answer result with confetti
    useEffect(() => {
        if (answerResult) {
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

        // If I was behind (negative diff) and now I'm ahead (positive diff)
        if (prevScoreDiff.current < -50 && currentDiff > 0) {
            setShowComeback(true);
            sounds.streak(5); // Play special sound
            setTimeout(() => setShowComeback(false), 2000);
        }

        prevScoreDiff.current = currentDiff;
    }, [score, myRole]);

    // Handle incoming reactions
    useEffect(() => {
        if (lastReaction) {
            sounds.reaction();
            const newReaction = {
                id: lastReaction.id,
                type: lastReaction.type,
                isMe: lastReaction.isMe
            };
            setVisibleReactions(prev => [...prev, newReaction]);

            setTimeout(() => {
                setVisibleReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 2000);
        }
    }, [lastReaction]);

    const handleOptionClick = (index) => {
        if (selectedOption !== null) return;
        sounds.click();
        setSelectedOption(index);
        onAnswer(index, timeLeft);
    };

    // Determine who is Left (Me) and Right (Them)
    const iAmHost = myRole === 'host';
    const leftName = iAmHost ? names.host : names.guest;
    const leftScore = iAmHost ? score.host : score.guest;
    const leftStreak = iAmHost ? streaks.host : streaks.guest;

    const rightName = iAmHost ? names.guest : names.host;
    const rightScore = iAmHost ? score.guest : score.host;
    const rightStreak = iAmHost ? streaks.guest : streaks.host;

    // Share results
    const handleShare = async () => {
        const iWon = leftScore > rightScore;
        const isDraw = leftScore === rightScore;

        const resultEmoji = isDraw ? '🤝' : (iWon ? '🏆' : '💀');
        const resultText = isDraw ? 'Parità!' : (iWon ? 'Vittoria!' : 'Sconfitta');

        const shareText = `🧠 TESTA A TESTA ${resultEmoji}

📚 Argomento: ${topic}
${iWon ? '🥇' : '🥈'} ${leftName}: ${leftScore} pts
${iWon ? '🥈' : '🥇'} ${rightName}: ${rightScore} pts

${resultText}

🎮 Sfida i tuoi amici su Testa a Testa!`;

        try {
            if (navigator.share) {
                await navigator.share({ text: shareText });
            } else {
                await navigator.clipboard.writeText(shareText);
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 2000);
            }
            sounds.click();
        } catch (err) {
            console.log('Share failed:', err);
        }
    };

    // --- GAME OVER SCREEN ---
    if (gameStatus === 'game_over') {
        const iWon = leftScore > rightScore;
        const isDraw = leftScore === rightScore;

        // Play victory/defeat sound once
        if (!hasPlayedVictory.current) {
            hasPlayedVictory.current = true;
            if (iWon) {
                sounds.victory();
                fireVictoryConfetti();
            } else if (!isDraw) {
                sounds.defeat();
            }
        }

        return (
            <div className="flex flex-col items-center justify-center h-dvh w-screen bg-[#0a0a0f] text-white p-6 overflow-hidden relative">
                {/* Sound Toggle */}
                <button
                    onClick={toggleSound}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors z-50"
                >
                    {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                </button>

                {/* Share Toast */}
                <AnimatePresence>
                    {showShareToast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-16 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold z-50"
                        >
                            Copiato negli appunti! 📋
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-center space-y-6 z-10">
                    <motion.h1
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="text-5xl font-black uppercase tracking-tighter mb-4"
                    >
                        {isDraw ? <span className="text-gray-400">Parità! 🤝</span> : (
                            iWon
                                ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Vittoria! 🏆</span>
                                : <span className="text-slate-500">Sconfitta... 💀</span>
                        )}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center items-center gap-8 text-3xl font-bold bg-slate-900/50 p-6 rounded-2xl border border-white/10"
                    >
                        <div className="text-center">
                            <div className="text-cyan-400 text-sm uppercase mb-1">Tu</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className={iWon ? "text-yellow-400" : ""}
                            >
                                {leftScore}
                            </motion.div>
                        </div>
                        <div className="text-slate-600">-</div>
                        <div className="text-center">
                            <div className="text-rose-400 text-sm uppercase mb-1">{rightName}</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6, type: "spring" }}
                                className={!iWon && !isDraw ? "text-yellow-400" : ""}
                            >
                                {rightScore}
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="pt-8 flex flex-col items-center gap-4"
                    >
                        {opponentWantsRematch && !rematchRequested && (
                            <div className="mb-2 text-pink-400 animate-bounce font-bold">
                                L'avversario vuole la rivincita!
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                onClick={onRematch}
                                disabled={rematchRequested}
                                className={clsx(
                                    "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-105 active:scale-95 shadow-xl",
                                    rematchRequested
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500"
                                )}
                            >
                                <RefreshCw className={clsx("w-5 h-5", rematchRequested && "animate-spin")} />
                                {rematchRequested ? "Attesa..." : "RIVINCITA"}
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Share2 className="w-5 h-5" />
                                CONDIVIDI
                            </button>

                            <button
                                onClick={() => {
                                    sounds.click();
                                    onGoHome();
                                }}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-base bg-slate-700 text-white hover:bg-slate-600 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Home className="w-5 h-5" />
                                HOME
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (gameStatus === 'waiting_for_opponent') {
        return (
            <div className="flex flex-col items-center justify-center h-dvh w-screen bg-[#0a0a0f] text-white p-6 relative overflow-hidden">
                <div className="text-center space-y-6 z-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-cyan-400 animate-pulse">
                        Hai Finito! 🚀
                    </h1>
                    <p className="text-xl text-slate-400">
                        In attesa che <span className="text-rose-400 font-bold">{opponentNameForWaiting || "l'avversario"}</span> finisca...
                    </p>
                    <div className="flex justify-center mt-8">
                        <div className="w-16 h-16 border-4 border-t-cyan-500 border-white/10 rounded-full animate-spin"></div>
                    </div>
                </div>
                {/* Reaction Bar for waiting */}
                <div className="absolute bottom-10 left-0 right-0 p-4 flex justify-center gap-4">
                    {['laugh', 'clap', 'angry', 'poop'].map(type => (
                        <button
                            key={type}
                            onClick={() => onReaction(type)}
                            className="text-2xl hover:scale-125 transition-transform active:scale-90"
                        >
                            {type === 'laugh' && '😂'}
                            {type === 'clap' && '👏'}
                            {type === 'angry' && '🤬'}
                            {type === 'poop' && '💩'}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (!questionData) {
        return (
            <div className="flex items-center justify-center h-dvh w-screen bg-[#0a0a0f] text-white">
                <div className="animate-pulse text-cyan-400 font-bold">Caricamento...</div>
            </div>
        );
    }

    // --- ACTIVE GAME UI ---
    return (
        <div className="flex flex-col h-dvh w-screen bg-[#0a0a0f] text-white font-sans overflow-hidden relative">

            {/* Sound Toggle */}
            <button
                onClick={toggleSound}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors z-50"
            >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Points Earned Popup */}
            <AnimatePresence>
                {pointsEarned && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
                    >
                        <div className="text-4xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                            +{pointsEarned}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Comeback Announcement */}
            <AnimatePresence>
                {showComeback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    >
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.8)] animate-pulse">
                            COMEBACK! 🔥
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reactions Layer */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                    {visibleReactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{ y: '100%', x: reaction.isMe ? '20%' : '80%', opacity: 0, scale: 0.5 }}
                            animate={{ y: '30%', opacity: 1, scale: 1.5 }}
                            exit={{ y: '-20%', opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute bottom-0 text-6xl"
                            style={{ left: reaction.isMe ? '10%' : 'auto', right: reaction.isMe ? 'auto' : '10%' }}
                        >
                            {reaction.type === 'laugh' && '😂'}
                            {reaction.type === 'angry' && '🤬'}
                            {reaction.type === 'clap' && '👏'}
                            {reaction.type === 'poop' && '💩'}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Header / Scoreboard */}
            <div className="flex-none flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-4 border-b border-white/5 z-20">
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest truncate max-w-full">TU ({leftName})</span>
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-500 font-black text-4xl drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">{leftScore}</span>
                        {leftStreak > 1 && <span className="text-orange-500 font-bold animate-bounce">🔥 {leftStreak}</span>}
                    </div>
                </div>
                {/* Timer Bar */}
                <div className="w-1/3 flex flex-col items-center gap-1">
                    <span className={clsx(
                        "text-xs font-mono transition-colors",
                        timeLeft <= 5 ? "text-red-500 font-bold animate-pulse" : "text-slate-400"
                    )}>{timeLeft}s</span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            key={questionData.question}
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className={clsx(
                                "h-full origin-left transition-colors",
                                timeLeft <= 5 ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-yellow-500"
                            )}
                        />
                    </div>
                    {/* Question progress */}
                    <span className="text-[10px] text-slate-500 font-mono">
                        {questionData.currentIndex}/{questionData.totalQuestions}
                    </span>
                </div>
                <div className="flex flex-col items-end w-1/3">
                    <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest truncate max-w-full text-right">{rightName}</span>
                    <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-rose-500 font-black text-4xl drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{rightScore}</span>
                        {rightStreak > 1 && <span className="text-orange-500 font-bold animate-bounce">🔥 {rightStreak}</span>}
                    </div>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative w-full max-w-lg mx-auto overflow-y-auto">
                {/* Answer Feedback Overlay */}
                <AnimatePresence>
                    {answerResult && selectedOption !== null && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-x-0 top-4 z-30 flex items-center justify-center pointer-events-none"
                        >
                            <div className={clsx(
                                "backdrop-blur-md px-6 py-3 rounded-full border shadow-2xl flex items-center gap-2",
                                answerResult.isCorrect
                                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                                    : "bg-red-500/20 border-red-500/50 text-red-400"
                            )}>
                                {answerResult.isCorrect ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span className="font-bold">Corretto! +{answerResult.points}</span>
                                        {answerResult.streak > 1 && <span>🔥 x{answerResult.streak}</span>}
                                    </>
                                ) : (
                                    <>
                                        <X className="w-5 h-5" />
                                        <span className="font-bold">Sbagliato!</span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <h2 className="text-xl md:text-2xl font-bold leading-tight text-slate-100 mb-8 drop-shadow-md">
                    {questionData.question}
                </h2>

                <div className="grid grid-cols-1 gap-3 w-full">
                    {questionData.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        const isCorrectAnswer = answerResult?.correctIndex === index;
                        const showResult = answerResult && selectedOption !== null;

                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleOptionClick(index)}
                                disabled={selectedOption !== null || gameStatus === 'round_locked'}
                                whileTap={{ scale: 0.98 }}
                                className={clsx(
                                    "w-full p-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg border",
                                    // Show correct/wrong after answer
                                    showResult && isCorrectAnswer && "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 ring-2 ring-green-400",
                                    showResult && isSelected && !answerResult.isCorrect && "bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400 ring-2 ring-red-400",
                                    // Selected but waiting for result
                                    isSelected && !showResult && "bg-gradient-to-r from-yellow-400 to-amber-500 text-black ring-2 ring-white border-white/50",
                                    // Default state
                                    !isSelected && !showResult && "bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/5",
                                    // Disabled state
                                    (selectedOption !== null || gameStatus === 'round_locked') && !isSelected && !isCorrectAnswer && "opacity-50 grayscale"
                                )}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {option}
                                    {showResult && isCorrectAnswer && <Check className="w-5 h-5" />}
                                    {showResult && isSelected && !answerResult.isCorrect && <X className="w-5 h-5" />}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Reaction Bar */}
            <div className="flex-none p-4 flex justify-center gap-4 bg-slate-900/50 backdrop-blur-sm pb-safe">
                {['laugh', 'clap', 'angry', 'poop'].map(type => (
                    <button
                        key={type}
                        onClick={() => onReaction(type)}
                        className="text-2xl hover:scale-125 transition-transform active:scale-90"
                    >
                        {type === 'laugh' && '😂'}
                        {type === 'clap' && '👏'}
                        {type === 'angry' && '🤬'}
                        {type === 'poop' && '💩'}
                    </button>
                ))}
            </div>
        </div>
    );
}
