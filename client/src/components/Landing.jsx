import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, LogIn, User, Hash, Sparkles } from 'lucide-react';

export default function Landing({ onCreate, onJoin }) {
    const [joinCode, setJoinCode] = useState('');
    const [topic, setTopic] = useState('General');
    const [username, setUsername] = useState('');

    const handleCreateClick = () => {
        if (!username.trim()) return alert("Inserisci il tuo nome!");
        onCreate(topic, username);
    };

    const handleJoinClick = () => {
        if (!username.trim()) return alert("Inserisci il tuo nome!");
        if (!joinCode.trim()) return alert("Inserisci il codice stanza!");
        onJoin(joinCode, username);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0f] font-sans selection:bg-cyan-500/30">

            {/* --- ANIMATED BACKGROUND LAYER --- */}

            {/* 1. Moving Grid (Perspective) */}
            <div className="absolute inset-0 overflow-hidden perspective-1000 transform-gpu opacity-20 pointer-events-none">
                <div className="absolute -inset-[100%] top-[-50%] bg-grid-pattern w-[300%] h-[300%] origin-center transform rotate-x-60 animate-[moveGrid_20s_linear_infinite]"></div>
            </div>

            {/* 2. Floating Orbs (Intensified) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600 mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-cyan-600 mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-[10%] left-[40%] w-[600px] h-[600px] bg-pink-600 mix-blend-screen filter blur-[130px] opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* 3. Shooting Stars / Particles (Simulated with framer-motion) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full opacity-0"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: 0
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [0, 0.4, 0],
                            scale: [0, Math.random() * 2, 0]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        style={{ width: Math.random() * 4 + 1, height: Math.random() * 4 + 1 }}
                    />
                ))}
            </div>

            {/* --- CONTENT LAYER --- */}

            <motion.div
                className="relative z-10 w-full max-w-lg px-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                        <span className="text-xs text-slate-300 font-bold tracking-wider uppercase">Beta Version</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-2 relative group cursor-default">
                        <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                            Testa a Testa
                        </span>
                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500 text-glow">
                            Testa a Testa
                        </span>
                    </h1>
                    <p className="text-slate-400/80 text-lg uppercase tracking-[0.3em] font-medium">
                        Ultimate Trivia Battle
                    </p>
                </motion.div>

                {/* Main Identity Input */}
                <motion.div variants={itemVariants} className="mb-10 group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center">
                        <div className="pl-4 pr-2 text-slate-500">
                            <User className="w-6 h-6" />
                        </div>
                        <input
                            type="text"
                            placeholder="SCEGLI IL TUO NOME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-transparent p-3 text-white font-bold text-center text-lg placeholder-slate-600 focus:outline-none uppercase tracking-wide"
                        />
                    </div>
                </motion.div>

                {/* Actions Grid */}
                <div className="grid gap-6">

                    {/* Create Room Card */}
                    <motion.div variants={itemVariants} className="relative group perspective-1000">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl opacity-20 group-hover:opacity-80 blur-md transition duration-500"></div>
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-[1.02]">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Play className="fill-pink-500 text-pink-500 w-5 h-5" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Nuova Partita</span>
                            </h2>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Argomento (es. Storia)"
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all font-medium"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                                <button
                                    onClick={handleCreateClick}
                                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black py-4 rounded-xl shadow-lg shadow-rose-900/20 active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    CREA SFIDA
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative flex items-center py-2 opacity-50">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">VS</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </motion.div>

                    {/* Join Room Card */}
                    <motion.div variants={itemVariants} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-80 blur-md transition duration-500"></div>
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-[1.02]">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <LogIn className="text-cyan-500 w-5 h-5" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Unisciti</span>
                            </h2>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Hash className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="CODICE"
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 text-white uppercase tracking-widest font-mono font-bold focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <button
                                    onClick={handleJoinClick}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
                                >
                                    ENTRA
                                </button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
}
