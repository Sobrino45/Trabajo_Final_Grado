/* public/games/Ruleta/ruleta.js */

const TOTAL_NUMEROS = 37;
const GRADOS = 360 / TOTAL_NUMEROS;
const ORDEN_RULETA = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const ROJOS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

let apuestas = [];
let saldoActual = 0;
let girando = false;
let rotacionActual = 0;
let historialLocal = Array.from({ length: 10 }, () =>
  Math.floor(Math.random() * TOTAL_NUMEROS),
);

document.addEventListener("DOMContentLoaded", () => {
  crearRuletaVisual();
  dibujarTablero();
  cargarSaldoServidor();
  actualizarVisualHistorial();
  document.getElementById("btnLimpiar").onclick = limpiarMesa;
  document.getElementById("girar").onclick = girarRuleta;
});

function crearRuletaVisual() {
  const ruleta = document.getElementById("ruleta");
  ruleta.innerHTML = `<div class="ruleta-centro"></div>`;
  ORDEN_RULETA.forEach((num, i) => {
    const div = document.createElement("div");
    div.className = "numero-spoke";
    div.style.transform = `rotate(${i * GRADOS}deg)`;
    const span = document.createElement("span");
    span.textContent = num;
    span.style.color =
      num === 0 ? "#2ecc71" : ROJOS.includes(num) ? "#e74c3c" : "#fff";
    div.appendChild(span);
    ruleta.appendChild(div);
  });
}

function dibujarTablero() {
  const tablero = document.getElementById("tablero");
  tablero.innerHTML = "";

  const mainGrid = document.createElement("div");
  mainGrid.className = "d-flex gap-1 justify-content-center";

  // 1. El Cero (a la izquierda)
  mainGrid.appendChild(crearCelda("0", "numero", 0, "bg-green celda-0"));

  // 2. Cuadrícula de Números (12 columnas x 3 filas) + 1 columna de "2:1"
  const numsContainer = document.createElement("div");
  numsContainer.className = "nums-grid";

  // Fila 1 (Superior): 3, 6, 9... 36
  // Fila 2 (Media): 2, 5, 8... 35
  // Fila 3 (Inferior): 1, 4, 7... 34
  for (let r = 3; r >= 1; r--) {
    for (let c = 1; c <= 12; c++) {
      const n = (c - 1) * 3 + r;
      numsContainer.appendChild(
        crearCelda(n, "numero", n, ROJOS.includes(n) ? "bg-red" : "bg-black"),
      );
    }
    // Celda de Columna al final de cada fila (A la derecha)
    numsContainer.appendChild(
      crearCelda("2:1", "columna", r, "bg-dark-gray text-warning small-cell"),
    );
  }
  mainGrid.appendChild(numsContainer);
  tablero.appendChild(mainGrid);

  // 3. Docenas (Abajo de los números)
  const dozensRow = document.createElement("div");
  dozensRow.className = "d-flex gap-1 mt-1 dozens-row";
  ["1st 12", "2nd 12", "3rd 12"].forEach((t, i) => {
    dozensRow.appendChild(
      crearCelda(t, "docena", i + 1, "bg-dark-gray flex-fill py-2"),
    );
  });
  tablero.appendChild(dozensRow);

  // 4. Apuestas Externas (Rojo, Negro, etc.)
  const simpleRow = document.createElement("div");
  simpleRow.className = "d-flex gap-1 mt-1 dozens-row";
  const simples = [
    { t: "1-18", k: "rango", v: "bajo" },
    { t: "EVEN", k: "paridad", v: "par" },
    { t: "RED", k: "color", v: "rojo", c: "bg-red" },
    { t: "BLACK", k: "color", v: "negro", c: "bg-black" },
    { t: "ODD", k: "paridad", v: "impar" },
    { t: "19-36", k: "rango", v: "alto" },
  ];
  simples.forEach((s) => {
    simpleRow.appendChild(
      crearCelda(s.t, s.k, s.v, `${s.c || "bg-dark-gray"} flex-fill py-2`),
    );
  });
  tablero.appendChild(simpleRow);
}

function crearCelda(texto, tipo, valor, clases) {
  const div = document.createElement("div");
  div.className = `celda ${clases}`;
  div.innerHTML = `<span>${texto}</span>`;
  div.onclick = () => añadirApuesta(tipo, valor, div);
  return div;
}

function añadirApuesta(tipo, valor, elemento) {
  if (girando) return;
  const cant = Number(document.getElementById("cantidad").value);
  const total = apuestas.reduce((s, a) => s + a.cantidad, 0);

  if (!cant || cant <= 0 || total + cant > saldoActual)
    return alert("Saldo insuficiente");
  if (window.AudioManager) AudioManager.play("chips");

  let a = apuestas.find((x) => x.tipo === tipo && x.valor === valor);
  if (a) {
    a.cantidad += cant;
    elemento.querySelector(".ficha-visual").textContent = a.cantidad;
  } else {
    apuestas.push({ tipo, valor, cantidad: cant });
    const f = document.createElement("div");
    f.className = "ficha-visual";
    f.textContent = cant;
    elemento.appendChild(f);
  }
  document.getElementById("btnLimpiar").disabled = false;
}

function limpiarMesa() {
  apuestas = [];
  document.querySelectorAll(".ficha-visual").forEach((f) => f.remove());
  document.getElementById("btnLimpiar").disabled = true;
}

function girarRuleta() {
  if (girando || apuestas.length === 0) return;
  girando = true;
  const num = Math.floor(Math.random() * TOTAL_NUMEROS);
  const idx = ORDEN_RULETA.indexOf(num);
  rotacionActual =
    Math.ceil(rotacionActual / 360) * 360 + 5 * 360 - idx * GRADOS;
  document.getElementById("ruleta").style.transform =
    `rotate(${rotacionActual}deg)`;
  setTimeout(() => {
    evaluarResultado(num);
    girando = false;
  }, 4000);
}

function evaluarResultado(n) {
  let win = 0;
  let betTotal = apuestas.reduce((s, a) => s + a.cantidad, 0);
  apuestas.forEach((a) => {
    if (a.tipo === "numero" && a.valor === n) win += a.cantidad * 36;
    if (
      a.tipo === "color" &&
      ((a.valor === "rojo" && ROJOS.includes(n)) ||
        (a.valor === "negro" && !ROJOS.includes(n) && n !== 0))
    )
      win += a.cantidad * 2;
    if (
      a.tipo === "paridad" &&
      n !== 0 &&
      ((a.valor === "par" && n % 2 === 0) ||
        (a.valor === "impar" && n % 2 !== 0))
    )
      win += a.cantidad * 2;
    if (
      a.tipo === "docena" &&
      n !== 0 &&
      n > 0 &&
      a.valor === Math.ceil(n / 12)
    )
      win += a.cantidad * 3;
    if (a.tipo === "columna" && n !== 0 && (n - a.valor) % 3 === 0)
      win += a.cantidad * 3;
  });
  saldoActual += win - betTotal;
  document.getElementById("walletDisplay").textContent =
    saldoActual.toFixed(2) + " €";
  historialLocal.unshift(n);
  historialLocal = historialLocal.slice(0, 10);
  actualizarVisualHistorial();
  document.getElementById("resultado").innerHTML =
    win > 0
      ? `<span class="text-success fw-bold">Nº ${n} - ¡GANASTE ${win}€!</span>`
      : `<span class="text-danger">Nº ${n} - PIERDES</span>`;
  limpiarMesa();
}

function actualizarVisualHistorial() {
  const c = document.getElementById("resultados");
  c.innerHTML = historialLocal
    .map((n) => {
      const cl =
        n === 0 ? "bg-success" : ROJOS.includes(n) ? "bg-danger" : "bg-dark";
      return `<span class="badge ${cl} p-2 shadow-sm" style="width:32px">${n}</span>`;
    })
    .join("");
}

function cargarSaldoServidor() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((d) => {
      saldoActual = d.saldo || 0;
      document.getElementById("walletDisplay").textContent =
        saldoActual.toFixed(2) + " €";
    });
}
