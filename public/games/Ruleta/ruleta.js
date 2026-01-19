const TOTAL_NUMEROS = 37;
const GRADOS = 360 / TOTAL_NUMEROS;
const PREMIOS = {
  numero: 35,
  color: 1,
  paridad: 1,
  rango: 1,
  columna: 2,
  docena: 2,
};
const AJUSTE_VISUAL = -90;
const ROJOS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

let apuestas = [];
let rotacionActual = 0;
let girando = false;
let saldoActual = 0;

const ruleta = document.getElementById("ruleta");
const girarBtn = document.getElementById("girar");
const resultadoTxt = document.getElementById("resultado");
const cantidadInput = document.getElementById("cantidad");
const tableroDiv = document.getElementById("tablero");
const walletDisplay = document.getElementById("walletDisplay");

document.addEventListener("DOMContentLoaded", () => {
  crearRuletaVisual();
  dibujarTablero();
  cargarSaldoServidor();
});

function cargarSaldoServidor() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = parseFloat(data.saldo);
        actualizarSaldoVisual(saldoActual);
      } else {
        window.location.href = "../../login.html";
      }
    });
}

function actualizarSaldoVisual(valor) {
  walletDisplay.textContent = valor.toFixed(2) + " €";
}
const esRojo = (n) => ROJOS.includes(n);

function crearRuletaVisual() {
  for (let i = 0; i < TOTAL_NUMEROS; i++) {
    const div = document.createElement("div");
    div.className = "numero";
    div.style.transform = `rotate(${i * GRADOS}deg)`;
    const span = document.createElement("span");
    span.textContent = i;
    span.style.color = i === 0 ? "#2ecc71" : esRojo(i) ? "#e74c3c" : "white";
    div.appendChild(span);
    ruleta.appendChild(div);
  }
}

function dibujarTablero() {
  tableroDiv.innerHTML = "";
  crearCeldaTablero("0", "numero", 0, "bg-green celda-0");
  for (let i = 3; i <= 36; i += 3) crearCeldaNumero(i);
  crearCeldaTablero("2 a 1", "columna", 3, "bg-transparent celda-2to1");
  for (let i = 2; i <= 36; i += 3) crearCeldaNumero(i);
  crearCeldaTablero("2 a 1", "columna", 2, "bg-transparent celda-2to1");
  for (let i = 1; i <= 36; i += 3) crearCeldaNumero(i);
  crearCeldaTablero("2 a 1", "columna", 1, "bg-transparent celda-2to1");
}

function crearCeldaNumero(num) {
  const colorClass = esRojo(num) ? "bg-red" : "bg-black";
  crearCeldaTablero(num, "numero", num, `${colorClass} celda-numero`);
}

function crearCeldaTablero(texto, tipo, valor, clasesExtra) {
  const div = document.createElement("div");
  div.className = `celda ${clasesExtra}`;
  div.textContent = texto;
  div.dataset.tipo = tipo;
  div.dataset.valor = valor;
  div.onclick = () => {
    const cant = parseFloat(cantidadInput.value);
    if (
      isNaN(cant) ||
      cant <= 0 ||
      apuestas.reduce((a, b) => a + b.cantidad, 0) + cant > saldoActual
    )
      return alert("Error en apuesta");

    // SONIDO AL PONER FICHA
    if (window.AudioManager) AudioManager.play("chips");

    apuestas.push({ tipo, valor, cantidad: cant });
    const ficha = document.createElement("div");
    ficha.className = "ficha-visual";
    ficha.textContent = cant;
    div.appendChild(ficha);
  };
  tableroDiv.appendChild(div);
}

girarBtn.addEventListener("click", () => {
  if (girando || !apuestas.length) return;
  girando = true;

  // SONIDO DE GIRO
  if (window.AudioManager) AudioManager.play("spin");

  const numGanador = Math.floor(Math.random() * TOTAL_NUMEROS);
  const targetRotation = 360 - numGanador * GRADOS + AJUSTE_VISUAL + 5 * 360;
  rotacionActual += targetRotation;
  ruleta.style.transform = `rotate(${rotacionActual}deg)`;
  setTimeout(() => {
    evaluar(numGanador);
    girando = false;
  }, 4000);
});

function evaluar(numero) {
  let gananciaTotal = 0;
  let apuestaTotal = 0;
  apuestas.forEach((a) => {
    apuestaTotal += a.cantidad;
    let gano = false;
    if (a.tipo === "numero" && parseInt(a.valor) === numero) gano = true;
    if (
      a.tipo === "color" &&
      ((a.valor === "rojo" && esRojo(numero)) ||
        (a.valor === "negro" && !esRojo(numero) && numero !== 0))
    )
      gano = true;
    if (gano) gananciaTotal += a.cantidad * (PREMIOS[a.tipo] + 1);
  });

  fetch("../../api.php?action=game_result", {
    method: "POST",
    body: JSON.stringify({
      game: "Ruleta",
      bet: apuestaTotal,
      win: gananciaTotal,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success) {
        // SONIDO DE RESULTADO
        if (window.AudioManager) {
          AudioManager.play(gananciaTotal > 0 ? "win" : "loss");
        }

        saldoActual = d.new_balance;
        actualizarSaldoVisual(saldoActual);
        resultadoTxt.innerHTML = `Nº ${numero} - ${
          gananciaTotal > 0 ? "¡GANASTE!" : "PIERDES"
        }`;
      }
    });
  apuestas = [];
  document.querySelectorAll(".ficha-visual").forEach((f) => f.remove());
}
