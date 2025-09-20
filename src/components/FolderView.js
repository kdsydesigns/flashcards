import React from 'react';

export default function FolderView({ folderId, data, setData, navigate }){
  const folder = data.folders.find(f=>f.id === folderId);
  if(!folder) return <div className="center">Folder not found</div>;

  function deleteDeck(deckId){
    if(!window.confirm('Delete deck?')) return;
    const nd = { ...data, folders: data.folders.map(f => f.id===folderId ? { ...f, decks: f.decks.filter(d=>d.id!==deckId) } : f) };
    setData(nd);
  }

  return (
    <div className="container">
      <header className="topbar">
        <button onClick={()=>navigate({name:'home'})}>← Back</button>
        <h2>{folder.name}</h2>
      </header>

      <div className="deck-list">
        {folder.decks.length === 0 && <div className="empty">No decks. Import a CSV.</div>}
        {folder.decks.map(d => (
          <div className="deck" key={d.id}>
            <div onClick={()=>navigate({ name:'deck', folderId, deckId: d.id })} className="deck-info">
              <strong>{d.name}</strong>
              <div className="muted">{d.cards.length} cards</div>
            </div>
            <div className="deck-actions">
              <button onClick={()=>navigate({ name:'study', folderId, deckId: d.id })}>Study</button>
              <button onClick={()=>deleteDeck(d.id)} className="danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}