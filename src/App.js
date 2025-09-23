// src/App.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Flashcard from "./components/Flashcard";

function App() {
  const [decks, setDecks] = useState({
    Uncategorized: [],
    Learned_Uncategorized: [],
  });
  const [activeDeck, setActiveDeck] = useState(null); // { folder, deck }
  const [history, setHistory] = useState([]); // array of { folder, deckId, card }
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());


  // Load/save
  useEffect(() => {
    const saved = localStorage.getItem("flashcardDecks");
    if (saved) {
      try {
        setDecks(JSON.parse(saved));
      } catch {
        // ignore parse issues
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("flashcardDecks", JSON.stringify(decks));
  }, [decks]);

  // Ensure a learned shadow folder exists (uses setDecks updater to avoid stale reads)
  const ensureShadowFolder = (folder) => {
    const shadow = `Learned_${folder}`;
    setDecks((prev) => {
      if (prev[shadow]) return prev;
      return { ...prev, [shadow]: [] };
    });
  };

  // File upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedCards = (results.data || [])
          .filter((row) => row.question || row.Question)
          .map((row) => ({
            question: (row.question || row.Question || "").trim(),
            answer: (row.answer || row.Answer || "").trim(),
          }))
          .filter((c) => c.question && c.answer);

        if (!parsedCards.length) return;

        const newDeck = {
          id: Date.now(),
          name: file.name.replace(".csv", ""),
          cards: parsedCards,
          stats: { swipes: 0, knew: 0, didntKnow: 0 },
          currentIndex: 0,
          finished: false,
        };

        setDecks((prev) => {
          const updated = JSON.parse(JSON.stringify(prev));
          updated.Uncategorized = [...(updated.Uncategorized || []), newDeck];
          if (!updated["Learned_Uncategorized"]) updated["Learned_Uncategorized"] = [];
          return updated;
        });
      },
    });
  };

  // Create folder (creates its learned_ sibling)
  const handleCreateFolder = () => {
    const name = newFolderName?.trim();
    if (!name) return;
    setDecks((prev) => {
      if (prev[name]) return prev; // already exists
      const updated = JSON.parse(JSON.stringify(prev));
      updated[name] = [];
      updated[`Learned_${name}`] = [];
      return updated;
    });
    setNewFolderName("");
    setShowFolderInput(false);
  };

  // Move deck between folders (also move its learned shadow deck entry)
  const moveDeckToFolder = (deckId, fromFolder, toFolder) => {
    if (!toFolder || fromFolder === toFolder) return;
    setDecks((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (!updated[fromFolder]) return prev;
      const idx = updated[fromFolder].findIndex((d) => d.id === deckId);
      if (idx === -1) return prev;
      const [moved] = updated[fromFolder].splice(idx, 1);
      if (!updated[toFolder]) updated[toFolder] = [];
      updated[toFolder].push(moved);

      // move shadow deck entry if present
      const shadowFrom = `Learned_${fromFolder}`;
      const shadowTo = `Learned_${toFolder}`;
      if (updated[shadowFrom]) {
        const sidx = updated[shadowFrom].findIndex((sd) => sd.id === deckId);
        if (sidx !== -1) {
          const [sdMoved] = updated[shadowFrom].splice(sidx, 1);
          if (!updated[shadowTo]) updated[shadowTo] = [];
          updated[shadowTo].push(sdMoved);
          if (updated[shadowFrom].length === 0) delete updated[shadowFrom];
        }
      } else {
        if (!updated[shadowTo]) updated[shadowTo] = [];
      }

      return updated;
    });
  };

   //Toggle between folders
  const toggleFolder = (folder) => {
  setExpandedFolders(prev => {
    const newSet = new Set(prev);
    if (newSet.has(folder)) {
      newSet.delete(folder);
    } else {
      newSet.add(folder);
    }
    return newSet;
  });
};

  // Helper: push to history
  const pushHistory = (folder, deckId, card) => {
    setHistory((prev) => [...prev, { folder, deckId, card }]);
  };

  // ------------------ Swipe handler ------------------
  const handleSwipe = (direction) => {
    if (!activeDeck) return;
    const { folder, deck } = activeDeck;
    if (!deck || !Array.isArray(deck.cards)) return;
    const currentCard = deck.cards[deck.currentIndex];
    if (!currentCard) return;

    const isShadow = folder.startsWith("Learned_");
    const originalFolder = isShadow ? folder.replace("Learned_", "") : folder;
    const learnedFolder = `Learned_${originalFolder}`;

    // deep clone
    const updated = JSON.parse(JSON.stringify(decks));
    if (!updated[originalFolder]) {
      // safety: nothing to do
      return;
    }
    if (!updated[learnedFolder]) updated[learnedFolder] = [];

    // working with main deck
    if (!isShadow) {
      const dIdx = updated[folder].findIndex((d) => d.id === deck.id);
      if (dIdx === -1) return;
      const d = updated[folder][dIdx];
      d.stats = d.stats || { swipes: 0, knew: 0, didntKnow: 0 };
      d.stats.swipes++;

      if (direction === "right") {
        // Knew it: remove from main deck, add to learned_<folder>
        d.stats.knew = (d.stats.knew || 0) + 1;
        // remove the card at currentIndex
        d.cards.splice(deck.currentIndex, 1);

        // find or create learned shadow deck entry with same id
        let sdList = updated[learnedFolder];
        let sd = sdList.find((s) => s.id === d.id);
        if (sd) {
          sd.cards.push(currentCard);
          sd.finished = false;
        } else {
          sdList.push({
            id: d.id,
            name: d.name,
            cards: [currentCard],
            stats: { swipes: 0, knew: 0, didntKnow: 0 },
            currentIndex: 0,
            finished: false,
          });
        }
      } else {
        // Didn't know in main deck: remove and add to end
        d.stats.didntKnow = (d.stats.didntKnow || 0) + 1;
        d.cards.splice(deck.currentIndex, 1);
        d.cards.push(currentCard);
        // ensure card is not lingering in any learned deck
        Object.keys(updated).forEach((f) => {
          if (f.startsWith("Learned_")) {
            updated[f] = (updated[f] || []).map((sd) => {
              sd.cards = sd.cards.filter((c) => c.question !== currentCard.question);
              return sd;
            });
          }
        });
      }

      // adjust finished & index
      if (d.cards.length === 0) {
        d.finished = true;
        d.currentIndex = 0;
      } else {
        d.finished = false;
        // if we removed a card that had index >= length, reset to 0
        d.currentIndex = d.currentIndex % d.cards.length;
      }

      // commit
      updated[folder][dIdx] = d;
      setDecks(updated);
      pushHistory(folder, d.id, currentCard);

      // set the active deck to the updated deck object (fresh reference)
      const newActiveDeckObj = updated[folder].find((x) => x.id === d.id);
      setActiveDeck({ folder, deck: newActiveDeckObj });
      return;
    }

    // ----------------- swiping in a learned deck -----------------
    // folder like "Learned_<X>"
    const sdIdx = (updated[folder] || []).findIndex((s) => s.id === deck.id);
    if (sdIdx === -1) return;
    const sd = updated[folder][sdIdx];

    if (direction === "left") {
      // didn't know in learned deck: recall to original
      sd.cards = sd.cards.filter((c) => c.question !== currentCard.question);
      const mainIdx = (updated[originalFolder] || []).findIndex((m) => m.id === deck.id);
      if (mainIdx >= 0) {
        updated[originalFolder][mainIdx].cards.push(currentCard);
        updated[originalFolder][mainIdx].finished = false;
      } else {
        // if original deck missing (rare), create it
        if (!updated[originalFolder]) updated[originalFolder] = [];
        updated[originalFolder].push({
          id: deck.id,
          name: sd.name,
          cards: [currentCard],
          stats: { swipes: 0, knew: 0, didntKnow: 0 },
          currentIndex: 0,
          finished: false,
        });
      }
    } else {
      // knew it in learned deck: remove permanently from learned deck
      sd.cards = sd.cards.filter((c) => c.question !== currentCard.question);
    }

    // if learned deck's cards become empty => remove that shadow deck object
    if (sd.cards.length === 0) {
      updated[folder].splice(sdIdx, 1);
      if (updated[folder].length === 0) {
        // keep or delete the folder? we'll keep empty folder arrays for predictable behavior
        delete updated[folder];
      }
      setDecks(updated);
      pushHistory(folder, sd.id, currentCard);
      setActiveDeck(null); // close view if it was showing that now-empty learned deck
      return;
    }

    // otherwise update sd index and commit
    sd.finished = false;
    sd.currentIndex = sd.currentIndex % sd.cards.length;
    updated[folder][sdIdx] = sd;
    setDecks(updated);
    pushHistory(folder, sd.id, currentCard);
    setActiveDeck({ folder, deck: sd });
  };

  // ------------------ Previous ------------------
  const handlePrevious = () => {
    if (history.length < 2) return;
    // remove current from history (we want the last shown before current)
    const newHist = [...history];
    newHist.pop();
    const last = newHist[newHist.length - 1];
    setHistory(newHist);

    if (!activeDeck) {
      // if no active deck, try to open the folder the last belonged to
      const { folder: lastFolder, deckId, card } = last;
      // attempt to find deck object
      const updated = JSON.parse(JSON.stringify(decks));
      if (!updated[lastFolder]) return;
      const dIndex = updated[lastFolder].findIndex((d) => d.id === deckId);
      if (dIndex === -1) return;
      const d = updated[lastFolder][dIndex];
      // find card in deck, else recall into deck front
      const foundIndex = d.cards.findIndex((c) => c.question === card.question);
      if (foundIndex >= 0) {
        d.currentIndex = foundIndex;
      } else {
        // remove from any learned decks and insert at front
        Object.keys(updated).forEach((f) => {
          if (f.startsWith("Learned_")) {
            updated[f] = (updated[f] || []).map((sd) => {
              sd.cards = sd.cards.filter((c) => c.question !== card.question);
              return sd;
            });
          }
        });
        d.cards.unshift(card);
        d.currentIndex = 0;
        d.finished = false;
      }
      updated[lastFolder][dIndex] = d;
      setDecks(updated);
      setActiveDeck({ folder: lastFolder, deck: d });
      return;
    }

    // active deck present
    const { folder, deck } = activeDeck;
    const updated = JSON.parse(JSON.stringify(decks));
    if (!updated[folder]) {
      setActiveDeck(null);
      return;
    }
    const dIndex = updated[folder].findIndex((d) => d.id === deck.id);
    if (dIndex === -1) {
      setActiveDeck(null);
      return;
    }
    const d = updated[folder][dIndex];

    // check if last.card exists inside this deck
    const foundIndex = d.cards.findIndex((c) => c.question === last.card.question);
    if (foundIndex >= 0) {
      d.currentIndex = foundIndex;
    } else {
      // recall: remove card from any learned decks where it might be present
      Object.keys(updated).forEach((f) => {
        if (f.startsWith("Learned_")) {
          updated[f] = (updated[f] || []).map((sd) => {
            sd.cards = sd.cards.filter((c) => c.question !== last.card.question);
            return sd;
          });
        }
      });

      // insert at front of the active deck
      d.cards.unshift(last.card);
      d.currentIndex = 0;
      d.finished = false;
    }

    updated[folder][dIndex] = d;
    setDecks(updated);
    setActiveDeck({ folder, deck: d });
  };

  // ------------------ Reset deck ------------------
  // If folder is a learned folder, move its cards back to main deck; if main, move all learned back
  const handleReset = (deckId, folder) => {
    setDecks((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      // if it's a learned folder
      if (folder.startsWith("Learned_")) {
        const mainFolder = folder.replace("Learned_", "");
        if (!updated[folder]) return prev;
        const sdIndex = updated[folder].findIndex((d) => d.id === deckId);
        const mainIndex = (updated[mainFolder] || []).findIndex((d) => d.id === deckId);
        if (sdIndex === -1 || mainIndex === -1) return prev;
        // move cards
        updated[mainFolder][mainIndex].cards = [
          ...updated[mainFolder][mainIndex].cards,
          ...updated[folder][sdIndex].cards,
        ];
        updated[mainFolder][mainIndex].finished = false;
        // clear shadow deck entry
        updated[folder][sdIndex].cards = [];
        // remove the shadow deck object
        updated[folder].splice(sdIndex, 1);
        if (updated[folder].length === 0) delete updated[folder];
        return updated;
      }

      // else main/original folder
      if (!updated[folder]) return prev;
      const dIndex = updated[folder].findIndex((d) => d.id === deckId);
      if (dIndex === -1) return prev;
      const learnedList = updated[`Learned_${folder}`] || [];
      const learnedDeck = learnedList.find((ld) => ld.id === deckId);
      if (learnedDeck) {
        // move all learned cards back and clear learned deck
        updated[folder][dIndex].cards = [
          ...updated[folder][dIndex].cards,
          ...learnedDeck.cards,
        ];
        // remove that learned deck entry
        updated[`Learned_${folder}`] = learnedList.filter((ld) => ld.id !== deckId);
        if (updated[`Learned_${folder}`].length === 0) {
          delete updated[`Learned_${folder}`];
        }
      }
      // reset stats and state on main deck
      updated[folder][dIndex].stats = { swipes: 0, knew: 0, didntKnow: 0 };
      updated[folder][dIndex].currentIndex = 0;
      updated[folder][dIndex].finished = false;
      return updated;
    });

    // If currently viewing that deck, adjust active view
    if (activeDeck && activeDeck.deck.id === deckId) {
      setActiveDeck((prev) => {
        if (!prev) return prev;
        return {
          folder,
          deck: {
            ...prev.deck,
            currentIndex: 0,
            finished: false,
          },
        };
      });
    }
  };

  // ------------------ Delete deck ------------------
  const handleDeleteDeck = (deckId, folder) => {
    setDecks((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (updated[folder]) {
        updated[folder] = updated[folder].filter((d) => d.id !== deckId);
      }
      const shadow = `Learned_${folder}`;
      if (updated[shadow]) {
        updated[shadow] = updated[shadow].filter((d) => d.id !== deckId);
        if (updated[shadow].length === 0) delete updated[shadow];
      }
      return updated;
    });
    if (activeDeck && activeDeck.deck.id === deckId) setActiveDeck(null);
  };

  // ------------------ Active deck view ------------------
  if (activeDeck) {
    const { folder, deck } = activeDeck;
    const noCardsLeft = !deck.cards || deck.cards.length === 0;
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
          {deck.finished || noCardsLeft ? "✅ Deck Completed" : `${deck.cards.length} cards left`}
        </p>

        {!deck.finished && !noCardsLeft && deck.cards[deck.currentIndex] && (
          <Flashcard
            key={`${deck.id}-${deck.currentIndex}-${deck.cards.length}`}
            question={deck.cards[deck.currentIndex].question}
            answer={deck.cards[deck.currentIndex].answer}
            onSwipe={handleSwipe}
            canGoPrevious={history.length > 1}
            onPrevious={handlePrevious}
          />
        )}
      </div>
    );
  }

  // ------------------ HOME view ------------------
return (
  <div className="p-6 text-center">
    <h1 className="text-3xl font-bold mb-6">📂 Flashcard Decks</h1>
    <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-6" />

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

    {/* ================= UNCATEGORIZED DECKS ================= */}
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">📄 Uncategorized Decks</h2>
      <div className="flex flex-col gap-4 items-center">
        {(decks["Uncategorized"] || []).map((d) => (
          <div key={d.id} className="flex gap-4 items-center">
            <button
              onClick={() => setActiveDeck({ folder: "Uncategorized", deck: d })}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
            >
              {d.name} ({d.cards.length})
            </button>
            <select
              onChange={(e) => moveDeckToFolder(d.id, "Uncategorized", e.target.value)}
              defaultValue=""
              className="border px-2 py-1 rounded"
            >
              <option value="" disabled>
                Move to...
              </option>
              {Object.keys(decks)
                .filter((f) => !f.startsWith("Learned_"))
                .map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
            </select>
            <button
              onClick={() => handleReset(d.id, "Uncategorized")}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
            >
              🔄
            </button>
            <button
              onClick={() => handleDeleteDeck(d.id, "Uncategorized")}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
{/* ================= LEARNED UNCATEGORIZED ================= */}
{(decks["Learned_Uncategorized"] || []).length > 0 && (
  <div className="mb-10">
    <h3 className="text-lg font-semibold">📘 Learned Decks (Uncategorized)</h3>
    <div className="flex flex-col gap-4 items-center">
      {(decks["Learned_Uncategorized"] || []).map(
        (ld) =>
          ld.cards &&
          ld.cards.length > 0 && (
            <div key={"learned-" + ld.id} className="flex gap-4 items-center">
              <button
                onClick={() =>
                  setActiveDeck({ folder: "Learned_Uncategorized", deck: ld })
                }
                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"
              >
                {ld.name} (Learned) ({ld.cards.length})
              </button>
            </div>
          )
      )}
    </div>
  </div>
)}


    {/* ================= FOLDERS ================= */}
    {Object.keys(decks)
      .filter((f) => f !== "Uncategorized" && !f.startsWith("Learned_"))
      .map((folder) => (
        <div key={folder} className="mb-8">
          {/* Folder header */}
          <h2
            onClick={() =>
              setExpandedFolders((prev) =>
                prev.has(folder) ? new Set([...prev].filter((x) => x !== folder)) : new Set(prev).add(folder)
              )
            }
            className="text-xl font-bold mb-4 flex items-center justify-center gap-4 cursor-pointer"
          >
            📁 {folder} ({decks[folder]?.length || 0} decks)
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `Are you sure you want to delete the folder "${folder}" and all its decks (including its Learned decks)?`
                  )
                ) {
                  setDecks((prev) => {
                    const updated = JSON.parse(JSON.stringify(prev));
                    delete updated[folder];
                    delete updated[`Learned_${folder}`];
                    return updated;
                  });
                }
              }}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-sm"
            >
              Delete Folder
            </button>
          </h2>

          {/* Expanded folder contents */}
          {expandedFolders.has(folder) && (
            <>
              <div className="flex flex-col gap-4 items-center">
                {(decks[folder] || []).map((d) => (
                  <div key={d.id} className="flex gap-4 items-center">
                    <button
                      onClick={() => setActiveDeck({ folder, deck: d })}
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                    >
                      {d.name} ({d.cards.length})
                    </button>
                    <select
                      onChange={(e) => moveDeckToFolder(d.id, folder, e.target.value)}
                      defaultValue=""
                      className="border px-2 py-1 rounded"
                    >
                      <option value="" disabled>
                        Move to...
                      </option>
                      {Object.keys(decks)
                        .filter((f) => !f.startsWith("Learned_"))
                        .map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleReset(d.id, folder)}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => handleDeleteDeck(d.id, folder)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>

              {/* Learned decks under this folder */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold">📘 Learned Decks</h3>
                {(decks[`Learned_${folder}`] || []).map(
                  (ld) =>
                    ld.cards &&
                    ld.cards.length > 0 && (
                      <div key={"learned-" + ld.id} className="flex gap-4 items-center mt-2">
                        <button
                          onClick={() => setActiveDeck({ folder: `Learned_${folder}`, deck: ld })}
                          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"
                        >
                          {ld.name} (Learned) ({ld.cards.length})
                        </button>
                      </div>
                    )
                )}
              </div>
            </>
          )}
        </div>
      ))}
  </div>
);
}
export default App;
