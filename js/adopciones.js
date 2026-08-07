/* ==========================================================================
   RESERVA CANINA GÁLVEZ - ADOPCIONES CATALOG & LOGIC
   ========================================================================== */

const DOGS_DATA = [
    {
        id: 1,
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
        description: "Leopoldo es un perro noble, cariñoso y de mirada extremadamente tierna. Le encanta salir a pasear, estar acompañado y dar afecto incondicional.",
        health: "Vacunado, Castrado y Desparasitado",
        goodWith: ["Niños", "Otros Perros"],
        story: "Rescatado por los voluntarios en Gálvez. Tras recuperarse en la Reserva, demostró ser un compañero de vida ejemplar que sueña con una familia amorosa."
    },
    {
        id: 2,
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
        description: "Lupin es súper sociable, curioso y juguetón. Se lleva excelente con otros animales y busca una familia activa que le brinde mucho amor.",
        health: "Vacunado, Castrado y Desparasitado",
        goodWith: ["Niños", "Otros Perros", "Familias"],
        story: "Fue encontrado buscando refugio en un barrio de Gálvez. Hoy está sano, fuerte y ansioso por formar parte de un hogar definitivo."
    },
    {
        id: 3,
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
        description: "Pumba es pura simpatía, ternura y buen carácter. De tamaño muy práctico, tranquilo en el hogar y dulce con adultos y niños.",
        health: "Vacunado, Castrado, Controles al día",
        goodWith: ["Niños", "Ancianos", "Otros Perros"],
        story: "Rescatado hace un tiempo, Pumba es de los mimados del refugio por su andar compasivo y su mirada dulce."
    },
    {
        id: 4,
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
        description: "Wilson es un gigante bonachón, guardián leal y de temple sereno. Excelente compañero para casas con patio amplio.",
        health: "Vacunado, Castrado y Desparasitado",
        goodWith: ["Adultos", "Espacios Amplios"],
        story: "Wilson fue rescatado tras pasar necesidades en la vía pública. Se recuperó maravillosamente y busca su familia definitiva."
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderDogsCatalog(DOGS_DATA);
    initDogFilters();
});

function renderDogsCatalog(dogs) {
    const grid = document.getElementById('dogs-grid');
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

    grid.innerHTML = dogs.map(dog => `
        <div class="dog-card">
            <div class="dog-card-img-wrapper">
                <img src="${dog.image}" alt="${dog.name}" class="dog-card-img">
                <span class="badge ${dog.status === 'Urgente' ? 'badge-urgent' : 'badge-primary'} dog-status-tag">
                    ${dog.status}
                </span>
                ${dog.images && dog.images.length > 1 ? `
                    <span class="badge badge-secondary" style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.65); color: #fff; border: none; font-size: 0.75rem;">
                        <i class="fas fa-camera"></i> ${dog.images.length} fotos
                    </span>
                ` : ''}
            </div>
            <div class="dog-card-body">
                <div class="dog-card-header">
                    <h3 class="dog-name">${dog.name}</h3>
                    <span class="dog-gender-symbol"><b>${dog.genderSymbol}</b></span>
                </div>
                <div class="dog-tags">
                    <span class="dog-tag-item"><i class="fas fa-ruler-vertical"></i> ${dog.size}</span>
                    <span class="dog-tag-item"><i class="fas fa-birthday-cake"></i> ${dog.age}</span>
                </div>
                <p class="dog-description">${dog.description}</p>
                <button class="btn btn-primary btn-sm" onclick="openDogDetailModal(${dog.id})" style="width: 100%;">
                    <i class="fas fa-heart"></i> Conocer a ${dog.name}
                </button>
            </div>
        </div>
    `).join('');
}

function initDogFilters() {
    const sizeFilter = document.getElementById('filter-size');
    const ageFilter = document.getElementById('filter-age');
    const genderFilter = document.getElementById('filter-gender');

    const applyFilters = () => {
        const sizeVal = sizeFilter ? sizeFilter.value : 'all';
        const ageVal = ageFilter ? ageFilter.value : 'all';
        const genderVal = genderFilter ? genderFilter.value : 'all';

        const filtered = DOGS_DATA.filter(dog => {
            const matchesSize = sizeVal === 'all' || dog.size.toLowerCase().includes(sizeVal.toLowerCase());
            const matchesAge = ageVal === 'all' || dog.age.toLowerCase().includes(ageVal.toLowerCase());
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
    const dog = DOGS_DATA.find(d => d.id === id);
    if (!dog) return;

    const modalBody = document.getElementById('dog-modal-content');
    if (!modalBody) return;

    const imagesList = dog.images && dog.images.length > 0 ? dog.images : [dog.image];

    modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div>
                <img id="modal-main-dog-img" src="${imagesList[0]}" alt="${dog.name}" style="width: 100%; height: 280px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                ${imagesList.length > 1 ? `
                    <div style="display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 5px;">
                        ${imagesList.map((imgSrc, idx) => `
                            <img src="${imgSrc}" alt="${dog.name} foto ${idx + 1}" 
                                onclick="changeModalDogImage('${imgSrc}')" 
                                class="modal-thumb-img" 
                                style="width: 65px; height: 65px; object-fit: cover; border-radius: var(--radius-sm); cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--primary)' : 'var(--border-color)'}; flex-shrink: 0;">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2>${dog.name}</h2>
                    <span class="dog-gender-symbol"><b>${dog.genderSymbol}</b></span>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 15px;"><strong>Tamaño:</strong> ${dog.size} | <strong>Edad:</strong> ${dog.age}</p>
                <h4 style="margin-bottom: 6px; color: var(--primary);"><i class="fas fa-heartbeat"></i> Estado de Salud:</h4>
                <p style="margin-bottom: 15px;">${dog.health}</p>
                <h4 style="margin-bottom: 6px; color: var(--primary);"><i class="fas fa-book-open"></i> Su Historia:</h4>
                <p style="margin-bottom: 20px; color: var(--text-muted);">${dog.story}</p>
                <button class="btn btn-secondary" onclick="sendAdoptionRequest('${dog.name}')" style="width: 100%;">
                    <i class="fab fa-whatsapp"></i> Solicitar Adopción de ${dog.name} vía WhatsApp
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
