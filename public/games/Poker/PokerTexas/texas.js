/* public/games/Poker/PokerTexas/texas.js */
const suits = ["♥", "♦", "♣", "♠"];
const values = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const valueMap = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};
const API_PATH = "/CasinoDaw/public/api.php";

let deck = [],
  playerCards = [],
  dealerCards = [],
  communityCards = [],
  currentPhase = "BETTING",
  saldoActual = 0,
  apuestaActual = 0;
const btnAction = document.getElementById("btnAction"),
  btnFold = document.getElementById("btnFold"),
  msgBox = document.getElementById("poker-message"),
  phaseBox = document.getElementById("game-phase"),
  walletNav = document.getElementById("nav-saldo");

document.addEventListener("DOMContentLoaded", cargarSaldo);

function cargarSaldo() {
  fetch(API_PATH + "?action=get_user_info&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        if (walletNav) walletNav.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

function initDeck() {
  deck = [];
  for (let s of suits) {
    for (let v of values) deck.push({ v, s });
  }
  deck.sort(() => Math.random() - 0.5);
}

btnAction.addEventListener("click", () => {
  if (window.AudioManager) AudioManager.play("click");
  switch (currentPhase) {
    case "BETTING":
      iniciarPartida();
      break;
    case "PREFLOP":
      mostrarFlop();
      break;
    case "FLOP":
      mostrarTurn();
      break;
    case "TURN":
      mostrarRiver();
      break;
    case "RIVER":
      resolverPartida();
      break;
    case "SHOWDOWN":
      reiniciarMesa();
      break;
  }
});

btnFold.addEventListener("click", () => {
  if (window.AudioManager) AudioManager.play("loss");
  msgBox.textContent = "TE HAS RETIRADO.";
  registrarResultado(apuestaActual, 0);
  reiniciarMesa();
});

function iniciarPartida() {
  const amount = parseFloat(document.getElementById("betAmount").value);
  if (isNaN(amount) || amount <= 0 || amount > saldoActual)
    return alert("Apuesta no válida");
  apuestaActual = amount;
  initDeck();
  if (window.AudioManager) AudioManager.play("card");
  playerCards = [deck.pop(), deck.pop()];
  dealerCards = [deck.pop(), deck.pop()];
  communityCards = [];
  renderCards("player-cards", playerCards);
  renderCards("dealer-cards", [{}, {}], true);
  document.getElementById("community-area").innerHTML =
    '<span class="text-white-50 small">REPARTIENDO...</span>';
  currentPhase = "PREFLOP";
  btnAction.textContent = "VER FLOP";
  btnFold.classList.remove("d-none");
  msgBox.textContent = "CARTAS RECIBIDAS";
  phaseBox.textContent = "PRE-FLOP";
}

function mostrarFlop() {
  if (window.AudioManager) AudioManager.play("card");
  communityCards.push(deck.pop(), deck.pop(), deck.pop());
  renderCards("community-area", communityCards);
  currentPhase = "FLOP";
  btnAction.textContent = "VER TURN";
  phaseBox.textContent = "EL FLOP";
}
function mostrarTurn() {
  if (window.AudioManager) AudioManager.play("card");
  communityCards.push(deck.pop());
  renderCards("community-area", communityCards);
  currentPhase = "TURN";
  btnAction.textContent = "VER RIVER";
  phaseBox.textContent = "EL TURN";
}
function mostrarRiver() {
  if (window.AudioManager) AudioManager.play("card");
  communityCards.push(deck.pop());
  renderCards("community-area", communityCards);
  currentPhase = "RIVER";
  btnAction.textContent = "RESULTADO FINAL";
  phaseBox.textContent = "EL RIVER";
}

function resolverPartida() {
  if (window.AudioManager) AudioManager.play("card");
  renderCards("dealer-cards", dealerCards);
  const pEval = evaluateTexasHand(playerCards, communityCards),
    dEval = evaluateTexasHand(dealerCards, communityCards);
  let premio = 0;
  if (pEval.tieBreakScore > dEval.tieBreakScore) {
    premio = apuestaActual * 2;
    msgBox.textContent = `🏆 ¡GANASTE! con ${pEval.name}`;
    msgBox.className = "text-success fw-bold fs-3";
    if (window.AudioManager) AudioManager.play("win");
    if (window.ConfettiManager) ConfettiManager.celebrate(); // Confeti victoria
  } else if (pEval.tieBreakScore < dEval.tieBreakScore) {
    premio = 0;
    msgBox.textContent = `❌ BANCA GANA con ${dEval.name}`;
    msgBox.className = "text-danger fw-bold fs-3";
    if (window.AudioManager) AudioManager.play("loss");
  } else {
    premio = apuestaActual;
    msgBox.textContent = `🤝 EMPATE: Ambos ${pEval.name}`;
    msgBox.className = "text-warning fw-bold fs-3";
    if (window.AudioManager) AudioManager.play("chips");
  }
  registrarResultado(apuestaActual, premio);
  currentPhase = "SHOWDOWN";
  btnAction.textContent = "NUEVA PARTIDA";
  btnFold.classList.add("d-none");
}

function evaluateTexasHand(hole, community) {
  const all = [...hole, ...community],
    vNums = all.map((c) => valueMap[c.v]).sort((a, b) => b - a),
    suitsCount = {},
    counts = {};
  all.forEach((c) => {
    suitsCount[c.s] = (suitsCount[c.s] || 0) + 1;
    counts[c.v] = (counts[c.v] || 0) + 1;
  });
  const isFlush = Object.values(suitsCount).some((s) => s >= 5);
  let uniqueValues = [...new Set(vNums)];
  if (uniqueValues.includes(14)) uniqueValues.push(1);
  uniqueValues.sort((a, b) => b - a);
  let isStraight = false,
    straightHigh = 0;
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[i];
      break;
    }
  }
  const pairValues = Object.entries(counts)
    .filter(([v, c]) => c === 2)
    .map(([v]) => valueMap[v])
    .sort((a, b) => b - a);
  const trioValue = Object.entries(counts).find(([v, c]) => c === 3),
    pokerValue = Object.entries(counts).find(([v, c]) => c === 4);
  let score = 0,
    name = "Carta Alta",
    mainVal = vNums[0];
  if (isFlush && isStraight && straightHigh === 14) {
    score = 9;
    name = "Escalera Real";
  } else if (isFlush && isStraight) {
    score = 8;
    name = "Escalera de Color";
    mainVal = straightHigh;
  } else if (pokerValue) {
    score = 7;
    name = "Póker";
    mainVal = valueMap[pokerValue[0]];
  } else if (
    trioValue &&
    (pairValues.length >= 1 ||
      Object.values(counts).filter((c) => c === 3).length > 1)
  ) {
    score = 6;
    name = "Full House";
    mainVal = valueMap[trioValue[0]];
  } else if (isFlush) {
    score = 5;
    name = "Color";
    mainVal = vNums[0];
  } else if (isStraight) {
    score = 4;
    name = "Escalera";
    mainVal = straightHigh;
  } else if (trioValue) {
    score = 3;
    name = "Trío";
    mainVal = valueMap[trioValue[0]];
  } else if (pairValues.length >= 2) {
    score = 2;
    name = "Doble Pareja";
    mainVal = pairValues[0];
  } else if (pairValues.length === 1) {
    score = 1;
    name = "Pareja";
    mainVal = pairValues[0];
  }
  let tieBreakScore = score * Math.pow(15, 6) + mainVal * Math.pow(15, 5);
  vNums.slice(0, 5).forEach((val, i) => {
    tieBreakScore += val * Math.pow(15, 4 - i);
  });
  return { score, name, tieBreakScore };
}

function renderCards(id, cards, hide = false) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  cards.forEach((c) => {
    const div = document.createElement("div");
    div.className = hide
      ? "card-texas back deal-anim"
      : `card-texas ${c.s === "♥" || c.s === "♦" ? "red" : "black"} deal-anim`;
    if (!hide)
      div.innerHTML = `<div>${c.v}</div><div class="suit-center">${c.s}</div><div class="text-end">${c.v}</div>`;
    container.appendChild(div);
  });
}

function registrarResultado(bet, win) {
  fetch(API_PATH + "?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bet, win, game: "Texas Hold'em" }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success) {
        saldoActual = d.new_balance;
        if (walletNav)
          walletNav.textContent = parseFloat(saldoActual).toFixed(2) + " €";
      }
    });
}

function reiniciarMesa() {
  if (window.AudioManager) AudioManager.play("click");
  currentPhase = "BETTING";
  btnAction.textContent = "REPARTIR";
  msgBox.textContent = "HAGA SU APUESTA";
  msgBox.className = "text-warning fw-bold fs-3";
  phaseBox.textContent = "ESPERANDO";
  document.getElementById("community-area").innerHTML =
    '<span class="text-white-50 small opacity-50">FLOP · TURN · RIVER</span>';
  renderCards("player-cards", [{}, {}], true);
  renderCards("dealer-cards", [{}, {}], true);
}
