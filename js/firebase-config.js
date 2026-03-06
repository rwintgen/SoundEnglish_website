// Firebase configuration for client-side use
// This file contains public configuration that's safe to expose
// Update with actual values from Firebase Console

export const firebaseConfig = {
    apiKey: "AIzaSyAASEyKINTH3FVCVLIWDbVKVkmIbg9W7Nw",
    authDomain: "soundenglish-homework.firebaseapp.com",
    projectId: "soundenglish-homework",
    storageBucket: "soundenglish-homework.firebasestorage.app",
    messagingSenderId: "621217414713",
    appId: "1:621217414713:web:1f2e9d357b1bfc466ed7e8"
};

// Project constants
export const PROJECT_ID = "soundenglish-homework";
export const AUTH_DOMAIN = "soundenglish-homework.firebaseapp.com";

// Gemini API Key is stored in Firestore (config/api_keys) for security.
// Fetch it at runtime via: db.collection('config').doc('api_keys').get()
export let GEMINI_API_KEY = null;

// Call this after auth to load the Gemini key from Firestore
export async function loadGeminiApiKey(db) {
    const doc = await db.collection('config').doc('api_keys').get();
    if (doc.exists) {
        GEMINI_API_KEY = doc.data().gemini_api_key;
    }
    return GEMINI_API_KEY;
}

// AI Models Configuration
export const AI_MODELS = {
    "gemini-2.0-pro": {
        name: "Gemini 2.0 Pro",
        description: "Latest and most capable model, best for complex homework generation",
        available: true,
        featured: true
    },
    "gemini-2.0-flash": {
        name: "Gemini 2.0 Flash",
        description: "Fast and efficient, good for quick exercise generation",
        available: true,
        featured: false
    },
    "gemini-1.5-pro": {
        name: "Gemini 1.5 Pro",
        description: "Reliable model for homework generation",
        available: true,
        featured: false
    },
    "gemini-1.5-flash": {
        name: "Gemini 1.5 Flash",
        description: "Fast model, lighter weight",
        available: true,
        featured: false
    }
};

// Default model for chat interface
export const DEFAULT_MODEL = "gemini-2.0-pro";
