import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, LogIn, User, Hash, Sparkles, Film, Music, Trophy, Globe, FlaskConical, Tv, Gamepad2, UtensilsCrossed, BookOpen, Landmark, Shuffle, Zap, Skull, Timer } from 'lucide-react';
import sounds, { unlockAudio } from '../hooks/useSounds';

// Predefined categories
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
    { id: 'random', name: 'Mix', icon: Shuffle, color: 'from-slate-500 to-slate-700' },
];

// Game modes
const GAME_MODES = [
    { id: 'normal', name: 'Normale', icon: Play, color: 'from-cyan-500 to-blue-600', desc: '15s per domanda' },
    { id: 'speed', name: 'Speed', icon: Zap, color: 'from-yellow-500 to-orange-600', desc: '5s per domanda' },
    { id: 'sudden_death', name: 'Sudden Death', icon: Skull, color: 'from-red-500 to-rose-700', desc: 'Sbagli = Perdi' },
];

// Avatar options
const AVATARS = ['😀', '😎', '🤓', '🧠', '🦊', '🐱', '🦁', '🐸', '👻', '🤖', '👽', '🎮', '🎯', '🔥', '⭐', '💎'];

export default function Landing({ onCreate, onJoin }) {
    const [joinCode, setJoinCode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [customTopic, setCustomTopic] = useState('');
    const [username, setUsername] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState('😀');
    const [selectedMode, setSelectedMode] = useState('normal');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    const handleCategoryClick = (category) => {
        unlockAudio();
        sounds.click();
        if (category.id === 'random') {
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
        await unlockAudio();
        sounds.click();
        onCreate(topic, username, selectedAvatar, selectedMode);
    };

    const handleJoinClick = async () => {
        if (!username.trim()) return alert("Inserisci il tuo nome!");
        if (!joinCode.trim()) return alert("Inserisci il codice stanza!");
        await unlockAudio();
        sounds.click();
        onJoin(joinCode, username, selectedAvatar);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0f] font-sans selection:bg-cyan-500/30">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600 mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-cyan-600 mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-[10%] left-[40%] w-[600px] h-[600px] bg-pink-600 mix-blend-screen filter blur-[130px] opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                className="relative z-10 w-full max-w-lg px-4 py-6 max-h-screen overflow-y-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="text-center mb-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500">
                        Testa a Testa
                    </h1>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Ultimate Trivia Battle</p>
                </motion.div>

                {/* Avatar + Name Row */}
                <motion.div variants={itemVariants} className="mb-4 flex gap-2">
                    {/* Avatar Picker */}
                    <div className="relative">
                        <button
                            onClick={() => { unlockAudio(); sounds.click(); setShowAvatarPicker(!showAvatarPicker); }}
                            className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl hover:bg-slate-700 transition-colors"
                        >
                            {selectedAvatar}
                        </button>
                        {showAvatarPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute top-16 left-0 z-50 bg-slate-900 border border-slate-700 rounded-xl p-2 grid grid-cols-4 gap-1 shadow-xl"
                            >
                                {AVATARS.map(avatar => (
                                    <button
                                        key={avatar}
                                        onClick={() => { sounds.click(); setSelectedAvatar(avatar); setShowAvatarPicker(false); }}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl hover:bg-slate-700 transition-colors ${selectedAvatar === avatar ? 'bg-cyan-600' : 'bg-slate-800'}`}
                                    >
                                        {avatar}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                    {/* Name Input */}
                    <div className="flex-1 relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-50 transition"></div>
                        <input
                            type="text"
                            placeholder="IL TUO NOME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="relative w-full h-14 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-bold text-center placeholder-slate-600 focus:outline-none focus:border-cyan-500 uppercase tracking-wide"
                        />
                    </div>
                </motion.div>

                {/* Create Room Section */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 border border-white/5 p-4 rounded-2xl mb-3">
                    <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <Play className="fill-pink-500 text-pink-500 w-4 h-4" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Nuova Partita</span>
                    </h2>

                    {/* Game Mode Selection */}
                    <div className="flex gap-2 mb-3">
                        {GAME_MODES.map(mode => {
                            const Icon = mode.icon;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => { sounds.click(); setSelectedMode(mode.id); }}
                                    className={`flex-1 p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                                        selectedMode === mode.id
                                            ? `bg-gradient-to-br ${mode.color} text-white shadow-lg`
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase">{mode.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isSelected = selectedCategory?.id === category.id;
                            return (
                                <motion.button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
                                        isSelected
                                            ? `bg-gradient-to-br ${category.color} text-white shadow-lg ring-2 ring-white/30`
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 mb-0.5" />
                                    <span className="text-[8px] font-bold uppercase leading-tight">{category.name}</span>
                                </motion.button>
                            );
                        })}
                        {/* Custom Topic */}
                        <motion.button
                            onClick={() => { unlockAudio(); sounds.click(); setShowCustomInput(!showCustomInput); setSelectedCategory(null); }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
                                showCustomInput
                                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            }`}
                        >
                            <span className="text-sm mb-0.5">✏️</span>
                            <span className="text-[8px] font-bold uppercase">Altro</span>
                        </motion.button>
                    </div>

                    {/* Custom Topic Input */}
                    {showCustomInput && (
                        <input
                            type="text"
                            placeholder="Scrivi argomento..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 text-sm mb-3"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            autoFocus
                        />
                    )}

                    {/* Selected info */}
                    {(selectedCategory || (showCustomInput && customTopic)) && (
                        <div className="text-center text-xs text-slate-400 mb-2">
                            <span className="text-cyan-400 font-bold">{selectedCategory?.name || customTopic}</span>
                            {' • '}
                            <span className="text-pink-400">{GAME_MODES.find(m => m.id === selectedMode)?.name}</span>
                        </div>
                    )}

                    <button
                        onClick={handleCreateClick}
                        disabled={!selectedCategory && !(showCustomInput && customTopic)}
                        className={`w-full font-black py-3 rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${
                            (selectedCategory || (showCustomInput && customTopic))
                                ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg active:scale-95'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        CREA SFIDA
                    </button>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="flex items-center py-2 opacity-50">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="mx-3 text-slate-500 text-[10px] font-bold uppercase">oppure</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </motion.div>

                {/* Join Room */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 border border-white/5 p-4 rounded-2xl">
                    <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <LogIn className="text-cyan-500 w-4 h-4" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Unisciti</span>
                    </h2>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="CODICE"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-9 pr-3 py-3 text-white uppercase tracking-widest font-mono font-bold focus:outline-none focus:border-cyan-500/50"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                maxLength={4}
                            />
                        </div>
                        <button
                            onClick={handleJoinClick}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-5 rounded-xl shadow-lg active:scale-95 transition-all text-sm uppercase"
                        >
                            ENTRA
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
