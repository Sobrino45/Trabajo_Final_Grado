/**
 * Lógica para manejar la Navbar y el Cierre de Sesión.
 * Se debe llamar a initNavbar() después de cargar el HTML del menú.
 */

const NavbarManager = {
    init: function() {
        const isAuth = Auth.isAuthenticated();
        const user = Auth.getCurrentUser();

        // 1. Referencias al DOM
        const guestElements = document.querySelectorAll('.guest-only');
        const userElements = document.querySelectorAll('.user-only');
        const usernameSpan = document.getElementById('nav-username');
        const saldoSpan = document.getElementById('nav-saldo');
        const btnLogout = document.getElementById('btnLogout');

        // 2. Mostrar/Ocultar elementos según estado
        if (isAuth && user) {
            // ESTADO: LOGUEADO
            guestElements.forEach(el => el.classList.add('d-none'));
            userElements.forEach(el => el.classList.remove('d-none'));

            // Actualizar textos
            if(usernameSpan) usernameSpan.textContent = user.username;
            // Usamos Wallet.getBalance() si está disponible, si no, del user directo
            if(saldoSpan) {
                const saldo = typeof Wallet !== 'undefined' ? Wallet.getBalance() : user.wallet;
                saldoSpan.textContent = parseFloat(saldo).toFixed(2);
            }

            // 3. Activar botón Logout
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                   Auth.logout(); // Llama a la función de auth.js
                });
            }

        } else {
            // ESTADO: VISITANTE
            guestElements.forEach(el => el.classList.remove('d-none'));
            userElements.forEach(el => el.classList.add('d-none'));
        }
    }
};

// Hacemos global la función para usarla en los HTML
window.NavbarManager = NavbarManager;