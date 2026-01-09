/**
 * NAVBAR MANAGER
 * Controla la visibilidad de elementos del menú (Usuario vs Visitante).
 * Se debe llamar a NavbarManager.init() cada vez que se cargue el navbar.html
 */

const NavbarManager = {
    init: function() {
        // Verificar si Auth existe (seguridad)
        if (typeof Auth === 'undefined') return;

        const isAuth = Auth.isAuthenticated();
        const user = Auth.getCurrentUser();

        // 1. Referencias al DOM
        const guestElements = document.querySelectorAll('.guest-only');
        const userElements = document.querySelectorAll('.user-only');
        const usernameSpan = document.getElementById('nav-username');
        const saldoSpan = document.getElementById('nav-saldo');
        const btnLogout = document.getElementById('btnLogout');

        // 2. Mostrar/Ocultar según estado
        if (isAuth && user) {
            // -- USUARIO LOGUEADO --
            guestElements.forEach(el => el.classList.add('d-none'));
            userElements.forEach(el => el.classList.remove('d-none'));

            // Actualizar Nombre
            if(usernameSpan) usernameSpan.textContent = user.username;
            
            // Actualizar Saldo (usando Wallet si existe)
            if(saldoSpan) {
                const saldo = typeof Wallet !== 'undefined' ? Wallet.getBalance() : user.wallet;
                saldoSpan.textContent = parseFloat(saldo).toFixed(2);
            }

            // Activar Logout
            if (btnLogout) {
                // Clonamos el nodo para eliminar listeners antiguos si se recarga el navbar
                const newBtn = btnLogout.cloneNode(true);
                btnLogout.parentNode.replaceChild(newBtn, btnLogout);
                
                newBtn.addEventListener('click', (e) => {
                   e.preventDefault();
                   Auth.logout();
                });
            }

        } else {
            // -- VISITANTE --
            guestElements.forEach(el => el.classList.remove('d-none'));
            userElements.forEach(el => el.classList.add('d-none'));
        }
    }
};

window.NavbarManager = NavbarManager;