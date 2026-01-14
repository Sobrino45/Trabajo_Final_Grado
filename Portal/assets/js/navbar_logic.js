const NavbarManager = {
    init: function() {
        this.checkLoginStatus();
        this.attachLogoutListener(); 
    },

    checkLoginStatus: function() {
        fetch("../Backend/get_user_info.php")
            .then(response => response.json())
            .then(data => {
                if (data.logged_in) {
                    this.showUserInterface(data);
                } else {
                    this.showGuestInterface();
                }
            })
            .catch(error => {
                console.error("Error verificando sesión:", error);
                this.showGuestInterface();
            });
    },

    showUserInterface: function(data) {
        document.querySelectorAll('.guest-only').forEach(el => el.classList.add('d-none'));
        document.querySelectorAll('.user-only').forEach(el => el.classList.remove('d-none'));

        const usernameEl = document.getElementById('nav-username');
        const saldoEl = document.getElementById('nav-saldo');
        if(usernameEl) usernameEl.textContent = data.username;
        if(saldoEl) saldoEl.textContent = parseFloat(data.saldo).toFixed(2);
    },

    showGuestInterface: function() {
        document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('d-none'));
        document.querySelectorAll('.user-only').forEach(el => el.classList.add('d-none'));
    },

    attachLogoutListener: function() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#btnLogout');
            if (btn) {
                e.preventDefault();
                this.logout();
            }
        });
    },

    logout: function() {
        fetch("../Backend/logout.php")
            .then(() => {
                localStorage.removeItem("user_login");
                // ESTA LÍNEA ES LA QUE TE FALTA PARA QUE NO SE QUEDE LA PANTALLA VACÍA:
                window.location.href = "../Portal/login.html";
            })
            .catch(err => {
                console.error("Error al cerrar sesión:", err);
                window.location.href = "../Portal/login.html";
            });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavbarManager.init());
} else {
    NavbarManager.init();
}