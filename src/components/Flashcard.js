// src/components/Flashcard.js
import React, { useState } from "react";
import "./Flashcard.css";

const Flashcard = ({ question, answer, onSwipe, canGoPrevious, onPrevious }) => {
  const [flipped, setFlipped] = useState(false);

  const handleChoice = (direction) => {
    // Flip back before moving on
    setFlipped(false);

    // Match CSS transition duration
    setTimeout(() => {
      onSwipe(direction);
    }, 600);
  };

  return (
    <div className="flashcard-wrapper">
      <div className={`flashcard ${flipped ? "flipped" : ""}`}>
        {/* Front side (Question) */}
        <div className="front">
          <h2>{question}</h2>
          <button onClick={() => setFlipped(true)}>See Answer</button>
        </div>

        {/* Back side (Answer) */}
        <div className="back">
          <h2>{answer}</h2>
          <div className="button-group">
            <button onClick={() => handleChoice("right")}>✅ Knew it</button>
            <button onClick={() => handleChoice("left")}>❌ Didn’t Know</button>
          </div>
          {/* Previous button (only if allowed) */}
          {canGoPrevious && (
            <button
              className="previous-btn"
              onClick={() => {
                setFlipped(false);
                setTimeout(() => {
                  onPrevious();
                }, 300);
              }}
            >
              ⬅ Previous
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
