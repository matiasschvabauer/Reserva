/* ==========================================================================
   RESERVA CANINA GÁLVEZ - FORUM LOGIC, CLOUDINARY UPLOAD & MODERATION
   ========================================================================== */

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
window.escapeHTML = escapeHTML;

// Cloudinary Free Unsigned Configuration
const CLOUDINARY_CONFIG = {
    cloudName: 'doissrwhj', // Tu Cloud Name de Cloudinary
    uploadPreset: 'reserva_preset'     // Tu Unsigned Upload Preset en Cloudinary
};

const INITIAL_THREADS = [];

let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'recent';
let lastPostTime = 0; // Anti-spam rate limiting timestamp

document.addEventListener('DOMContentLoaded', () => {
    initForum();
});

function initForum() {
    setupFirebaseOrLocalListeners();
}

let currentThreadsList = [];

/* Dual Connectivity & Realtime Persistence */
function setupFirebaseOrLocalListeners() {
    const container = document.getElementById('forum-threads-list');
    if (container && typeof getPawLoaderHTML === 'function') {
        container.innerHTML = getPawLoaderHTML('Cargando publicaciones del foro...');
    }

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            const threads = [];
            snapshot.forEach(doc => {
                threads.push({ id: doc.id, ...doc.data() });
            });
            currentThreadsList = threads;
            if (threads.length === 0) {
                seedInitialForumThreads();
            } else {
                renderForum(currentThreadsList);
            }
        }, (error) => {
            console.warn("Error en Firestore listener. Usando almacenamiento local:", error);
            currentThreadsList = getLocalForumThreads();
            renderForum(currentThreadsList);
        });
    } else {
        currentThreadsList = getLocalForumThreads();
        renderForum(currentThreadsList);
    }
}

function seedInitialForumThreads() {
    const sampleThread = {
        id: "thread_bienvenida",
        title: "¡Bienvenidos al Foro Oficial de la Reserva Canina Gálvez!",
        category: "general",
        content: "Espacio creado para conversar sobre adopciones, tránsito, salud animal y voluntariado en nuestra ciudad de Gálvez. ¡Sumate a la comunidad!",
        author: "Reserva Canina Gálvez",
        authorEmail: "matiasschvbauer@gmail.com",
        authorRole: "Administrador Reserva",
        createdAt: new Date().toISOString(),
        status: "approved",
        likes: 5,
        likedBy: [],
        replies: [
            {
                id: "reply_1",
                author: "Vecino/a de Gálvez",
                content: "¡Excelente iniciativa! Muchas gracias por el trabajo que hacen por los callejeritos.",
                createdAt: new Date().toISOString()
            }
        ]
    };
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(sampleThread.id).set(sampleThread).catch(e => console.warn("Seed thread error:", e));
    }
    renderForum([sampleThread]);
}

function getLocalForumThreads() {
    const saved = localStorage.getItem('reserva_forum_threads');
    if (!saved) return INITIAL_THREADS;
    try { return JSON.parse(saved); } catch (e) { return INITIAL_THREADS; }
}

function saveLocalForumThreads(threads) {
    localStorage.setItem('reserva_forum_threads', JSON.stringify(threads));
    if (!isFirebaseConfigured) {
        renderForum(threads);
    }
}

/* Direct Cloudinary Free Image Upload Handler */
function handleCloudinaryFileUpload(fileInput, mode) {
    const file = fileInput.files[0];
    if (!file) return;

    const statusEl = document.getElementById(`cloudinary-status-${mode}`);
    const hiddenUrlInput = document.getElementById(mode === 'edit' ? 'edit-thread-image-input' : 'thread-image-input');
    const previewContainer = document.getElementById(mode === 'edit' ? 'edit-image-preview-container' : 'image-preview-container');
    const previewImg = document.getElementById(mode === 'edit' ? 'edit-image-preview-element' : 'image-preview-element');

    if (statusEl) statusEl.innerText = '⏳ Subiendo foto a Cloudinary...';
    if (window.showUploadProgress) {
        window.showUploadProgress('Subiendo Imagen a la Nube', `Subiendo ${file.name} a Cloudinary...`, 45);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.secure_url) {
                hiddenUrlInput.value = data.secure_url;
                if (previewImg) previewImg.src = data.secure_url;
                if (previewContainer) previewContainer.style.display = 'block';

                if (window.showUploadProgress) {
                    window.showUploadProgress('Carga Completada', '¡Foto procesada correctamente!', 100);
                    setTimeout(window.hideUploadProgress, 600);
                }

                // Check if Cloudinary AI moderation (AWS Rekognition) flagged the image
                if (data.moderation && data.moderation.length > 0) {
                    const modStatus = data.moderation[0].status;
                    if (modStatus === 'pending' || modStatus === 'rejected') {
                        if (statusEl) statusEl.innerText = '⚠️ Foto subida (En revisión por bot de moderación)';
                        fileInput.dataset.moderated = 'flagged';
                        showToast('La imagen fue enviada a revisión previa por el bot de IA.', 'warning');
                        return;
                    }
                }

                fileInput.dataset.moderated = 'approved';
                if (statusEl) statusEl.innerText = '✅ Foto subida con éxito a Cloudinary';
                showToast('¡Foto cargada con éxito!', 'success');
            } else {
                if (window.hideUploadProgress) window.hideUploadProgress();
                throw new Error(data.error ? data.error.message : 'Upload failed');
            }
        })
        .catch(err => {
            if (window.hideUploadProgress) window.hideUploadProgress();
            console.warn("Cloudinary Upload Fallback using local FileReader:", err);
            // Fallback local preview if Cloudinary credentials are not configured yet
            const reader = new FileReader();
            reader.onload = function (e) {
                hiddenUrlInput.value = e.target.result;
                if (previewImg) previewImg.src = e.target.result;
                if (previewContainer) previewContainer.style.display = 'block';
                if (statusEl) statusEl.innerText = '✅ Foto seleccionada correctamente';
            };
            reader.readAsDataURL(file);
        });
}

/* Forum Core Rendering & Stats */
function renderForum(threads) {
    updateForumStatistics(threads);
    updateCategoryCounts(threads);
    renderFilteredThreads(threads);
}

function updateForumStatistics(threads) {
    const totalThreadsEl = document.getElementById('stat-total-threads');
    const solvedCasesEl = document.getElementById('stat-solved-cases');
    const totalRepliesEl = document.getElementById('stat-total-replies');
    const activeUsersEl = document.getElementById('stat-active-users');

    if (!totalThreadsEl) return;

    const publicThreads = threads.filter(t => !t.status || t.status === 'active' || t.isSolved);

    const totalThreads = publicThreads.length;
    const solvedCases = publicThreads.filter(t => t.isSolved).length;

    let totalReplies = 0;
    const authorsSet = new Set();

    publicThreads.forEach(t => {
        if (t.author) authorsSet.add(t.author);
        if (t.replies) {
            totalReplies += t.replies.length;
            t.replies.forEach(r => { if (r.author) authorsSet.add(r.author); });
        }
    });

    totalThreadsEl.innerText = totalThreads;
    solvedCasesEl.innerText = solvedCases;
    totalRepliesEl.innerText = totalReplies;
    activeUsersEl.innerText = authorsSet.size;
}

function updateCategoryCounts(threads) {
    const publicThreads = threads.filter(t => !t.status || t.status === 'active' || t.isSolved);
    const counts = { all: publicThreads.length, perdidos: 0, salud: 0, ayuda: 0, general: 0 };

    publicThreads.forEach(t => {
        if (counts[t.category] !== undefined) {
            counts[t.category]++;
        } else {
            counts.general++;
        }
    });

    Object.keys(counts).forEach(cat => {
        const badge = document.getElementById(`cat-count-${cat}`);
        if (badge) badge.innerText = counts[cat];
    });
}

function renderFilteredThreads(threads) {
    const threadContainer = document.getElementById('forum-threads-list');
    if (!threadContainer) return;

    let filtered = [...threads];

    // Filter out threads that are "under_review" EXCEPT for the post's author or admins
    filtered = filtered.filter(t => {
        if (!t.status || t.status === 'active' || t.isSolved) return true;
        if (t.status === 'under_review') {
            return currentUser && (currentUser.isAdmin || currentUser.uid === t.authorUid || currentUser.name === t.author);
        }
        return false;
    });

    if (activeCategory !== 'all') {
        filtered = filtered.filter(t => t.category === activeCategory);
    }

    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(t =>
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.content && t.content.toLowerCase().includes(q)) ||
            (t.author && t.author.toLowerCase().includes(q)) ||
            (t.location && t.location.toLowerCase().includes(q))
        );
    }

    if (currentSort === 'popular') {
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'replies') {
        filtered.sort((a, b) => ((b.replies ? b.replies.length : 0) - (a.replies ? a.replies.length : 0)));
    } else {
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (filtered.length === 0) {
        threadContainer.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <i class="fas fa-comments" style="font-size: 3rem; color: var(--text-light); margin-bottom: 15px;"></i>
                <h3>No hay publicaciones aún</h3>
                <p style="color: var(--text-muted); margin-top: 5px;">Sé el primero en iniciar un hilo de búsqueda o consulta para la comunidad de Gálvez.</p>
                <button class="btn btn-primary" onclick="checkAuthAndOpenNewThread()" style="margin-top: 15px;">
                    <i class="fas fa-plus-circle"></i> Crear Primer Hilo
                </button>
            </div>
        `;
        return;
    }

    threadContainer.innerHTML = filtered.map(t => {
        const isAdmin = currentUser && currentUser.isAdmin;
        const isOwner = currentUser && (currentUser.uid === t.authorUid || currentUser.name === t.author);
        const canManage = isOwner || isAdmin;
        const isLiked = currentUser && t.likedBy && t.likedBy.includes(currentUser.uid);
        const isUnderReview = t.status === 'under_review';
        
        let categoryClass = 'general';
        if (t.category === 'perdidos') categoryClass = 'lost';
        if (t.category === 'salud') categoryClass = 'health';
        if (t.category === 'ayuda') categoryClass = 'help';
        if (t.isSolved) categoryClass = 'solved';

        let roleBadge = '';
        if (t.authorRole === 'Voluntario Reserva') {
            roleBadge = '<span class="author-role-badge role-voluntario"><i class="fas fa-paw"></i> Voluntario</span>';
        } else if (t.authorRole === 'Veterinario') {
            roleBadge = '<span class="author-role-badge role-vet"><i class="fas fa-user-md"></i> Vet</span>';
        } else if (t.authorRole === 'Administrador Reserva' || (t.authorEmail && isAdminEmail(t.authorEmail))) {
            roleBadge = '<span class="author-role-badge role-admin"><i class="fas fa-crown"></i> Admin</span>';
        } else if (isOwner) {
            roleBadge = '<span class="author-role-badge role-creator">Tu Hilo</span>';
        }

        return `
            <div class="thread-card ${t.isSolved ? 'is-solved' : ''} ${isUnderReview ? 'is-urgent' : ''}">
                
                ${isUnderReview ? `
                    <div style="background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 1.1rem;"></i>
                            <div>
                                <strong>Publicación en Revisión por Moderación Automática:</strong> 
                                ${isAdmin ? `[MODO ADMIN] Reporte: ${escapeHTML(t.flagReason || 'Contenido o imagen sospechosa')}` : 'Esta publicación está en revisión para verificar las imágenes/texto.'}
                            </div>
                        </div>
                        ${isAdmin ? `
                            <button class="btn btn-sm btn-primary" onclick="approveThread('${t.id}')" style="padding: 4px 10px; font-size: 0.8rem; background: #2e7d32;">
                                <i class="fas fa-check"></i> Aprobar Post
                            </button>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="thread-header-row">
                    <div class="thread-user-info">
                        <div class="avatar">${escapeHTML(t.author ? t.author.charAt(0).toUpperCase() : 'V')}</div>
                        <div class="thread-meta-text">
                            <div class="user-name-wrapper">
                                <span class="user-name">${escapeHTML(t.author || 'Vecino/a')}</span>
                                ${roleBadge}
                            </div>
                            <span class="thread-time">${escapeHTML(t.time || 'Reciente')}</span>
                        </div>
                    </div>

                    <div class="thread-status-badges">
                        ${isUnderReview ? '<span class="status-badge help"><i class="fas fa-clock"></i> EN REVISIÓN</span>' : ''}
                        ${t.isSolved ? '<span class="status-badge solved"><i class="fas fa-check-circle"></i> ¡RESUELTO!</span>' : ''}
                        <span class="status-badge ${categoryClass}">${escapeHTML(t.categoryName || t.category)}</span>
                    </div>
                </div>

                ${t.location ? `<div class="thread-location-tag"><i class="fas fa-location-dot"></i> ${escapeHTML(t.location)}</div>` : ''}

                <h3 class="thread-title" onclick="openThreadDetailModal('${t.id}')">${escapeHTML(t.title)}</h3>
                <p class="thread-excerpt">${escapeHTML(t.content)}</p>

                ${t.imageUrl ? `
                    <div class="thread-image-container" onclick="openThreadDetailModal('${t.id}')">
                        <img src="${escapeHTML(t.imageUrl)}" alt="${escapeHTML(t.title)}" onerror="this.style.display='none'">
                    </div>
                ` : ''}

                ${t.replies && t.replies.length > 0 ? `
                    <div style="background: var(--bg-body); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 15px; font-size: 0.88rem; border-left: 3px solid var(--primary);">
                        <strong>Última respuesta de ${escapeHTML(t.replies[t.replies.length - 1].author)}:</strong> "${escapeHTML(t.replies[t.replies.length - 1].text)}"
                    </div>
                ` : ''}

                <div class="thread-footer">
                    <div class="thread-actions">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="likeThread('${t.id}')" title="Dar Me Gusta">
                            <i class="fas fa-heart" style="${isLiked ? 'color:#e53935;' : ''}"></i> <span>${t.likes || 0}</span>
                        </button>
                        <button class="action-btn" onclick="openThreadDetailModal('${t.id}')" title="Ver comentarios">
                            <i class="fas fa-comment"></i> <span>${t.replies ? t.replies.length : 0} Respuestas</span>
                        </button>
                        <button class="action-btn" onclick="reportThread('${t.id}')" title="Reportar publicación">
                            <i class="fas fa-flag"></i> <span>Reportar</span>
                        </button>
                    </div>

                    <div class="thread-owner-actions">
                        ${canManage ? `
                            <button class="btn btn-sm btn-outline" onclick="openEditThreadModal('${t.id}')" style="padding: 6px 10px; font-size: 0.8rem;" title="Editar Publicación">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm ${t.isSolved ? 'btn-outline' : 'btn-primary'}" onclick="toggleSolvedStatus('${t.id}')" style="padding: 6px 12px; font-size: 0.8rem;">
                                ${t.isSolved ? 'Desmarcar' : '✅ Marcar Resuelto'}
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="deleteThread('${t.id}')" style="padding: 6px 10px; font-size: 0.8rem; color: #c62828; border-color: #ef9a9a;" title="Eliminar Hilo">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : `
                            <button class="btn btn-outline btn-sm" onclick="openReplyModal('${t.id}')" style="padding: 6px 14px; font-size: 0.85rem;">
                                Responder
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* Automated AI Content & Image Moderation Scanner */
function runAutomatedModerationScan(title, content, imageUrl, isImageFlaggedByCloudinary) {
    if (isImageFlaggedByCloudinary) {
        return { isFlagged: true, reason: 'Imagen marcada por el bot de IA de Cloudinary (Gore/Contenido Inapropiado)' };
    }

    const sensitiveWords = ['violencia', 'gore', 'sangre', 'desnudo', 'pornografia', 'arma', 'droga', 'insulto', 'matar', 'ataque'];
    const textToScan = `${title} ${content}`.toLowerCase();

    for (let word of sensitiveWords) {
        if (textToScan.includes(word)) {
            return { isFlagged: true, reason: `Palabras sensibles detectadas: "${word}"` };
        }
    }

    if (imageUrl && imageUrl.trim() !== '') {
        const lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.includes('nsfw') || lowerUrl.includes('adult') || lowerUrl.includes('gore') || lowerUrl.includes('blood')) {
            return { isFlagged: true, reason: 'Patrón de imagen no permitido o inapropiado' };
        }
    }

    return { isFlagged: false, reason: '' };
}

function checkAuthAndOpenNewThread() {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Debes iniciar sesión con tu cuenta de Google (Gmail) para publicar.', 'warning');
        return;
    }
    openModal('new-thread-modal');
}

/* Create New Thread */
function createNewThread(event) {
    event.preventDefault();

    if (!currentUser) {
        openModal('login-modal');
        showToast('Debes iniciar sesión para publicar.', 'warning');
        return;
    }

    const now = Date.now();
    if (now - lastPostTime < 15000) {
        const remaining = Math.ceil((15000 - (now - lastPostTime)) / 1000);
        showToast(`Por favor espera ${remaining} segundos antes de publicar otra vez.`, 'warning');
        return;
    }

    const titleInput = document.getElementById('thread-title-input');
    const categorySelect = document.getElementById('thread-category-select');
    const locationInput = document.getElementById('thread-location-input');
    const phoneInput = document.getElementById('thread-phone-input');
    const imageInput = document.getElementById('thread-image-input');
    const fileInput = document.getElementById('thread-image-file');
    const contentInput = document.getElementById('thread-content-input');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const imageUrl = imageInput ? imageInput.value.trim() : '';

    if (!title || !content) {
        showToast('Por favor completa todos los campos requeridos.', 'error');
        return;
    }

    const isCloudinaryFlagged = fileInput && fileInput.dataset.moderated === 'flagged';
    const modResult = runAutomatedModerationScan(title, content, imageUrl, isCloudinaryFlagged);
    const postStatus = modResult.isFlagged ? 'under_review' : 'active';

    const categoryNames = {
        perdidos: "🚨 Mascotas Perdidas",
        salud: "🩺 Consultas Médicas",
        ayuda: "🆘 Pedidos de Ayuda",
        general: "💬 General"
    };

    const newThread = {
        id: "thread_" + Date.now(),
        category: categorySelect.value,
        categoryName: categoryNames[categorySelect.value] || "💬 General",
        title: title,
        author: currentUser.name || "Vecino/a de Gálvez",
        authorEmail: currentUser.email || '',
        authorRole: currentUser.isAdmin ? 'Administrador Reserva' : 'Vecino Verificado',
        authorUid: currentUser.uid,
        location: locationInput.value.trim() || (currentUser.phone ? `Contacto: ${currentUser.phone}` : ''),
        phone: phoneInput.value.trim() || currentUser.phone || '',
        imageUrl: imageUrl,
        time: "Hace un instante",
        createdAt: Date.now(),
        content: content,
        likes: 1,
        likedBy: [currentUser.uid],
        isSolved: false,
        status: postStatus,
        flagReason: modResult.reason || '',
        replies: []
    };

    lastPostTime = now;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(newThread.id).set(newThread).then(() => {
            resetNewThreadForm();
            closeModal('new-thread-modal');
            if (modResult.isFlagged) {
                showToast('Tu publicación está EN REVISIÓN por el bot de moderación antes de hacerse pública.', 'warning');
            } else {
                showToast('¡Hilo publicado con éxito en la nube de la Reserva!', 'success');
            }
        }).catch(err => {
            showToast(`Error al guardar en Firebase: ${err.message}`, 'error');
        });
    } else {
        const threads = getLocalForumThreads();
        threads.unshift(newThread);
        saveLocalForumThreads(threads);

        resetNewThreadForm();
        closeModal('new-thread-modal');

        if (modResult.isFlagged) {
            showToast('Tu publicación está EN REVISIÓN por moderación de imágenes/contenido.', 'warning');
        } else {
            showToast('¡Hilo publicado con éxito en el foro!', 'success');
        }
    }
}

/* Edit Existing Thread */
function openEditThreadModal(threadId) {
    if (!currentUser) {
        openModal('login-modal');
        return;
    }

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    if (thread.authorUid !== currentUser.uid && thread.author !== currentUser.name) {
        showToast('Solo el creador del hilo puede editar esta publicación.', 'error');
        return;
    }

    document.getElementById('edit-thread-id').value = thread.id;
    document.getElementById('edit-thread-title-input').value = thread.title || '';
    document.getElementById('edit-thread-category-select').value = thread.category || 'general';
    document.getElementById('edit-thread-location-input').value = thread.location || '';
    document.getElementById('edit-thread-phone-input').value = thread.phone || '';
    document.getElementById('edit-thread-image-input').value = thread.imageUrl || '';
    document.getElementById('edit-thread-content-input').value = thread.content || '';

    previewEditImageURL(thread.imageUrl || '');
    openModal('edit-thread-modal');
}

function previewEditImageURL(url) {
    const container = document.getElementById('edit-image-preview-container');
    const img = document.getElementById('edit-image-preview-element');
    if (!container || !img) return;

    if (url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('data:image')) {
        img.src = url.trim();
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function submitEditThread(event) {
    event.preventDefault();
    if (!currentUser) return;

    const threadId = document.getElementById('edit-thread-id').value;
    const title = document.getElementById('edit-thread-title-input').value.trim();
    const category = document.getElementById('edit-thread-category-select').value;
    const location = document.getElementById('edit-thread-location-input').value.trim();
    const phone = document.getElementById('edit-thread-phone-input').value.trim();
    const imageUrl = document.getElementById('edit-thread-image-input').value.trim();
    const content = document.getElementById('edit-thread-content-input').value.trim();
    const fileInput = document.getElementById('edit-thread-image-file');

    if (!title || !content) {
        showToast('Por favor completa los campos requeridos.', 'error');
        return;
    }

    const categoryNames = {
        perdidos: "🚨 Mascotas Perdidas",
        salud: "🩺 Consultas Médicas",
        ayuda: "🆘 Pedidos de Ayuda",
        general: "💬 General"
    };

    const isCloudinaryFlagged = fileInput && fileInput.dataset.moderated === 'flagged';
    const modResult = runAutomatedModerationScan(title, content, imageUrl, isCloudinaryFlagged);
    const postStatus = modResult.isFlagged ? 'under_review' : 'active';

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));

    if (thread) {
        thread.title = title;
        thread.category = category;
        thread.categoryName = categoryNames[category] || "💬 General";
        thread.location = location;
        thread.phone = phone;
        thread.imageUrl = imageUrl;
        thread.content = content;
        thread.status = postStatus;

        if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
            db.collection('forum_threads').doc(thread.id).update({
                title, category, categoryName: thread.categoryName, location, phone, imageUrl, content, status: postStatus
            }).then(() => {
                closeModal('edit-thread-modal');
                showToast('¡Publicación actualizada con éxito!', 'success');
            });
        } else {
            saveLocalForumThreads(threads);
            closeModal('edit-thread-modal');
            showToast('¡Publicación actualizada con éxito!', 'success');
        }
    }
}

function resetNewThreadForm() {
    document.getElementById('thread-title-input').value = '';
    document.getElementById('thread-location-input').value = '';
    document.getElementById('thread-phone-input').value = '';
    document.getElementById('thread-image-input').value = '';
    const fileInput = document.getElementById('thread-image-file');
    if (fileInput) fileInput.value = '';
    const statusEl = document.getElementById('cloudinary-status-new');
    if (statusEl) statusEl.innerText = '';
    document.getElementById('thread-content-input').value = '';
    const container = document.getElementById('image-preview-container');
    if (container) container.style.display = 'none';
}

function approveThread(threadId) {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Solo administradores pueden aprobar publicaciones.', 'error');
        return;
    }

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    thread.status = 'active';
    thread.flagReason = '';

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(thread.id).update({
            status: 'active',
            flagReason: ''
        }).then(() => {
            showToast('✅ Publicación aprobada y hecha pública para la comunidad.', 'success');
        });
    } else {
        saveLocalForumThreads(threads);
        showToast('✅ Publicación aprobada y hecha pública para la comunidad.', 'success');
    }
}

function likeThread(threadId) {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Inicia sesión para votar.', 'warning');
        return;
    }

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    if (!thread.likedBy) thread.likedBy = [];

    const userIdx = thread.likedBy.indexOf(currentUser.uid);
    if (userIdx > -1) {
        thread.likedBy.splice(userIdx, 1);
        thread.likes = Math.max(0, (thread.likes || 1) - 1);
        showToast('Has quitado tu Me Gusta.', 'info');
    } else {
        thread.likedBy.push(currentUser.uid);
        thread.likes = (thread.likes || 0) + 1;
        showToast('¡Te ha gustado esta publicación!', 'success');
    }

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(thread.id).update({
            likes: thread.likes,
            likedBy: thread.likedBy
        });
    } else {
        saveLocalForumThreads(threads);
    }
}

function toggleSolvedStatus(threadId) {
    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    thread.isSolved = !thread.isSolved;
    const msg = thread.isSolved ? '¡Marcado como RESUELTO / ENCONTRADO! 🎉' : 'Publicación marcada como activa otra vez.';

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(thread.id).update({
            isSolved: thread.isSolved
        }).then(() => showToast(msg, 'success'));
    } else {
        saveLocalForumThreads(threads);
        showToast(msg, 'success');
    }
}

function deleteThread(threadId) {
    if (!confirm('¿Estás seguro/a de que deseas eliminar este hilo de discusión?')) return;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(threadId).delete().then(() => {
            showToast('Hilo eliminado con éxito.', 'info');
        });
    } else {
        let threads = getLocalForumThreads();
        threads = threads.filter(t => t.id !== threadId && String(t.id) !== String(threadId));
        saveLocalForumThreads(threads);
        showToast('Hilo eliminado con éxito.', 'info');
    }
}

function reportThread(threadId) {
    showToast('Gracias. Hemos registrado tu reporte para la revisión de moderadores.', 'info');
}

/* Modal Detailed Thread View */
function openThreadDetailModal(threadId) {
    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    const detailContainer = document.getElementById('thread-detail-content');
    const threadIdInput = document.getElementById('detail-modal-thread-id');
    if (!detailContainer || !threadIdInput) return;

    threadIdInput.value = thread.id;

    detailContainer.innerHTML = `
        <div class="thread-detail-body">
            <div class="thread-status-badges" style="margin-bottom: 10px;">
                ${thread.status === 'under_review' ? '<span class="status-badge help"><i class="fas fa-clock"></i> EN REVISIÓN</span>' : ''}
                ${thread.isSolved ? '<span class="status-badge solved"><i class="fas fa-check-circle"></i> ¡RESUELTO!</span>' : ''}
                <span class="status-badge general">${escapeHTML(thread.categoryName || thread.category)}</span>
            </div>

            ${thread.status === 'under_review' ? `
                <div style="background: #fff3e0; color: #e65100; padding: 12px; border-radius: var(--radius-sm); font-size: 0.88rem;">
                    <strong>⚠️ Estado: En Revisión por Moderación Automática.</strong> Solo tú puedes ver este hilo en este momento.
                </div>
            ` : ''}
            
            <h2 style="font-size: 1.4rem; color: var(--text-main); margin-bottom: 8px;">${escapeHTML(thread.title)}</h2>
            
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
                <span><strong>Publicado por:</strong> ${escapeHTML(thread.author)}</span>
                <span>•</span>
                <span>${escapeHTML(thread.time || 'Reciente')}</span>
                ${thread.location ? `<span>• <i class="fas fa-location-dot" style="color:var(--secondary);"></i> ${escapeHTML(thread.location)}</span>` : ''}
            </div>

            ${thread.phone ? `
                <div style="background: var(--secondary-light); color: var(--secondary); padding: 10px 14px; border-radius: var(--radius-sm); font-weight: 700; display: inline-flex; align-items: center; gap: 8px; width: fit-content;">
                    <i class="fas fa-phone"></i> Contacto: <a href="tel:${escapeHTML(thread.phone)}">${escapeHTML(thread.phone)}</a>
                </div>
            ` : ''}

            <p style="font-size: 1rem; color: var(--text-main); line-height: 1.6; white-space: pre-line; margin-top: 10px;">${escapeHTML(thread.content)}</p>

            ${thread.imageUrl ? `
                <div style="margin-top: 15px; border-radius: var(--radius-md); overflow: hidden; max-height: 400px; border: 1px solid var(--border-color);">
                    <img src="${escapeHTML(thread.imageUrl)}" alt="${escapeHTML(thread.title)}" style="width: 100%; max-height: 400px; object-fit: cover;">
                </div>
            ` : ''}

            <h4 style="margin-top: 25px; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                Respuestas (${thread.replies ? thread.replies.length : 0})
            </h4>

            <div class="replies-list-container">
                ${(!thread.replies || thread.replies.length === 0) ? `
                    <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Aún no hay respuestas en este hilo. ¡Sé el primero en responder!</p>
                ` : thread.replies.map(r => `
                    <div class="reply-item">
                        <div class="reply-header">
                            <span class="reply-author">${escapeHTML(r.author)} ${r.authorRole ? `<small style="color:var(--primary); font-weight:600;">(${escapeHTML(r.authorRole)})</small>` : ''}</span>
                            <span style="color: var(--text-light); font-size: 0.78rem;">${escapeHTML(r.time || 'Reciente')}</span>
                        </div>
                        <div class="reply-text">${escapeHTML(r.text)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    openModal('thread-detail-modal');
}

function submitReplyFromDetailModal(event) {
    event.preventDefault();
    const threadId = document.getElementById('detail-modal-thread-id').value;
    const input = document.getElementById('detail-modal-reply-input');
    const text = input.value.trim();

    if (!text) return;
    executeReplySubmission(threadId, text, () => {
        input.value = '';
        openThreadDetailModal(threadId);
    });
}

function openReplyModal(threadId) {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Debes iniciar sesión para responder.', 'warning');
        return;
    }

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (!thread) return;

    document.getElementById('reply-thread-id').value = thread.id;
    document.getElementById('reply-thread-title-preview').innerText = `Respondiendo a: "${thread.title}"`;
    openModal('reply-modal');
}

function submitReply(event) {
    event.preventDefault();
    const threadId = document.getElementById('reply-thread-id').value;
    const input = document.getElementById('reply-content-input');
    const text = input.value.trim();

    if (!text) return;
    executeReplySubmission(threadId, text, () => {
        input.value = '';
        closeModal('reply-modal');
    });
}

function executeReplySubmission(threadId, replyText, callback) {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Inicia sesión para enviar tu respuesta.', 'warning');
        return;
    }

    const newReply = {
        id: "rep_" + Date.now(),
        author: currentUser.name || 'Vecino/a de Gálvez',
        authorRole: 'Vecino Verificado',
        time: 'Hace un instante',
        text: replyText
    };

    const threads = getLocalForumThreads();
    const thread = threads.find(t => t.id === threadId || String(t.id) === String(threadId));
    if (thread) {
        if (!thread.replies) thread.replies = [];
        thread.replies.push(newReply);

        if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
            db.collection('forum_threads').doc(thread.id).update({
                replies: thread.replies
            }).then(() => {
                showToast('¡Respuesta publicada con éxito!', 'success');
                if (callback) callback();
            });
        } else {
            saveLocalForumThreads(threads);
            showToast('¡Respuesta publicada con éxito!', 'success');
            if (callback) callback();
        }
    }
}

function handleCreateThreadClick() {
    if (!currentUser) {
        if (typeof showToast === 'function') {
            showToast('Debes iniciar sesión con Google para publicar un hilo en el foro.', 'warning');
        }
        if (typeof openModal === 'function') {
            openModal('login-modal');
        }
        return;
    }
    if (typeof openModal === 'function') {
        openModal('new-thread-modal');
    }
}
window.handleCreateThreadClick = handleCreateThreadClick;

function filterCategory(category, element) {
    activeCategory = category;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');
    const threadsToRender = (currentThreadsList && currentThreadsList.length > 0) ? currentThreadsList : getLocalForumThreads();
    renderForum(threadsToRender);
}

function handleForumSearch() {
    const input = document.getElementById('forum-search-input');
    if (input) {
        searchQuery = input.value;
        const threadsToRender = (currentThreadsList && currentThreadsList.length > 0) ? currentThreadsList : getLocalForumThreads();
        renderForum(threadsToRender);
    }
}

function handleForumSort() {
    const select = document.getElementById('forum-sort-select');
    if (select) {
        currentSort = select.value;
        const threadsToRender = (currentThreadsList && currentThreadsList.length > 0) ? currentThreadsList : getLocalForumThreads();
        renderForum(threadsToRender);
    }
}

function previewImageURL(url) {
    const container = document.getElementById('image-preview-container');
    const img = document.getElementById('image-preview-element');
    if (!container || !img) return;

    if (url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('data:image')) {
        img.src = url.trim();
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}
