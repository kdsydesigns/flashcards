import React, { useState } from 'react';
import Papa from 'papaparse';
import { makeId } from '../utils/storage';

export default function Home({ data, setData, navigate }){
  const [name, setName] = useState('');

  function createFolder(){
    if(!name.trim()) return alert('Folder name required');
    const folder = { id: makeId(), name: name.trim(), decks: [] };
    const nd = { ...data, folders: [folder, ...data.folders] };
    setData(nd);
    setName('');
  }

  function handleFilePick(folderId, e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const rows = parsed.data.map(r => {
        const keys = Object.keys(r);
        const qk = keys.find(k => k.toLowerCase().includes('question')) || keys[0];
        const ak = keys.find(k => k.toLowerCase().includes('answer')) || keys[1] || keys[0];
        return { id: makeId(), question: r[qk] + '', answer: r[ak] + '', wrongCount: 0 };
      });
      const deck = { id: makeId(), name: file.name.replace(/\.csv$/i,''), cards: rows };
      const nd = { ...data, folders: data.folders.map(f => f.id === folderId ? { ...f, decks: [deck, ...f.decks] } : f) };
      setData(nd);
      alert(`Imported ${rows.length} cards into ${deck.name}`);
    };
    reader.readAsText(file);
    e.target.value = null;
  }

  return (
    <div className="container">
      <header className="topbar">
        <h1>Flashcards</h1>
      </header>
      <section className="create">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="New folder name" />
        <button onClick={createFolder}>Create Folder</button>
      </section>

      <section className="folders">
        {data.folders.length === 0 && <div className="empty">No folders. Create one and import CSVs.</div>}
        {data.folders.map(f=> (
          <div className="folder" key={f.id}>
            <div className="folder-info" onClick={()=>navigate({ name:'folder', folderId: f.id })}>
              <strong>{f.name}</strong>
              <div className="muted">{f.decks.length} decks</div>
            </div>
            <div className="folder-actions">
              <label className="file-label">+CSV
                <input type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={(e)=>handleFilePick(f.id,e)} />
              </label>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}