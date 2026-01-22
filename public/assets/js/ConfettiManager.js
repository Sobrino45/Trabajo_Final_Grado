/* public/assets/js/ConfettiManager.js */

const ConfettiManager = {
    // Carga la librería dinámicamente si no existe
    init: function() {
        if (!window.confetti) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
            document.head.appendChild(script);
        }
    },

    // Dispara una explosión de confeti clásica
    celebrate: function() {
        if (!window.confetti) return;
        
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#ffffff']
        });
    },

    // Dispara una lluvia lateral (efecto cañón)
    victoryBlast: function() {
        if (!window.confetti) return;

        const duration = 3 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffc107', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffc107', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
};

// Inicializar al cargar
ConfettiManager.init();