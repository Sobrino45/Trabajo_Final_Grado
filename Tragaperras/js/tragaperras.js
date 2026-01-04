const symbols = [
  { icon: "🍒", weight: 40 },
  { icon: "🍋", weight: 30 },
  { icon: "🔔", weight: 15 },
  { icon: "⭐", weight: 10 },
  { icon: "💎", weight: 5 }
];

const payouts = {
  "💎": 50,
  "⭐": 30,
  "🔔": 20,
  "🍒": 10
};

let credits = 100;
const costPerSpin = 5;

const reels = document.querySelectorAll(".reel");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result");
const creditsText = document.getElementById("credits");
const paytable = document.getElementById("paytable");
const paytableBtn = document.getElementById("paytableBtn");

spinBtn.addEventListener("click", spin);
paytableBtn.addEventListener("click", togglePaytable);

function spin() {
  if (credits < costPerSpin) {
    resultText.textContent = "❌ No tienes créditos suficientes";
    resultText.className = "result lose";
    return;
  }

  credits -= costPerSpin;
  updateCredits();
  resultText.textContent = "";

  reels.forEach(r => r.classList.add("spinning"));
  spinBtn.disabled = true;

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
  if (result.every(s => s === result[0]) && payouts[result[0]]) {
    const prize = payouts[result[0]];
    credits += prize;
    updateCredits();
    resultText.textContent = `🎉 ¡Has ganado ${prize} créditos!`;
    resultText.className = "result win";
  } else {
    resultText.textContent = "❌ No hay premio";
    resultText.className = "result lose";
  }
}

function updateCredits() {
  creditsText.textContent = credits;
}

function togglePaytable() {
  paytable.classList.toggle("d-none");
}
