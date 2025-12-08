import React from 'react';
import { Zap, Skull, Play } from 'lucide-react';

const MODE_INFO = {
    normal: { name: 'Normale', icon: Play, color: 'text-cyan-400' },
    speed: { name: 'Speed', icon: Zap, color: 'text-yellow-400' },
    sudden_death: { name: 'Sudden Death', icon: Skull, color: 'text-red-400' }
};

export default function Lobby({ roomCode, topic, gameMode = 'normal' }) {
    const mode = MODE_INFO[gameMode] || MODE_INFO.normal;
    const ModeIcon = mode.icon;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white p-4 font-sans">
            <div className="text-center">
                <h2 className="text-lg text-slate-500 mb-2 uppercase tracking-widest">Codice Stanza</h2>
                <div className="text-6xl md:text-8xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 animate-pulse">
                    {roomCode}
                </div>

                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Argomento</p>
                            <p className="font-bold text-white">{topic}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700"></div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Modalità</p>
                            <p className={`font-bold flex items-center gap-1 ${mode.color}`}>
                                <ModeIcon className="w-4 h-4" />
                                {mode.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="mt-3 text-cyan-400 font-medium text-sm">In attesa dell'avversario...</p>
                    <p className="mt-2 text-slate-600 text-xs">Condividi il codice con un amico!</p>
                </div>
            </div>
        </div>
    );
}
