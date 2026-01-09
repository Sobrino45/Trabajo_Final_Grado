/**
 * AUTH SERVICE
 * Simula un Backend completo usando LocalStorage.
 * Maneja usuarios, sesiones, persistencia de datos y seguridad.
 */

const Auth = {
    // Claves para guardar los datos en el navegador
    DB_KEY: 'casino_daw_users_db',      // Aquí se guardan TODOS los usuarios registrados
    SESSION_KEY: 'casino_daw_session',  // Aquí se guarda el usuario que está logueado AHORA

    // ==========================================
    // 1. GESTIÓN DE LA "BASE DE DATOS" SIMULADA
    // ==========================================

    /**
     * Recupera todos los usuarios registrados.
     * Si es la primera vez que se entra, crea usuarios "semilla" (Seed Data).
     */
    getUsers: function() {
        const usersJSON = localStorage.getItem(this.DB_KEY);
        
        if (!usersJSON) {
            console.log("Inicializando base de datos simulada...");
            // DATOS INICIALES (Seed): Usuarios que ya "existen" en el sistema
            const initialUsers = [
                { 
                    id: 1,
                    username: 'Admin', 
                    email: 'admin@casino.com', 
                    password: 'admin', 
                    wallet: 50000.00, // La banca siempre gana
                    isAdmin: true,
                    createdAt: new Date().toISOString()
                },
                { 
                    id: 2,
                    username: 'Jugador1', 
                    email: 'jugador@demo.com', 
                    password: '1234', 
                    wallet: 1000.00, // Saldo inicial para pruebas
                    isAdmin: false,
                    createdAt: new Date().toISOString()
                }
            ];
            // Guardamos estos usuarios iniciales
            this.saveUsers(initialUsers);
            return initialUsers;
        }

        return JSON.parse(usersJSON);
    },

    /**
     * Guarda el array de usuarios en el almacenamiento local.
     */
    saveUsers: function(users) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(users));
    },

    // ==========================================
    // 2. FUNCIONES DE AUTENTICACIÓN (LOGIN/REGISTER)
    // ==========================================

    /**
     * Registra un nuevo usuario.
     * Retorna un objeto { success: true/false, message: "..." }
     */
    register: function(username, email, password) {
        const users = this.getUsers();

        // Validación: Comprobar si el email ya existe
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            return { success: false, message: 'Este correo electrónico ya está registrado.' };
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now(), // ID único basado en tiempo
            username: username,
            email: email,
            password: password,
            wallet: 0.00, // Empieza a 0, luego se ingresa saldo en el dashboard o registro
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        // Guardar en la "Base de Datos"
        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Usuario registrado correctamente.' };
    },

    /**
     * Inicia sesión.
     * Busca al usuario y, si coincide, crea la sesión.
     */
    login: function(email, password) {
        const users = this.getUsers();
        
        // Buscar usuario coincidente
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (user) {
            // Guardar usuario en sesión (clonamos para no referenciar)
            const sessionUser = { ...user };
            // Por seguridad (aunque sea simulada), no guardamos la password en la sesión visible
            delete sessionUser.password;
            
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        } else {
            return { success: false, message: 'Usuario o contraseña incorrectos.' };
        }
    },

    /**
     * Cierra la sesión y redirige al inicio.
     */
    logout: function() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = '../Portal/index.html'; // Ajusta la ruta si es necesario
    },

    // ==========================================
    // 3. GESTIÓN DE SESIÓN Y DATOS
    // ==========================================

    /**
     * Verifica si hay alguien logueado.
     */
    isAuthenticated: function() {
        return !!localStorage.getItem(this.SESSION_KEY);
    },

    /**
     * Obtiene los datos del usuario logueado actualmente.
     */
    getCurrentUser: function() {
        const sessionJSON = localStorage.getItem(this.SESSION_KEY);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
    },

    /**
     * IMPORTANTE: Esta función actualiza los datos (ej: Saldo) 
     * tanto en la sesión actual como en la base de datos permanente.
     */
    updateUser: function(updatedData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        // 1. Actualizar en la lista general de usuarios (Persistencia)
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            // Mezclar datos antiguos con los nuevos
            users[userIndex] = { ...users[userIndex], ...updatedData };
            this.saveUsers(users);

            // 2. Actualizar la sesión activa (para que se vea reflejado al instante)
            const newSession = { ...currentUser, ...updatedData };
            if (newSession.password) delete newSession.password; 
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
        }
    },
    
    /**
     * Función de seguridad para bloquear páginas privadas.
     * Pon Auth.check() al principio de dashboard.html
     */
    check: function() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
};

// Inicializar la base de datos al cargar el script (para crear los usuarios seed si no existen)
Auth.getUsers();

// Hacer Auth globalmente accesible
window.Auth = Auth;