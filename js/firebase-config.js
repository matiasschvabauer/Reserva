/* ==========================================================================
   RESERVA CANINA GÁLVEZ - FIREBASE CONFIGURATION
   ========================================================================== */

// Configuración de tu proyecto de Firebase
// Reemplaza estas credenciales cuando crees tu proyecto en la consola de Firebase (https://console.firebase.google.com/)
const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "reserva-canina-galvez.firebaseapp.com",
    projectId: "reserva-canina-galvez",
    storageBucket: "reserva-canina-galvez.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
};

// Variable global para detectar si Firebase está activado con credenciales reales
let isFirebaseConfigured = false;
let auth = null;
let db = null;

function initFirebaseApp() {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "TU_API_KEY_AQUI") {
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
