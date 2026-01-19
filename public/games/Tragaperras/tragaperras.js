const symbols = [
    { icon: "🍒", weight: 40 }, { icon: "🍋", weight: 30 },
    { icon: "🔔", weight: 15 }, { icon: "⭐", weight: 10 }, { icon: "💎", weight: 5 }
];
const payouts = { "💎": 100, "⭐": 50, "🔔": 20, "🍋": 10, "🍒": 5 };
const COST_PER_SPIN = 5;
let saldoActual = 0;

const reels = document.querySelectorAll(".reel");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result");
const walletDisplay = document.getElementById("walletDisplay");

document.addEventListener("DOMContentLoaded", cargarDatosUsuario);

function cargarDatosUsuario() {
    fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
        if (data.logged_in) {
            saldoActual = parseFloat(data.saldo);
            updateGUI();
        } else { window.location.href = "../../login.html"; }
    });
}

spinBtn.addEventListener("click", () => {
    if (saldoActual < COST_PER_SPIN) return alert("Saldo insuficiente");
    spinBtn.disabled = true;
    reels.forEach(r => r.classList.add("spinning"));
    setTimeout(() => {
        const res = [];
        reels.forEach(r => {
            const sym = symbols[Math.floor(Math.random() * symbols.length)].icon;
            r.textContent = sym; r.classList.remove("spinning"); res.push(sym);
        });
        const win = (res[0] === res[1] && res[1] === res[2]) ? payouts[res[0]] : 0;
        fetch("../../api.php?action=game_result", {
            method: "POST",
            body: JSON.stringify({ game: "Tragaperras", bet: COST_PER_SPIN, win: win }),
            headers: { "Content-Type": "application/json" }
        }).then(r => r.json()).then(d => {
            if(d.success) { saldoActual = d.new_balance; updateGUI(); resultText.textContent = win > 0 ? "¡GANASTE!" : "Suerte..."; }
            spinBtn.disabled = false;
        });
    }, 1000);
});

function updateGUI() { walletDisplay.textContent = parseFloat(saldoActual).toFixed(2) + " €"; }