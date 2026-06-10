// Firebase Configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Guestbook functions
async function submitGuestbook(name, message) {
    try {
        await db.collection('guestbook').add({
            name: name,
            message: message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            created: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding guestbook entry:", error);
        return { success: false, error: error.message };
    }
}

async function loadGuestbook() {
    try {
        const snapshot = await db.collection('guestbook')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const entries = [];
        snapshot.forEach(doc => {
            entries.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return entries;
    } catch (error) {
        console.error("Error loading guestbook:", error);
        return [];
    }
}

// RSVP functions
async function submitRSVP(data) {
    try {
        await db.collection('rsvp').add({
            ...data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            created: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding RSVP:", error);
        return { success: false, error: error.message };
    }
}

// Real-time guestbook updates
function subscribeToGuestbook(callback) {
    return db.collection('guestbook')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            const entries = [];
            snapshot.forEach(doc => {
                entries.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(entries);
        });
}