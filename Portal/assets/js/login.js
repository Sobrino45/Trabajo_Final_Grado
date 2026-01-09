// Portal/assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Si ya está logueado, redirigir al dashboard
    if (Auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evitar recarga de página

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Intentar login usando la clase Auth (definida en auth.js)
        const result = Auth.login(email, password);

        if (result.success) {
            // Si es correcto, redirigir
            window.location.href = 'dashboard.html';
        } else {
            // Si falla, mostrar error
            errorMsg.textContent = result.message || "Error al iniciar sesión";
            errorMsg.style.display = 'block';
        }
    });
});