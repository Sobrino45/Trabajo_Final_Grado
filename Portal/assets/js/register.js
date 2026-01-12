/*
 * Lógica del Formulario de Registro (register.html)
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Obtener referencias a los elementos con los IDs de TU html
    const registerForm = document.getElementById('registerForm');
    const msgContainer = document.getElementById('msgContainer');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Recoger valores
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPass = document.getElementById('confirmPassword').value.trim();
            const saldo = document.getElementById('saldo').value;

            // Resetear mensajes
            msgContainer.style.display = 'none';
            msgContainer.className = 'mt-3 text-center'; // Clase base
            msgContainer.textContent = '';

            // --- VALIDACIONES FRONTEND ---

            // 1. Contraseñas coinciden
            if (password !== confirmPass) {
                showMessage("⚠️ Las contraseñas no coinciden.", "text-danger");
                return;
            }

            // 2. Longitud contraseña
            if (password.length < 4) {
                showMessage("⚠️ La contraseña debe tener al menos 4 caracteres.", "text-danger");
                return;
            }

            // --- ENVIAR AL BACKEND ---
            // Llamamos a Auth.register pasando el saldo también
            const result = await Auth.register(username, email, password, saldo);

            if (result.success) {
                // ÉXITO
                showMessage("✅ ¡Cuenta creada con éxito! Redirigiendo...", "text-success");
                
                // Deshabilitar botón para no enviar doble
                const btn = registerForm.querySelector('button[type="submit"]');
                if(btn) btn.disabled = true;

                // Esperar 1.5 seg y mandar al Login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);

            } else {
                // ERROR (Usuario existe, etc)
                showMessage("❌ " + result.message, "text-danger");
            }
        });
    }

    // Función auxiliar para mostrar mensajes en el div msgContainer
    function showMessage(text, colorClass) {
        msgContainer.textContent = text;
        msgContainer.className = `mt-3 text-center fw-bold ${colorClass}`;
        msgContainer.style.display = 'block';
    }
});