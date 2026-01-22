/* public/games/Crash/crash.js */
const canvas = document.getElementById("crashGraph");
const ctx = canvas.getContext("2d");
const multiplierDisplay = document.getElementById("multiplierDisplay");
const statusText = document.getElementById("statusText");
const btnAction = document.getElementById("btnAction");
const betInput = document.getElementById("betInput");
const autoCashoutInput = document.getElementById("autoCashoutInput");
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
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  historyDiv.innerHTML =
    '<small class="text-white-50">Esperando resultados...</small>';
});

function cargarDatosUsuario() {
  fetch("../../api.php?action=get_user_info&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        walletDisplay.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

btnAction.addEventListener("click", () => {
  if (!gameRunning) prepararPartida();
  else if (userInGame && !userCashedOut) cobrarGanancia();
});

function prepararPartida() {
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
  if (window.AudioManager) AudioManager.play("spin");
  crashPoint = Math.max(1.01, 0.99 / (1 - Math.random()));
  if (crashPoint > 40) crashPoint = 40;
  btnAction.classList.replace("btn-success", "btn-warning");
  btnAction.innerHTML = "💰 RETIRAR";
  statusText.textContent = "¡SUBIENDO!";
  statusText.className = "text-warning fw-bold text-uppercase";
  startTime = Date.now();
  requestAnimationFrame(animarJuego);
}

function animarJuego() {
  if (!gameRunning) return;
  const elapsed = (Date.now() - startTime) / 1000;
  currentMultiplier = Math.pow(1.06, elapsed * 10) / 10 + 0.9;
  multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";
  if (currentMultiplier >= crashPoint) {
    finalizarPorExplosion();
    return;
  }
  if (autoCashoutInput && autoCashoutInput.value) {
    const autoValue = parseFloat(autoCashoutInput.value);
    if (!userCashedOut && autoValue > 1.0 && currentMultiplier >= autoValue)
      cobrarGanancia();
  }
  if (elapsed > maxX * 0.7) maxX = elapsed / 0.7;
  if (currentMultiplier > maxY * 0.7) maxY = currentMultiplier / 0.7;
  dibujarGrafico(elapsed, currentMultiplier);
  animationId = requestAnimationFrame(animarJuego);
}

function dibujarGrafico(elapsed, mult) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width - 100,
    h = canvas.height - 100;
  const x = (elapsed / maxX) * w,
    y = canvas.height - (mult / maxY) * h;
  ctx.beginPath();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#f1c40f";
  ctx.lineCap = "round";
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#f1c40f";
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function cobrarGanancia() {
  if (userCashedOut || !gameRunning) return;
  userCashedOut = true;
  const multCapturado = currentMultiplier;
  const premio = userBet * multCapturado;
  btnAction.classList.replace("btn-warning", "btn-secondary");
  btnAction.innerHTML = `✅ RECIBIDO: ${premio.toFixed(2)}€`;
  btnAction.disabled = true;
  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("win");
  }
  if (window.ConfettiManager) ConfettiManager.celebrate(); // Confeti al cobrar
  enviarResultado(userBet, premio, multCapturado);
}

function finalizarPorExplosion() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  multiplierDisplay.textContent = crashPoint.toFixed(2) + "x";
  multiplierDisplay.style.color = "#e74c3c";
  statusText.textContent = "💥 ¡EXPLOTÓ!";
  statusText.className = "text-danger fw-bold";
  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("explosion");
  }
  if (!userCashedOut) {
    btnAction.classList.replace("btn-warning", "btn-danger");
    btnAction.innerHTML = "PERDISTE";
    btnAction.disabled = true;
    enviarResultado(userBet, 0, crashPoint);
  }
  actualizarHistorialVisual(crashPoint);
  setTimeout(() => {
    multiplierDisplay.style.color = "white";
    btnAction.className = "btn btn-success w-100 py-4 fw-bold fs-4";
    btnAction.innerHTML = "APOSTAR";
    btnAction.disabled = false;
    statusText.textContent = "Esperando...";
    userInGame = false;
  }, 3000);
}

function enviarResultado(apuesta, ganancia, mult) {
  fetch("../../api.php?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "Crash Rocket",
      bet: apuesta,
      win: ganancia,
      details: { multiplicador: mult.toFixed(2) },
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        saldoActual = parseFloat(data.new_balance);
        walletDisplay.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

function actualizarHistorialVisual(val) {
  if (historyDiv.querySelector("small")) historyDiv.innerHTML = "";
  const span = document.createElement("span");
  span.className = `badge ${val >= 2 ? "bg-success" : "bg-danger"} p-2`;
  span.textContent = val.toFixed(2) + "x";
  historyDiv.prepend(span);
  if (historyDiv.children.length > 8) historyDiv.lastChild.remove();
}

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}
