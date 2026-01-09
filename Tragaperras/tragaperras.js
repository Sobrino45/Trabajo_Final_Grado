/* =========================================
   CONFIGURACIÓN
   ========================================= */
const symbols = [
    { icon: "🍒", weight: 40 },
    { icon: "🍋", weight: 30 },
    { icon: "🔔", weight: 15 },
    { icon: "⭐", weight: 10 },
    { icon: "💎", weight: 5 }
];
  
// Ajuste de premios para ser más realista con saldo en Euros
const payouts = {
    "💎": 100, // Jackpot
    "⭐": 50,
    "🔔": 20,
    "🍋": 10,
    "🍒": 5
};
  
const COST_PER_SPIN = 5; // Coste en Euros
  
/* =========================================
    ELEMENTOS DOM
    ========================================= */
const reels = document.querySelectorAll(".reel");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result");
const walletDisplay = document.getElementById("walletDisplay"); // El de arriba
const paytable = document.getElementById("paytable");
const paytableBtn = document.getElementById("paytableBtn");
  
/* =========================================
    INICIALIZACIÓN
    ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Seguridad
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = '../Portal/login.html';
        return;
    }
    // 2. Cargar Saldo Inicial
    updateGUI();
});

// Event Listeners
spinBtn.addEventListener("click", spin);
paytableBtn.addEventListener("click", togglePaytable);
  
/* =========================================
    LÓGICA DEL JUEGO
    ========================================= */
function spin() {
    // Verificar saldo usando la clase Wallet
    const currentBalance = Wallet.getBalance();

    if (currentBalance < COST_PER_SPIN) {
        resultText.innerHTML = "<span class='text-danger'>❌ Saldo insuficiente. Recarga en el Panel.</span>";
        return;
    }
  
    // Cobrar la tirada
    Wallet.updateBalance(-COST_PER_SPIN);
    updateGUI(); // Actualizar visualmente el dinero bajando
    
    resultText.textContent = "";
    spinBtn.disabled = true;
    
    // Animación CSS
    reels.forEach(r => r.classList.add("spinning"));
  
    // Esperar tiempo de giro (1.2s)
    setTimeout(() => {
        const result = [];
    
        reels.forEach(reel => {
            const symbol = getRandomSymbol();
            reel.textContent = symbol;
            reel.classList.remove("spinning");
            result.push(symbol);
        });
    
        checkWin(result);
        spinBtn.disabled = false;
    }, 1200);
}
  
function getRandomSymbol() {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
  
    for (const s of symbols) {
        if (rand < s.weight) return s.icon;
        rand -= s.weight;
    }
}
  
function checkWin(result) {
    // Victoria: Todos los símbolos iguales
    if (result.every(s => s === result[0]) && payouts[result[0]]) {
        const prize = payouts[result[0]];
        
        // Pagar premio
        Wallet.updateBalance(prize);
        updateGUI(); // Actualizar visualmente el dinero subiendo

        resultText.innerHTML = `🎉 ¡PREMIO! Ganaste <span class="text-warning fs-4">${prize}€</span>`;
        resultText.className = "result win";
    } else {
        resultText.textContent = "Suerte la próxima vez...";
        resultText.className = "result lose";
    }
    
    // Actualizar también el navbar si existe
    if(window.NavbarManager) NavbarManager.init();
}
  
function updateGUI() {
    if (typeof Wallet !== 'undefined' && walletDisplay) {
        const saldo = Wallet.getBalance();
        walletDisplay.textContent = parseFloat(saldo).toFixed(2) + " €";
        
        // Color rojo si hay poco saldo
        if (saldo < COST_PER_SPIN) {
            walletDisplay.classList.remove("text-success");
            walletDisplay.classList.add("text-danger");
        } else {
            walletDisplay.classList.remove("text-danger");
            walletDisplay.classList.add("text-success");
        }
    }
}
  
function togglePaytable() {
    paytable.classList.toggle("d-none");
}