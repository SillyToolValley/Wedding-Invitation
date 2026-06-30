/*  firebase.js – Firestore 연결 및 helper */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot, getDocs, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let db;

/* 0) 초기화 */
export function initFirebase () {
  const firebaseConfig = {
    apiKey            : 'AIzaSyCfJ2xA0htQIlwvnFp5oTcKmEjXJLcj9Cs',
    authDomain        : 'wedding-invitation-46ad9.firebaseapp.com',
    projectId         : 'wedding-invitation-46ad9',
    appId             : '1:281364628692:web:c169a60fca936dca38a741'
  };
  db = getFirestore(initializeApp(firebaseConfig));
}

/* 1) 방명록 추가 */
export const addGuestbook = (name, msg) =>
  addDoc(collection(db, 'guestbook'), {
    name, msg,
    ts: serverTimestamp()
  });

/* 2) RSVP 추가 */
export const addRsvp = data =>
  addDoc(collection(db, 'rsvp'), {
    ...data,
    ts: serverTimestamp()
  });

/* 3) 방명록 실시간 감시 */
export const listenGuestbook = (cb) => {
  const q = query(collection(db, 'guestbook'), orderBy('ts', 'desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => d.data())));
};

/* 4) 게임 리더보드 */
export const addGameScore = (name, score) =>
  addDoc(collection(db, 'gameScores'), {
    name,
    score,
    ts: serverTimestamp()
  });

export const getGameScores = async () => {
  const q = query(collection(db, 'gameScores'), orderBy('score', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};
