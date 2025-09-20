import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Flashcard = ({ cards = [], onFinish }) => {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wrongCards, setWrongCards] = useState([]);
  const [swipeCount, setSwipeCount] = useState(0);

  if (!cards || cards.length === 0) {
    return <div className="text-center mt-10">No cards loaded.</div>;
  }

  const currentCard = cards[index];

  const handleNext = (knewIt) => {
    setSwipeCount((prev) => prev + 1);

    if (!knewIt) {
      setWrongCards((prev) => [...prev, currentCard]);
    }

    if (index < cards.length - 1) {
      setIndex(index + 1);
      setShowAnswer(false);
    } else {
      if (wrongCards.length > 0 && !knewIt) {
        setIndex(0);
        setShowAnswer(false);
      } else {
        onFinish && onFinish(swipeCount + 1);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10">
      {/* Swipe counter */}
      <p className="mb-4 text-gray-600 font-medium">
        Progress: {swipeCount}/{cards.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={index + (showAnswer ? "-answer" : "-question")}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-8 rounded-2xl shadow-2xl w-96 text-center"
        >
          {!showAnswer ? (
            <>
              <p className="text-xl font-bold mb-6">{currentCard.question}</p>
              <button
                onClick={() => setShowAnswer(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
              >
                See Answer
              </button>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-green-700 mb-6">
                {currentCard.answer}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleNext(false)}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                >
                  Don’t Know
                </button>
                <button
                  onClick={() => handleNext(true)}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition"
                >
                  Know
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Flashcard;
