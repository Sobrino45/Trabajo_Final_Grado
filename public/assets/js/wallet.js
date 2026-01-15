/**
 * WALLET SERVICE
 * Gestiona el saldo del usuario.
 * Se comunica con Auth.js para guardar los cambios.
 */

const Wallet = {
    
    /**
     * Devuelve el saldo actual del usuario logueado.
     * Retorna 0.00 si no hay usuario.
     */
    getBalance: function() {
        const user = Auth.getCurrentUser();
        return user ? parseFloat(user.wallet) : 0.00;
    },

    /**
     * Intenta realizar un depósito (sumar dinero).
     * @param {number} amount Cantidad a ingresar
     * @returns {number|boolean} Nuevo saldo o false si falló.
     */
    deposit: function(amount) {
        if (amount <= 0) return false;
        
        const current = this.getBalance();
        const newBalance = current + amount;
        
        // Actualizar en Auth (BD y Sesión)
        Auth.updateUser({ wallet: newBalance });
        
        return newBalance;
    },

    /**
     * Actualiza el saldo (Suma o Resta).
     * Usada por los juegos (Ruleta, Slots...).
     * @param {number} amount Cantidad (Positiva para premios, negativa para apuestas)
     */
    updateBalance: function(amount) {
        const current = this.getBalance();
        const newBalance = current + amount;

        // Evitar saldos negativos por error
        if (newBalance < 0) return false;

        Auth.updateUser({ wallet: newBalance });
        return newBalance;
    }
};

// Hacer Wallet global
window.Wallet = Wallet;