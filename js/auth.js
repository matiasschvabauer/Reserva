/* ==========================================================================
   RESERVA CANINA GÁLVEZ - AUTHENTICATION MODULE (GOOGLE, FACEBOOK & DEMO)
   ========================================================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    updateAuthUI();
});

function checkAuthState() {
    const savedDemoUser = localStorage.getItem('reserva_demo_user');
    if (savedDemoUser) {
        currentUser = JSON.parse(savedDemoUser);
    }
}

function loginWithGoogle() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            currentUser = {
                uid: result.user.uid,
                name: result.user.displayName,
                email: result.user.email,
                photo: result.user.photoURL,
                provider: 'Google'
            };
            localStorage.setItem('reserva_demo_user', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal('login-modal');
            showToast(`¡Bienvenido/a ${currentUser.name}!`, 'success');
        }).catch((error) => {
            showToast(`Error al iniciar sesión con Google: ${error.message}`, 'error');
        });
    } else {
        // Fallback Demo Login for GitHub Pages immediately
        currentUser = {
            uid: 'google_demo_' + Date.now(),
            name: 'Usuario Google Demo',
            email: 'usuario.google@ejemplo.com',
            photo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
            provider: 'Google Demo'
        };
        localStorage.setItem('reserva_demo_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('login-modal');
        showToast('¡Sesión iniciada con Google (Modo Demo)!', 'success');
    }
}

function loginWithFacebook() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
        const provider = new firebase.auth.FacebookAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            currentUser = {
                uid: result.user.uid,
                name: result.user.displayName,
                email: result.user.email,
                photo: result.user.photoURL,
                provider: 'Facebook'
            };
            localStorage.setItem('reserva_demo_user', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal('login-modal');
            showToast(`¡Bienvenido/a ${currentUser.name}!`, 'success');
        }).catch((error) => {
            showToast(`Error al iniciar sesión con Facebook: ${error.message}`, 'error');
        });
    } else {
        currentUser = {
            uid: 'fb_demo_' + Date.now(),
            name: 'Usuario Facebook Demo',
            email: 'usuario.facebook@ejemplo.com',
            photo: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
            provider: 'Facebook Demo'
        };
        localStorage.setItem('reserva_demo_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('login-modal');
        showToast('¡Sesión iniciada con Facebook (Modo Demo)!', 'success');
    }
}

function loginAsGuest(event) {
    if (event) event.preventDefault();
    const guestNameInput = document.getElementById('guest-name');
    const guestName = (guestNameInput && guestNameInput.value.trim()) ? guestNameInput.value.trim() : 'Vecino/a de Gálvez';

    currentUser = {
        uid: 'guest_' + Date.now(),
        name: guestName,
        email: '',
        photo: '',
        provider: 'Invitado'
    };
    localStorage.setItem('reserva_demo_user', JSON.stringify(currentUser));
    updateAuthUI();
    closeModal('login-modal');
    showToast(`¡Bienvenido/a ${currentUser.name}!`, 'success');
}

function logout() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
        auth.signOut();
    }
    currentUser = null;
    localStorage.removeItem('reserva_demo_user');
    updateAuthUI();
    showToast('Sesión cerrada correctamente.', 'info');
}

function updateAuthUI() {
    const authStatusBtns = document.querySelectorAll('.auth-status-container');
    
    authStatusBtns.forEach(container => {
        if (currentUser) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar" style="width:36px; height:36px; font-size:0.9rem;">
                        ${currentUser.photo ? `<img src="${currentUser.photo}" style="width:100%; height:100%; border-radius:50%;">` : currentUser.name.charAt(0)}
                    </div>
                    <span style="font-weight:600; font-size:0.9rem;">${currentUser.name}</span>
                    <button class="btn btn-sm btn-outline" onclick="logout()" title="Cerrar Sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="btn btn-primary btn-sm" onclick="openModal('login-modal')">
                    <i class="fas fa-user"></i> Iniciar Sesión / Foro
                </button>
            `;
        }
    });
}
