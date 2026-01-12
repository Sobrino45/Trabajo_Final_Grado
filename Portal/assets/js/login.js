// Portal/assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Si ya estás logueado, te manda directo dentro
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error');

    // Verificamos que el formulario exista para evitar errores
    if (loginForm) {
        // NOTA IMPORTANTE: Añadimos 'async' aquí para poder esperar al servidor
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitar recarga

            // 2. CAMBIO CLAVE: Usamos el ID correcto 'loginUser'
            const identifier = document.getElementById('loginUser').value;
            const password = document.getElementById('password').value;

            // Limpiar errores previos
            if(errorMsg) {
                errorMsg.style.display = 'none';
                errorMsg.textContent = '';
            }

            try {
                // 3. CAMBIO CLAVE: Usamos 'await' porque la petición al servidor tarda unos milisegundos
                const result = await Auth.login(identifier, password);

                if (result.success) {
                    // Éxito: Vamos al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Fallo: Mostramos el mensaje que nos devuelve PHP (ej: "Contraseña incorrecta")
                    if(errorMsg) {
                        errorMsg.textContent = result.message || "Error desconocido";
                        errorMsg.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error("Error en login:", error);
                if(errorMsg) {
                    errorMsg.textContent = "Error de conexión con el servidor";
                    errorMsg.style.display = 'block';
                }
            }
        });
    }
});