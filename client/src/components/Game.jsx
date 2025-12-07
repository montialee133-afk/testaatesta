import React, { useState, useEffect } from 'react';

export default function Game({ questionData, score, names, onAnswer, gameStatus }) {
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        setSelectedOption(null);
    }, [questionData]);

    const handleOptionClick = (index) => {
        setSelectedOption(index);
        onAnswer(index);
    };

    if (!questionData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-2xl animate-pulse">
                    {gameStatus === 'preparing' ? 'Generazione Domande...' : 'Caricamento...'}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
            {/* Header / Score */}
            <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700">
                <div className="flex flex-col items-center w-1/3">
                    <span className="text-gray-400 text-sm font-bold truncate max-w-full">{names.host}</span>
                    <span className="text-blue-400 font-bold text-3xl">{score.host}</span>
                </div>
                <div className="text-gray-600 font-mono text-xl">VS</div>
                <div className="flex flex-col items-center w-1/3">
                    <span className="text-gray-400 text-sm font-bold truncate max-w-full">{names.guest}</span>
                    <span className="text-red-400 font-bold text-3xl">{score.guest}</span>
                </div>
            </div>

            {/* Question Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

                {/* Status Overlay */}
                {gameStatus === 'round_locked' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-white text-2xl font-bold animate-bounce">
                            Risposta Inviata!
                        </div>
                    </div>
                )}

                <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight max-w-3xl">
                    {questionData.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    {questionData.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(index)}
                            disabled={selectedOption !== null || gameStatus === 'round_locked'}
                            className={`
                                p-6 rounded-xl text-lg font-semibold transition-all transform active:scale-95
                                ${selectedOption === index
                                    ? 'bg-yellow-500 text-black ring-4 ring-yellow-300 scale-105'
                                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
