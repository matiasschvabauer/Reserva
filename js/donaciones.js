/* ==========================================================================
   RESERVA CANINA GÁLVEZ - DONACIONES & APADRINAMIENTO MODULE
   ========================================================================== */

const DONATION_INFO = {
    alias: "RESERVA.CANINA.GALVEZ",
    cbu: "0000003100098765432100",
    titular: "Reserva Canina Gálvez (Asociación Civil)",
    mpLink: "https://www.mercadopago.com.ar"
};

document.addEventListener('DOMContentLoaded', () => {
    initDonationCalculator();
});

function copyAlias() {
    copyToClipboard(DONATION_INFO.alias, 'Alias bancario');
}

function copyCBU() {
    copyToClipboard(DONATION_INFO.cbu, 'CBU bancario');
}

function donateMercadoPago(amount) {
    showToast(`Redirigiendo a Mercado Pago por $${amount.toLocaleString()}...`, 'info');
    setTimeout(() => {
        window.open(DONATION_INFO.mpLink, '_blank');
    }, 800);
}

function initDonationCalculator() {
    const amountInput = document.getElementById('custom-donation-amount');
    const impactText = document.getElementById('donation-impact-text');

    if (!amountInput || !impactText) return;

    amountInput.addEventListener('input', () => {
        const val = parseInt(amountInput.value) || 0;
        let impact = "";

        if (val < 1000) {
            impact = "🌱 ¡Todo suma! Tu aporte ayuda a comprar insumos básicos de limpieza.";
        } else if (val < 3000) {
            impact = "💉 ¡Genial! Equivale a 1 dosis de vacuna o desparasitante completo.";
        } else if (val < 8000) {
            impact = "🍖 ¡Buenísimo! Equivale a media bolsa de alimento balanceado de alta calidad.";
        } else if (val < 15000) {
            impact = "📦 ¡Excelente! Equivale a 1 bolsa completa de alimento de 15kg para los rescatados.";
        } else {
            impact = "❤️ ¡Impacto enorme! Financia medicamentos y controles veterinarios de varios perritos.";
        }

        impactText.innerText = impact;
    });
}
