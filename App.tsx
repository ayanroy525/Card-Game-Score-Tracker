import React, { useState, useEffect } from 'react';
import { Gamepad2, RotateCcw, Download, Edit3, Trophy, Minus, Plus } from 'lucide-react';

interface Player {
  name: string;
  scores: number[];
  total: number;
}

interface PlayersData {
  player1: Player;
  player2: Player;
  player3: Player;
  player4: Player;
}

function App() {
  const [players, setPlayers] = useState<PlayersData>({
    player1: { name: 'Player 1', scores: [], total: 0 },
    player2: { name: 'Player 2', scores: [], total: 0 },
    player3: { name: 'Player 3', scores: [], total: 0 },
    player4: { name: 'Player 4', scores: [], total: 0 }
  });
  
  const [roundScores, setRoundScores] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load from localStorage on component mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem('gamingScoreTracker');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
  }, []);

  // Save to localStorage whenever players state changes
  useEffect(() => {
    localStorage.setItem('gamingScoreTracker', JSON.stringify(players));
  }, [players]);

  const validateInput = (value: string) => {
    return value.replace(/[^0-9\- ]/g, '');
  };

  const handleRoundScoresChange = (value: string) => {
    const validatedValue = validateInput(value);
    setRoundScores(validatedValue);
  };

  const submitRoundScores = () => {
    if (!roundScores.trim()) return;

    const values = roundScores.trim().split(/\s+/).map(v => 
      (v === '' || v === '-') ? null : parseInt(v, 10)
    );
    const playerKeys = Object.keys(players) as (keyof PlayersData)[];

    setPlayers(prev => {
      const newPlayers = { ...prev };
      values.forEach((value, index) => {
        if (index < playerKeys.length && value !== null && !isNaN(value)) {
          const player = playerKeys[index];
          newPlayers[player] = {
            ...newPlayers[player],
            scores: [...newPlayers[player].scores, value],
            total: newPlayers[player].total + value
          };
        }
      });
      return newPlayers;
    });

    setRoundScores('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRoundScores();
    }
  };

  const updatePlayerName = (playerId: keyof PlayersData, name: string) => {
    setPlayers(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], name }
    }));
  };

  const editScore = (playerId: keyof PlayersData, scoreIndex: number) => {
    const currentScore = players[playerId].scores[scoreIndex];
    const newScoreStr = prompt(`Edit score for ${players[playerId].name}:`, currentScore.toString());
    
    if (newScoreStr !== null) {
      const newScore = parseInt(newScoreStr, 10);
      if (!isNaN(newScore)) {
        setPlayers(prev => {
          const newPlayers = { ...prev };
          const oldScore = newPlayers[playerId].scores[scoreIndex];
          newPlayers[playerId].scores[scoreIndex] = newScore;
          newPlayers[playerId].total = newPlayers[playerId].total - oldScore + newScore;
          return newPlayers;
        });
      }
    }
  };

  const resetAllScores = () => {
    setPlayers({
      player1: { name: players.player1.name, scores: [], total: 0 },
      player2: { name: players.player2.name, scores: [], total: 0 },
      player3: { name: players.player3.name, scores: [], total: 0 },
      player4: { name: players.player4.name, scores: [], total: 0 }
    });
    setShowResetConfirm(false);
  };

  const exportToExcel = () => {
    const data = Object.values(players).map(player => ({
      'Player Name': player.name,
      'Scores': player.scores.join(', '),
      'Total': player.total
    }));

    // Simple CSV export since we're not using external libraries
    const csvContent = [
      ['Player Name', 'Scores', 'Total'],
      ...Object.values(players).map(player => [
        player.name,
        player.scores.join(', '),
        player.total.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game_scores.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPlayerRank = (playerId: keyof PlayersData) => {
    const sortedPlayers = Object.entries(players)
      .sort(([, a], [, b]) => b.total - a.total);
    return sortedPlayers.findIndex(([id]) => id === playerId) + 1;
  };

  const PlayerCard = ({ playerId }: { playerId: keyof PlayersData }) => {
    const player = players[playerId];
    const rank = getPlayerRank(playerId);
    const isLeading = rank === 1 && player.total > 0;
    
    return (
      <div className={`relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 ${isLeading ? 'ring-2 ring-yellow-400/50 shadow-xl shadow-yellow-400/20' : ''}`}>
        {isLeading && (
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-2 rounded-full animate-pulse">
            <Trophy className="w-5 h-5" />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : rank === 3 ? 'bg-orange-600' : 'bg-gray-600'}`}></div>
            <span className="text-sm text-gray-400">#{rank}</span>
          </div>
          <Gamepad2 className="w-5 h-5 text-cyan-400" />
        </div>

        <input
          type="text"
          value={player.name}
          onChange={(e) => updatePlayerName(playerId, e.target.value)}
          className="w-full bg-transparent text-white text-xl font-bold border-none outline-none focus:text-cyan-400 transition-colors duration-200 mb-4"
        />

        <div className="mb-6">
          <h4 className="text-gray-400 text-sm mb-3 flex items-center">
            <Edit3 className="w-4 h-4 mr-2" />
            Recent Scores (tap to edit)
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {player.scores.slice(-5).reverse().map((score, index) => {
              const actualIndex = player.scores.length - 1 - index;
              return (
                <button
                  key={actualIndex}
                  onClick={() => editScore(playerId, actualIndex)}
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-110 mr-2 mb-1 ${
                    score >= 0 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  {score >= 0 ? '+' : ''}{score}
                </button>
              );
            })}
            {player.scores.length === 0 && (
              <p className="text-gray-500 text-sm italic">No scores yet</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700/50 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Total Score</span>
            <span className={`text-3xl font-bold transition-colors duration-300 ${
              player.total > 0 ? 'text-green-400' : player.total < 0 ? 'text-red-400' : 'text-gray-300'
            }`}>
              {player.total >= 0 ? '+' : ''}{player.total}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
          Gaming Score Tracker
        </h1>
        <p className="text-gray-400 text-lg">Four-Player Card Game Edition</p>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-6xl mx-auto">
        {(Object.keys(players) as (keyof PlayersData)[]).map(playerId => (
          <PlayerCard key={playerId} playerId={playerId} />
        ))}
      </div>

      {/* Input Section */}
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-center text-cyan-400">Add Round Scores</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={roundScores}
            onChange={(e) => handleRoundScoresChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter 4 scores separated by spaces (e.g., 10 -5 20 15)"
            className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-200"
          />
          <button
            onClick={submitRoundScores}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Scores
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          Enter scores in order: {players.player1.name}, {players.player2.name}, {players.player3.name}, {players.player4.name}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset All
        </button>
        
        <button
          onClick={exportToExcel}
          className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-center mb-4 text-red-400">Reset All Scores?</h3>
            <p className="text-gray-300 text-center mb-6">This will permanently delete all player scores and cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={resetAllScores}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-xl font-medium transition-all duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}

export default App;