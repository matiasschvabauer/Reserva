/* ==========================================================================
   RESERVA CANINA GÁLVEZ - FIREBASE CONFIGURATION
   ========================================================================== */

// Configuración de tu proyecto de Firebase
// Reemplaza estas credenciales cuando crees tu proyecto en la consola de Firebase (https://console.firebase.google.com/)
const firebaseConfig = {
    apiKey: "AIzaSyA-eyf7HElXeEq8Yf7CgaMAMCxX3aBewQM",
    authDomain: "reserva-canina-galvez.firebaseapp.com",
    projectId: "reserva-canina-galvez",
    storageBucket: "reserva-canina-galvez.firebasestorage.app",
    messagingSenderId: "594593063473",
    appId: "1:594593063473:web:7c598c55dc689c2cc6eb10"
};

// Lista de correos de Administradores con permisos especiales de moderación
const ADMIN_EMAILS = [
    "matiasschvbauer@gmail.com",
    "matiasschvabauer@gmail.com"
];

function isAdminEmail(email) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// Variable global para detectar si Firebase está activado con credenciales reales
let isFirebaseConfigured = false;
let auth = null;
let db = null;

function initFirebaseApp() {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseConfigured = true;
            console.log("🔥 Firebase inicializado con éxito.");
        } catch (e) {
            console.warn("⚠️ Error al inicializar Firebase. Se usará el modo LocalStorage/Demo.", e);
        }
    } else {
        console.log("ℹ️ Firebase no configurado aún o en modo Demo. Usando persistencia LocalStorage.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initFirebaseApp();
});
