document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar Seguridad: Si no hay usuario, fuera.
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Obtener datos del usuario actual
    const user = Auth.getCurrentUser();
    
    // 3. Referencias al DOM
    const usernameSpan = document.getElementById('username');
    const balanceSpan = document.getElementById('saldo');
    const depositInput = document.getElementById('depositAmount');
    const btnDeposit = document.getElementById('btnDeposit');

    // 4. Renderizar datos iniciales
    if (user) {
        usernameSpan.textContent = user.username || user.email; // Usar nombre o email
        updateBalanceDisplay();
    }

    // 5. Función para actualizar el saldo en pantalla
    function updateBalanceDisplay() {
        // Usamos Wallet.getBalance() si existe, si no, directo del user
        const currentBalance = Wallet.getBalance();
        balanceSpan.textContent = currentBalance.toFixed(2);
    }

    // 6. Evento: Ingresar dinero (Simulación)
    if (btnDeposit) {
        btnDeposit.addEventListener('click', () => {
            const amount = parseFloat(depositInput.value);
            
            if (isNaN(amount) || amount <= 0) {
                alert("Por favor, introduce una cantidad válida.");
                return;
            }

            // Llamamos a la lógica de Wallet
            const newBalance = Wallet.deposit(amount);
            
            if (newBalance !== false) {
                updateBalanceDisplay();
                alert(`¡Has ingresado ${amount}€ correctamente!`);
                depositInput.value = ''; // Limpiar input
            } else {
                alert("Error al realizar la operación.");
            }
        });
    }
});