// src/App.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Flashcard from "./components/Flashcard";

function App() {
  const [decks, setDecks] = useState({ Uncategorized: [] });
  const [activeDeck, setActiveDeck] = useState(null);
  const [history, setHistory] = useState([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("flashcardDecks");
    if (saved) {
      setDecks(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("flashcardDecks", JSON.stringify(decks));
  }, [decks]);

  // File upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedCards = results.data
          .filter((row) => row.question || row.Question)
          .map((row) => ({
            question: (row.question || row.Question || "").trim(),
            answer: (row.answer || row.Answer || "").trim(),
          }))
          .filter((card) => card.question && card.answer);

        if (parsedCards.length === 0) return;

        const newDeck = {
          id: Date.now(),
          name: file.name.replace(".csv", ""),
          cards: parsedCards,
          learned: [],
          stats: { swipes: 0, knew: 0, didntKnow: 0 },
          currentIndex: 0,
          finished: false,
        };

        setDecks((prev) => ({
          ...prev,
          Uncategorized: [...(prev.Uncategorized || []), newDeck],
        }));
      },
    });
  };

  // Folder creation
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (decks[newFolderName] || newFolderName === "Learned Cards") return; // prevent duplicates & reserved name

    setDecks((prev) => ({
      ...prev,
      [newFolderName]: [],
    }));
    setNewFolderName("");
    setShowFolderInput(false);
  };

  // Move deck to another folder
  const moveDeckToFolder = (deckId, fromFolder, toFolder) => {
    if (!toFolder || fromFolder === toFolder) return;
    const deckToMove = decks[fromFolder].find((d) => d.id === deckId);

    setDecks((prev) => {
      const updated = { ...prev };
      updated[fromFolder] = updated[fromFolder].filter((d) => d.id !== deckId);
      updated[toFolder] = [...(updated[toFolder] || []), deckToMove];
      return updated;
    });
  };

  // Handle swipe (knew it / didn’t know)
  const handleSwipe = (direction) => {
    if (!activeDeck) return;
    const { folder, deck } = activeDeck;
    const currentCard = deck.cards[deck.currentIndex];
    let updatedDeck = { ...deck };

    updatedDeck.swipes = (updatedDeck.swipes || 0) + 1;

    if (direction === "right") {
      updatedDeck.stats.knew += 1;
      updatedDeck.learned = [...updatedDeck.learned, currentCard];
      updatedDeck.cards.splice(updatedDeck.currentIndex, 1);
    } else {
      updatedDeck.stats.didntKnow += 1;
      updatedDeck.cards.push(currentCard);
      updatedDeck.cards.splice(updatedDeck.currentIndex, 1);
      updatedDeck.learned = updatedDeck.learned.filter(
        (c) => c.question !== currentCard.question
      );
    }

    if (updatedDeck.cards.length === 0) {
      updatedDeck.finished = true;
    } else {
      updatedDeck.currentIndex =
        updatedDeck.currentIndex % updatedDeck.cards.length;
    }

    setHistory((prev) => [...prev, currentCard]);

    setDecks((prev) => {
      const updated = { ...prev };
      updated[folder] = updated[folder].map((d) =>
        d.id === deck.id ? updatedDeck : d
      );
      return updated;
    });

    setActiveDeck({ folder, deck: updatedDeck });
  };

  // Handle Previous
  const handlePrevious = () => {
    if (history.length < 2) return;
    const prevHistory = [...history];
    prevHistory.pop();
    const lastCard = prevHistory[prevHistory.length - 1];
    setHistory(prevHistory);

    setActiveDeck((prevActive) => {
      if (!prevActive) return prevActive;
      const { folder, deck } = prevActive;
      const updatedDeck = { ...deck };
      const index = updatedDeck.cards.findIndex(
        (c) => c.question === lastCard.question
      );
      if (index >= 0) {
        updatedDeck.currentIndex = index;
      } else {
        updatedDeck.cards.unshift(lastCard);
        updatedDeck.currentIndex = 0;
      }
      return { folder, deck: updatedDeck };
    });
  };

  // Delete deck
  const handleDeleteDeck = (deckId, folder) => {
    setDecks((prev) => {
      const updated = { ...prev };
      updated[folder] = updated[folder].filter((d) => d.id !== deckId);
      return updated;
    });
    setActiveDeck(null);
  };

  // Restart deck
  const handleRestart = (deckId, folder) => {
    setDecks((prev) => {
      const updated = { ...prev };
      updated[folder] = updated[folder].map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: [...deck.cards, ...deck.learned],
              learned: [],
              currentIndex: 0,
              finished: false,
              stats: { swipes: 0, knew: 0, didntKnow: 0 },
            }
          : deck
      );
      return updated;
    });
  };

  // Active deck view
  if (activeDeck) {
    const { folder, deck } = activeDeck;
    return (
      <div className="p-6 text-center">
        <button
          onClick={() => setActiveDeck(null)}
          className="mb-4 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
        >
          ⬅ Back to Home
        </button>
        <h1 className="text-2xl font-bold mb-2">📚 {deck.name}</h1>
        <p className="text-gray-600 mb-4">
          {deck.finished ? "✅ Deck Completed" : `${deck.cards.length} cards left`}
        </p>

        {!deck.finished && deck.cards.length > 0 && (
          <Flashcard
            key={deck.currentIndex + "-" + deck.cards.length}
            question={deck.cards[deck.currentIndex].question}
            answer={deck.cards[deck.currentIndex].answer}
            onSwipe={handleSwipe}
            canGoPrevious={history.length > 1}
            onPrevious={handlePrevious}
          />
        )}

        {deck.finished && (
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 mx-auto">
            <h2 className="text-xl font-bold mb-4">🎉 Deck Completed!</h2>
            <p>Cards Left: {deck.cards.length}</p>
            <p>Total Swipes: {deck.stats.swipes}</p>
            <p className="text-green-600 font-semibold">
              ✅ Knew it: {deck.stats.knew}
            </p>
            <p className="text-red-600 font-semibold mb-4">
              ❌ Didn’t Know: {deck.stats.didntKnow}
            </p>
            <button
              onClick={() => handleRestart(deck.id, folder)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Restart Deck
            </button>
          </div>
        )}
      </div>
    );
  }

  // Home view
  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">📂 Flashcard Decks</h1>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-6"
      />
      <div className="mb-6">
        {showFolderInput ? (
          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="border px-2 py-1 rounded"
            />
            <button
              onClick={handleCreateFolder}
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add
            </button>
            <button
              onClick={() => setShowFolderInput(false)}
              className="px-4 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowFolderInput(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            ➕ Create New Folder
          </button>
        )}
      </div>

      {/* Normal folders */}
      {Object.keys(decks).map(
        (folder) =>
          folder !== "Learned Cards" && (
            <div key={folder} className="mb-8">
              <h2 className="text-xl font-bold mb-4">📁 {folder}</h2>
              <div className="flex flex-col gap-4 items-center">
                {decks[folder].map((deck) => (
                  <div key={deck.id} className="flex gap-4 items-center">
                    <button
                      onClick={() => setActiveDeck({ folder, deck })}
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                    >
                      {deck.name} ({deck.cards.length})
                    </button>
                    <select
                      onChange={(e) =>
                        moveDeckToFolder(deck.id, folder, e.target.value)
                      }
                      defaultValue=""
                      className="border px-2 py-1 rounded"
                    >
                      <option value="" disabled>
                        Move to...
                      </option>
                      {Object.keys(decks)
                        .filter((f) => f !== "Learned Cards")
                        .map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleDeleteDeck(deck.id, folder)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {/* Learned Cards folder */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">📘 Learned Cards</h2>
        <div className="flex flex-col gap-4 items-center">
          {Object.keys(decks).map((folder) =>
            decks[folder].map((deck) =>
              deck.learned.length > 0 ? (
                <div key={"learned-" + deck.id} className="flex gap-4 items-center">
                  <button
                    onClick={() =>
                      setActiveDeck({
                        folder,
                        deck: {
                          ...deck,
                          name: deck.name + " (Learned)",
                          cards: deck.learned,
                          learned: [],
                          currentIndex: 0,
                          finished: false,
                        },
                      })
                    }
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"
                  >
                    {deck.name} ({deck.learned.length})
                  </button>
                </div>
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
