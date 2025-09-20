const STORAGE_KEY = 'flash_folders_v1';

export function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { folders: [] };
  } catch (e) {
    console.error(e);
    return { folders: [] };
  }
}

export function saveStorage(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function makeId() {
  return Math.random().toString(36).slice(2,9);
}