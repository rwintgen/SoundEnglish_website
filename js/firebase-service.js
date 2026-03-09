// Firebase Service Initialization
// This script initializes Firebase and exposes a global FirebaseService object

(function() {
    // Firebase configuration - Update with actual values from .env
    const firebaseConfig = {
        apiKey: "AIzaSyAASEyKINTH3FVCVLIWDbVKVkmIbg9W7Nw",
        authDomain: "soundenglish-homework.firebaseapp.com",
        projectId: "soundenglish-homework",
        storageBucket: "soundenglish-homework.firebasestorage.app",
        messagingSenderId: "621217414713",
        appId: "1:621217414713:web:1f2e9d357b1bfc466ed7e8"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Global service object
    window.FirebaseService = {
        // Authentication
        signIn: async (email, password) => {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        signOut: async () => {
            try {
                await auth.signOut();
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        getCurrentUser: () => {
            return auth.currentUser;
        },

        onAuthStateChanged: (callback) => {
            return auth.onAuthStateChanged(callback);
        },

        // Contact Form
        saveContactForm: async (name, email, event) => {
            try {
                const docRef = await db.collection('contact_form').add({
                    name: name.trim(),
                    email: email.trim(),
                    event: event.trim(),
                    submitDate: firebase.firestore.FieldValue.serverTimestamp()
                });
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('Error saving contact form:', error);
                return { success: false, error: error.message };
            }
        },

        // Homework Types Collection (exercise template library)
        getAllHomeworkTypes: async () => {
            try {
                const snap = await db.collection('homework_types').orderBy('createdAt').get();
                const data = [];
                snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching homework types:', error);
                return { success: false, error: error.message };
            }
        },

        createHomeworkType: async (typeData) => {
            try {
                const docRef = await db.collection('homework_types').add({
                    ...typeData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('Error creating homework type:', error);
                return { success: false, error: error.message };
            }
        },

        updateHomeworkType: async (id, typeData) => {
            try {
                await db.collection('homework_types').doc(id).set(typeData, { merge: true });
                return { success: true };
            } catch (error) {
                console.error('Error updating homework type:', error);
                return { success: false, error: error.message };
            }
        },

        deleteHomeworkType: async (id) => {
            try {
                await db.collection('homework_types').doc(id).delete();
                return { success: true };
            } catch (error) {
                console.error('Error deleting homework type:', error);
                return { success: false, error: error.message };
            }
        },

        // Students Collection
        getAllStudents: async () => {
            try {
                const snap = await db.collection('students').orderBy('name').get();
                const data = [];
                snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching students:', error);
                return { success: false, error: error.message };
            }
        },

        createStudent: async (studentData) => {
            try {
                const docRef = await db.collection('students').add({
                    ...studentData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('Error creating student:', error);
                return { success: false, error: error.message };
            }
        },

        updateStudent: async (id, studentData) => {
            try {
                await db.collection('students').doc(id).set(studentData, { merge: true });
                return { success: true };
            } catch (error) {
                console.error('Error updating student:', error);
                return { success: false, error: error.message };
            }
        },

        deleteStudent: async (id) => {
            try {
                await db.collection('students').doc(id).delete();
                return { success: true };
            } catch (error) {
                console.error('Error deleting student:', error);
                return { success: false, error: error.message };
            }
        },

        // Fetch Gemini API key from Firestore (only authenticated users)
        getGeminiApiKey: async () => {
            try {
                const doc = await db.collection('config').doc('api_keys').get();
                if (doc.exists) {
                    return doc.data().gemini_api_key;
                }
                return null;
            } catch (error) {
                console.error('Error fetching API key:', error);
                return null;
            }
        },

        // Saved Homeworks Collection
        getAllHomeworks: async () => {
            try {
                const snap = await db.collection('homeworks').orderBy('createdAt', 'desc').get();
                const data = [];
                snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching homeworks:', error);
                return { success: false, error: error.message };
            }
        },

        getHomeworksByStudent: async (studentId) => {
            try {
                const snap = await db.collection('homeworks')
                    .where('studentId', '==', studentId)
                    .orderBy('createdAt', 'desc')
                    .get();
                const data = [];
                snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching student homeworks:', error);
                return { success: false, error: error.message };
            }
        },

        createHomework: async (hwData) => {
            try {
                const docRef = await db.collection('homeworks').add({
                    ...hwData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('Error saving homework:', error);
                return { success: false, error: error.message };
            }
        },

        deleteHomework: async (id) => {
            try {
                await db.collection('homeworks').doc(id).delete();
                return { success: true };
            } catch (error) {
                console.error('Error deleting homework:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // Expose Firebase instances for advanced usage
    window.FirebaseService.auth = auth;
    window.FirebaseService.db = db;
    window.FirebaseService.app = app;

    console.log('Firebase Service initialized successfully');
})();
