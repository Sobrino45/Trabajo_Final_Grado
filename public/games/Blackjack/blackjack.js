/* CasinoDaw/Blackjack/game.js */

// 1. CONFIGURACIÓN: Java para el juego, PHP para el dinero
const API_URL = "http://localhost:8080/api/blackjack"; // Lógica de cartas (Java Spring Boot)
let gameId = null;
let saldo = 0;

// 2. ELEMENTOS DOM
const btnDeal = document.getElementById("btnDeal");
const btnHit = document.getElementById("btnHit");
const btnStand = document.getElementById("btnStand");
const btnDouble = document.getElementById("btnDouble");
const bettingPanel = document.getElementById("betting-panel");
const actionPanel = document.getElementById("action-panel");
const dealerCardsDiv = document.getElementById("dealer-cards");
const playerCardsDiv = document.getElementById("player-cards");
const dealerScore = document.getElementById("dealer-score");
const playerScore = document.getElementById("player-score");
const msgBox = document.getElementById("game-message");
const statusServer = document.getElementById("server-status");

/* ================= INICIO ================= */
document.addEventListener("DOMContentLoaded", () => {
  cargarSaldo();
  checkServer();
});

// Comprobar si el servidor Java (Motor del juego) está encendido
async function checkServer() {
  try {
    // Hacemos una petición ligera para ver si responde
    await fetch(API_URL + "/health", { method: "HEAD" }).catch(() => {});
    // Si no salta al catch, asumimos que está vivo (o lo veremos al intentar jugar)
    statusServer.textContent = "🟢 Motor Java listo";
    statusServer.className = "text-success small";
  } catch (e) {
    statusServer.textContent =
      "🔴 Error: Enciende el servidor Java (puerto 8080)";
    statusServer.className = "text-danger fw-bold small";
  }
}

// Cargar saldo desde PHP (Base de Datos MySQL)
function cargarSaldo() {
  // CORREGIDO: Ruta absoluta al router PHP
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((d) => {
      if (d.logged_in) {
        saldo = parseFloat(d.saldo);
        document.getElementById("walletDisplay").textContent =
          saldo.toFixed(2) + " €";
      } else {
        // Si no hay sesión, fuera
        window.location.href = "../../login.html";
      }
    });
}

/* ================= ACCIONES DEL JUEGO ================= */

// REPARTIR (Nueva Partida)
btnDeal.addEventListener("click", () => {
  const apuesta = parseInt(document.getElementById("betAmount").value);

  // Validación básica
  if (isNaN(apuesta) || apuesta < 10) return alert("Apuesta mínima 10€");
  if (apuesta > saldo) return alert("Saldo insuficiente");

  // Llamada a Java para iniciar
  fetch(`${API_URL}/start?apuesta=${apuesta}`, { method: "POST" })
    .then((r) => {
      if (!r.ok) throw new Error("No se pudo conectar con Java (Puerto 8080)");
      return r.json();
    })
    .then((data) => {
      statusServer.textContent = "🟢 Jugando en Java";
      statusServer.className = "text-success small";
      iniciarInterfaz(data);
    })
    .catch((err) => {
      alert("Error crítico: " + err.message);
      console.error(err);
    });
});

// Botones de acción
btnHit.addEventListener("click", () => realizarAccion("hit"));
btnStand.addEventListener("click", () => realizarAccion("stand"));
btnDouble.addEventListener("click", () => realizarAccion("double"));

function realizarAccion(accion) {
  // Llamada a Java para pedir carta, plantarse, etc.
  fetch(`${API_URL}/${accion}?id=${gameId}`, { method: "POST" })
    .then((r) => r.json())
    .then((data) => actualizarMesa(data))
    .catch((err) => console.error("Error en acción:", err));
}

/* ================= ACTUALIZACIÓN VISUAL ================= */

function iniciarInterfaz(data) {
  gameId = data.id;
  bettingPanel.classList.add("d-none");
  actionPanel.classList.remove("d-none");
  msgBox.style.opacity = "0";
  actualizarMesa(data);
}

function actualizarMesa(data) {
  // 1. Renderizar Cartas Croupier
  // Si la partida sigue, Java suele ocultar la 2ª carta o no mandarla.
  // Aquí asumimos que si hay 'cartaCroupierVisible', mostramos esa y un dorso.
  if (data.cartasCroupier && data.cartasCroupier.length > 0) {
    renderMano(dealerCardsDiv, data.cartasCroupier);
  } else if (data.cartaCroupierVisible) {
    renderMano(dealerCardsDiv, [data.cartaCroupierVisible], true); // true = mostrar dorso extra
  }

  // 2. Renderizar Cartas Jugador
  renderMano(playerCardsDiv, data.cartasJugador);

  // 3. Puntuaciones
  playerScore.textContent = data.puntosJugador;
  dealerScore.textContent = data.puntosCroupier > 0 ? data.puntosCroupier : "?";

  // 4. Verificar si terminó
  if (data.estado !== "JUGANDO") {
    finalizarPartida(data);
  }
}

function renderMano(container, cartas, mostrarDorsoExtra = false) {
  container.innerHTML = "";

  cartas.forEach((c) => {
    const cartaDiv = document.createElement("div");
    // Detectar color
    const esRoja =
      c.palo === "♥" ||
      c.palo === "♦" ||
      c.palo === "HEARTS" ||
      c.palo === "DIAMONDS";
    // Mapear símbolos de texto si Java devuelve nombres en inglés
    let paloSimbolo = c.palo;
    if (c.palo === "HEARTS") paloSimbolo = "♥";
    if (c.palo === "DIAMONDS") paloSimbolo = "♦";
    if (c.palo === "CLUBS") paloSimbolo = "♣";
    if (c.palo === "SPADES") paloSimbolo = "♠";

    cartaDiv.className = `carta ${esRoja ? "roja" : "negra"}`;

    cartaDiv.innerHTML = `
            <div class="top">${c.rango} ${paloSimbolo}</div>
            <div class="center display-4">${paloSimbolo}</div>
            <div class="bottom text-end">${c.rango} ${paloSimbolo}</div>
        `;
    container.appendChild(cartaDiv);
  });

  if (mostrarDorsoExtra) {
    const dorso = document.createElement("div");
    dorso.className = "carta bg-danger";
    dorso.style.background =
      "repeating-linear-gradient(45deg, #c0392b 0, #c0392b 10px, #e74c3c 10px, #e74c3c 20px)";
    container.appendChild(dorso);
  }
}

/* ================= FIN DE PARTIDA Y GUARDADO ================= */

function finalizarPartida(data) {
  actionPanel.classList.add("d-none");

  let mensaje = "";
  let claseAlert = "";
  let gananciaTotal = 0; // Lo que el usuario recibe al final

  // Analizar estado devuelto por Java
  if (data.estado === "GANADOR" || data.estado === "PLAYER_WINS") {
    mensaje = `🏆 ¡GANASTE! (+${data.apuesta}€)`;
    claseAlert = "alert-success";
    gananciaTotal = data.apuesta * 2; // Recuperas apuesta + ganancia (1:1)
  } else if (data.estado === "PERDEDOR" || data.estado === "DEALER_WINS") {
    mensaje = `❌ PERDISTE (-${data.apuesta}€)`;
    claseAlert = "alert-danger";
    gananciaTotal = 0;
  } else if (data.estado === "EMPATE" || data.estado === "PUSH") {
    mensaje = `🤝 EMPATE (Recuperas apuesta)`;
    claseAlert = "alert-warning";
    gananciaTotal = data.apuesta; // Recuperas lo puesto
  } else if (data.estado === "BLACKJACK") {
    mensaje = `✨ ¡BLACKJACK! (+${data.apuesta * 1.5}€)`;
    claseAlert = "alert-info";
    gananciaTotal = data.apuesta + data.apuesta * 1.5; // Pago 3:2
  }

  // Mostrar mensaje
  msgBox.textContent = mensaje;
  msgBox.className = `alert ${claseAlert} text-center fw-bold`;
  msgBox.style.opacity = "1";

  // 🚀 SINCRONIZACIÓN CON PHP (Guardar dinero en BD)
  fetch("../../api.php?action=game_logic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "Blackjack",
      bet: data.apuesta,
      win: gananciaTotal,
    }),
  })
    .then((r) => r.json())
    .then((dbData) => {
      if (dbData.success) {
        saldo = parseFloat(dbData.new_balance);
        document.getElementById("walletDisplay").textContent =
          saldo.toFixed(2) + " €";
      } else {
        console.error("Error guardando en BD:", dbData.message);
      }
    })
    .catch((err) => console.error("Error de red PHP:", err));

  // Reiniciar interfaz tras unos segundos
  setTimeout(() => {
    bettingPanel.classList.remove("d-none");
  }, 3000);
}
