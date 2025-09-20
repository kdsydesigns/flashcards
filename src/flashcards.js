import Flashcard from "./components/Flashcard";


import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Flashcard({ cards, onComplete }) {
  const [index, setIndex] = useState(0);
  const [wrongCards, setWrongCards] = useState([]);

  const handleSwipe = (direction) => {
    const currentCard = cards[index];

    if (direction === "left") {
      setWrongCards((prev) => [...prev, currentCard]);
    }

    if (index < cards.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      // restart deck with wrong cards
      if (wrongCards.length > 0) {
        setIndex(0);
        cards = [...wrongCards];
        setWrongCards([]);
      } else {
        onComplete && onComplete();
      }
    }
  };

  if (!cards || cards.length === 0) {
    return <p>No cards in this deck.</p>;
  }

  const card = cards[index];

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="bg-white shadow-lg rounded-2xl p-6 w-96 text-center"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) handleSwipe("right");
            else if (info.offset.x < -100) handleSwipe("left");
          }}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-bold">{card.question}</h2>
          <p className="text-gray-600 mt-4">{card.answer}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
