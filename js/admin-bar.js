/* ==========================================================================
   RESERVA CANINA GÁLVEZ - GLOBAL ADMIN BAR & UPLOAD PROGRESS MODAL
   ========================================================================== */

// Global Upload & Save Progress Modal
window.showUploadProgress = function(titleText, statusText, percent) {
    let modal = document.getElementById('reserva-upload-progress-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reserva-upload-progress-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px);
            z-index: 9999999; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        `;
        modal.innerHTML = `
            <div style="background: white; width: 100%; max-width: 480px; border-radius: 24px; padding: 2rem; box-shadow: 0 25px 50px rgba(0,0,0,0.35); text-align: center; border: 1px solid #cbd5e1;">
                <div style="margin-bottom: 1.2rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3.2rem; color: #2e7d32;"></i>
                </div>
                <h3 id="reserva-progress-modal-title" style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.6rem;">
                    Guardando y Publicando en la Nube
                </h3>
                
                <div style="background: #fffbebf; border-left: 4px solid #f59e0b; padding: 0.8rem 1rem; border-radius: 10px; margin-bottom: 1.25rem; font-size: 0.82rem; color: #92400e; text-align: left; line-height: 1.45;">
                    <strong style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                        <i class="fas fa-exclamation-triangle"></i> ¡Atención! No cierres esta pestaña:
                    </strong>
                    Por favor esperá a que la barra complete el 100%. Si salís o cerrás la web ahora, la carga se cancelará.
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
                    <span id="reserva-progress-modal-status">Subiendo fotos...</span>
                    <span id="reserva-progress-modal-percent">0%</span>
                </div>

                <div style="background: #e2e8f0; border-radius: 999px; height: 12px; overflow: hidden;">
                    <div id="reserva-progress-modal-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #2e7d32, #4caf50); border-radius: 999px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const titleEl = document.getElementById('reserva-progress-modal-title');
    const statusEl = document.getElementById('reserva-progress-modal-status');
    const percentEl = document.getElementById('reserva-progress-modal-percent');
    const barEl = document.getElementById('reserva-progress-modal-bar');

    if (titleEl && titleText) titleEl.innerText = titleText;
    if (statusEl && statusText) statusEl.innerText = statusText;
    const clampedPct = Math.min(100, Math.max(0, percent || 0));
    if (percentEl) percentEl.innerText = `${clampedPct}%`;
    if (barEl) barEl.style.width = `${clampedPct}%`;

    modal.style.display = 'flex';

    if (clampedPct >= 100) {
        window.onbeforeunload = null;
    } else {
        window.onbeforeunload = function() {
            return "Carga en progreso. Si salís ahora se cancelará.";
        };
    }
};

window.hideUploadProgress = function() {
    window.onbeforeunload = null;
    const modal = document.getElementById('reserva-upload-progress-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Global Admin Topbar Initialization
document.addEventListener('DOMContentLoaded', () => {
    initAdminTopbar();
});

function initAdminTopbar() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.isAdmin) {
        renderAdminTopbar(currentUser);
    }
}

function renderAdminTopbar(user) {
    if (document.getElementById('reserva-admin-topbar')) return;

    const styleEl = document.createElement('style');
    styleEl.textContent = `
        #reserva-admin-topbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 42px;
            background: #1b4332;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.2rem;
            font-size: 0.84rem;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-family: 'Inter', system-ui, sans-serif;
        }
        body.has-admin-topbar {
            margin-top: 42px !important;
        }
        .admin-topbar-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .admin-topbar-badge {
            background: #e9c46a;
            color: #1b4332;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
        }
        .admin-topbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .admin-topbar-btn {
            background: rgba(255,255,255,0.15);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .admin-topbar-btn:hover {
            background: rgba(255,255,255,0.3);
            color: #fff;
        }
    `;
    document.head.appendChild(styleEl);

    document.body.classList.add('has-admin-topbar');

    const topbar = document.createElement('div');
    topbar.id = 'reserva-admin-topbar';
    topbar.innerHTML = `
        <div class="admin-topbar-left">
            <span class="admin-topbar-badge"><i class="fas fa-crown"></i> Modo Administrador</span>
            <span>Conectado como: <strong>${user.name || user.email}</strong></span>
        </div>
        <div class="admin-topbar-actions">
            <a href="adopciones.html" class="admin-topbar-btn"><i class="fas fa-dog"></i> Adopciones</a>
            <a href="refugio.html#metas-donaciones" class="admin-topbar-btn"><i class="fas fa-hand-holding-heart"></i> Metas & Necesidades</a>
            <a href="foro.html" class="admin-topbar-btn"><i class="fas fa-comments"></i> Moderar Foro</a>
            <button class="admin-topbar-btn" onclick="logout()" style="background: rgba(239,68,68,0.3); border-color: rgba(239,68,68,0.5);"><i class="fas fa-sign-out-alt"></i> Salir</button>
        </div>
    `;
    document.body.insertBefore(topbar, document.body.firstChild);
}
