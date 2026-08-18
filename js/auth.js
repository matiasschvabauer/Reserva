/* ==========================================================================
   RESERVA CANINA GÁLVEZ - AUTHENTICATION & PROFILE MODULE (GOOGLE / GMAIL)
   ========================================================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

function initAuth() {
    checkAuthState();
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const customProfile = getCustomProfile(user.uid);
                const isAdmin = typeof isAdminEmail === 'function' ? isAdminEmail(user.email) : false;
                currentUser = {
                    uid: user.uid,
                    name: customProfile.displayName || user.displayName || 'Vecino/a de Gálvez',
                    originalName: user.displayName || 'Usuario Google',
                    email: user.email || '',
                    photo: user.photoURL || '',
                    phone: customProfile.phone || '',
                    provider: 'Google',
                    isAdmin: isAdmin,
                    role: isAdmin ? 'Administrador Reserva' : 'Vecino Verificado'
                };
                localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
            } else {
                currentUser = null;
                localStorage.removeItem('reserva_user_profile');
            }
            updateAuthUI();
            if (typeof renderForum === 'function') {
                renderForum(typeof getLocalForumThreads === 'function' ? getLocalForumThreads() : []);
            }
        });
    } else {
        updateAuthUI();
    }
}

function checkAuthState() {
    const savedUser = localStorage.getItem('reserva_user_profile');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch(e) {
            currentUser = null;
        }
    }
}

function getCustomProfile(uid) {
    const saved = localStorage.getItem(`reserva_profile_${uid}`);
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {};
}

function saveCustomProfile(uid, profileData) {
    localStorage.setItem(`reserva_profile_${uid}`, JSON.stringify(profileData));
}

/* Google (Gmail) Login */
function loginWithGoogle() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && auth) {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            const customProfile = getCustomProfile(user.uid);
            const isAdmin = typeof isAdminEmail === 'function' ? isAdminEmail(user.email) : false;
            currentUser = {
                uid: user.uid,
                name: customProfile.displayName || user.displayName || 'Vecino/a de Gálvez',
                originalName: user.displayName || 'Usuario Google',
                email: user.email || '',
                photo: user.photoURL || '',
                phone: customProfile.phone || '',
                provider: 'Google',
                isAdmin: isAdmin,
                role: isAdmin ? 'Administrador Reserva' : 'Vecino Verificado'
            };
            localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal('login-modal');
            showToast(`¡Bienvenido/a ${currentUser.name}!`, 'success');
        }).catch((error) => {
            showToast(`Error al iniciar sesión con Google: ${error.message}`, 'error');
        });
    } else {
        currentUser = {
            uid: 'google_user_demo_' + Date.now(),
            name: 'Vecino/a de Gálvez (Gmail)',
            originalName: 'Vecino/a de Gálvez',
            email: 'vecino.galvez@gmail.com',
            photo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
            phone: '3404-556677',
            provider: 'Google Demo'
        };
        localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('login-modal');
        showToast('¡Sesión iniciada con Google!', 'success');
        if (typeof renderForum === 'function') {
            renderForum(typeof getLocalForumThreads === 'function' ? getLocalForumThreads() : []);
        }
    }
}

function logout() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && auth) {
        auth.signOut();
    }
    currentUser = null;
    localStorage.removeItem('reserva_user_profile');
    updateAuthUI();
    showToast('Sesión cerrada correctamente.', 'info');
    if (typeof renderForum === 'function') {
        renderForum(typeof getLocalForumThreads === 'function' ? getLocalForumThreads() : []);
    }
}

/* User Profile Management Modal */
function openProfileModal() {
    if (!currentUser) {
        openModal('login-modal');
        return;
    }

    const nameInput = document.getElementById('profile-display-name');
    const emailEl = document.getElementById('profile-email-text');
    const phoneInput = document.getElementById('profile-phone-input');
    const avatarImg = document.getElementById('profile-avatar-img');

    if (nameInput) nameInput.value = currentUser.name || '';
    if (emailEl) emailEl.innerText = `Google (Gmail) • ${currentUser.email || 'Cuenta Verificada'}`;
    if (phoneInput) phoneInput.value = currentUser.phone || '';
    if (avatarImg) {
        if (currentUser.photo) {
            avatarImg.src = currentUser.photo;
            avatarImg.style.display = 'block';
        } else {
            avatarImg.style.display = 'none';
        }
    }

    openModal('profile-modal');
}

function saveProfileSettings(event) {
    if (event) event.preventDefault();
    if (!currentUser) return;

    const newDisplayName = document.getElementById('profile-display-name').value.trim();
    const newPhone = document.getElementById('profile-phone-input').value.trim();

    if (!newDisplayName) {
        showToast('Por favor ingresa tu nombre visible para el foro.', 'error');
        return;
    }

    currentUser.name = newDisplayName;
    currentUser.phone = newPhone;

    localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
    saveCustomProfile(currentUser.uid, { displayName: newDisplayName, phone: newPhone });

    updateAuthUI();
    closeModal('profile-modal');
    showToast('¡Perfil actualizado con éxito!', 'success');

    if (typeof renderForum === 'function') {
        renderForum(typeof getLocalForumThreads === 'function' ? getLocalForumThreads() : []);
    }
}

function updateAuthUI() {
    const authStatusContainers = document.querySelectorAll('.auth-status-container');
    
    authStatusContainers.forEach(container => {
        if (currentUser) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="avatar" onclick="openProfileModal()" style="width:36px; height:36px; cursor:pointer;" title="Configurar Mi Perfil">
                        ${currentUser.photo ? `<img src="${currentUser.photo}" style="width:100%; height:100%; border-radius:50%;">` : currentUser.name.charAt(0)}
                    </div>
                    <span onclick="openProfileModal()" style="font-weight:600; font-size:0.88rem; cursor:pointer; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="Configurar Mi Perfil">
                        ${currentUser.name}
                    </span>
                    <button class="btn btn-sm btn-outline" onclick="openProfileModal()" title="Mi Perfil" style="padding:4px 8px; font-size:0.8rem;">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="logout()" title="Cerrar Sesión" style="padding:4px 8px; font-size:0.8rem; color:#c62828;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="btn btn-primary btn-sm" onclick="openModal('login-modal')">
                    <i class="fab fa-google"></i> Entrar con Gmail
                </button>
            `;
        }
    });
}
