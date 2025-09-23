// src/components/Flashcard.js
import React, { useState } from "react";
import "./Flashcard.css";

const Flashcard = ({ question, answer, onSwipe }) => {
  const [flipped, setFlipped] = useState(false);

  const handleChoice = (direction) => {
    // Step 1: Flip back to question
    setFlipped(false);

    // Step 2: After animation (~600ms from CSS), move to next card
    setTimeout(() => {
      onSwipe(direction);
    }, 600); // must match transition duration in Flashcard.css
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
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
