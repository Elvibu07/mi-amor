// ─────────────────────────────────────────────────────────────────────────────
// useFirestore — Real-time sync hook with localStorage fallback
// When Firebase is not configured, behaves like regular useState + localStorage.
// When Firebase IS configured, syncs data between both users in real time.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { db, isFirebaseConfigured, onSnapshot, doc, setDoc, collection, addDoc, query, orderBy } from './firebase';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Syncs a single Firestore document field with localStorage fallback.
 * @param firestorePath - e.g. 'shared/state' with field 'music'
 * @param localKey - localStorage key
 * @param defaultValue - default value if nothing exists
 */
export function useSyncedDoc<T>(
  collection_: string,
  docId: string,
  localKey: string,
  defaultValue: T
): [T, SetValue<T>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(localKey);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Subscribe to Firestore if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const docRef = doc(db, collection_, docId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as T;
        setValue(data);
        try {
          localStorage.setItem(localKey, JSON.stringify(data));
        } catch { /* ignore */ }
      }
    });

    return () => unsub();
  }, [collection_, docId, localKey]);

  // Cross-component sync: listen for changes from other instances of this hook
  // on the same page (localStorage 'storage' event only fires across tabs,
  // so we also use a custom DOM event for same-tab sync).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === localKey) {
        setValue(detail.value);
      }
    };
    window.addEventListener('ourlobby_sync', handler);
    return () => window.removeEventListener('ourlobby_sync', handler);
  }, [localKey]);

  const set: SetValue<T> = useCallback((newVal) => {
    setValue((prev) => {
      const resolved = typeof newVal === 'function'
        ? (newVal as (p: T) => T)(prev)
        : newVal;

      // Save to localStorage
      try {
        localStorage.setItem(localKey, JSON.stringify(resolved));
      } catch { /* ignore */ }

      // Notify other hook instances on the same page
      window.dispatchEvent(new CustomEvent('ourlobby_sync', {
        detail: { key: localKey, value: resolved },
      }));

      // Save to Firestore if configured
      if (isFirebaseConfigured && db) {
        const docRef = doc(db, collection_, docId);
        setDoc(docRef, resolved as object, { merge: true }).catch(console.warn);
      }

      return resolved;
    });
  }, [collection_, docId, localKey]);

  return [value, set];
}

/**
 * Syncs a Firestore collection with localStorage fallback.
 * @param collectionPath - Firestore collection path
 * @param localKey - localStorage key
 * @param defaultItems - default array if nothing exists
 */
export function useSyncedCollection<T extends { id: string }>(
  collectionPath: string,
  localKey: string,
  defaultItems: T[]
): [T[], (item: T) => void, (id: string, update: Partial<T>) => void, (id: string) => void] {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const saved = localStorage.getItem(localKey);
      return saved ? JSON.parse(saved) : defaultItems;
    } catch {
      return defaultItems;
    }
  });

  // Subscribe to Firestore collection if configured
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    const colRef = collection(db, collectionPath);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
      setItems(data);
      try {
        localStorage.setItem(localKey, JSON.stringify(data));
      } catch { /* ignore */ }
    });

    return () => unsub();
  }, [collectionPath, localKey]);

  const addItem = useCallback((item: T) => {
    if (isFirebaseConfigured && db) {
      const colRef = collection(db, collectionPath);
      const { id: _id, ...rest } = item as Record<string, unknown>;
      addDoc(colRef, { ...rest, createdAt: new Date().toISOString() }).catch(console.warn);
    } else {
      setItems((prev) => {
        const next = [item, ...prev];
        try { localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
  }, [collectionPath, localKey]);

  const updateItem = useCallback((id: string, update: Partial<T>) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...update } : i));
      try { localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (isFirebaseConfigured && db) {
      import('./firebase').then(({ doc: fbDoc, updateDoc: fbUpdate }) => {
        const colRef = fbDoc(db!, collectionPath, id);
        fbUpdate(colRef, update as object).catch(console.warn);
      });
    }
  }, [collectionPath, localKey]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try { localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (isFirebaseConfigured && db) {
      import('./firebase').then(({ doc: fbDoc, deleteDoc: fbDelete }) => {
        const colRef = fbDoc(db!, collectionPath, id);
        fbDelete(colRef).catch(console.warn);
      });
    }
  }, [collectionPath, localKey]);

  return [items, addItem, updateItem, removeItem];
}
