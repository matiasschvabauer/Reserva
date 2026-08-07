/* ==========================================================================
   RESERVA CANINA GÁLVEZ - FORUM LOGIC & THREAD MANAGEMENT
   ========================================================================== */

const INITIAL_THREADS = [
    {
        id: 1,
        category: "perdidos",
        categoryName: "🚨 Mascotas Perdidas",
        title: "Perra mestiza dorada perdida en Barrio Pedroni (Gálvez)",
        author: "María Fernández",
        time: "Hace 2 horas",
        content: "Se busca a 'Luna', lleva collar rojo sin chapa. Se escapó esta mañana cerca del Parque San Martín. Si alguien la ve por favor avisar al 3404-556677.",
        likes: 12,
        repliesCount: 4,
        replies: [
            { author: "Carlos G.", time: "Hace 1 hora", text: "La vi corriendo por calle San Martín hacia el sur cerca de las 11hs." },
            { author: "Reserva Canina", time: "Hace 30 min", text: "Difundimos en las historias de Facebook e Instagram del refugio." }
        ]
    },
    {
        id: 2,
        category: "salud",
        categoryName: "🩺 Consultas Médicas",
        title: "Recomendaciones de desparasitación para cachorros recién rescatados",
        author: "Dr. Roberto V. (Veterinario)",
        time: "Ayer",
        content: "Hola a la comunidad. Dejamos un recordatorio sobre el esquema básico de desparasitación para cachorritos encontrados en la calle antes de la primera vacuna.",
        likes: 24,
        repliesCount: 8,
        replies: [
            { author: "Lucía M.", time: "Ayer", text: "¡Muchas gracias Doctor por la información tan clara!" }
        ]
    },
    {
        id: 3,
        category: "ayuda",
        categoryName: "🆘 Pedidos de Ayuda",
        title: "Se solicita tránsito urgente por 5 días para perrito operado",
        author: "Voluntarios Reserva",
        time: "Hace 1 día",
        content: "Rescatamos a 'Felipe', necesitó cirugía de patita. Necesita un hogar tranquilo sin otros animales por 5 días para su posoperatorio en Gálvez.",
        likes: 35,
        repliesCount: 6,
        replies: [
            { author: "Ana P.", time: "Hace 18 horas", text: "Tengo un patio cerrado sin otros perros, ¡puedo ayudar!" }
        ]
    }
];

let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initForumThreads();
    initCategoryButtons();
});

function getForumThreads() {
    const saved = localStorage.getItem('reserva_forum_threads');
    return saved ? JSON.parse(saved) : INITIAL_THREADS;
}

function saveForumThreads(threads) {
    localStorage.setItem('reserva_forum_threads', JSON.stringify(threads));
}

function initForumThreads() {
    const threads = getForumThreads();
    renderThreads(threads);
}

function renderThreads(threads) {
    const threadContainer = document.getElementById('forum-threads-list');
    if (!threadContainer) return;

    const filtered = activeCategory === 'all' 
        ? threads 
        : threads.filter(t => t.category === activeCategory);

    if (filtered.length === 0) {
        threadContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <i class="fas fa-comments" style="font-size: 2.5rem; color: var(--text-light); margin-bottom: 12px;"></i>
                <h3>No hay hilos en esta categoría todavía</h3>
                <p style="color: var(--text-muted);">¡Sé el primero en abrir un tema de discusión o ayuda!</p>
            </div>
        `;
        return;
    }

    threadContainer.innerHTML = filtered.map(t => `
        <div class="thread-card">
            <div class="thread-user-info">
                <div class="avatar">${t.author.charAt(0)}</div>
                <div class="thread-meta-text">
                    <span class="user-name">${t.author}</span>
                    <span class="thread-time">${t.time} • <strong style="color: var(--primary);">${t.categoryName || t.category}</strong></span>
                </div>
            </div>
            <h3 class="thread-title">${t.title}</h3>
            <p class="thread-excerpt">${t.content}</p>
            
            ${t.replies && t.replies.length > 0 ? `
                <div style="background: var(--bg-body); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 15px; font-size: 0.9rem;">
                    <strong>Última respuesta de ${t.replies[t.replies.length - 1].author}:</strong> "${t.replies[t.replies.length - 1].text}"
                </div>
            ` : ''}

            <div class="thread-footer">
                <div class="thread-actions">
                    <button class="action-btn" onclick="likeThread(${t.id})">
                        <i class="fas fa-heart" style="color: #e53935;"></i> <span>${t.likes}</span>
                    </button>
                    <button class="action-btn" onclick="toggleReplies(${t.id})">
                        <i class="fas fa-comment"></i> <span>${t.replies ? t.replies.length : 0} Respuestas</span>
                    </button>
                </div>
                <button class="btn btn-outline btn-sm" onclick="openReplyModal(${t.id})">
                    Responder
                </button>
            </div>
        </div>
    `).join('');
}

function initCategoryButtons() {
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-cat') || 'all';
            renderThreads(getForumThreads());
        });
    });
}

function createNewThread(event) {
    event.preventDefault();
    
    if (!currentUser) {
        openModal('login-modal');
        showToast('Debes iniciar sesión para publicar un hilo en el foro.', 'warning');
        return;
    }

    const titleInput = document.getElementById('thread-title-input');
    const categorySelect = document.getElementById('thread-category-select');
    const contentInput = document.getElementById('thread-content-input');

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        showToast('Por favor completa todos los campos requeridos.', 'error');
        return;
    }

    const categoryNames = {
        perdidos: "🚨 Mascotas Perdidas",
        salud: "🩺 Consultas Médicas",
        ayuda: "🆘 Pedidos de Ayuda",
        general: "💬 General"
    };

    const newThread = {
        id: Date.now(),
        category: categorySelect.value,
        categoryName: categoryNames[categorySelect.value] || "💬 General",
        title: titleInput.value.trim(),
        author: currentUser.name,
        time: "Reciente",
        content: contentInput.value.trim(),
        likes: 1,
        repliesCount: 0,
        replies: []
    };

    const threads = getForumThreads();
    threads.unshift(newThread);
    saveForumThreads(threads);

    titleInput.value = '';
    contentInput.value = '';

    closeModal('new-thread-modal');
    renderThreads(threads);
    showToast('¡Hilo publicado correctamente en el foro!', 'success');
}

function likeThread(threadId) {
    const threads = getForumThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        thread.likes += 1;
        saveForumThreads(threads);
        renderThreads(threads);
        showToast('¡Te ha gustado esta publicación!', 'success');
    }
}

function openReplyModal(threadId) {
    if (!currentUser) {
        openModal('login-modal');
        showToast('Inicia sesión para responder en el foro.', 'warning');
        return;
    }

    const thread = getForumThreads().find(t => t.id === threadId);
    if (!thread) return;

    document.getElementById('reply-thread-id').value = threadId;
    document.getElementById('reply-thread-title-preview').innerText = `Respondiendo a: "${thread.title}"`;
    openModal('reply-modal');
}

function submitReply(event) {
    event.preventDefault();
    const threadId = parseInt(document.getElementById('reply-thread-id').value);
    const replyText = document.getElementById('reply-content-input').value.trim();

    if (!replyText) {
        showToast('Por favor escribe tu respuesta.', 'error');
        return;
    }

    const threads = getForumThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
        if (!thread.replies) thread.replies = [];
        thread.replies.push({
            author: currentUser ? currentUser.name : 'Vecino/a',
            time: 'Hace un instante',
            text: replyText
        });
        saveForumThreads(threads);
        document.getElementById('reply-content-input').value = '';
        closeModal('reply-modal');
        renderThreads(threads);
        showToast('¡Respuesta publicada con éxito!', 'success');
    }
}
