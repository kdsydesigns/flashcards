import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import FolderView from './components/FolderView';
import DeckView from './components/DeckView';
import StudyView from './components/StudyView';
import { loadStorage, saveStorage } from './utils/storage';

export default function App(){
  const [route, setRoute] = useState({ name: 'home' });
  const [data, setData] = useState({ folders: [] });

  useEffect(()=>{
    setData(loadStorage());
  }, []);

  function updateAndSave(next){
    setData(next);
    saveStorage(next);
  }

  return (
    <div className="app-root">
      {route.name === 'home' && (
        <Home data={data} setData={updateAndSave} navigate={setRoute} />
      )}
      {route.name === 'folder' && (
        <FolderView folderId={route.folderId} data={data} setData={updateAndSave} navigate={setRoute} />
      )}
      {route.name === 'deck' && (
        <DeckView folderId={route.folderId} deckId={route.deckId} data={data} setData={updateAndSave} navigate={setRoute} />
      )}
      {route.name === 'study' && (
        <StudyView folderId={route.folderId} deckId={route.deckId} data={data} setData={updateAndSave} navigate={setRoute} />
      )}
    </div>
  );
}