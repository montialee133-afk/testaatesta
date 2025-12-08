import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Timer as TimerIcon } from 'lucide-react';

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
    opponentNameForWaiting
}) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [visibleReactions, setVisibleReactions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(15);

    // Reset selection and timer when question changes
    useEffect(() => {
        setSelectedOption(null);
        setTimeLeft(15);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questionData]);

    // Handle incoming reactions
    useEffect(() => {
        if (lastReaction) {
            const newReaction = {
                id: lastReaction.id,
                type: lastReaction.type,
                isMe: lastReaction.isMe
            };
            setVisibleReactions(prev => [...prev, newReaction]);

            // Auto remove after animation
            setTimeout(() => {
                setVisibleReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 2000);
        }
    }, [lastReaction]);

    const handleOptionClick = (index) => {
        if (selectedOption !== null) return; // Prevent double clicks
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

    // --- GAME OVER SCREEN ---
    if (gameStatus === 'game_over') {
        const iWon = leftScore > rightScore;
        const isDraw = leftScore === rightScore;

        return (
            <div className="flex flex-col items-center justify-center h-dvh w-screen bg-[#0a0a0f] text-white p-6 overflow-hidden relative">
                <div className="text-center space-y-6 z-10">
                    <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">
                        {isDraw ? <span className="text-gray-400">Parità!</span> : (
                            iWon
                                ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Vittoria! 🏆</span>
                                : <span className="text-slate-500">Sconfitta... 💀</span>
                        )}
                    </h1>

                    <div className="flex justify-center items-center gap-8 text-3xl font-bold bg-slate-900/50 p-6 rounded-2xl border border-white/10">
                        <div className="text-center">
                            <div className="text-cyan-400 text-sm uppercase mb-1">Tu</div>
                            <div>{leftScore}</div>
                        </div>
                        <div className="text-slate-600">-</div>
                        <div className="text-center">
                            <div className="text-rose-400 text-sm uppercase mb-1">{rightName}</div>
                            <div>{rightScore}</div>
                        </div>
                    </div>

                    <div className="pt-8">
                        {opponentWantsRematch && !rematchRequested && (
                            <div className="mb-4 text-pink-400 animate-bounce font-bold">
                                L'avversario vuole la rivincita!
                            </div>
                        )}

                        <button
                            onClick={onRematch}
                            disabled={rematchRequested}
                            className={clsx(
                                "flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-xl",
                                rematchRequested
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500"
                            )}
                        >
                            <RefreshCw className={clsx("w-6 h-6", rematchRequested && "animate-spin")} />
                            {rematchRequested ? "In attesa..." : "RIVINCITA"}
                        </button>
                    </div>
                </div>
                {/* Background particles for celebration */}
                {iWon && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                )}
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
                    <span className="text-xs font-mono text-slate-400">{timeLeft}s</span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            key={questionData.question} // Key change forces animation reset
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 origin-left"
                        />
                    </div>
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
                {gameStatus === 'round_locked' && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl animate-bounce">
                            <span className="text-white font-bold">Rispota Inviata 🔒</span>
                        </div>
                    </div>
                )}

                <h2 className="text-xl md:text-2xl font-bold leading-tight text-slate-100 mb-8 drop-shadow-md">
                    {questionData.question}
                </h2>

                <div className="grid grid-cols-1 gap-3 w-full">
                    {questionData.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(index)}
                            disabled={selectedOption !== null || gameStatus === 'round_locked'}
                            className={clsx(
                                "w-full p-4 rounded-xl text-lg font-bold transition-all duration-200 active:scale-[0.98] shadow-lg border border-white/5",
                                selectedOption === index
                                    ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black ring-2 ring-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200",
                                (selectedOption !== null || gameStatus === 'round_locked') && selectedOption !== index && "opacity-50 grayscale"
                            )}
                        >
                            {option}
                        </button>
                    ))}
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

            <style>{`
                @keyframes shrink {
                    from { width: 100%; filter: hue-rotate(0deg); }
                    to { width: 0%; filter: hue-rotate(-120deg); }
                }
            `}</style>
        </div>
    );
}
