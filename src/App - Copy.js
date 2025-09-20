import React, { useState } from "react";
import Papa from "papaparse";
import Flashcard from "./components/Flashcard";

function App() {
  const [decks, setDecks] = useState({});
  const [currentDeck, setCurrentDeck] = useState(null);

  // Handle CSV upload
const handleUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const cards = results.data
        .filter((row) => (row.question || row.Question) && (row.answer || row.Answer)) // ✅ flexible
        .map((row) => ({
          question: row.question || row.Question,
          answer: row.answer || row.Answer,
        }));

      setDecks((prev) => ({
        ...prev,
        [file.name.replace(".csv", "")]: cards,
      }));
    },
  });
};

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {!currentDeck ? (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Flashcard App</h1>
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
            className="mb-6"
          />

          {Object.keys(decks).length === 0 && (
            <p className="text-gray-600">Upload a CSV to create a deck.</p>
          )}

          <div className="grid gap-4">
            {Object.keys(decks).map((deckName) => (
              <button
                key={deckName}
                className="bg-white p-4 rounded-lg shadow hover:bg-gray-50 text-left"
                onClick={() => setCurrentDeck(deckName)}
              >
                {deckName} ({decks[deckName].length} cards)
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setCurrentDeck(null)}
          >
            ← Back to Decks
          </button>
          <Flashcard cards={decks[currentDeck]} />
        </div>
      )}
    </div>
  );
}

export default App;
