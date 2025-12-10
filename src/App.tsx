import { useState, useEffect } from 'react';
import WheelOfNames from './components/WheelOfNames';
import NameInput, { type NameSet } from './components/NameInput';

const App = () => {
  const [sets, setSets] = useState<NameSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const allNames = sets.flatMap(s => s.names);
  const selectedSetNames = sets.find(s => s.id === selectedSetId)?.names || [];

  const handleWinner = (winnerName: string) => {
    setWinner(winnerName);
    setShowModal(true);
    
    // Remove winner from the selected set
    const updatedSets = sets.map(s => 
      s.id === selectedSetId
        ? { ...s, names: s.names.filter(name => name !== winnerName) }
        : s
    ).filter(s => s.names.length > 0);
    
    setSets(updatedSets);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Alt+Number
      if (e.ctrlKey && e.altKey && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const setNumber = parseInt(e.key);
        if (setNumber >= 1 && setNumber <= 9) {
          setSelectedSetId(setNumber);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-300 via-purple-300 to-pink-300">
      {/* Wheel Section - h-screen */}
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🎡 Wheel of Names
          </h1>
          <p className="text-white text-lg opacity-90">
            Add participants and spin to pick a random winner!
          </p>
          <p className="text-white text-sm opacity-75 mt-2">
            Use Ctrl+Alt+1-9 to switch between sets
          </p>
        </div>

        {/* Wheel centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <WheelOfNames 
            allNames={allNames} 
            selectedSetNames={selectedSetNames}
            onWinner={handleWinner} 
          />
        </div>

        {/* Spacer to push content up a bit */}
        <div className="pb-8"></div>
      </div>

      {/* Name Input Section - Below the h-screen section */}
      <div className="pb-8 px-4 flex justify-center">
        <NameInput 
          sets={sets} 
          onSetsChange={setSets} 
          selectedSetId={selectedSetId}
        />
      </div>

      {/* Winner Modal */}
      {showModal && winner && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/30"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4 transform transition-all animate-[wiggle_0.5s_ease-in-out]"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'wiggle 0.5s ease-in-out'
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Winner
              </h2>
              <p className="text-5xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
                {winner}
              </p>
              <div className="text-6xl mb-6">🏆</div>
              <button
                onClick={closeModal}
                className="px-8 py-3 bg-linear-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
