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
  
const payouts = {
    "💎": 100,
    "⭐": 50,
    "🔔": 20,
    "🍋": 10,
    "🍒": 5
};
  
const COST_PER_SPIN = 5; 
let saldoActual = 0;
  
/* =========================================
    ELEMENTOS DOM
    ========================================= */
const reels = document.querySelectorAll(".reel");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result");
const walletDisplay = document.getElementById("walletDisplay");
const paytable = document.getElementById("paytable");
const paytableBtn = document.getElementById("paytableBtn");
  
/* =========================================
    INICIALIZACIÓN
    ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosUsuario();
});

function cargarDatosUsuario() {
    fetch('../Backend/get_user_info.php')
        .then(r => r.json())
        .then(data => {
            if(data.logged_in) {
                saldoActual = parseFloat(data.saldo);
                updateGUI();
            } else {
                window.location.href = '../Portal/login.html';
            }
        });
}

// Event Listeners
spinBtn.addEventListener("click", spin);
paytableBtn.addEventListener("click", togglePaytable);
  
/* =========================================
    LÓGICA DEL JUEGO
    ========================================= */
function spin() {
    if (saldoActual < COST_PER_SPIN) {
        resultText.innerHTML = "<span class='text-danger'>❌ Saldo insuficiente.</span>";
        return;
    }
  
    // Restamos visualmente
    saldoActual -= COST_PER_SPIN;
    updateGUI();
    
    resultText.textContent = "";
    spinBtn.disabled = true;
    
    // Animación CSS
    reels.forEach(r => r.classList.add("spinning"));
  
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
    let winAmount = 0;
    
    // Victoria: Todos los símbolos iguales
    if (result.every(s => s === result[0]) && payouts[result[0]]) {
        winAmount = payouts[result[0]];
    }

    // --- CONEXIÓN AL BACKEND ---
    fetch('../Backend/game_logic.php', {
        method: 'POST',
        body: JSON.stringify({ bet: COST_PER_SPIN, win: winAmount }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            saldoActual = parseFloat(data.new_balance); // Sincronizar saldo real
            updateGUI();

            if(winAmount > 0) {
                resultText.innerHTML = `🎉 ¡PREMIO! Ganaste <span class="text-warning fs-4">${winAmount}€</span>`;
                resultText.className = "result win";
            } else {
                resultText.textContent = "Suerte la próxima vez...";
                resultText.className = "result lose";
            }
        }
    });
}
  
function updateGUI() {
    walletDisplay.textContent = saldoActual.toFixed(2) + " €";
    if (saldoActual < COST_PER_SPIN) {
        walletDisplay.classList.remove("text-success");
        walletDisplay.classList.add("text-danger");
    } else {
        walletDisplay.classList.remove("text-danger");
        walletDisplay.classList.add("text-success");
    }
}
  
function togglePaytable() {
    paytable.classList.toggle("d-none");
}