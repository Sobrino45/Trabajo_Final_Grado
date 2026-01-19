/* public/games/Poker/PokerClassic/poker.js */

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

let deck = [];
let playerHand = [];
let dealerHand = [];
let holds = [false, false, false, false, false];
let gameState = "BETTING";
let saldoActual = 0;

const btnAction = document.getElementById("btnAction");
const cardsContainer = document.getElementById("cards-container");
const dealerContainer = document.getElementById("dealer-cards");
const msgBox = document.getElementById("poker-message");
const betInput = document.getElementById("betAmount");

document.addEventListener("DOMContentLoaded", () => {
  cargarSaldo();
});

function cargarSaldo() {
  fetch(API_PATH + "?action=get_user_info&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        const navSaldo = document.getElementById("nav-saldo");
        if (navSaldo) navSaldo.textContent = saldoActual.toFixed(2) + " €";
      }
    });
}

function createDeck() {
  deck = [];
  for (let s of suits) {
    for (let v of values) {
      deck.push({ value: v, suit: s });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

btnAction.addEventListener("click", () => {
  if (gameState === "BETTING") {
    const apuesta = parseFloat(betInput.value);
    if (apuesta > saldoActual) return alert("Saldo insuficiente");
    if (window.AudioManager) AudioManager.play("click");
    iniciarMano();
  } else if (gameState === "DISCARDING") {
    if (window.AudioManager) AudioManager.play("click");
    finalizarMano();
  }
});

function iniciarMano() {
  createDeck();
  playerHand = [];
  dealerHand = [];
  holds = [false, false, false, false, false];

  // SONIDO DE REPARTO INICIAL
  if (window.AudioManager) AudioManager.play("card");

  for (let i = 0; i < 5; i++) {
    playerHand.push(deck.pop());
    dealerHand.push(deck.pop());
  }

  gameState = "DISCARDING";
  btnAction.textContent = "CAMBIAR CARTAS";
  msgBox.textContent = "MANTÉN TUS MEJORES CARTAS";
  renderHands(false);
}

function renderHands(revealDealer) {
  cardsContainer.innerHTML = "";
  playerHand.forEach((card, index) => {
    const div = createCardUI(card, isRed(card.suit), holds[index]);
    div.onclick = () => {
      if (gameState === "DISCARDING") {
        if (window.AudioManager) AudioManager.play("card");
        holds[index] = !holds[index];
        renderHands(false);
      }
    };
    cardsContainer.appendChild(div);
  });

  dealerContainer.innerHTML = "";
  dealerHand.forEach((card) => {
    if (revealDealer) {
      dealerContainer.appendChild(createCardUI(card, isRed(card.suit), false));
    } else {
      const back = document.createElement("div");
      back.className = "poker-card back";
      dealerContainer.appendChild(back);
    }
  });
}

function createCardUI(card, red, isHeld) {
  const div = document.createElement("div");
  div.className = `poker-card ${red ? "red" : "black"} ${isHeld ? "held" : ""}`;
  div.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
        ${isHeld ? '<div class="hold-badge">HOLD</div>' : ""}
    `;
  return div;
}

function isRed(s) {
  return s === "♥" || s === "♦";
}

function finalizarMano() {
  // SONIDO DE NUEVAS CARTAS TRAS EL DESCARTE
  if (window.AudioManager) AudioManager.play("card");

  for (let i = 0; i < 5; i++) {
    if (!holds[i]) playerHand[i] = deck.pop();
  }

  const evalDealerInit = evaluateHand(dealerHand);
  if (evalDealerInit.score < 1) {
    for (let i = 0; i < 3; i++) dealerHand[i] = deck.pop();
  }

  renderHands(true);

  const pEval = evaluateHand(playerHand);
  const dEval = evaluateHand(dealerHand);
  const apuesta = parseFloat(betInput.value);
  let win = 0;
  let finalMsg = "";

  if (pEval.tieBreakScore > dEval.tieBreakScore) {
    win = apuesta * 2;
    finalMsg = `🏆 ¡GANASTE! con ${pEval.name}`;
    msgBox.className = "text-success fw-bold fs-4";
    if (window.AudioManager) AudioManager.play("win"); //
  } else if (pEval.tieBreakScore < dEval.tieBreakScore) {
    win = 0;
    finalMsg = `❌ BANCA GANA con ${dEval.name}`;
    msgBox.className = "text-danger fw-bold fs-4";
    if (window.AudioManager) AudioManager.play("loss"); //
  } else {
    win = apuesta;
    finalMsg = "🤝 EMPATE (PUSH)";
    msgBox.className = "text-warning fw-bold fs-4";
    if (window.AudioManager) AudioManager.play("chips");
  }

  msgBox.textContent = finalMsg;

  fetch(API_PATH + "?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bet: apuesta, win: win, game: "Poker Classic" }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        saldoActual = data.new_balance;
        const navSaldo = document.getElementById("nav-saldo");
        if (navSaldo)
          navSaldo.textContent = parseFloat(saldoActual).toFixed(2) + " €";
      }
    });

  gameState = "BETTING";
  btnAction.textContent = "NUEVA MANO";
}

function evaluateHand(h) {
  const counts = {};
  const suitsCount = {};
  const vNums = h.map((c) => valueMap[c.value]).sort((a, b) => b - a);

  h.forEach((c) => {
    counts[c.value] = (counts[c.value] || 0) + 1;
    suitsCount[c.suit] = (suitsCount[c.suit] || 0) + 1;
  });

  const isFlush = Object.values(suitsCount).some((c) => c === 5);
  const isStraight = vNums.every((v, i) => i === 0 || v === vNums[i - 1] - 1);

  const pairValues = Object.keys(counts)
    .filter((v) => counts[v] === 2)
    .map((v) => valueMap[v])
    .sort((a, b) => b - a);
  const trioValue = Object.keys(counts).find((v) => counts[v] === 3);
  const pokerValue = Object.keys(counts).find((v) => counts[v] === 4);

  let score = 0;
  let name = "Carta Alta";
  let tieValue = vNums[0];

  if (isFlush && isStraight && vNums[0] === 14) {
    score = 9;
    name = "Escalera Real";
  } else if (isFlush && isStraight) {
    score = 8;
    name = "Escalera de Color";
    tieValue = vNums[0];
  } else if (pokerValue) {
    score = 7;
    name = "Póker";
    tieValue = valueMap[pokerValue];
  } else if (trioValue && pairValues.length > 0) {
    score = 6;
    name = "Full House";
    tieValue = valueMap[trioValue];
  } else if (isFlush) {
    score = 5;
    name = "Color";
    tieValue = vNums[0];
  } else if (isStraight) {
    score = 4;
    name = "Escalera";
    tieValue = vNums[0];
  } else if (trioValue) {
    score = 3;
    name = "Trío";
    tieValue = valueMap[trioValue];
  } else if (pairValues.length === 2) {
    score = 2;
    name = "Doble Pareja";
    tieValue = pairValues[0];
  } else if (pairValues.length === 1) {
    score = 1;
    name = "Pareja";
    tieValue = pairValues[0];
  }

  const tieBreakScore = score * 1000000 + tieValue * 1000 + vNums[0];
  return { score, name, tieBreakScore };
}
