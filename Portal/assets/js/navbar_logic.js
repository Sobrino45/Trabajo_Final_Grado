// Portal/assets/js/navbar_logic.js

// Comprobamos si ya existe para evitar el error "Already declared"
if (typeof window.NavbarManager === 'undefined') {

    window.NavbarManager = {
        init: function() {
            console.log("Iniciando NavbarManager..."); // Log para depurar
            this.checkSession();
            this.setupLogout();
        },

        checkSession: function() {
            fetch('/CasinoDaw/Backend/get_user_info.php')
                .then(response => response.json())
                .then(data => {
                    const guestItems = document.querySelectorAll('.guest-only');
                    const userItems = document.querySelectorAll('.user-only');

                    if (data.logged_in) {
                        // Ocultar login, mostrar perfil
                        guestItems.forEach(el => el.classList.add('d-none'));
                        userItems.forEach(el => el.classList.remove('d-none'));

                        // Rellenar datos
                        const nameSpan = document.getElementById('nav-username');
                        const saldoSpan = document.getElementById('nav-saldo');
                        if(nameSpan) nameSpan.textContent = data.username;
                        if(saldoSpan) saldoSpan.textContent = parseFloat(data.saldo).toFixed(2);
                    } else {
                        // Modo invitado
                        guestItems.forEach(el => el.classList.remove('d-none'));
                        userItems.forEach(el => el.classList.add('d-none'));
                    }
                })
                .catch(err => console.error("Error navbar:", err));
        },

        setupLogout: function() {
            // Usamos un flag para no añadir el evento click 20 veces si se recarga
            if (this.logoutInitialized) return; 
            
            document.body.addEventListener('click', function(e) {
                if(e.target && e.target.id === 'btnLogout') {
                    localStorage.removeItem('user_login');
                    fetch('/CasinoDaw/Backend/logout.php').finally(() => {
                        window.location.href = 'login.html';
                    });
                }
            });
            this.logoutInitialized = true;
        }
    };
}