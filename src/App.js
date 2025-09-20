// src/App.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Flashcard from "./components/Flashcard";

function App() {
  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);

  // Load decks from localStorage
  useEffect(() => {
    const savedDecks = localStorage.getItem("flashcardDecks");
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks));
    }
  }, []);

  // Save decks to localStorage
  useEffect(() => {
    localStorage.setItem("flashcardDecks", JSON.stringify(decks));
  }, [decks]);

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
          currentIndex: 0,
          stats: {
            total: parsedCards.length,
            swipes: 0,
            knew: 0,
            didntKnow: 0,
          },
          finished: false,
        };

        setDecks((prev) => [...prev, newDeck]);
      },
    });
  };

  const handleSwipe = (deckId, direction) => {
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id !== deckId) return deck;

        const currentCard = deck.cards[deck.currentIndex];
        const newStats = {
          ...deck.stats,
          swipes: deck.stats.swipes + 1,
          knew: direction === "right" ? deck.stats.knew + 1 : deck.stats.knew,
          didntKnow:
            direction === "left"
              ? deck.stats.didntKnow + 1
              : deck.stats.didntKnow,
        };

        let newCards = [...deck.cards];
        let newIndex = deck.currentIndex;

        if (direction === "right") {
          newCards.splice(newIndex, 1);
        } else {
          newCards = [
            ...newCards.filter((_, idx) => idx !== newIndex),
            currentCard,
          ];
        }

        if (newCards.length === 0) {
          return { ...deck, cards: [], finished: true, stats: newStats };
        }

        newIndex = newIndex % newCards.length;

        return {
          ...deck,
          cards: newCards,
          currentIndex: newIndex,
          stats: newStats,
        };
      })
    );
  };

  const handleRestart = (deckId) => {
    setDecks((prevDecks) =>
      prevDecks.map((deck) => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          currentIndex: 0,
          finished: false,
          stats: {
            total: deck.cards.length,
            swipes: 0,
            knew: 0,
            didntKnow: 0,
          },
        };
      })
    );
  };

  const handleDeleteDeck = (deckId) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) {
      setActiveDeckId(null);
    }
  };

  // Active deck view
  if (activeDeckId) {
    const deck = decks.find((d) => d.id === activeDeckId);
    if (!deck) return null;

    return (
      <div className="p-6 text-center">
        <button
          onClick={() => setActiveDeckId(null)}
          className="mb-4 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
        >
          ⬅ Back to Home
        </button>
        <h1 className="text-2xl font-bold mb-2">📚 {deck.name}</h1>
        <p className="text-gray-600 mb-4">
          {deck.finished
            ? "✅ Deck Completed"
            : `${deck.cards.length} cards left out of ${deck.stats.total}`}
        </p>

        {!deck.finished && deck.cards.length > 0 && (
          <Flashcard
            key={deck.currentIndex + "-" + deck.cards.length}
            question={deck.cards[deck.currentIndex].question}
            answer={deck.cards[deck.currentIndex].answer}
            onSwipe={(dir) => handleSwipe(deck.id, dir)}
          />
        )}

        {deck.finished && (
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 mx-auto">
            <h2 className="text-xl font-bold mb-4">🎉 Deck Completed!</h2>
            <p>Total Cards: {deck.stats.total}</p>
            <p>Total Swipes: {deck.stats.swipes}</p>
            <p className="text-green-600 font-semibold">
              ✅ Knew it: {deck.stats.knew}
            </p>
            <p className="text-red-600 font-semibold mb-4">
              ❌ Didn’t Know: {deck.stats.didntKnow}
            </p>
            <button
              onClick={() => handleRestart(deck.id)}
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

    <div className="flex flex-col gap-4 items-center">
      {decks.map((deck) => (
        <div key={deck.id} className="flex gap-4 items-center">
          <button
            onClick={() => setActiveDeckId(deck.id)}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            {deck.name}{" "}
            {deck.finished
              ? "✅ Completed"
              : `(${deck.stats.swipes}/${deck.stats.total})`}
          </button>
          <button
            onClick={() => handleDeleteDeck(deck.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  </div>
);

}

export default App;
