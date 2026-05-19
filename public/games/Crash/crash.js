/* public/games/Crash/crash.js */
const canvas = document.getElementById("crashGraph");
const ctx = canvas.getContext("2d");
const multiplierDisplay = document.getElementById("multiplierDisplay");
const statusText = document.getElementById("statusText");
const btnAction = document.getElementById("btnAction");
const betInput = document.getElementById("betInput");
const walletDisplay = document.getElementById("walletDisplay");
const historyDiv = document.getElementById("history");

let gameRunning = false,
  userInGame = false,
  userCashedOut = false;
let currentMultiplier = 1.0,
  crashPoint = 0,
  startTime = 0,
  animationId = null;
let saldoActual = 0,
  userBet = 0,
  maxX = 5,
  maxY = 2;

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosUsuario();
  cargarHistorialDesdeDB();
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
});

// Funciones de utilidad para los botones del HTML
function setBet(v) {
  betInput.value = v;
}
function doubleBet() {
  betInput.value = (parseFloat(betInput.value) * 2).toFixed(0);
}

function cargarHistorialDesdeDB() {
  fetch("../../api.php?action=get_transactions&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.success && data.transacciones) {
        historyDiv.innerHTML = "";
        const crashes = data.transacciones
          .map((t) => {
            try {
              return JSON.parse(t.detalles_json);
            } catch (e) {
              return null;
            }
          })
          .filter((d) => d && d.multiplicador)
          .slice(0, 8);
        if (crashes.length > 0)
          crashes.forEach((c) => agregarBadge(parseFloat(c.multiplicador)));
      }
    });
}

function agregarBadge(val) {
  const span = document.createElement("span");
  span.className = `badge ${val >= 2 ? "bg-success" : "bg-danger"} p-2 shadow-sm me-1 mb-1`;
  span.textContent = val.toFixed(2) + "x";
  historyDiv.prepend(span);
}

function cargarDatosUsuario() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        walletDisplay.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

btnAction.addEventListener("click", () => {
  if (!gameRunning) empezarPartida();
  else if (userInGame && !userCashedOut) cobrar();
});

function empezarPartida() {
  const bet = parseFloat(betInput.value);
  if (isNaN(bet) || bet <= 0 || bet > saldoActual)
    return alert("Saldo insuficiente.");

  saldoActual -= bet;
  walletDisplay.textContent = saldoActual.toFixed(2) + " €";

  userBet = bet;
  userInGame = true;
  userCashedOut = false;
  gameRunning = true;
  currentMultiplier = 1.0;
  maxX = 5;
  maxY = 2;
  startTime = Date.now();

  if (window.AudioManager) AudioManager.play("spin");

  crashPoint = Math.max(1.01, 0.99 / (1 - Math.random()));
  if (crashPoint > 40) crashPoint = 40;

  btnAction.className =
    "btn btn-warning w-100 py-4 fw-bold fs-4 border-0 pulse-anim";
  btnAction.innerHTML = "💰 COBRAR";
  statusText.textContent = "COHETE EN VUELO";
  statusText.className = "text-warning fw-bold text-uppercase";

  loop();
}

function loop() {
  if (!gameRunning) return;
  const elapsed = (Date.now() - startTime) / 1000;
  currentMultiplier = Math.pow(1.06, elapsed * 10) / 10 + 0.9;
  multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";

  if (currentMultiplier >= crashPoint) {
    explotar();
    return;
  }

  if (elapsed > maxX * 0.8) maxX = elapsed / 0.8;
  if (currentMultiplier > maxY * 0.8) maxY = currentMultiplier / 0.8;

  render(elapsed, currentMultiplier);
  animationId = requestAnimationFrame(loop);
}

function render(elapsed, mult) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width - 80,
    h = canvas.height - 80;
  const x = (elapsed / maxX) * w,
    y = canvas.height - (mult / maxY) * h;

  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#f1c40f";
  ctx.lineCap = "round";
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#f1c40f";
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function cobrar() {
  if (userCashedOut || !gameRunning) return;
  userCashedOut = true;
  const finalMult = currentMultiplier;
  const win = userBet * finalMult;

  btnAction.className = "btn btn-secondary w-100 py-4 fw-bold fs-4 border-0";
  btnAction.innerHTML = `+${win.toFixed(2)}€`;
  btnAction.disabled = true;

  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("win");
  }
  if (window.ConfettiManager) ConfettiManager.celebrate();

  actualizarAPI(userBet, win, finalMult);
}

function explotar() {
  gameRunning = false;
  cancelAnimationFrame(animationId);

  multiplierDisplay.textContent = crashPoint.toFixed(2) + "x";
  multiplierDisplay.style.color = "#e74c3c";
  statusText.textContent = "💥 EXPLOTÓ";
  statusText.className = "text-danger fw-bold";

  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("explosion");
  }

  if (!userCashedOut) {
    btnAction.className = "btn btn-danger w-100 py-4 fw-bold fs-4 border-0";
    btnAction.innerHTML = "¡PERDISTE!";
    btnAction.disabled = true;
    actualizarAPI(userBet, 0, crashPoint);
  }

  agregarBadge(crashPoint);
  if (historyDiv.children.length > 8) historyDiv.lastChild.remove();

  // RESET TOTAL INFALIBLE TRAS 3 SEGUNDOS
  setTimeout(() => {
    resetGame();
  }, 3000);
}

function resetGame() {
  multiplierDisplay.style.color = "white";
  multiplierDisplay.textContent = "1.00x";
  btnAction.className = "btn btn-success w-100 py-4 fw-bold fs-4 border-0";
  btnAction.innerHTML = "APOSTAR";
  btnAction.disabled = false;
  btnAction.classList.remove("pulse-anim");
  statusText.textContent = "Esperando...";
  statusText.className = "text-secondary small tracking-widest";
  userInGame = false;
  userCashedOut = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function actualizarAPI(bet, win, mult) {
  fetch("../../api.php?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "Crash Rocket",
      bet: bet,
      win: win,
      details: { multiplicador: mult.toFixed(2) },
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success) {
        saldoActual = parseFloat(d.new_balance);
        walletDisplay.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

function resizeCanvas() {
  const p = canvas.parentElement;
  canvas.width = p.clientWidth;
  canvas.height = p.clientHeight;
}
