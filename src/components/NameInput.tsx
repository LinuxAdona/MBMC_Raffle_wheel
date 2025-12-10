import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export interface NameSet {
  id: number;
  names: string[];
}

interface NameInputProps {
  sets: NameSet[];
  onSetsChange: (sets: NameSet[]) => void;
  selectedSetId: number;
}

const NameInput: React.FC<NameInputProps> = ({ sets, onSetsChange, selectedSetId }) => {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentSet = sets.find(s => s.id === selectedSetId) || { id: selectedSetId, names: [] };
  const allNames = sets.flatMap(s => s.names);

  const addName = () => {
    const trimmedName = inputValue.trim();
    if (trimmedName && !currentSet.names.includes(trimmedName)) {
      const updatedSets = sets.map(s => 
        s.id === selectedSetId 
          ? { ...s, names: [...s.names, trimmedName] }
          : s
      );
      if (!sets.find(s => s.id === selectedSetId)) {
        updatedSets.push({ id: selectedSetId, names: [trimmedName] });
      }
      onSetsChange(updatedSets);
      setInputValue('');
    }
  };

  const removeName = (index: number) => {
    const updatedSets = sets.map(s => 
      s.id === selectedSetId
        ? { ...s, names: s.names.filter((_, i) => i !== index) }
        : s
    ).filter(s => s.names.length > 0);
    onSetsChange(updatedSets);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addName();
    }
  };

  const clearAll = () => {
    const updatedSets = sets.filter(s => s.id !== selectedSetId);
    onSetsChange(updatedSets);
  };

  const addSampleNames = () => {
    const samples = [
      'Alice Johnson',
      'Bob Smith',
      'Carol Davis',
      'David Wilson',
      'Emma Brown',
      'Frank Miller',
      'Grace Lee',
      'Henry Garcia'
    ];
    const updatedSets = sets.filter(s => s.id !== selectedSetId);
    updatedSets.push({ id: selectedSetId, names: samples });
    onSetsChange(updatedSets);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;
        
        if (jsonData.length === 0) {
          alert('The file appears to be empty.');
          return;
        }

        const newSets: NameSet[] = [];
        const setPattern = /^Set\s+(\d+)$/i;
        
        // Get all column names
        const columns = Object.keys(jsonData[0]);
        
        // Find all "Set n" columns
        columns.forEach(col => {
          const match = col.match(setPattern);
          if (match) {
            const setNumber = parseInt(match[1]);
            const names = jsonData
              .map(row => row[col])
              .filter(name => name && String(name).trim() !== '')
              .map(name => String(name).trim());
            
            if (names.length > 0) {
              newSets.push({ id: setNumber, names });
            }
          }
        });
        
        if (newSets.length > 0) {
          onSetsChange(newSets);
        } else {
          alert('No "Set 1", "Set 2", etc. columns found. Please check your file.');
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please make sure it\'s a valid Excel or CSV file with "Set 1", "Set 2", etc. columns.');
      }
    };

    reader.readAsArrayBuffer(file);
    
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[40vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Participants</h2>
      <p className="text-sm text-gray-500 mb-4">Current Set: <span className="font-bold text-purple-500">Set {selectedSetId}</span> (Ctrl+Alt+{selectedSetId} to switch)</p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a name..."
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-300 focus:outline-none transition-colors"
        />
        <button
          onClick={addName}
          className="px-6 py-2 bg-linear-to-r from-purple-400 to-pink-400 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 font-semibold transition-all"
        >
          Add
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={triggerFileInput}
          className="flex-1 px-4 py-2 bg-green-300 text-white rounded-lg hover:bg-green-400 font-semibold transition-colors text-sm"
        >
          📁 Load Excel
        </button>
        <button
          onClick={addSampleNames}
          className="flex-1 px-4 py-2 bg-blue-300 text-white rounded-lg hover:bg-blue-400 font-semibold transition-colors text-sm"
        >
          Load Sample
        </button>
        <button
          onClick={clearAll}
          disabled={currentSet.names.length === 0}
          className="flex-1 px-4 py-2 bg-red-300 text-white rounded-lg hover:bg-red-400 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Clear Set {selectedSetId}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {currentSet.names.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No participants in Set {selectedSetId} yet. Add some names!</p>
        ) : (
          currentSet.names.map((name, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-linear-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-lg group hover:from-purple-100 hover:to-pink-100 transition-colors"
            >
              <span className="font-medium text-gray-700">{name}</span>
              <button
                onClick={() => removeName(index)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {sets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Set {selectedSetId}: <span className="font-bold text-purple-400">{currentSet.names.length}</span> | 
            Total (all sets): <span className="font-bold text-purple-400">{allNames.length}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default NameInput;
