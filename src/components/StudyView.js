import React, { useState } from 'react';
import TinderCard from 'react-tinder-card';

export default function StudyView({ folderId, deckId, data, setData, navigate }){
  const folder = data.folders.find(f=>f.id===folderId);
  const deck = folder?.decks.find(d=>d.id===deckId);
  const [queue, setQueue] = useState(deck ? deck.cards.map(c=> ({...c})) : []);
  const [flipped, setFlipped] = useState({});

  function onSwipe(direction, card){
    if(direction === 'right'){
      setQueue(prev => prev.filter(x=>x.id!==card.id));
    } else if(direction === 'left'){
      setQueue(prev => {
        const updated = prev.map(x => x.id===card.id ? {...x, wrongCount:(x.wrongCount||0)+1} : x);
        const idx = updated.findIndex(x => x.id===card.id);
        const cardObj = updated.splice(idx,1)[0];
        const insertAt = Math.min(2, updated.length);
        updated.splice(insertAt,0,cardObj);
        return updated;
      });
    }
    setFlipped({});
  }

  function markKnown(){
    const first = queue[0];
    if(!first) return;
    setQueue(prev => prev.filter(x=>x.id!==first.id));
  }
  function markWrong(){
    const first = queue[0];
    if(!first) return;
    onSwipe('left', first);
  }

  if(!deck) return <div className="center">Deck not found</div>;
  if(queue.length === 0) return (
    <div className="container center"><h3>All cards learned 🎉</h3><button onClick={()=>navigate({name:'deck', folderId, deckId})}>Back</button></div>
  );

  return (
    <div className="container">
      <header className="topbar">
        <button onClick={()=>navigate({name:'deck', folderId, deckId})}>← Back</button>
        <h2>Study: {deck.name}</h2>
      </header>

      <div className="study-area">
        <div className="progress">{queue.length} cards left</div>

        <div className="card-stack">
          {queue.slice(0,3).reverse().map((card)=> (
            <TinderCard key={card.id} onSwipe={(dir)=>onSwipe(dir, card)} preventSwipe={["up","down"]}>
              <div className="card" onClick={()=>setFlipped(prev=>({...prev, [card.id]: !prev[card.id]}))}>
                {!flipped[card.id] ? (
                  <div className="front">Q: {card.question}</div>
                ) : (
                  <div className="back">A: {card.answer}</div>
                )}
                <div className="meta">Wrong: {card.wrongCount||0}</div>
              </div>
            </TinderCard>
          ))}
        </div>

        <div className="controls">
          <button onClick={markWrong} className="btn wrong">Wrong</button>
          <button onClick={markKnown} className="btn known">Known</button>
        </div>
      </div>
    </div>
  );
}