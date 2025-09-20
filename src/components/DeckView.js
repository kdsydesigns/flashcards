import React from 'react';

export default function DeckView({ folderId, deckId, data, setData, navigate }){
  const folder = data.folders.find(f=>f.id===folderId);
  const deck = folder?.decks.find(d=>d.id===deckId);
  if(!deck) return <div className="center">Deck not found</div>;

  return (
    <div className="container">
      <header className="topbar">
        <button onClick={()=>navigate({name:'folder', folderId})}>← Back</button>
        <h2>{deck.name}</h2>
      </header>
      <div className="content">
        <p>{deck.cards.length} cards</p>
        <button onClick={()=>navigate({ name:'study', folderId, deckId })} className="primary">Start Learning</button>
      </div>
    </div>
  );
}