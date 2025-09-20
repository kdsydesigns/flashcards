import React, { useState } from "react";
import TinderCard from "react-tinder-card";
import { useSpring, animated as a } from "@react-spring/web";
import "./Flashcard.css";

const Flashcard = ({ question, answer, onSwipe }) => {
  const [flipped, setFlipped] = useState(false);

  const { transform, opacity } = useSpring({
    opacity: flipped ? 1 : 0,
    transform: `perspective(600px) rotateY(${flipped ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  return (
    <TinderCard
      className="swipe"
      preventSwipe={!flipped ? ["left", "right"] : []} // disable swipes until flipped
      onSwipe={(dir) => onSwipe(dir)}
    >
      <div className="flashcard-container">
        {/* Front side (Question) */}
        <a.div
          className="flashcard front"
          style={{ opacity: opacity.to((o) => 1 - o), transform }}
        >
          <h2>{question}</h2>
          <button onClick={() => setFlipped(true)}>See Answer</button>
        </a.div>

        {/* Back side (Answer) */}
        <a.div
          className="flashcard back"
          style={{ opacity, transform, rotateY: "180deg" }}
        >
          <h2>{answer}</h2>
          <div className="button-group">
            <button onClick={() => setFlipped(false)}>See Question</button>
            <button onClick={() => onSwipe("right")}>Know</button>
            <button onClick={() => onSwipe("left")}>Don’t Know</button>
          </div>
        </a.div>
      </div>
    </TinderCard>
  );
};

export default Flashcard;
