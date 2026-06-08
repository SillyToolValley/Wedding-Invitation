import {
  initFirebase,
  addGuestbook,
  listenGuestbook,
  addRsvp,
  addGameScore,
  getGameScores,
} from '../../js/firebase.js';

const LOCAL_GUESTBOOK_KEY = 'wi-gb';
const LOCAL_RSVP_KEY = 'wi-rsvp';
const LOCAL_SCORE_KEY = 'wi-scores';

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function normalizeTimestamp(value) {
  if (!value) return Date.now();
  if (typeof value === 'number') return value;
  if (value.seconds) return value.seconds * 1000;
  if (typeof value.toMillis === 'function') return value.toMillis();
  return Date.now();
}

function normalizeGuestbook(entry) {
  return {
    name: entry.name || 'Guest',
    msg: entry.msg || entry.message || '',
    ts: normalizeTimestamp(entry.ts || entry.timestamp || entry.created),
  };
}

function normalizeScore(entry) {
  return {
    name: String(entry.name || 'PLAYER').slice(0, 10),
    score: Math.floor(Number(entry.score) || 0),
    ts: normalizeTimestamp(entry.ts || entry.timestamp || entry.created),
  };
}

function localScores() {
  return readLocal(LOCAL_SCORE_KEY)
    .map(normalizeScore)
    .sort((a, b) => b.score - a.score);
}

let firebaseReady = false;

try {
  initFirebase();
  firebaseReady = true;
} catch (error) {
  console.warn('Firebase init failed. Falling back to localStorage.', error);
}

window.WeddingData = {
  get isRemote() {
    return firebaseReady;
  },

  async submitRsvp(data) {
    if (firebaseReady) {
      try {
        await addRsvp(data);
        return { remote: true };
      } catch (error) {
        console.warn('Remote RSVP submit failed. Falling back to localStorage.', error);
      }
    }

    const list = readLocal(LOCAL_RSVP_KEY);
    list.push(data);
    writeLocal(LOCAL_RSVP_KEY, list);
    return { remote: false };
  },

  async submitGuestbook(name, msg) {
    if (firebaseReady) {
      try {
        await addGuestbook(name, msg);
        return { remote: true };
      } catch (error) {
        console.warn('Remote guestbook submit failed. Falling back to localStorage.', error);
      }
    }

    const list = readLocal(LOCAL_GUESTBOOK_KEY);
    list.push({ name, msg, ts: Date.now() });
    writeLocal(LOCAL_GUESTBOOK_KEY, list);
    return { remote: false };
  },

  listenGuestbook(callback) {
    if (!firebaseReady) return null;

    try {
      return listenGuestbook((items) => {
        callback(items.map(normalizeGuestbook));
      });
    } catch (error) {
      console.warn('Remote guestbook listener failed.', error);
      return null;
    }
  },

  async getGameLeaderboard() {
    if (firebaseReady) {
      try {
        return (await getGameScores()).map(normalizeScore).sort((a, b) => b.score - a.score);
      } catch (error) {
        console.warn('Remote game leaderboard failed. Falling back to localStorage.', error);
      }
    }

    return localScores();
  },

  async submitGameScore(name, score) {
    const entry = normalizeScore({ name, score, ts: Date.now() });

    if (firebaseReady) {
      try {
        await addGameScore(entry.name, entry.score);
        return { remote: true };
      } catch (error) {
        console.warn('Remote game score submit failed. Falling back to localStorage.', error);
      }
    }

    const list = readLocal(LOCAL_SCORE_KEY);
    list.push(entry);
    writeLocal(LOCAL_SCORE_KEY, list);
    return { remote: false };
  },
};

window.getGameLeaderboard = () => window.WeddingData.getGameLeaderboard();
window.submitGameScore = (name, score) => window.WeddingData.submitGameScore(name, score);
