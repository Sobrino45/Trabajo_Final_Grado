/**
 * AUTH SERVICE (CONECTADO AL ROUTER PHP)
 * Ubicación: public/assets/js/auth.js
 */

const Auth = {
    USER_KEY: 'casino_user',

    // ==========================================
    // 1. LOGIN
    // ==========================================
    login: async function(identifier, password) {
        try {
            // Enviamos "identifier" como "email" para compatibilidad con el backend
            const response = await fetch('api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password: password })
            });

            // Evitamos el error "Unexpected end of JSON" verificando si hay contenido
            const text = await response.text(); 
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Respuesta no es JSON:", text);
                return { success: false, message: "Error del servidor (respuesta inválida)" };
            }

            if (response.ok) {
                const sessionData = {
                    id: data.user_id,
                    nombre: data.nombre, 
                    saldo: data.saldo,
                    isLoggedIn: true
                };
                
                localStorage.setItem(this.USER_KEY, JSON.stringify(sessionData));
                return { success: true };
            } else {
                return { success: false, message: data.message || "Error al iniciar sesión" };
            }

        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    // ==========================================
    // 2. REGISTRO
    // ==========================================
    register: async function(username, email, password, saldo) {
        try {
            const response = await fetch('api.php?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, saldo })
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || "Error en el registro" };
            }

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
        // Llamada opcional al backend para matar sesión PHP
        fetch('api.php?action=logout').finally(() => {
             window.location.href = 'login.html';
        });
    },

    isAuthenticated: function() {
        const user = JSON.parse(localStorage.getItem(this.USER_KEY));
        return user && user.isLoggedIn;
    },

    getUser: function() {
        const user = JSON.parse(localStorage.getItem(this.USER_KEY));
        return user || null;
    },

    // --- CORRECCIÓN DEL ERROR ---
    // Añadimos este alias porque logout.js lo está buscando
    getCurrentUser: function() {
        return this.getUser();
    },

    check: function() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
};

window.Auth = Auth;