const canvas = document.getElementById("crashGraph");
const ctx = canvas.getContext("2d");
const multiplierDisplay = document.getElementById("multiplierDisplay");
const statusText = document.getElementById("statusText");
const btnAction = document.getElementById("btnAction");
const betInput = document.getElementById("betInput");
const walletDisplay = document.getElementById("walletDisplay");
const historyDiv = document.getElementById("history");

let gameRunning = false;
let userBet = 0;
let userInGame = false;
let userCashedOut = false;
let currentMultiplier = 1.0;
let crashPoint = 0;
let animationId;
let startTime;
let saldoActual = 0;

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosUsuario();
  resizeCanvas();
  drawIdleGraph();
});

function cargarDatosUsuario() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        updateWalletVisuals();
      } else {
        window.location.href = "../../login.html";
      }
    });
}

window.addEventListener("resize", resizeCanvas);

btnAction.addEventListener("click", () => {
  if (gameRunning) {
    if (userInGame && !userCashedOut) cashOut();
  } else startGame();
});

function startGame() {
  const bet = parseFloat(betInput.value);
  if (isNaN(bet) || bet <= 0) return alert("Apuesta inválida");
  if (saldoActual < bet) return alert("Saldo insuficiente");

  // SONIDOS DE INICIO
  if (window.AudioManager) {
    AudioManager.play("click");
    AudioManager.play("spin"); // Sonido de motor/subida
  }

  userBet = bet;
  userInGame = true;
  userCashedOut = false;
  gameRunning = true;
  currentMultiplier = 1.0;

  const r = Math.random();
  crashPoint = 0.99 / (1 - r);
  if (crashPoint > 100) crashPoint = 100;
  if (Math.random() < 0.03) crashPoint = 1.0;

  btnAction.classList.replace("btn-success", "btn-warning");
  btnAction.innerHTML = "💰 RETIRAR";
  statusText.textContent = "¡SUBIENDO!";
  startTime = Date.now();
  animate();
}

function animate() {
  if (!gameRunning) return;
  const elapsed = (Date.now() - startTime) / 1000;
  currentMultiplier = 1 + Math.pow(elapsed, 2) / 10;
  multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";

  if (currentMultiplier >= crashPoint) {
    gameOver();
    return;
  }
  drawGraph(elapsed);
  animationId = requestAnimationFrame(animate);
}

function cashOut() {
  userCashedOut = true;
  userInGame = false;
  const winAmount = userBet * currentMultiplier;

  // DETENER MOTOR Y SONIDO DE VICTORIA
  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("win");
  }

  fetch("../../api.php?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "Crash Rocket",
      bet: userBet,
      win: winAmount,
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        saldoActual = parseFloat(data.new_balance);
        updateWalletVisuals();
      }
    });

  btnAction.classList.replace("btn-warning", "btn-secondary");
  btnAction.disabled = true;
  btnAction.innerHTML = `✅ GANADO: ${winAmount.toFixed(2)}€`;
}

function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animationId);

  // DETENER MOTOR Y SONIDO DE EXPLOSIÓN
  if (window.AudioManager) {
    AudioManager.stop("spin");
    AudioManager.play("explosion");
  }

  multiplierDisplay.textContent = crashPoint.toFixed(2) + "x";
  statusText.textContent = "💥 CRASHED!";
  statusText.className = "text-danger fw-bold";
  btnAction.disabled = false;

  if (!userCashedOut && userInGame) {
    btnAction.innerHTML = "PERDISTE";
    btnAction.className = "btn btn-danger w-100";
    fetch("../../api.php?action=game_result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: "Crash Rocket", bet: userBet, win: 0 }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          saldoActual = d.new_balance;
          updateWalletVisuals();
        }
      });
  } else {
    btnAction.className = "btn btn-success w-100";
    btnAction.innerHTML = "JUGAR DE NUEVO";
  }
  addToHistory(crashPoint);
}

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
}

function drawGraph(elapsed) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const x = elapsed * 30;
  const y = canvas.height - Math.pow(elapsed, 2) * 5;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(x, y);
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawIdleGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function updateWalletVisuals() {
  walletDisplay.textContent = parseFloat(saldoActual).toFixed(2) + " €";
}
function addToHistory(val) {
  const span = document.createElement("span");
  span.className = `badge ${val >= 2 ? "bg-success" : "bg-danger"} me-1`;
  span.textContent = val.toFixed(2) + "x";
  historyDiv.prepend(span);
}
