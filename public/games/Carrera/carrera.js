const TODA_LA_CUADRA = [
  { id: "h1", icon: "🐎", name: "Relámpago", cuota: 1.5 },
  { id: "h2", icon: "🦄", name: "Fantasma", cuota: 2.5 },
  { id: "h3", icon: "🦓", name: "Zebra", cuota: 3.5 },
  { id: "h4", icon: "🐂", name: "Toro", cuota: 5.0 },
  { id: "h5", icon: "🐪", name: "Camello", cuota: 8.0 },
];
const TRACK_WIDTH_PERCENT = 90;
const PROBABILIDAD_TURBO = 0.3;
const POTENCIA_TURBO = 4.0;

let corredoresActuales = [];
let saldoActual = 0;
let caballoSeleccionado = null;
let carreraEnCurso = false;
let idCaballoConTurbo = null;

const track = document.getElementById("track");
const panelSeleccion = document.getElementById("horseSelection");
const btnStart = document.getElementById("btnStart");
const betInput = document.getElementById("betAmount");
const walletDisplay = document.getElementById("walletDisplay");
const statusText = document.getElementById("raceStatus");
const btnNewRace = document.getElementById("btnNewRace");

document.addEventListener("DOMContentLoaded", () => {
  cargarSaldo();
  generarNuevaCarrera();
});

function cargarSaldo() {
  fetch("../../api.php?action=get_user_info")
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

window.generarNuevaCarrera = function () {
  if (carreraEnCurso) return;
  let mezclados = [...TODA_LA_CUADRA].sort(() => 0.5 - Math.random());
  corredoresActuales = mezclados.slice(0, 3);
  idCaballoConTurbo = null;
  if (Math.random() < PROBABILIDAD_TURBO) {
    const indiceRandom = Math.floor(Math.random() * corredoresActuales.length);
    idCaballoConTurbo = corredoresActuales[indiceRandom].id;
  }
  caballoSeleccionado = null;
  btnStart.disabled = true;
  statusText.textContent = "¡Nuevos corredores en pista!";
  statusText.className =
    "text-center mt-3 fw-bold fs-4 text-info p-3 rounded bg-black border border-secondary";
  renderizarPista();
  renderizarBotones();
};

function renderizarPista() {
  track.innerHTML = '<div class="meta-flag"></div>';
  corredoresActuales.forEach((caballo) => {
    const div = document.createElement("div");
    div.className = "carril";
    div.innerHTML = `<div class="caballo" id="sprite-${caballo.id}" style="transform: translateX(0px);">${caballo.icon}</div>`;
    track.appendChild(div);
  });
}

function renderizarBotones() {
  panelSeleccion.innerHTML = "";
  corredoresActuales.forEach((caballo) => {
    const btn = document.createElement("button");
    btn.className =
      "btn btn-outline-secondary d-flex justify-content-between align-items-center mb-2 horse-btn p-2";
    btn.setAttribute("data-id", caballo.id);
    btn.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <span class="fs-2">${caballo.icon}</span>
                <div class="text-start lh-1">
                    <div class="fw-bold text-white">${caballo.name}</div>
                    <small class="text-white-50" style="font-size:0.75em">Se paga a:</small>
                </div>
            </div>
            <span class="badge bg-warning text-dark fw-bold fs-5">x${caballo.cuota}</span>`;
    btn.onclick = () => seleccionar(caballo.id, btn);
    panelSeleccion.appendChild(btn);
  });
}

function seleccionar(id, btnElement) {
  if (carreraEnCurso) return;
  caballoSeleccionado = id;
  document.querySelectorAll(".horse-btn").forEach((b) => {
    b.classList.remove("active");
    b.classList.add("btn-outline-secondary");
  });
  btnElement.classList.remove("btn-outline-secondary");
  btnElement.classList.add("active");
  btnStart.disabled = false;
}

btnStart.addEventListener("click", () => {
  const apuesta = parseFloat(betInput.value);
  if (isNaN(apuesta) || apuesta <= 0) return alert("Apuesta incorrecta");
  if (apuesta > saldoActual) return alert("Saldo insuficiente");
  carreraEnCurso = true;
  deshabilitarControles(true);
  statusText.innerHTML = "🔴 ¡CARRERA EN CURSO!";
  statusText.className =
    "text-center mt-3 fw-bold fs-4 text-danger p-3 rounded bg-dark border border-danger pulse-anim";
  correr(apuesta);
});

function correr(apuesta) {
  let posiciones = {};
  corredoresActuales.forEach((c) => (posiciones[c.id] = 0));
  let ganador = null;
  const carrilAnchoPx = track.clientWidth;
  const intervalo = setInterval(() => {
    corredoresActuales.forEach((caballo) => {
      if (ganador) return;
      let velocidad = 3.0 + 5.0 / caballo.cuota + Math.random();
      if (caballo.id === idCaballoConTurbo) velocidad += POTENCIA_TURBO;
      posiciones[caballo.id] += velocidad * 0.15;
      const sprite = document.getElementById(`sprite-${caballo.id}`);
      if (sprite) {
        const visualPos = Math.min(posiciones[caballo.id], 92);
        sprite.style.transform = `translateX(${
          visualPos * (carrilAnchoPx / 100)
        }px)`;
      }
      if (posiciones[caballo.id] >= TRACK_WIDTH_PERCENT) ganador = caballo.id;
    });
    if (ganador) {
      clearInterval(intervalo);
      finCarrera(ganador, apuesta);
    }
  }, 30);
}

function finCarrera(ganadorId, apuesta) {
  const caballoGanador = corredoresActuales.find((c) => c.id === ganadorId);
  const hasGanado = ganadorId === caballoSeleccionado;
  let ganancia = hasGanado ? apuesta * caballoGanador.cuota : 0;

  if (hasGanado) {
    statusText.innerHTML = `🏆 ¡GANA ${
      caballoGanador.name
    }! <br> <span class="text-success display-6">Has ganado ${ganancia.toFixed(
      2
    )}€</span>`;
    statusText.className =
      "text-center mt-3 fw-bold fs-4 text-white p-3 rounded bg-success border border-light";
  } else {
    statusText.innerHTML = `🏁 Gana ${caballoGanador.name}. <br> <span class="text-white-50">Inténtalo de nuevo.</span>`;
    statusText.className =
      "text-center mt-3 fw-bold fs-4 text-white p-3 rounded bg-dark border border-secondary";
  }

  fetch("../../api.php?action=game_result", {
    method: "POST",
    body: JSON.stringify({
      game: "Carrera Caballos",
      bet: apuesta,
      win: ganancia,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        saldoActual = parseFloat(data.new_balance);
        actualizarSaldoVisual();
      }
    });

  setTimeout(() => {
    carreraEnCurso = false;
    deshabilitarControles(false);
  }, 3000);
}

function deshabilitarControles(disable) {
  btnNewRace.disabled = disable;
  betInput.disabled = disable;
  document
    .querySelectorAll(".horse-btn")
    .forEach((b) => (b.disabled = disable));
}

function actualizarSaldoVisual() {
  if (walletDisplay) walletDisplay.textContent = saldoActual.toFixed(2) + " €";
}
