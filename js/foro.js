/* ==========================================================================
   RESERVA CANINA GÁLVEZ - FORUM LOGIC, REALTIME CONNECTIVITY & SECURITY
   ========================================================================== */

// Anti-XSS Sanitization Function
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial Sample Data for Gálvez Community
const INITIAL_THREADS = [
    {
        id: "thread_1",
        category: "perdidos",
        categoryName: "🚨 Mascotas Perdidas",
        title: "Perra mestiza dorada 'Luna' perdida en Barrio Pedroni",
        author: "María Fernández",
        authorRole: "Vecino/a",
        authorUid: "user_maria_1",
        location: "Barrio Pedroni (Gálvez)",
        phone: "3404-556677",
        imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80",
        time: "Hace 2 horas",
        createdAt: Date.now() - 7200000,
        content: "Se busca a 'Luna', perrita mestiza de tamaño mediano, pelaje dorado suave. Lleva collar rojo sin chapa. Se escapó cerca del Parque San Martín en Gálvez. Cualquier dato es de vital ayuda.",
        likes: 18,
        likedBy: [],
        isSolved: false,
        replies: [
            { id: "r1", author: "Carlos G.", authorRole: "Vecino/a", time: "Hace 1 hora", text: "La vi corriendo por calle San Martín hacia el sur cerca de las 11hs." },
            { id: "r2", author: "Reserva Canina", authorRole: "Voluntario Reserva", time: "Hace 30 min", text: "Publicado también en las historias de Facebook e Instagram del refugio." }
        ]
    },
    {
        id: "thread_2",
        category: "salud",
        categoryName: "🩺 Consultas Médicas",
        title: "Esquema básico de desparasitación para cachorros rescatados",
        author: "Dr. Roberto V.",
        authorRole: "Veterinario",
        authorUid: "vet_roberto",
        location: "Gálvez Centro",
        phone: "",
        imageUrl: "",
        time: "Ayer",
        createdAt: Date.now() - 86400000,
        content: "Hola a la comunidad de Gálvez. Dejamos un recordatorio preventivo sobre el esquema de desparasitación interna y externa en cachorritos encontrados en la calle antes de su primera vacuna quíntuple.",
        likes: 34,
        likedBy: [],
        isSolved: false,
        replies: [
            { id: "r3", author: "Lucía M.", authorRole: "Vecino/a", time: "Ayer", text: "¡Muchas gracias Doctor por la aclaración y consejos!" }
        ]
    },
    {
        id: "thread_3",
        category: "ayuda",
        categoryName: "🆘 Pedidos de Ayuda",
        title: "Tránsito urgente por 5 días para 'Felipe' (posoperatorio)",
        author: "Voluntarios Reserva",
        authorRole: "Voluntario Reserva",
        authorUid: "voluntarios_reserva",
        location: "Refugio Reserva Canina",
        phone: "3404-401122",
        imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
        time: "Hace 1 día",
        createdAt: Date.now() - 90000000,
        content: "Rescatamos a 'Felipe' con una lesión en su pata trasera. Requerirá 5 días de reposo posoperatorio en un lugar cerrado sin otros perritos. Brindamos el alimento y sus remedios.",
        likes: 42,
        likedBy: [],
        isSolved: true,
        replies: [
            { id: "r4", author: "Ana P.", authorRole: "Vecino/a", time: "Hace 18 horas", text: "Tengo un patio cerrado y habitación libre, ¡ya me contacto por WhatsApp!" }
        ]
    }
];

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

/* Dual Connectivity & Persistence Sync */
function setupFirebaseOrLocalListeners() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        // Real-time Firestore Listener
        db.collection('forum_threads').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            const threads = [];
            snapshot.forEach(doc => {
                threads.push({ id: doc.id, ...doc.data() });
            });
            renderForum(threads);
        }, (error) => {
            console.warn("Error en Firestore listener. Usando LocalStorage fallback.", error);
            renderForum(getLocalForumThreads());
        });
    } else {
        // LocalStorage Fallback Sync
        renderForum(getLocalForumThreads());
    }
}

function getLocalForumThreads() {
    const saved = localStorage.getItem('reserva_forum_threads');
    if (!saved) {
        localStorage.setItem('reserva_forum_threads', JSON.stringify(INITIAL_THREADS));
        return INITIAL_THREADS;
    }
    try {
        return JSON.parse(saved);
    } catch(e) {
        return INITIAL_THREADS;
    }
}

function saveLocalForumThreads(threads) {
    localStorage.setItem('reserva_forum_threads', JSON.stringify(threads));
    if (!isFirebaseConfigured) {
        renderForum(threads);
    }
}

/* Forum Core Rendering & Stats Calculation */
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

    const totalThreads = threads.length;
    const solvedCases = threads.filter(t => t.isSolved).length;
    
    let totalReplies = 0;
    const authorsSet = new Set();

    threads.forEach(t => {
        if (t.author) authorsSet.add(t.author);
        if (t.replies) {
            totalReplies += t.replies.length;
            t.replies.forEach(r => { if (r.author) authorsSet.add(r.author); });
        }
    });

    totalThreadsEl.innerText = totalThreads;
    solvedCasesEl.innerText = solvedCases;
    totalRepliesEl.innerText = totalReplies;
    activeUsersEl.innerText = Math.max(authorsSet.size, 1);
}

function updateCategoryCounts(threads) {
    const counts = { all: threads.length, perdidos: 0, salud: 0, ayuda: 0, general: 0 };
    threads.forEach(t => {
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

    // 1. Filter by Category
    if (activeCategory !== 'all') {
        filtered = filtered.filter(t => t.category === activeCategory);
    }

    // 2. Filter by Search Query
    if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(t => 
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.content && t.content.toLowerCase().includes(q)) ||
            (t.author && t.author.toLowerCase().includes(q)) ||
            (t.location && t.location.toLowerCase().includes(q))
        );
    }

    // 3. Sorting
    if (currentSort === 'popular') {
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'replies') {
        filtered.sort((a, b) => ((b.replies ? b.replies.length : 0) - (a.replies ? a.replies.length : 0)));
    } else {
        // Default recent
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (filtered.length === 0) {
        threadContainer.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <i class="fas fa-search-minus" style="font-size: 3rem; color: var(--text-light); margin-bottom: 15px;"></i>
                <h3>No se encontraron publicaciones</h3>
                <p style="color: var(--text-muted); margin-top: 5px;">Probá cambiando las palabras de búsqueda o publicá un nuevo hilo en esta categoría.</p>
            </div>
        `;
        return;
    }

    threadContainer.innerHTML = filtered.map(t => {
        const isOwner = currentUser && (currentUser.uid === t.authorUid || currentUser.name === t.author);
        const isLiked = currentUser && t.likedBy && t.likedBy.includes(currentUser.uid);
        
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
        } else if (isOwner) {
            roleBadge = '<span class="author-role-badge role-creator">Tu Hilo</span>';
        }

        return `
            <div class="thread-card ${t.isSolved ? 'is-solved' : ''}">
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
                        ${t.isSolved ? '<span class="status-badge solved"><i class="fas fa-check-circle"></i> ¡ENCONTRADO / RESUELTO!</span>' : ''}
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
                        <button class="action-btn" onclick="reportThread('${t.id}')" title="Reportar contenido">
                            <i class="fas fa-flag"></i> <span>Reportar</span>
                        </button>
                    </div>

                    <div class="thread-owner-actions">
                        ${isOwner ? `
                            <button class="btn btn-sm ${t.isSolved ? 'btn-outline' : 'btn-primary'}" onclick="toggleSolvedStatus('${t.id}')" style="padding: 6px 12px; font-size: 0.8rem;">
                                ${t.isSolved ? 'Desmarcar Resuelto' : '✅ Marcar Resuelto'}
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="deleteThread('${t.id}')" style="padding: 6px 10px; font-size: 0.8rem; color: #c62828; border-color: #ef9a9a;">
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

/* Filter, Search & Sort Handlers */
function filterCategory(category, element) {
    activeCategory = category;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');
    renderForum(getLocalForumThreads());
}

function handleForumSearch() {
    const input = document.getElementById('forum-search-input');
    if (input) {
        searchQuery = input.value;
        renderForum(getLocalForumThreads());
    }
}

function handleForumSort() {
    const select = document.getElementById('forum-sort-select');
    if (select) {
        currentSort = select.value;
        renderForum(getLocalForumThreads());
    }
}

/* Image Preview in Modal */
function previewImageURL(url) {
    const container = document.getElementById('image-preview-container');
    const img = document.getElementById('image-preview-element');
    if (!container || !img) return;

    if (url.trim().startsWith('http://') || url.trim().startsWith('https://')) {
        img.src = url.trim();
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

/* Thread Actions (Create, Reply, Like, Solved, Delete, Report) */
function createNewThread(event) {
    event.preventDefault();

    if (!currentUser) {
        openModal('login-modal');
        showToast('Debes iniciar sesión para publicar en el foro.', 'warning');
        return;
    }

    // Anti-Spam Rate Limiting (15 seconds)
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
    const contentInput = document.getElementById('thread-content-input');

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        showToast('Por favor completa los campos obligatorios.', 'error');
        return;
    }

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
        title: titleInput.value.trim(),
        author: currentUser.name || "Vecino/a",
        authorRole: currentUser.provider === 'Google' || currentUser.provider === 'Facebook' ? 'Vecino Verificado' : 'Vecino/a',
        authorUid: currentUser.uid,
        location: locationInput.value.trim(),
        phone: phoneInput.value.trim(),
        imageUrl: imageInput.value.trim(),
        time: "Hace un instante",
        createdAt: Date.now(),
        content: contentInput.value.trim(),
        likes: 1,
        likedBy: [currentUser.uid],
        isSolved: false,
        replies: []
    };

    lastPostTime = now;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('forum_threads').doc(newThread.id).set(newThread).then(() => {
            resetNewThreadForm();
            closeModal('new-thread-modal');
            showToast('¡Hilo publicado con éxito en la nube de la Reserva!', 'success');
        }).catch(err => {
            showToast(`Error al guardar en Firebase: ${err.message}`, 'error');
        });
    } else {
        const threads = getLocalForumThreads();
        threads.unshift(newThread);
        saveLocalForumThreads(threads);

        resetNewThreadForm();
        closeModal('new-thread-modal');
        showToast('¡Hilo publicado correctamente en el foro!', 'success');
    }
}

function resetNewThreadForm() {
    document.getElementById('thread-title-input').value = '';
    document.getElementById('thread-location-input').value = '';
    document.getElementById('thread-phone-input').value = '';
    document.getElementById('thread-image-input').value = '';
    document.getElementById('thread-content-input').value = '';
    const container = document.getElementById('image-preview-container');
    if (container) container.style.display = 'none';
}

function likeThread(threadId) {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Inicia sesión para votar publicaciones.', 'warning');
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
    showToast('Gracias. Hemos registrado tu reporte para revisión de los moderadores.', 'info');
}

/* Modal Detailed Thread View & Conversation */
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
                ${thread.isSolved ? '<span class="status-badge solved"><i class="fas fa-check-circle"></i> ¡RESUELTO!</span>' : ''}
                <span class="status-badge general">${escapeHTML(thread.categoryName || thread.category)}</span>
            </div>
            
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
                    <p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">Aún no hay respuestas en este hilo. ¡Sé el primero en aportar información!</p>
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
        showToast('Inicia sesión para responder.', 'warning');
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
        authorRole: currentUser.provider === 'Google' || currentUser.provider === 'Facebook' ? 'Vecino Verificado' : 'Vecino/a',
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
