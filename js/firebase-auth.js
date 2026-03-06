// Firebase Authentication Module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { firebaseConfig, AI_MODELS, DEFAULT_MODEL } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export Firebase instances
export { auth, db, app };

// Export AI Configuration
export { AI_MODELS, DEFAULT_MODEL };

/**
 * Sign in user with email and password
 */
export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChangedListener(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Save contact form submission to Firestore
 */
export async function saveContactForm(name, email, event) {
  try {
    const docRef = await addDoc(collection(db, 'contact_form'), {
      name: name.trim(),
      email: email.trim(),
      event: event.trim(),
      submitDate: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving contact form:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all homework for current user
 */
export async function getUserHomework(userId) {
  try {
    const q = query(collection(db, 'homework'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const homework = [];
    querySnapshot.forEach(doc => {
      homework.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return { success: true, data: homework };
  } catch (error) {
    console.error('Error fetching homework:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new homework
 */
export async function createHomework(userId, homeworkData) {
  try {
    const docRef = await addDoc(collection(db, 'homework'), {
      userId: userId,
      ...homeworkData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating homework:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get student profile
 */
export async function getStudentProfile(userId) {
  try {
    const docRef = doc(db, 'students', userId);
    const docSnap = await getDocs(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'Profile not found' };
    }
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save chat message with model information
 */
export async function saveChatMessage(userId, role, content, model = DEFAULT_MODEL) {
  try {
    const docRef = await addDoc(collection(db, 'chat_history'), {
      userId: userId,
      model: model,
      messages: [
        {
          role: role,
          content: content,
          model: model,
          timestamp: serverTimestamp()
        }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get available AI models
 */
export function getAvailableModels() {
  return Object.entries(AI_MODELS).map(([key, value]) => ({
    id: key,
    ...value
  }));
}

/**
 * Get model by ID
 */
export function getModelById(modelId) {
  return AI_MODELS[modelId] || AI_MODELS[DEFAULT_MODEL];
}

/**
 * Update user's preferred model selection
 */
export async function updateUserPreferredModel(userId, modelId) {
  try {
    // Verify model exists
    if (!AI_MODELS[modelId]) {
      return { success: false, error: 'Invalid model ID' };
    }
    
    const userRef = doc(db, 'students', userId);
    await updateDoc(userRef, {
      preferredModel: modelId,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating preferred model:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's preferred model
 */
export async function getUserPreferredModel(userId) {
  try {
    const docRef = doc(db, 'students', userId);
    const docSnap = await getDocs(docRef);
    if (docSnap.exists()) {
      return { 
        success: true, 
        model: docSnap.data().preferredModel || DEFAULT_MODEL 
      };
    } else {
      return { success: true, model: DEFAULT_MODEL };
    }
  } catch (error) {
    console.error('Error getting preferred model:', error);
    return { success: true, model: DEFAULT_MODEL };
  }
}
