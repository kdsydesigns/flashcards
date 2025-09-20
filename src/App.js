import React, { useState } from "react";
import Papa from "papaparse";
import Flashcard from "./components/Flashcard";

function App() {
  const [cards, setCards] = useState([]);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ total: 0, swipes: 0 });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsedCards = results.data
          .filter((row) => row.question && row.answer)
          .map((row) => ({
            question: row.question.trim(),
            answer: row.answer.trim(),
          }));
        setCards(parsedCards);
        setFinished(false);
        setStats({ total: parsedCards.length, swipes: 0 });
      },
    });
  };

  const handleFinish = (swipes) => {
    setStats((prev) => ({ ...prev, swipes }));
    setFinished(true);
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">📚 Flashcard App</h1>

      {!cards.length && !finished && (
        <div className="mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mb-4"
          />
          <p className="text-gray-600">
            Upload a CSV file with <b>question</b> and <b>answer</b> columns
          </p>
        </div>
      )}

      {!finished && cards.length > 0 && (
        <Flashcard cards={cards} onFinish={handleFinish} />
      )}

      {finished && (
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 mx-auto">
          <h2 className="text-2xl font-bold mb-4">🎉 Deck Completed!</h2>
          <p className="mb-2">Total Cards: {stats.total}</p>
          <p className="mb-2">Total Swipes: {stats.swipes}</p>
          <p className="mb-6">
            Efficiency:{" "}
            {Math.round((stats.total / stats.swipes) * 100)}% (fewer swipes =
            better)
          </p>
          <button
            onClick={() => setFinished(false)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            Restart Deck
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
