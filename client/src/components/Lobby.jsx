import React from 'react';

export default function Lobby({ roomCode, topic }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans animate-pulse">
            <h2 className="text-2xl text-gray-400 mb-2">Codice Stanza</h2>
            <div className="text-7xl font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-8">
                {roomCode}
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center max-w-sm">
                <p className="text-gray-300 mb-2">Argomento: <span className="font-semibold text-white">{topic}</span></p>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="mt-4 text-blue-300 font-medium">In attesa dell'avversario...</p>
            </div>
        </div>
    );
}
