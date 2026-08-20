/* ==========================================================================
   RESERVA CANINA GÁLVEZ - AUTHENTICATION & PROFILE MODULE (GLOBAL GOOGLE AUTH)
   ========================================================================== */

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    ensureAuthModalsExist();
    initAuth();
});

function ensureAuthModalsExist() {
    // Inject #login-modal if missing on the page
    if (!document.getElementById('login-modal')) {
        const loginOverlay = document.createElement('div');
        loginOverlay.className = 'modal-overlay';
        loginOverlay.id = 'login-modal';
        loginOverlay.innerHTML = `
            <div class="modal-container">
                <button class="modal-close-btn" onclick="closeModal('login-modal')"><i class="fas fa-times"></i></button>
                <div style="text-align: center; margin-bottom: 25px;">
                    <img src="assets/img/cropped_circle_image.png" alt="Logo Reserva Canina" class="logo-img-circle" style="width:70px; height:70px; margin: 0 auto 15px auto;">
                    <h2>Acceso a la Comunidad Gálvez</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Verificá tu identidad con tu cuenta de Gmail para acceder como usuario o administrar la plataforma.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
                    <button class="btn" onclick="loginWithGoogle()" style="background: #ffffff; color: #444; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 14px; font-weight: 700;">
                        <i class="fab fa-google" style="color: #ea4335; font-size: 1.2rem;"></i> Iniciar Sesión con Google (Gmail)
                    </button>
                </div>

                <div style="background: var(--primary-light); color: var(--primary); padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; text-align: center; line-height: 1.4;">
                    <i class="fas fa-shield-alt"></i> La verificación ayuda a proteger la comunidad, evitar spam y validar las publicaciones.
                </div>
            </div>
        `;
        document.body.appendChild(loginOverlay);
    }

    // Inject #profile-modal if missing on the page
    if (!document.getElementById('profile-modal')) {
        const profileOverlay = document.createElement('div');
        profileOverlay.className = 'modal-overlay';
        profileOverlay.id = 'profile-modal';
        profileOverlay.innerHTML = `
            <div class="modal-container" style="max-width: 520px;">
                <button class="modal-close-btn" onclick="closeModal('profile-modal')"><i class="fas fa-times"></i></button>
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px auto; border: 3px solid var(--primary);">
                        <img id="profile-avatar-img" src="" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h2>Mi Perfil en la Reserva</h2>
                    <p id="profile-email-text" style="color: var(--text-muted); font-size: 0.88rem;"></p>
                </div>

                <form onsubmit="saveProfileSettings(event)">
                    <div class="form-group">
                        <label class="form-label">Nombre o Apodo Público:</label>
                        <input type="text" id="profile-display-name" class="form-control" placeholder="Ej: María Fernández" required minlength="2" maxlength="50">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono de contacto por defecto (Opcional):</label>
                        <input type="tel" id="profile-phone-input" class="form-control" placeholder="Ej: 3404-556677">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-save"></i> Guardar Cambios del Perfil
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(profileOverlay);
    }
}

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
            notifyPageModules();
        });
    } else {
        updateAuthUI();
        notifyPageModules();
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

function notifyPageModules() {
    if (typeof initAdminTopbar === 'function') initAdminTopbar();
    if (typeof renderDogsCatalog === 'function' && typeof allDogsList !== 'undefined') renderDogsCatalog(allDogsList);
    if (typeof renderRefugioNeeds === 'function' && typeof refugioNeedsList !== 'undefined') renderRefugioNeeds(refugioNeedsList);
    if (typeof renderRefugioGoals === 'function' && typeof refugioGoalsList !== 'undefined') renderRefugioGoals(refugioGoalsList);
    if (typeof renderForum === 'function' && typeof getLocalForumThreads === 'function') renderForum(getLocalForumThreads());
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
            notifyPageModules();
            showToast(`¡Bienvenido/a ${currentUser.name}!`, 'success');
        }).catch((error) => {
            showToast(`Error al iniciar sesión con Google: ${error.message}`, 'error');
        });
    } else {
        currentUser = {
            uid: 'google_user_demo_' + Date.now(),
            name: 'Administrador Demo',
            originalName: 'Administrador Demo',
            email: 'matiasschvbauer@gmail.com',
            photo: 'https://cdn-icons-png.flaticon.com/512/300/300221.png',
            phone: '3404-556677',
            provider: 'Google Demo',
            isAdmin: true,
            role: 'Administrador Reserva'
        };
        localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal('login-modal');
        notifyPageModules();
        showToast('¡Sesión de Administrador iniciada!', 'success');
    }
}

function logout() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && auth) {
        auth.signOut();
    }
    currentUser = null;
    localStorage.removeItem('reserva_user_profile');
    const topbar = document.getElementById('reserva-admin-topbar');
    if (topbar) topbar.remove();
    document.body.classList.remove('has-admin-topbar');
    updateAuthUI();
    notifyPageModules();
    showToast('Sesión cerrada correctamente.', 'info');
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
    if (emailEl) emailEl.innerText = `Google (Gmail) • ${currentUser.email || 'Cuenta Verificada'} ${currentUser.isAdmin ? '👑 ADMIN' : ''}`;
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
        showToast('Por favor ingresa tu nombre visible.', 'error');
        return;
    }

    currentUser.name = newDisplayName;
    currentUser.phone = newPhone;

    localStorage.setItem('reserva_user_profile', JSON.stringify(currentUser));
    saveCustomProfile(currentUser.uid, { displayName: newDisplayName, phone: newPhone });

    updateAuthUI();
    closeModal('profile-modal');
    notifyPageModules();
    showToast('¡Perfil actualizado con éxito!', 'success');
}

function updateAuthUI() {
    const authStatusContainers = document.querySelectorAll('.auth-status-container');
    
    authStatusContainers.forEach(container => {
        if (currentUser) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="avatar" onclick="openProfileModal()" style="width:34px; height:34px; cursor:pointer;" title="Configurar Mi Perfil">
                        ${currentUser.photo ? `<img src="${currentUser.photo}" style="width:100%; height:100%; border-radius:50%;">` : currentUser.name.charAt(0)}
                    </div>
                    <span onclick="openProfileModal()" style="font-weight:600; font-size:0.86rem; cursor:pointer; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color: var(--text-main);" title="Configurar Mi Perfil">
                        ${currentUser.name} ${currentUser.isAdmin ? '<i class="fas fa-crown" style="color:#e9c46a;"></i>' : ''}
                    </span>
                    <button class="btn btn-sm btn-outline" onclick="logout()" title="Cerrar Sesión" style="padding:4px 8px; font-size:0.78rem; color:#c62828;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="btn btn-primary btn-sm" onclick="openModal('login-modal')" style="font-size:0.82rem; padding: 6px 12px;">
                    <i class="fab fa-google"></i> Iniciar Sesión / Admin
                </button>
            `;
        }
    });
}
