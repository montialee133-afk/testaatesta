import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, LogIn, User, Hash, Sparkles, Film, Music, Trophy, Globe, FlaskConical, Tv, Gamepad2, UtensilsCrossed, BookOpen, Landmark, Shuffle } from 'lucide-react';
import sounds, { unlockAudio } from '../hooks/useSounds';

// Predefined categories with icons and colors
const CATEGORIES = [
    { id: 'cinema', name: 'Cinema', icon: Film, color: 'from-amber-500 to-orange-600' },
    { id: 'musica', name: 'Musica', icon: Music, color: 'from-pink-500 to-rose-600' },
    { id: 'sport', name: 'Sport', icon: Trophy, color: 'from-green-500 to-emerald-600' },
    { id: 'geografia', name: 'Geografia', icon: Globe, color: 'from-blue-500 to-cyan-600' },
    { id: 'scienza', name: 'Scienza', icon: FlaskConical, color: 'from-purple-500 to-violet-600' },
    { id: 'tv', name: 'Serie TV', icon: Tv, color: 'from-red-500 to-pink-600' },
    { id: 'videogiochi', name: 'Videogiochi', icon: Gamepad2, color: 'from-indigo-500 to-purple-600' },
    { id: 'cucina', name: 'Cucina', icon: UtensilsCrossed, color: 'from-orange-500 to-red-600' },
    { id: 'storia', name: 'Storia', icon: BookOpen, color: 'from-yellow-600 to-amber-700' },
    { id: 'italia', name: 'Made in Italy', icon: Landmark, color: 'from-green-600 to-red-600' },
    { id: 'random', name: 'Mix Casuale', icon: Shuffle, color: 'from-slate-500 to-slate-700' },
];

export default function Landing({ onCreate, onJoin }) {
    const [joinCode, setJoinCode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [customTopic, setCustomTopic] = useState('');
    const [username, setUsername] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const handleCategoryClick = (category) => {
        // Unlock audio on first interaction
        unlockAudio();
        sounds.click();
        if (category.id === 'random') {
            // Select random category (excluding 'random' itself)
            const randomCats = CATEGORIES.filter(c => c.id !== 'random');
            const randomCat = randomCats[Math.floor(Math.random() * randomCats.length)];
            setSelectedCategory(randomCat);
        } else {
            setSelectedCategory(category);
        }
        setShowCustomInput(false);
        setCustomTopic('');
    };

    const handleCreateClick = async () => {
        if (!username.trim()) return alert("Inserisci il tuo nome!");
        const topic = showCustomInput ? customTopic : (selectedCategory?.name || "Cultura Generale");
        // Unlock audio on iOS with user gesture
        await unlockAudio();
        sounds.click();
        onCreate(topic, username);
    };

    const handleJoinClick = async () => {
        if (!username.trim()) return alert("Inserisci il tuo nome!");
        if (!joinCode.trim()) return alert("Inserisci il codice stanza!");
        // Unlock audio on iOS with user gesture
        await unlockAudio();
        sounds.click();
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
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
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
                className="relative z-10 w-full max-w-lg px-6 py-8 max-h-screen overflow-y-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-2 mb-3 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                        <span className="text-xs text-slate-300 font-bold tracking-wider uppercase">Beta Version</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 relative group cursor-default">
                        <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                            Testa a Testa
                        </span>
                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500 text-glow">
                            Testa a Testa
                        </span>
                    </h1>
                    <p className="text-slate-400/80 text-sm uppercase tracking-[0.3em] font-medium">
                        Ultimate Trivia Battle
                    </p>
                </motion.div>

                {/* Main Identity Input */}
                <motion.div variants={itemVariants} className="mb-6 group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center">
                        <div className="pl-4 pr-2 text-slate-500">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="IL TUO NOME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-transparent p-2 text-white font-bold text-center text-lg placeholder-slate-600 focus:outline-none uppercase tracking-wide"
                        />
                    </div>
                </motion.div>

                {/* Actions Grid */}
                <div className="grid gap-4">

                    {/* Create Room Card */}
                    <motion.div variants={itemVariants} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl opacity-20 group-hover:opacity-60 blur-md transition duration-500"></div>
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <Play className="fill-pink-500 text-pink-500 w-5 h-5" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Nuova Partita</span>
                            </h2>

                            {/* Category Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {CATEGORIES.map((category) => {
                                    const Icon = category.icon;
                                    const isSelected = selectedCategory?.id === category.id;
                                    return (
                                        <motion.button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category)}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                                flex flex-col items-center justify-center p-2 rounded-xl transition-all
                                                ${isSelected
                                                    ? `bg-gradient-to-br ${category.color} text-white shadow-lg ring-2 ring-white/30`
                                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon className="w-5 h-5 mb-1" />
                                            <span className="text-[9px] font-bold uppercase tracking-tight leading-tight text-center">
                                                {category.name}
                                            </span>
                                        </motion.button>
                                    );
                                })}

                                {/* Custom Topic Button */}
                                <motion.button
                                    onClick={() => {
                                        unlockAudio();
                                        sounds.click();
                                        setShowCustomInput(!showCustomInput);
                                        setSelectedCategory(null);
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`
                                        flex flex-col items-center justify-center p-2 rounded-xl transition-all
                                        ${showCustomInput
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-white/30'
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                        }
                                    `}
                                >
                                    <span className="text-lg mb-1">✏️</span>
                                    <span className="text-[9px] font-bold uppercase tracking-tight">Altro</span>
                                </motion.button>
                            </div>

                            {/* Custom Topic Input */}
                            {showCustomInput && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-3"
                                >
                                    <input
                                        type="text"
                                        placeholder="Scrivi il tuo argomento..."
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                                        value={customTopic}
                                        onChange={(e) => setCustomTopic(e.target.value)}
                                        autoFocus
                                    />
                                </motion.div>
                            )}

                            {/* Selected Category Display */}
                            {selectedCategory && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mb-3 text-center"
                                >
                                    <span className="text-sm text-slate-400">Argomento: </span>
                                    <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${selectedCategory.color}`}>
                                        {selectedCategory.name}
                                    </span>
                                </motion.div>
                            )}

                            <button
                                onClick={handleCreateClick}
                                disabled={!selectedCategory && !showCustomInput}
                                className={`
                                    w-full font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2
                                    ${(selectedCategory || (showCustomInput && customTopic))
                                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-rose-900/20'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Play className="w-4 h-4 fill-current" />
                                CREA SFIDA
                            </button>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative flex items-center py-1 opacity-50">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">oppure</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </motion.div>

                    {/* Join Room Card */}
                    <motion.div variants={itemVariants} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-60 blur-md transition duration-500"></div>
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
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
                                        maxLength={4}
                                    />
                                </div>
                                <button
                                    onClick={handleJoinClick}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-6 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
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
