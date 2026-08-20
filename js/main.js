/* ==========================================================================
   RESERVA CANINA GÁLVEZ - MAIN JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    initActiveNav();
    initToastContainer();
    initRefugioCarousel();
});

/* Theme Toggle (Dark/Light Mode) */
function initTheme() {
    const savedTheme = localStorage.getItem('reserva_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('reserva_theme', newTheme);
            updateThemeIcon(newTheme);
            showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
        });
    }
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
}

/* Mobile Menu Navigation */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (toggleBtn && mobileNav) {
        toggleBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = mobileNav.classList.contains('active') 
                    ? 'fas fa-times' 
                    : 'fas fa-bars';
            }
        });
    }
}

/* Active Nav Highlighting */
function initActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/* Modal Helpers */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* Copy to Clipboard */
function copyToClipboard(text, label = 'Texto') {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`¡${label} copiado al portapapeles!`, 'success');
        }).catch(err => {
            fallbackCopyTextToClipboard(text, label);
        });
    } else {
        fallbackCopyTextToClipboard(text, label);
    }
}

function fallbackCopyTextToClipboard(text, label) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(`¡${label} copiado al portapapeles!`, 'success');
    } catch (err) {
        showToast(`Error al copiar ${label}`, 'error');
    }
    document.body.removeChild(textArea);
}

/* Toast Notifications System */
function initToastContainer() {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info') {
    initToastContainer();
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';
    if (type === 'warning') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* Automatic Refugio Carousel (NoNameFound photos) */
let currentRefugioIndex = 0;
let refugioInterval = null;

function initRefugioCarousel() {
    const slides = document.querySelectorAll('.refugio-slide');
    const dotsContainer = document.getElementById('refugio-carousel-dots');
    
    if (!slides || slides.length === 0) return;

    if (dotsContainer) {
        dotsContainer.innerHTML = Array.from(slides).map((_, idx) => `
            <span class="refugio-dot ${idx === 0 ? 'active' : ''}" onclick="goToRefugioSlide(${idx})" style="width: 10px; height: 10px; border-radius: 50%; background: ${idx === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)'}; cursor: pointer; transition: all 0.3s ease;"></span>
        `).join('');
    }

    startRefugioAutoPlay();
}

function showRefugioSlide(index) {
    const slides = document.querySelectorAll('.refugio-slide');
    const dots = document.querySelectorAll('.refugio-dot');
    
    if (!slides || slides.length === 0) return;

    if (index >= slides.length) currentRefugioIndex = 0;
    else if (index < 0) currentRefugioIndex = slides.length - 1;
    else currentRefugioIndex = index;

    slides.forEach((slide, idx) => {
        slide.style.opacity = idx === currentRefugioIndex ? '1' : '0';
        slide.classList.toggle('active', idx === currentRefugioIndex);
    });

    dots.forEach((dot, idx) => {
        dot.style.background = idx === currentRefugioIndex ? '#ffffff' : 'rgba(255,255,255,0.5)';
        dot.style.transform = idx === currentRefugioIndex ? 'scale(1.2)' : 'scale(1)';
    });
}

function nextRefugioSlide() {
    showRefugioSlide(currentRefugioIndex + 1);
    restartRefugioAutoPlay();
}

function prevRefugioSlide() {
    showRefugioSlide(currentRefugioIndex - 1);
    restartRefugioAutoPlay();
}

function goToRefugioSlide(index) {
    showRefugioSlide(index);
    restartRefugioAutoPlay();
}

function startRefugioAutoPlay() {
    if (refugioInterval) clearInterval(refugioInterval);
    refugioInterval = setInterval(() => {
        showRefugioSlide(currentRefugioIndex + 1);
    }, 3500);
}

function restartRefugioAutoPlay() {
    startRefugioAutoPlay();
}

/* Global HTML Escape Helper */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
window.escapeHTML = escapeHTML;
