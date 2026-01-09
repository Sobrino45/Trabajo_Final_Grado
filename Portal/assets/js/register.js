document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('registerForm');
    const msgContainer = document.getElementById('msgContainer');

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Recoger todos los datos
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const saldoInicial = parseFloat(document.getElementById('saldo').value);

        // 2. Validaciones
        if (password !== confirmPassword) {
            mostrarMensaje("Las contraseñas no coinciden.", "text-danger");
            return;
        }

        if (isNaN(saldoInicial) || saldoInicial < 0) {
            mostrarMensaje("El saldo inicial no es válido.", "text-danger");
            return;
        }

        // 3. Intentar registrar (Llama a auth.js)
        const result = Auth.register(username, email, password);

        if (result.success) {
            // ÉXITO EN EL REGISTRO
            mostrarMensaje("Cuenta creada. Configurando billetera...", "text-success");

            // TRUCO: Iniciamos sesión automáticamente para poder asignar el saldo
            const loginResult = Auth.login(email, password);
            
            if (loginResult.success) {
                // Ahora que hay sesión, ingresamos el dinero inicial
                Wallet.deposit(saldoInicial);

                // Redirigir al dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {
            // ERROR (ej: correo duplicado)
            mostrarMensaje(result.message, "text-danger");
        }
    });

    // Función auxiliar para mostrar alertas
    function mostrarMensaje(texto, claseColor) {
        msgContainer.textContent = texto;
        msgContainer.className = `mt-3 text-center fw-bold ${claseColor}`;
        msgContainer.style.display = 'block';
    }
});