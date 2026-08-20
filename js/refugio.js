/* ==========================================================================
   RESERVA CANINA GÁLVEZ - REFUGIO: URGENT NEEDS & FUNDRAISING GOALS
   ========================================================================== */

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
window.escapeHTML = escapeHTML;

const INITIAL_REFUGIO_NEEDS = [
    { id: "need_1", title: "Alimento Balanceado Adulto (Bolsas 15kg/20kg)", urgency: "Alta", icon: "fa-bone" },
    { id: "need_2", title: "Gasas estériles, vendas y Pervinox para curaciones", urgency: "Urgente", icon: "fa-band-aid" },
    { id: "need_3", title: "Mantas, abrigos y colchones en buen estado", urgency: "Alta", icon: "fa-blanket" },
    { id: "need_4", title: "Pipetas antipulgas y garrapaticidas para medianos/grandes", urgency: "Media", icon: "fa-capsules" }
];

const INITIAL_REFUGIO_GOALS = [
    {
        id: "goal_1",
        title: "Ampliación de Caniles y Techados de Protección",
        category: "Obras e Infraestructura",
        description: "Construcción de 3 caniles comunitarios reforzados con chapa y aislante para proteger a los perritos rescatados durante el invierno y tormentas.",
        targetAmount: 650000,
        currentAmount: 420000,
        image: "assets/img/Animales de la reserva real/Wilson1.jpg",
        status: "active"
    },
    {
        id: "goal_2",
        title: "Campaña de Vacunación Anual y Desparasitación 2026",
        category: "Salud Veterinaria",
        description: "Fondo dedicado a cubrir las dosis sextuples, antirrábicas y desparasitaciones periódicas para los 80+ animales del refugio.",
        targetAmount: 380000,
        currentAmount: 290000,
        image: "assets/img/Animales de la reserva real/Leopoldo1.jpg",
        status: "active"
    }
];

let refugioNeedsList = [];
let refugioGoalsList = [];

document.addEventListener('DOMContentLoaded', () => {
    initRefugioSection();
});

function initRefugioSection() {
    setupRefugioListeners();
    setupGoalDonationsListener();
}

function setupRefugioListeners() {
    const needsContainer = document.getElementById('refugio-needs-container');
    const goalsContainer = document.getElementById('refugio-goals-container');
    if (needsContainer && typeof getPawLoaderHTML === 'function') {
        needsContainer.innerHTML = getPawLoaderHTML('Cargando necesidades de hoy...');
    }
    if (goalsContainer && typeof getPawLoaderHTML === 'function') {
        goalsContainer.innerHTML = getPawLoaderHTML('Cargando metas y proyectos del refugio...');
    }

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        // Needs Listener
        db.collection('refugio_needs').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (list.length === 0) {
                refugioNeedsList = INITIAL_REFUGIO_NEEDS;
                renderRefugioNeeds(refugioNeedsList);
                if (currentUser && currentUser.isAdmin) seedInitialNeeds();
            } else {
                refugioNeedsList = list;
                renderRefugioNeeds(refugioNeedsList);
            }
        }, (err) => {
            console.warn("Firestore needs listener error. Local fallback:", err);
            refugioNeedsList = getLocalNeeds();
            renderRefugioNeeds(refugioNeedsList);
        });

        // Goals Listener
        db.collection('refugio_goals').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (list.length === 0) {
                refugioGoalsList = INITIAL_REFUGIO_GOALS;
                renderRefugioGoals(refugioGoalsList);
                if (currentUser && currentUser.isAdmin) seedInitialGoals();
            } else {
                refugioGoalsList = list;
                renderRefugioGoals(refugioGoalsList);
            }
        }, (err) => {
            console.warn("Firestore goals listener error. Local fallback:", err);
            refugioGoalsList = getLocalGoals();
            renderRefugioGoals(refugioGoalsList);
        });
    } else {
        refugioNeedsList = getLocalNeeds();
        renderRefugioNeeds(refugioNeedsList);
        refugioGoalsList = getLocalGoals();
        renderRefugioGoals(refugioGoalsList);
    }
}

function seedInitialNeeds() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        const batch = db.batch();
        INITIAL_REFUGIO_NEEDS.forEach(item => {
            batch.set(db.collection('refugio_needs').doc(item.id), item);
        });
        batch.commit().catch(e => console.warn("Seed needs error:", e));
    }
    refugioNeedsList = INITIAL_REFUGIO_NEEDS;
    saveLocalNeeds(INITIAL_REFUGIO_NEEDS);
    renderRefugioNeeds(INITIAL_REFUGIO_NEEDS);
}

function seedInitialGoals() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        const batch = db.batch();
        INITIAL_REFUGIO_GOALS.forEach(goal => {
            batch.set(db.collection('refugio_goals').doc(goal.id), goal);
        });
        batch.commit().catch(e => console.warn("Seed goals error:", e));
    }
    refugioGoalsList = INITIAL_REFUGIO_GOALS;
    saveLocalGoals(INITIAL_REFUGIO_GOALS);
    renderRefugioGoals(INITIAL_REFUGIO_GOALS);
}

function getLocalNeeds() {
    const saved = localStorage.getItem('reserva_refugio_needs');
    if (!saved) return INITIAL_REFUGIO_NEEDS;
    try { return JSON.parse(saved); } catch(e) { return INITIAL_REFUGIO_NEEDS; }
}

function saveLocalNeeds(list) {
    localStorage.setItem('reserva_refugio_needs', JSON.stringify(list));
    if (!isFirebaseConfigured) renderRefugioNeeds(list);
}

function getLocalGoals() {
    const saved = localStorage.getItem('reserva_refugio_goals');
    if (!saved) return INITIAL_REFUGIO_GOALS;
    try { return JSON.parse(saved); } catch(e) { return INITIAL_REFUGIO_GOALS; }
}

function saveLocalGoals(list) {
    localStorage.setItem('reserva_refugio_goals', JSON.stringify(list));
    if (!isFirebaseConfigured) renderRefugioGoals(list);
}

// Render Needs Today
function renderRefugioNeeds(needs) {
    const container = document.getElementById('refugio-needs-container');
    const adminActionContainer = document.getElementById('admin-needs-action-container');

    if (adminActionContainer) {
        if (currentUser && currentUser.isAdmin) {
            adminActionContainer.innerHTML = `
                <button class="btn btn-sm btn-primary" onclick="openNeedEditModal()" style="background:#2e7d32; border-color:#2e7d32;">
                    <i class="fas fa-plus"></i> + Agregar Necesidad URGENTE de Hoy
                </button>
            `;
        } else {
            adminActionContainer.innerHTML = '';
        }
    }

    if (!container) return;

    if (needs.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 25px; color: var(--text-muted);">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #2e7d32; margin-bottom: 8px;"></i>
                <p>¡Por el momento no hay insumos críticos registrados!</p>
            </div>
        `;
        return;
    }

    const isAdmin = currentUser && currentUser.isAdmin;

    container.innerHTML = needs.map(item => `
        <div style="background: var(--bg-card); border-left: 4px solid ${item.urgency === 'Urgente' ? '#c62828' : '#f59e0b'}; border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${item.icon || 'fa-box-open'}" style="font-size: 1.3rem; color: ${item.urgency === 'Urgente' ? '#c62828' : 'var(--primary)'};"></i>
                <div>
                    <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${escapeHTML(item.title)}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-light); font-weight: 600;">
                        Nivel de Urgencia: <span style="color: ${item.urgency === 'Urgente' ? '#c62828' : '#f59e0b'}; font-weight: 700;">${escapeHTML(item.urgency || 'Alta')}</span>
                    </span>
                </div>
            </div>
            ${isAdmin ? `
                <button onclick="deleteNeed('${item.id}')" class="btn btn-sm btn-outline" style="color: #c62828; border-color: #ef9a9a; padding: 4px 8px;" title="Eliminar Necesidad">
                    <i class="fas fa-trash-alt"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
}

// Render Goals / Metas de Recaudación
function renderRefugioGoals(goals) {
    const container = document.getElementById('refugio-goals-container');
    const adminActionContainer = document.getElementById('admin-goals-action-container');

    if (adminActionContainer) {
        if (currentUser && currentUser.isAdmin) {
            adminActionContainer.innerHTML = `
                <button class="btn btn-primary" onclick="openGoalEditModal()" style="background:#2e7d32; border-color:#2e7d32;">
                    <i class="fas fa-bullseye"></i> + Crear Nueva Meta u Objetivo del Refugio
                </button>
            `;
        } else {
            adminActionContainer.innerHTML = '';
        }
    }

    if (!container) return;

    if (goals.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 40px 20px;">
                <i class="fas fa-flag-checkered" style="font-size: 2.5rem; color: var(--text-light); margin-bottom: 12px;"></i>
                <h3>No hay metas de objetivo activas por el momento</h3>
            </div>
        `;
        return;
    }

    const isAdmin = currentUser && currentUser.isAdmin;

    container.innerHTML = goals.map(goal => {
        const target = Number(goal.targetAmount) || 1;
        const current = Number(goal.currentAmount) || 0;
        const pct = Math.min(100, Math.round((current / target) * 100));

        return `
            <div class="goal-card" style="background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column;">
                ${goal.image ? `
                    <div style="height: 180px; width: 100%; overflow: hidden; position: relative;">
                        <img src="${goal.image}" alt="${escapeHTML(goal.title)}" style="width: 100%; height: 100%; object-fit: cover;">
                        <span class="badge badge-primary" style="position: absolute; top: 12px; left: 12px;">${escapeHTML(goal.category || 'Objetivo Refugio')}</span>
                    </div>
                ` : ''}
                
                <div style="padding: 20px; display: flex; flex-direction: column; flex: 1;">
                    <h3 style="font-size: 1.15rem; color: var(--text-main); margin-bottom: 8px;">${escapeHTML(goal.title)}</h3>
                    <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 15px; flex: 1;">${escapeHTML(goal.description)}</p>

                    <!-- Progress Bar -->
                    <div style="background: var(--bg-body); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
                            <span>Recaudado: $${current.toLocaleString('es-AR')}</span>
                            <span style="color: var(--primary); font-weight: 800;">${pct}%</span>
                        </div>
                        <div style="background: #e2e8f0; border-radius: 999px; height: 10px; overflow: hidden; margin-bottom: 6px;">
                            <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 999px;"></div>
                        </div>
                        <div style="text-align: right; font-size: 0.78rem; color: var(--text-light); font-weight: 600;">
                            Meta Total: $${target.toLocaleString('es-AR')} ARS
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <a href="donaciones.html" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center; font-size: 0.85rem;">
                            <i class="fas fa-heart"></i> Colaborar con esta Meta
                        </a>
                        ${isAdmin ? `
                            <button onclick="openGoalAmountUpdateModal('${goal.id}')" class="btn btn-sm btn-primary" style="background:#2e7d32; font-size:0.8rem;" title="Actualizar Recaudado">
                                <i class="fas fa-dollar-sign"></i> Recaudado
                            </button>
                            <button onclick="openGoalEditModal('${goal.id}')" class="btn btn-sm btn-outline" style="font-size:0.8rem;" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteGoal('${goal.id}')" class="btn btn-sm btn-outline" style="color:#c62828; border-color:#ef9a9a; font-size:0.8rem;" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Admin Need Create Modal
function openNeedEditModal() {
    if (!currentUser || !currentUser.isAdmin) return;
    const title = prompt("Ingresá el insumo o necesidad URGENTE de hoy:");
    if (!title || !title.trim()) return;
    const urgency = prompt("Nivel de urgencia (Urgente / Alta / Media):", "Urgente") || "Urgente";

    const item = {
        id: "need_" + Date.now(),
        title: title.trim(),
        urgency: urgency.trim(),
        icon: urgency.toLowerCase().includes('urgente') ? 'fa-exclamation-triangle' : 'fa-box-open'
    };

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_needs').doc(item.id).set(item).then(() => {
            showToast('¡Necesidad agregada a Firestore!', 'success');
        });
    } else {
        refugioNeedsList.unshift(item);
        saveLocalNeeds(refugioNeedsList);
        showToast('Necesidad agregada.', 'success');
    }
}

function deleteNeed(id) {
    if (!currentUser || !currentUser.isAdmin) return;
    if (!confirm('¿Eliminar esta necesidad de la lista?')) return;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_needs').doc(String(id)).delete().then(() => {
            showToast('Necesidad eliminada.', 'info');
        });
    } else {
        refugioNeedsList = refugioNeedsList.filter(n => String(n.id) !== String(id));
        saveLocalNeeds(refugioNeedsList);
        showToast('Necesidad eliminada.', 'info');
    }
}

// Admin Goal Create / Edit Modal
function openGoalEditModal(goalId = null) {
    if (!currentUser || !currentUser.isAdmin) return;

    const modalTitle = document.getElementById('goal-edit-modal-title');
    const inputId = document.getElementById('goal-edit-id');
    const inputTitle = document.getElementById('goal-edit-title');
    const inputCategory = document.getElementById('goal-edit-category');
    const inputTarget = document.getElementById('goal-edit-target');
    const inputCurrent = document.getElementById('goal-edit-current');
    const inputDesc = document.getElementById('goal-edit-desc');
    const inputImgUrl = document.getElementById('goal-edit-image-url');

    if (goalId) {
        const goal = refugioGoalsList.find(g => String(g.id) === String(goalId));
        if (goal) {
            if (modalTitle) modalTitle.innerText = `Editar Meta: ${goal.title}`;
            if (inputId) inputId.value = goal.id;
            if (inputTitle) inputTitle.value = goal.title || '';
            if (inputCategory) inputCategory.value = goal.category || '';
            if (inputTarget) inputTarget.value = goal.targetAmount || 100000;
            if (inputCurrent) inputCurrent.value = goal.currentAmount || 0;
            if (inputDesc) inputDesc.value = goal.description || '';
            if (inputImgUrl) inputImgUrl.value = goal.image || '';
        }
    } else {
        if (modalTitle) modalTitle.innerText = "Crear Nueva Meta u Objetivo del Refugio";
        if (inputId) inputId.value = "";
        if (inputTitle) inputTitle.value = "";
        if (inputCategory) inputCategory.value = "Obras e Infraestructura";
        if (inputTarget) inputTarget.value = 500000;
        if (inputCurrent) inputCurrent.value = 0;
        if (inputDesc) inputDesc.value = "";
        if (inputImgUrl) inputImgUrl.value = "";
    }

    openModal('goal-edit-modal');
}

async function handleGoalFormSubmit(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) return;

    const goalId = document.getElementById('goal-edit-id').value;
    const title = document.getElementById('goal-edit-title').value.trim();
    const category = document.getElementById('goal-edit-category').value.trim();
    const targetAmount = Number(document.getElementById('goal-edit-target').value) || 0;
    const currentAmount = Number(document.getElementById('goal-edit-current').value) || 0;
    const description = document.getElementById('goal-edit-desc').value.trim();
    let imageUrl = document.getElementById('goal-edit-image-url').value.trim();

    const fileInput = document.getElementById('goal-edit-file-input');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (file) {
        if (window.showUploadProgress) {
            window.showUploadProgress('Subiendo Imagen de la Meta', `Subiendo imagen de "${title}" a Cloudinary...`, 35);
        }
        try {
            const cloudName = (typeof CLOUDINARY_CONFIG !== 'undefined' && CLOUDINARY_CONFIG.cloudName) ? CLOUDINARY_CONFIG.cloudName : 'doissrwhj';
            const uploadPreset = (typeof CLOUDINARY_CONFIG !== 'undefined' && CLOUDINARY_CONFIG.uploadPreset) ? CLOUDINARY_CONFIG.uploadPreset : 'reserva_preset';

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                imageUrl = data.secure_url;
                if (window.showUploadProgress) {
                    window.showUploadProgress('Guardando Meta', 'Sincronizando con Firestore...', 75);
                }
            } else {
                throw new Error(data.error ? data.error.message : 'Error al subir foto');
            }
        } catch(err) {
            if (window.hideUploadProgress) window.hideUploadProgress();
            showToast(`Error de subida: ${err.message}`, 'error');
            return;
        }
    } else {
        if (window.showUploadProgress) {
            window.showUploadProgress('Guardando Meta', 'Guardando meta del refugio...', 60);
        }
    }

    const goalData = {
        id: goalId || "goal_" + Date.now(),
        title,
        category,
        targetAmount,
        currentAmount,
        description,
        image: imageUrl || '',
        status: 'active'
    };

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goals').doc(goalData.id).set(goalData).then(() => {
            if (window.showUploadProgress) {
                window.showUploadProgress('Finalizado', '¡Meta del refugio guardada con éxito!', 100);
                setTimeout(window.hideUploadProgress, 600);
            }
            closeModal('goal-edit-modal');
            showToast('¡Meta guardada en la nube!', 'success');
        }).catch(err => {
            if (window.hideUploadProgress) window.hideUploadProgress();
            showToast(`Error Firestore: ${err.message}`, 'error');
        });
    } else {
        const idx = refugioGoalsList.findIndex(g => String(g.id) === String(goalData.id));
        if (idx > -1) refugioGoalsList[idx] = goalData;
        else refugioGoalsList.unshift(goalData);

        saveLocalGoals(refugioGoalsList);
        if (window.showUploadProgress) {
            window.showUploadProgress('Finalizado', '¡Meta guardada localmente!', 100);
            setTimeout(window.hideUploadProgress, 600);
        }
        closeModal('goal-edit-modal');
        showToast('¡Meta guardada!', 'success');
    }
}

function openGoalAmountUpdateModal(goalId) {
    if (!currentUser || !currentUser.isAdmin) return;
    const goal = refugioGoalsList.find(g => String(g.id) === String(goalId));
    if (!goal) return;

    const newAmountStr = prompt(`Actualizar monto recaudado para "${goal.title}":\nMeta total: $${goal.targetAmount.toLocaleString('es-AR')}`, goal.currentAmount);
    if (newAmountStr === null) return;
    const newAmount = Number(newAmountStr);
    if (isNaN(newAmount)) {
        showToast('Monto inválido.', 'error');
        return;
    }

    goal.currentAmount = newAmount;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goals').doc(goal.id).update({
            currentAmount: newAmount
        }).then(() => {
            showToast('¡Monto recaudado actualizado!', 'success');
        });
    } else {
        saveLocalGoals(refugioGoalsList);
        showToast('¡Monto recaudado actualizado!', 'success');
    }
}

function deleteGoal(goalId) {
    if (!currentUser || !currentUser.isAdmin) return;
    if (!confirm('¿Estás seguro/a de eliminar esta meta del refugio?')) return;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goals').doc(String(goalId)).delete().then(() => {
            showToast('Meta eliminada.', 'info');
        });
    } else {
        refugioGoalsList = refugioGoalsList.filter(g => String(g.id) !== String(goalId));
        saveLocalGoals(refugioGoalsList);
        showToast('Meta eliminada.', 'info');
    }
}

/* ==========================================================================
   GOAL DONATION MODAL & FLOATING DONORS NETWORK
   ========================================================================== */
let goalDonationsList = [
    {
        id: "don_1",
        goalId: "goal_caniles",
        author: "Familia Pérez",
        authorPhoto: "assets/img/cropped_circle_image.png",
        authorUid: "sample_1",
        amount: 2500,
        comment: "¡Fuerza equipo con la construcción de los nuevos caniles!",
        createdAt: new Date().toISOString()
    },
    {
        id: "don_2",
        goalId: "goal_caniles",
        author: "María L.",
        authorPhoto: "assets/img/cropped_circle_image.png",
        authorUid: "sample_2",
        amount: 1000,
        comment: "¡Un granito de arena para los rescataditos de Gálvez!",
        createdAt: new Date().toISOString()
    }
];

function setupGoalDonationsListener() {
    renderPageFloatingDonors();
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goal_donations').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            if (list.length > 0) {
                goalDonationsList = list;
            }
            renderPageFloatingDonors();
            const activeModalGoalId = document.getElementById('donate-modal-goal-id')?.value;
            if (activeModalGoalId) {
                renderGoalFloatingDonors(activeModalGoalId);
            }
        });
    } else {
        renderPageFloatingDonors();
    }
}

function openGoalDonateModal(goalId) {
    const goal = refugioGoalsList.find(g => String(g.id) === String(goalId));
    if (!goal) return;

    const modalGoalId = document.getElementById('donate-modal-goal-id');
    const modalTitle = document.getElementById('donate-modal-goal-title');
    const modalCategory = document.getElementById('donate-modal-goal-category');
    const modalCurrent = document.getElementById('donate-modal-goal-current');
    const modalTarget = document.getElementById('donate-modal-goal-target');
    const modalBar = document.getElementById('donate-modal-goal-bar');
    const nameInput = document.getElementById('donate-name-input');

    if (modalGoalId) modalGoalId.value = goal.id;
    if (modalTitle) modalTitle.innerText = `Colaborar con: ${goal.title}`;
    if (modalCategory) modalCategory.innerText = goal.category || 'Objetivo Refugio';

    const target = Number(goal.targetAmount) || 1;
    const current = Number(goal.currentAmount) || 0;
    const pct = Math.min(100, Math.round((current / target) * 100));

    if (modalCurrent) modalCurrent.innerText = `$${current.toLocaleString('es-AR')} recaudados (${pct}%)`;
    if (modalTarget) modalTarget.innerText = `Objetivo: $${target.toLocaleString('es-AR')}`;
    if (modalBar) modalBar.style.width = `${pct}%`;

    if (nameInput) {
        if (currentUser && currentUser.name) {
            nameInput.value = currentUser.name;
        } else {
            nameInput.value = '';
        }
    }

    renderGoalFloatingDonors(goal.id);
    openModal('goal-donate-modal');
}
window.openGoalDonateModal = openGoalDonateModal;

function renderPageFloatingDonors() {
    const pageContainer = document.getElementById('page-floating-donors-container');
    if (!pageContainer) return;

    if (goalDonationsList.length === 0) {
        pageContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; z-index: 5;">
                <i class="fas fa-hand-holding-heart" style="font-size: 2rem; color: var(--primary); margin-bottom: 8px;"></i>
                <div>Sé el primero en colaborar con nuestras metas y dejar tu mensaje flotante de apoyo.</div>
            </div>
        `;
        return;
    }

    const positions = [
        { top: '12%', left: '4%' },
        { top: '15%', right: '4%' },
        { top: '55%', left: '6%' },
        { top: '58%', right: '6%' },
        { top: '35%', left: '28%' }
    ];

    pageContainer.innerHTML = goalDonationsList.map((d, index) => {
        const pos = positions[index % positions.length];
        const isAuthor = currentUser && (currentUser.uid === d.authorUid || currentUser.email === d.authorEmail);
        const isAdmin = currentUser && currentUser.isAdmin;
        const canDelete = isAuthor || isAdmin;
        const delay = (index * 0.5).toFixed(1);

        return `
            <div class="floating-donor-card" style="top: ${pos.top}; ${pos.left ? `left: ${pos.left}` : `right: ${pos.right}`}; animation-delay: ${delay}s;">
                <img src="${escapeHTML(d.authorPhoto || 'assets/img/cropped_circle_image.png')}" alt="${escapeHTML(d.author)}" class="floating-donor-avatar" onerror="this.src='assets/img/cropped_circle_image.png'">
                <div class="floating-donor-info">
                    <div class="floating-donor-name">
                        ${escapeHTML(d.author || 'Vecino/a')}
                        <span class="floating-donor-badge" style="font-size: 0.72rem; color: var(--primary); font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-heart" style="color: #e53935; font-size: 0.7rem;"></i> Donante</span>
                        ${canDelete ? `<i class="fas fa-trash" style="color: #c62828; cursor: pointer; margin-left: 6px; font-size: 0.75rem;" onclick="deleteGoalDonation('${d.id}', '${d.goalId}')" title="Eliminar mensaje"></i>` : ''}
                    </div>
                    ${d.comment ? `<div class="floating-donor-comment">"${escapeHTML(d.comment)}"</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderGoalFloatingDonors(goalId) {
    renderPageFloatingDonors();
    const container = document.getElementById('goal-floating-donors-container');
    if (!container) return;

    const goalDonations = goalDonationsList.filter(d => String(d.goalId) === String(goalId));

    if (goalDonations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; z-index: 5;">
                <i class="fas fa-hand-holding-heart" style="font-size: 2rem; color: var(--primary); margin-bottom: 8px;"></i>
                <div>Sé el primero en colaborar con esta meta y dejar tu mensaje flotante de apoyo.</div>
            </div>
        `;
        return;
    }

    const positions = [
        { top: '15%', left: '6%' },
        { top: '18%', right: '6%' },
        { top: '55%', left: '8%' },
        { top: '58%', right: '8%' },
        { top: '35%', left: '30%' }
    ];

    container.innerHTML = goalDonations.map((d, index) => {
        const pos = positions[index % positions.length];
        const isAuthor = currentUser && (currentUser.uid === d.authorUid || currentUser.email === d.authorEmail);
        const isAdmin = currentUser && currentUser.isAdmin;
        const canDelete = isAuthor || isAdmin;
        const delay = (index * 0.4).toFixed(1);

        return `
            <div class="floating-donor-card" style="top: ${pos.top}; ${pos.left ? `left: ${pos.left}` : `right: ${pos.right}`}; animation-delay: ${delay}s;">
                <img src="${escapeHTML(d.authorPhoto || 'assets/img/cropped_circle_image.png')}" alt="${escapeHTML(d.author)}" class="floating-donor-avatar" onerror="this.src='assets/img/cropped_circle_image.png'">
                <div class="floating-donor-info">
                    <div class="floating-donor-name">
                        ${escapeHTML(d.author || 'Vecino/a')}
                        <span class="floating-donor-badge" style="font-size: 0.72rem; color: var(--primary); font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><i class="fas fa-heart" style="color: #e53935; font-size: 0.7rem;"></i> Donante</span>
                        ${canDelete ? `<i class="fas fa-trash" style="color: #c62828; cursor: pointer; margin-left: 6px; font-size: 0.75rem;" onclick="deleteGoalDonation('${d.id}', '${d.goalId}')" title="Eliminar mensaje"></i>` : ''}
                    </div>
                    ${d.comment ? `<div class="floating-donor-comment">"${escapeHTML(d.comment)}"</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function handleGoalDonationSubmit(event) {
    event.preventDefault();
    const goalId = document.getElementById('donate-modal-goal-id').value;
    const amount = Number(document.getElementById('donate-amount-input').value) || 0;
    const name = document.getElementById('donate-name-input').value.trim() || (currentUser ? currentUser.name : 'Vecino/a Anónimo/a');
    const comment = document.getElementById('donate-comment-input').value.trim();

    if (amount <= 0) {
        showToast('Por favor ingresa un monto válido.', 'error');
        return;
    }

    const goal = refugioGoalsList.find(g => String(g.id) === String(goalId));
    if (!goal) return;

    goal.currentAmount = (Number(goal.currentAmount) || 0) + amount;

    const donationItem = {
        id: "don_" + Date.now(),
        goalId: goal.id,
        author: name,
        authorPhoto: currentUser ? currentUser.photoURL : 'assets/img/cropped_circle_image.png',
        authorUid: currentUser ? currentUser.uid : '',
        authorEmail: currentUser ? currentUser.email : '',
        amount,
        comment,
        createdAt: new Date().toISOString()
    };

    goalDonationsList.unshift(donationItem);

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goals').doc(goal.id).update({
            currentAmount: goal.currentAmount
        });
        db.collection('refugio_goal_donations').doc(donationItem.id).set(donationItem);
    } else {
        saveLocalGoals(refugioGoalsList);
    }

    renderRefugioGoals(refugioGoalsList);
    renderGoalFloatingDonors(goal.id);
    document.getElementById('donate-amount-input').value = '';
    document.getElementById('donate-comment-input').value = '';

    showToast(`🎉 ¡Muchas gracias por tu contribución de $${amount.toLocaleString('es-AR')} a la meta!`, 'success');
}
window.handleGoalDonationSubmit = handleGoalDonationSubmit;

function deleteGoalDonation(donationId, goalId) {
    if (!confirm('¿Deseas eliminar este comentario/aporte flotante?')) return;

    goalDonationsList = goalDonationsList.filter(d => String(d.id) !== String(donationId));

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('refugio_goal_donations').doc(String(donationId)).delete();
    }

    renderGoalFloatingDonors(goalId);
    showToast('Comentario eliminado.', 'info');
}
window.deleteGoalDonation = deleteGoalDonation;
