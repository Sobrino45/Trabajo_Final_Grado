document.addEventListener('DOMContentLoaded', () => {
    
    // Verificar que Auth existe
    if (typeof Auth === 'undefined') {
        console.error("Error: Auth.js no está cargado.");
        return;
    }

    const registerForm = document.getElementById('registerForm');
    const msgContainer = document.getElementById('msgContainer');

    if (!registerForm) return;

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Recoger datos
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        // Si tienes campo de saldo inicial, úsalo; si no, por defecto 0
        const saldoInput = document.getElementById('saldo');
        const saldoInicial = saldoInput ? parseFloat(saldoInput.value) : 0;

        // 2. Validaciones básicas
        if (password !== confirmPassword) {
            mostrarMensaje("Las contraseñas no coinciden.", "text-danger");
            return;
        }

        // 3. Registrar usuario
        const result = Auth.register(username, email, password);

        if (result.success) {
            // 4. Éxito: Iniciar sesión automáticamente
            mostrarMensaje("¡Cuenta creada! Iniciando sesión...", "text-success");
            
            const loginResult = Auth.login(email, password);
            
            if (loginResult.success) {
                // Ingresar saldo inicial si se especificó
                if (saldoInicial > 0 && typeof Wallet !== 'undefined') {
                    Wallet.deposit(saldoInicial);
                }

                // Redirigir
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } else {
            // Error (ej: email duplicado)
            mostrarMensaje(result.message, "text-danger");
        }
    });

    function mostrarMensaje(texto, clase) {
        if (!msgContainer) return;
        msgContainer.textContent = texto;
        msgContainer.className = `mt-3 text-center fw-bold ${clase}`;
        msgContainer.style.display = 'block';
    }
});