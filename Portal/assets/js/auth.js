/**
 * AUTH SERVICE (CONECTADO A BACKEND PHP)
 * - Soporta Login (Usuario o Email).
 * - Soporta Registro real en Base de Datos (con Saldo).
 * - Gestiona la sesión del usuario en el navegador.
 */

const Auth = {
    USER_KEY: 'casino_user',

    // ==========================================
    // 1. LOGIN (Acepta Usuario o Email)
    // ==========================================

    /**
     * @param {string} identifier - Puede ser el nombre de usuario O el email
     * @param {string} password - La contraseña
     */
    login: async function(identifier, password) {
        try {
            // Enviamos el 'identifier' como 'username' porque así lo espera login.php
            const response = await fetch('../Backend/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: identifier, password: password })
            });

            // Verificar si el servidor respondió correctamente (HTTP 200)
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const sessionData = {
                    username: data.username,
                    saldo: data.saldo,
                    isLoggedIn: true
                };
                
                // Guardamos sesión en el navegador
                localStorage.setItem(this.USER_KEY, JSON.stringify(sessionData));
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }

        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    // ==========================================
    // 2. REGISTRO (CONECTADO A PHP)
    // ==========================================

    /**
     * @param {string} username - Nombre de usuario
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @param {number} saldo - Saldo inicial seleccionado
     */
    register: async function(username, email, password, saldo) {
        try {
            const response = await fetch('../Backend/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // IMPORTANTE: Aquí enviamos también el saldo
                body: JSON.stringify({ username, email, password, saldo })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data; // Devuelve el objeto { success: true/false, message: ... }

        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    // ==========================================
    // 3. GESTIÓN DE SESIÓN
    // ==========================================

    logout: function() {
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'login.html';
    },

    isAuthenticated: function() {
        const user = JSON.parse(localStorage.getItem(this.USER_KEY));
        return user && user.isLoggedIn;
    },

    getUser: function() {
        return JSON.parse(localStorage.getItem(this.USER_KEY));
    },

    /**
     * Bloquea el acceso a páginas privadas.
     */
    check: function() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
};

// Hacer Auth globalmente accesible en la ventana del navegador
window.Auth = Auth;