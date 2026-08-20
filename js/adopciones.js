/* ==========================================================================
   RESERVA CANINA GÁLVEZ - ADOPCIONES CATALOG & FIRESTORE LOGIC
   ========================================================================== */

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
window.escapeHTML = escapeHTML;

const INITIAL_DOGS = [
    {
        id: "dog_1",
        name: "Leopoldo",
        genderSymbol: "♂",
        genderType: "macho",
        age: "Adulto (3 años)",
        size: "Mediano / Grande",
        status: "Urgente",
        image: "assets/img/Animales de la reserva real/Leopoldo1.jpg",
        images: [
            "assets/img/Animales de la reserva real/Leopoldo1.jpg",
            "assets/img/Animales de la reserva real/Leopoldo2.jpg",
            "assets/img/Animales de la reserva real/Leopoldo3.jpg",
            "assets/img/Animales de la reserva real/Leopoldo4.jpg",
            "assets/img/Animales de la reserva real/Leopoldo5.jpg"
        ],
        description: "Leopoldo es un perro noble, cariñoso y de mirada extremadamente tierna. Le encanta salir a pasear y acompañar.",
        health: "Vacunado, Castrado y Desparasitado",
        story: "Rescatado por los voluntarios en Gálvez. Tras recuperarse en la Reserva, demostró ser un compañero de vida ejemplar que sueña con una familia amorosa."
    },
    {
        id: "dog_2",
        name: "Lupin",
        genderSymbol: "♂",
        genderType: "macho",
        age: "Joven (1.5 años)",
        size: "Mediano",
        status: "Disponible",
        image: "assets/img/Animales de la reserva real/Lupin.jpg",
        images: [
            "assets/img/Animales de la reserva real/Lupin.jpg"
        ],
        description: "Lupin es súper sociable, curioso y juguetón. Se lleva excelente con otros animales.",
        health: "Vacunado, Castrado y Desparasitado",
        story: "Fue encontrado buscando refugio en un barrio de Gálvez. Hoy está sano, fuerte y ansioso por formar parte de un hogar definitivo."
    },
    {
        id: "dog_3",
        name: "Pumba",
        genderSymbol: "♂",
        genderType: "macho",
        age: "Adulto (4 años)",
        size: "Pequeño / Mediano",
        status: "Disponible",
        image: "assets/img/Animales de la reserva real/Pumba1.jpg",
        images: [
            "assets/img/Animales de la reserva real/Pumba1.jpg",
            "assets/img/Animales de la reserva real/Pumba2.jpg",
            "assets/img/Animales de la reserva real/Pumba3.jpg"
        ],
        description: "Pumba es pura simpatía, ternura y buen carácter. De tamaño práctico y muy dulce.",
        health: "Vacunado, Castrado, Controles al día",
        story: "Rescatado hace un tiempo, Pumba es de los mimados del refugio por su andar compasivo y su mirada dulce."
    },
    {
        id: "dog_4",
        name: "Wilson",
        genderSymbol: "♂",
        genderType: "macho",
        age: "Adulto (5 años)",
        size: "Grande",
        status: "Disponible",
        image: "assets/img/Animales de la reserva real/Wilson1.jpg",
        images: [
            "assets/img/Animales de la reserva real/Wilson1.jpg",
            "assets/img/Animales de la reserva real/Wilson2.jpg"
        ],
        description: "Wilson es un gigante bonachón, guardián leal y de temple sereno.",
        health: "Vacunado, Castrado y Desparasitado",
        story: "Wilson fue rescatado tras pasar necesidades en la vía pública. Se recuperó maravillosamente y busca su familia definitiva."
    }
];

let allDogsList = [];

document.addEventListener('DOMContentLoaded', () => {
    initAdoptions();
});

function initAdoptions() {
    setupAdoptionsListener();
    initDogFilters();
}

function setupAdoptionsListener() {
    const grid = document.getElementById('dogs-grid');
    if (grid && typeof getPawLoaderHTML === 'function') {
        grid.innerHTML = getPawLoaderHTML('Buscando perritos en la Reserva...');
    }

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('adoptions').onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                list.push({
                    id: doc.id,
                    ...data,
                    images: (data.images && data.images.length > 0) ? data.images : [data.image || 'assets/img/cropped_circle_image.png']
                });
            });
            if (list.length === 0) {
                seedInitialDogs();
            } else {
                allDogsList = list;
                renderDogsCatalog(allDogsList);
            }
        }, (err) => {
            console.warn("Error en Firestore adoptions. Usando almacenamiento local.", err);
            allDogsList = getLocalDogs();
            renderDogsCatalog(allDogsList);
        });
    } else {
        allDogsList = getLocalDogs();
        renderDogsCatalog(allDogsList);
    }
}

function seedInitialDogs() {
    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        const batch = db.batch();
        INITIAL_DOGS.forEach(dog => {
            const ref = db.collection('adoptions').doc(dog.id);
            batch.set(ref, dog);
        });
        batch.commit().catch(e => console.warn("Seed dogs error:", e));
    }
    allDogsList = INITIAL_DOGS;
    saveLocalDogs(INITIAL_DOGS);
    renderDogsCatalog(INITIAL_DOGS);
}

function getLocalDogs() {
    const saved = localStorage.getItem('reserva_adoptions_dogs');
    if (!saved) return INITIAL_DOGS;
    try {
        const list = JSON.parse(saved);
        return (list && list.length > 0) ? list : INITIAL_DOGS;
    } catch(e) { return INITIAL_DOGS; }
}

function saveLocalDogs(dogs) {
    localStorage.setItem('reserva_adoptions_dogs', JSON.stringify(dogs));
    if (!isFirebaseConfigured) {
        renderDogsCatalog(dogs);
    }
}

function renderDogsCatalog(dogs) {
    const grid = document.getElementById('dogs-grid');
    const adminHeaderBtnContainer = document.getElementById('admin-adoptions-header-actions');

    if (adminHeaderBtnContainer) {
        if (currentUser && currentUser.isAdmin) {
            adminHeaderBtnContainer.innerHTML = `
                <button class="btn btn-primary" onclick="openDogEditModal()" style="background: #2e7d32; border-color: #2e7d32;">
                    <i class="fas fa-plus-circle"></i> + Agregar Mascota en Adopción
                </button>
            `;
        } else {
            adminHeaderBtnContainer.innerHTML = '';
        }
    }

    if (!grid) return;

    if (dogs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
                <i class="fas fa-paw" style="font-size: 3rem; color: var(--text-light); margin-bottom: 15px;"></i>
                <h3>No se encontraron perritos con esos filtros</h3>
                <p style="color: var(--text-muted);">Prueba cambiando las opciones de búsqueda.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = dogs.map(dog => {
        const isAdmin = currentUser && currentUser.isAdmin;
        const mainImage = dog.image || (dog.images && dog.images[0]) || 'assets/img/cropped_circle_image.png';
        const photoCount = dog.images ? dog.images.length : 1;

        return `
            <div class="dog-card">
                <div class="dog-card-img-wrapper">
                    <img src="${mainImage}" alt="${escapeHTML(dog.name)}" class="dog-card-img">
                    <span class="badge ${dog.status === 'Urgente' ? 'badge-urgent' : 'badge-primary'} dog-status-tag">
                        ${escapeHTML(dog.status || 'Disponible')}
                    </span>
                    ${photoCount > 1 ? `
                        <span class="badge badge-secondary" style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.65); color: #fff; border: none; font-size: 0.75rem;">
                            <i class="fas fa-camera"></i> ${photoCount} fotos
                        </span>
                    ` : ''}
                    ${isAdmin ? `
                        <div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px;">
                            <button onclick="openDogEditModal('${dog.id}')" class="btn btn-sm btn-light" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(255,255,255,0.9);" title="Editar">
                                <i class="fas fa-edit" style="color: #2e7d32;"></i>
                            </button>
                            <button onclick="deleteDog('${dog.id}')" class="btn btn-sm btn-light" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(255,255,255,0.9);" title="Eliminar">
                                <i class="fas fa-trash-alt" style="color: #c62828;"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="dog-card-body">
                    <div class="dog-card-header">
                        <h3 class="dog-name">${escapeHTML(dog.name)}</h3>
                        <span class="dog-gender-symbol"><b>${dog.genderSymbol || '♂'}</b></span>
                    </div>
                    <div class="dog-tags">
                        <span class="dog-tag-item"><i class="fas fa-ruler-vertical"></i> ${escapeHTML(dog.size)}</span>
                        <span class="dog-tag-item"><i class="fas fa-birthday-cake"></i> ${escapeHTML(dog.age)}</span>
                    </div>
                    <p class="dog-description">${escapeHTML(dog.description)}</p>
                    <button class="btn btn-primary btn-sm" onclick="openDogDetailModal('${dog.id}')" style="width: 100%;">
                        <i class="fas fa-heart"></i> Conocer a ${escapeHTML(dog.name)}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function initDogFilters() {
    const sizeFilter = document.getElementById('filter-size');
    const ageFilter = document.getElementById('filter-age');
    const genderFilter = document.getElementById('filter-gender');

    const applyFilters = () => {
        const sizeVal = sizeFilter ? sizeFilter.value : 'all';
        const ageVal = ageFilter ? ageFilter.value : 'all';
        const genderVal = genderFilter ? genderFilter.value : 'all';

        const filtered = allDogsList.filter(dog => {
            const matchesSize = sizeVal === 'all' || (dog.size && dog.size.toLowerCase().includes(sizeVal.toLowerCase()));
            const matchesAge = ageVal === 'all' || (dog.age && dog.age.toLowerCase().includes(ageVal.toLowerCase()));
            const matchesGender = genderVal === 'all' || dog.genderType === genderVal;
            return matchesSize && matchesAge && matchesGender;
        });

        renderDogsCatalog(filtered);
    };

    if (sizeFilter) sizeFilter.addEventListener('change', applyFilters);
    if (ageFilter) ageFilter.addEventListener('change', applyFilters);
    if (genderFilter) genderFilter.addEventListener('change', applyFilters);
}

function openDogDetailModal(id) {
    const dog = allDogsList.find(d => String(d.id) === String(id));
    if (!dog) return;

    const modalBody = document.getElementById('dog-modal-content');
    if (!modalBody) return;

    const imagesList = dog.images && dog.images.length > 0 ? dog.images : [dog.image || 'assets/img/cropped_circle_image.png'];

    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <img id="modal-main-dog-img" src="${imagesList[0]}" alt="${escapeHTML(dog.name)}" style="width: 100%; height: 280px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                ${imagesList.length > 1 ? `
                    <div style="display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 5px;">
                        ${imagesList.map((imgSrc, idx) => `
                            <img src="${imgSrc}" alt="${escapeHTML(dog.name)} foto ${idx + 1}" 
                                onclick="changeModalDogImage('${imgSrc}')" 
                                class="modal-thumb-img" 
                                style="width: 65px; height: 65px; object-fit: cover; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--primary)' : 'var(--border-color)'}; flex-shrink: 0;">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2>${escapeHTML(dog.name)}</h2>
                    <span class="dog-gender-symbol"><b>${dog.genderSymbol || '♂'}</b></span>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 15px;"><strong>Tamaño:</strong> ${escapeHTML(dog.size)} | <strong>Edad:</strong> ${escapeHTML(dog.age)}</p>
                <h4 style="margin-bottom: 6px; color: var(--primary);"><i class="fas fa-heartbeat"></i> Estado de Salud:</h4>
                <p style="margin-bottom: 15px;">${escapeHTML(dog.health || 'Vacunado/a, castrado/a y desparasitado/a')}</p>
                <h4 style="margin-bottom: 6px; color: var(--primary);"><i class="fas fa-book-open"></i> Su Historia:</h4>
                <p style="margin-bottom: 20px; color: var(--text-muted);">${escapeHTML(dog.story || dog.description)}</p>
                <button class="btn btn-secondary" onclick="sendAdoptionRequest('${escapeHTML(dog.name)}')" style="width: 100%;">
                    <i class="fab fa-whatsapp"></i> Solicitar Adopción de ${escapeHTML(dog.name)} vía WhatsApp
                </button>
            </div>
        </div>
    `;

    openModal('dog-detail-modal');
}

function changeModalDogImage(src) {
    const mainImg = document.getElementById('modal-main-dog-img');
    if (mainImg) mainImg.src = src;

    document.querySelectorAll('.modal-thumb-img').forEach(thumb => {
        if (thumb.getAttribute('src') === src) {
            thumb.style.borderColor = 'var(--primary)';
        } else {
            thumb.style.borderColor = 'var(--border-color)';
        }
    });
}

function sendAdoptionRequest(dogName) {
    const message = encodeURIComponent(`¡Hola! Quisiera recibir información y hacer la postulación para adoptar a ${dogName} de la Reserva Canina Gálvez.`);
    const whatsappNum = "5493404000000"; 
    window.open(`https://wa.me/${whatsappNum}?text=${message}`, '_blank');
}

// Admin Modal: Create / Edit Dog
function openDogEditModal(dogId = null) {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acceso denegado. Solo administradores pueden agregar mascotas.', 'error');
        return;
    }

    const modalTitle = document.getElementById('dog-edit-modal-title');
    const inputId = document.getElementById('dog-edit-id');
    const inputName = document.getElementById('dog-edit-name');
    const inputAge = document.getElementById('dog-edit-age');
    const selectSize = document.getElementById('dog-edit-size');
    const selectGender = document.getElementById('dog-edit-gender');
    const selectStatus = document.getElementById('dog-edit-status');
    const inputHealth = document.getElementById('dog-edit-health');
    const inputStory = document.getElementById('dog-edit-story');
    const inputDesc = document.getElementById('dog-edit-desc');
    const inputImgUrl = document.getElementById('dog-edit-image-url');

    if (dogId) {
        const dog = allDogsList.find(d => String(d.id) === String(dogId));
        if (dog) {
            if (modalTitle) modalTitle.innerText = `Editar Ficha de ${dog.name}`;
            if (inputId) inputId.value = dog.id;
            if (inputName) inputName.value = dog.name || '';
            if (inputAge) inputAge.value = dog.age || '';
            if (selectSize) selectSize.value = dog.size || 'Mediano';
            if (selectGender) selectGender.value = dog.genderType || 'macho';
            if (selectStatus) selectStatus.value = dog.status || 'Disponible';
            if (inputHealth) inputHealth.value = dog.health || '';
            if (inputStory) inputStory.value = dog.story || '';
            if (inputDesc) inputDesc.value = dog.description || '';
            if (inputImgUrl) inputImgUrl.value = dog.image || '';
        }
    } else {
        if (modalTitle) modalTitle.innerText = "Agregar Nueva Mascota en Adopción";
        if (inputId) inputId.value = "";
        if (inputName) inputName.value = "";
        if (inputAge) inputAge.value = "";
        if (inputHealth) inputHealth.value = "Vacunado/a, castrado/a y desparasitado/a";
        if (inputStory) inputStory.value = "";
        if (inputDesc) inputDesc.value = "";
        if (inputImgUrl) inputImgUrl.value = "";
    }

    openModal('dog-edit-modal');
}

async function handleDogFormSubmit(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) return;

    const dogId = document.getElementById('dog-edit-id').value;
    const name = document.getElementById('dog-edit-name').value.trim();
    const age = document.getElementById('dog-edit-age').value.trim();
    const size = document.getElementById('dog-edit-size').value;
    const genderType = document.getElementById('dog-edit-gender').value;
    const status = document.getElementById('dog-edit-status').value;
    const health = document.getElementById('dog-edit-health').value.trim();
    const story = document.getElementById('dog-edit-story').value.trim();
    const description = document.getElementById('dog-edit-desc').value.trim();
    let imageUrl = document.getElementById('dog-edit-image-url').value.trim();

    const fileInput = document.getElementById('dog-edit-file-input');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    if (file) {
        if (window.showUploadProgress) {
            window.showUploadProgress('Subiendo Foto a la Nube', `Subiendo foto de ${name} a Cloudinary...`, 30);
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
                    window.showUploadProgress('Guardando en Firestore', 'Sincronizando datos de la mascota...', 70);
                }
            } else {
                throw new Error(data.error ? data.error.message : 'Error al subir foto a Cloudinary');
            }
        } catch(err) {
            if (window.hideUploadProgress) window.hideUploadProgress();
            showToast(`Error al subir imagen: ${err.message}`, 'error');
            return;
        }
    } else {
        if (window.showUploadProgress) {
            window.showUploadProgress('Guardando Ficha', 'Guardando cambios de la mascota...', 60);
        }
    }

    const existingDog = allDogsList.find(d => String(d.id) === String(dogId));
    let imagesList = (existingDog && existingDog.images) ? [...existingDog.images] : [];
    if (imageUrl) {
        if (!imagesList.includes(imageUrl)) {
            imagesList.unshift(imageUrl);
        }
    }
    if (imagesList.length === 0) {
        imagesList = ['assets/img/cropped_circle_image.png'];
    }

    const dogData = {
        id: dogId || "dog_" + Date.now(),
        name,
        age,
        size,
        genderType,
        genderSymbol: genderType === 'macho' ? '♂' : '♀',
        status,
        health,
        story,
        description,
        image: imageUrl || imagesList[0],
        images: imagesList
    };

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('adoptions').doc(dogData.id).set(dogData).then(() => {
            if (window.showUploadProgress) {
                window.showUploadProgress('Finalizado', '¡Mascota guardada con éxito!', 100);
                setTimeout(window.hideUploadProgress, 600);
            }
            closeModal('dog-edit-modal');
            showToast('¡Ficha de mascota guardada en la nube!', 'success');
        }).catch(err => {
            if (window.hideUploadProgress) window.hideUploadProgress();
            showToast(`Error al guardar en Firestore: ${err.message}`, 'error');
        });
    } else {
        const idx = allDogsList.findIndex(d => String(d.id) === String(dogData.id));
        if (idx > -1) {
            allDogsList[idx] = dogData;
        } else {
            allDogsList.unshift(dogData);
        }
        saveLocalDogs(allDogsList);
        if (window.showUploadProgress) {
            window.showUploadProgress('Finalizado', '¡Mascota guardada localmente!', 100);
            setTimeout(window.hideUploadProgress, 600);
        }
        closeModal('dog-edit-modal');
        showToast('¡Ficha de mascota guardada!', 'success');
    }
}

function deleteDog(dogId) {
    if (!currentUser || !currentUser.isAdmin) return;
    if (!confirm('¿Estás seguro/a de eliminar esta mascota del catálogo de adopciones?')) return;

    if (typeof firebase !== 'undefined' && isFirebaseConfigured && db) {
        db.collection('adoptions').doc(String(dogId)).delete().then(() => {
            showToast('Mascota eliminada de Firestore.', 'info');
        }).catch(err => showToast(`Error: ${err.message}`, 'error'));
    } else {
        allDogsList = allDogsList.filter(d => String(d.id) !== String(dogId));
        saveLocalDogs(allDogsList);
        showToast('Mascota eliminada.', 'info');
    }
}
