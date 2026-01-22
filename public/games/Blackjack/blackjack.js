/* public/games/Blackjack/blackjack.js */
const API_JAVA = "http://localhost:8080/api/blackjack";
let gameId = null;
let saldoActual = 0;
const walletDisplay = document.getElementById("walletDisplay");
const bettingPanel = document.getElementById("betting-panel");
const actionPanel = document.getElementById("action-panel");
const msgBox = document.getElementById("game-message");
const statusBadge = document.getElementById("server-status");

document.addEventListener("DOMContentLoaded", () => {
  cargarSaldoDesdeBD();
  verificarMotorJava();
});

async function verificarMotorJava() {
  try {
    await fetch(API_JAVA + "/health", { method: "GET" });
    statusBadge.textContent = "🟢 Motor Java Activo";
    statusBadge.className = "ms-3 badge bg-success text-white";
  } catch (e) {
    statusBadge.textContent = "🔴 Motor Java Desconectado";
    statusBadge.className = "ms-3 badge bg-danger text-white";
  }
}

function cargarSaldoDesdeBD() {
  fetch("../../api.php?action=get_user_info&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        actualizarSaldoVisual();
      } else {
        window.location.href = "../../login.html";
      }
    });
}

document.getElementById("btnDeal").addEventListener("click", () => {
  const apuesta = parseInt(document.getElementById("betAmount").value);
  if (apuesta < 10) return alert("Apuesta mínima 10€");
  if (apuesta > saldoActual) return alert("Saldo insuficiente.");
  if (window.AudioManager) AudioManager.play("click");
  fetch(`${API_JAVA}/start?apuesta=${apuesta}`, { method: "POST" })
    .then((r) => r.json())
    .then((data) => {
      gameId = data.id;
      bettingPanel.classList.add("d-none");
      actionPanel.classList.remove("d-none");
      msgBox.classList.add("d-none");
      actualizarMesa(data);
    })
    .catch(() => alert("Error al iniciar. ¿Está encendido el servidor Java?"));
});

document
  .getElementById("btnHit")
  .addEventListener("click", () => enviarAccion("hit"));
document
  .getElementById("btnStand")
  .addEventListener("click", () => enviarAccion("stand"));
document
  .getElementById("btnDouble")
  .addEventListener("click", () => enviarAccion("double"));

function enviarAccion(accion) {
  if (window.AudioManager) AudioManager.play("click");
  fetch(`${API_JAVA}/${accion}?id=${gameId}`, { method: "POST" })
    .then((r) => r.json())
    .then((data) => actualizarMesa(data));
}

function actualizarMesa(data) {
  if (window.AudioManager) AudioManager.play("card");
  const dealerCardsDiv = document.getElementById("dealer-cards");
  const playerCardsDiv = document.getElementById("player-cards");
  if (data.estado !== "JUGANDO") {
    renderizarMano(dealerCardsDiv, data.cartasCroupier);
  } else {
    renderizarMano(dealerCardsDiv, [data.cartaCroupierVisible], true);
  }
  renderizarMano(playerCardsDiv, data.cartasJugador);
  document.getElementById("player-score").textContent = data.puntosJugador;
  document.getElementById("dealer-score").textContent =
    data.estado !== "JUGANDO" ? data.puntosCroupier : "?";
  if (data.estado !== "JUGANDO") finalizarPartida(data);
}

function renderizarMano(container, cartas, conDorso = false) {
  container.innerHTML = "";
  if (!cartas) return;
  cartas.forEach((c) => {
    const div = document.createElement("div");
    const esRoja = ["♥", "♦", "HEARTS", "DIAMONDS"].includes(c.palo);
    let s = c.palo;
    if (s === "HEARTS") s = "♥";
    if (s === "DIAMONDS") s = "♦";
    if (s === "CLUBS") s = "♣";
    if (s === "SPADES") s = "♠";
    div.className = `carta ${esRoja ? "roja" : "negra"}`;
    div.innerHTML = `<div class="top">${c.rango}${s}</div><div class="center">${s}</div><div class="bottom">${c.rango}${s}</div>`;
    container.appendChild(div);
  });
  if (conDorso) {
    const dorso = document.createElement("div");
    dorso.className = "carta dorso";
    container.appendChild(dorso);
  }
}

function finalizarPartida(data) {
  actionPanel.classList.add("d-none");
  let win = 0,
    txt = "",
    color = "";
  switch (data.estado) {
    case "GANADOR":
    case "PLAYER_WINS":
      win = data.apuesta * 2;
      txt = "🏆 ¡HAS GANADO!";
      color = "alert-success";
      if (window.AudioManager) AudioManager.play("win");
      if (window.ConfettiManager) ConfettiManager.celebrate(); // Confeti normal
      break;
    case "BLACKJACK":
      win = data.apuesta * 2.5;
      txt = "✨ ¡BLACKJACK!";
      color = "alert-info";
      if (window.AudioManager) AudioManager.play("win");
      if (window.ConfettiManager) ConfettiManager.victoryBlast(); // Confeti especial
      break;
    case "EMPATE":
    case "PUSH":
      win = data.apuesta;
      txt = "🤝 EMPATE";
      color = "alert-warning";
      if (window.AudioManager) AudioManager.play("chips");
      break;
    default:
      win = 0;
      txt = "❌ HAS PERDIDO";
      color = "alert-danger";
      if (window.AudioManager) AudioManager.play("loss");
      break;
  }
  msgBox.textContent = txt;
  msgBox.className = `alert ${color} d-block animate__animated animate__pulse`;
  fetch("../../api.php?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bet: data.apuesta, win: win, game: "Blackjack" }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (res.success) {
        saldoActual = res.new_balance;
        actualizarSaldoVisual();
      }
    });
  setTimeout(() => {
    msgBox.classList.add("d-none");
    bettingPanel.classList.remove("d-none");
  }, 4000);
}

function actualizarSaldoVisual() {
  walletDisplay.textContent = parseFloat(saldoActual).toFixed(2) + " €";
}
