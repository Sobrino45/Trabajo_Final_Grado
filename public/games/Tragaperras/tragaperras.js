/* public/games/Tragaperras/tragaperras.js */
const symbols = [
  { icon: "🍒", weight: 40 },
  { icon: "🍋", weight: 30 },
  { icon: "🔔", weight: 15 },
  { icon: "⭐", weight: 10 },
  { icon: "💎", weight: 5 },
];
const payouts = { "💎": 100, "⭐": 50, "🔔": 20, "🍋": 10, "🍒": 5 };
const COST_PER_SPIN = 5;
let saldoActual = 0;
const reels = document.querySelectorAll(".reel"),
  spinBtn = document.getElementById("spinBtn"),
  resultText = document.getElementById("result"),
  walletDisplay = document.getElementById("walletDisplay");

document.addEventListener("DOMContentLoaded", cargarDatosUsuario);

function cargarDatosUsuario() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        updateGUI();
      } else {
        window.location.href = "../../login.html";
      }
    });
}

function getWeightedSymbol() {
  const totalWeight = symbols.reduce((acc, s) => acc + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const s of symbols) {
    if (random < s.weight) return s.icon;
    random -= s.weight;
  }
  return symbols[0].icon;
}

spinBtn.addEventListener("click", () => {
  if (saldoActual < COST_PER_SPIN) return alert("Saldo insuficiente");
  spinBtn.disabled = true;
  resultText.textContent = "¡Mucha suerte!";
  const resultadosFinales = [];
  if (window.AudioManager) AudioManager.play("spin");
  reels.forEach((r) => {
    r.classList.add("spinning");
    r.textContent = "?";
  });
  reels.forEach((reel, index) => {
    const delay = 1000 + index * 1200;
    setTimeout(() => {
      const sym = getWeightedSymbol();
      reel.classList.remove("spinning");
      reel.textContent = sym;
      resultadosFinales[index] = sym;
      reel.style.transform = "scale(1.2)";
      setTimeout(() => (reel.style.transform = "scale(1)"), 100);
      if (window.AudioManager) AudioManager.play("click");
      if (index === reels.length - 1) {
        setTimeout(() => procesarResultadoFinal(resultadosFinales), 300);
      }
    }, delay);
  });
});

function procesarResultadoFinal(res) {
  const win = res[0] === res[1] && res[1] === res[2] ? payouts[res[0]] : 0;
  fetch("../../api.php?action=game_result", {
    method: "POST",
    body: JSON.stringify({ game: "Tragaperras", bet: COST_PER_SPIN, win: win }),
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success) {
        if (window.AudioManager) AudioManager.play(win > 0 ? "win" : "loss");
        saldoActual = d.new_balance;
        updateGUI();
        if (win > 0) {
          resultText.innerHTML = `<span class="text-success fw-bold fs-4">¡PREMIO DE ${win}€!</span>`;
          if (window.ConfettiManager) {
            win === 100
              ? ConfettiManager.victoryBlast()
              : ConfettiManager.celebrate();
          } // Jackpot blast
        } else {
          resultText.innerHTML = `<span class="text-white-50">Sigue probando...</span>`;
        }
      }
      spinBtn.disabled = false;
    });
}

function updateGUI() {
  if (walletDisplay) {
    walletDisplay.textContent = parseFloat(saldoActual).toFixed(2) + " €";
  }
}
