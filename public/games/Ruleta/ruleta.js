/* public/games/Ruleta/ruleta.js */
const TOTAL_NUMEROS = 37,
  GRADOS = 360 / TOTAL_NUMEROS;
const ORDEN_RULETA = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const ROJOS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const SECCIONES = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  orphelins: [1, 20, 14, 31, 9, 17, 34, 6],
};

let apuestas = [],
  saldoActual = 0,
  girando = false,
  rotacionActual = 0;
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

function dibujarTablero() {
  const tablero = document.getElementById("tablero");
  tablero.innerHTML = "";
  const mainGrid = document.createElement("div");
  mainGrid.className = "d-flex gap-1 justify-content-center";

  // Celda 0
  mainGrid.appendChild(
    crearCelda("0", "numero", 0, "bg-green celda-0", "celda-n-0"),
  );

  const numsContainer = document.createElement("div");
  numsContainer.className = "nums-grid";
  for (let r = 3; r >= 1; r--) {
    for (let c = 1; c <= 12; c++) {
      const n = (c - 1) * 3 + r;
      const cl = ROJOS.includes(n) ? "bg-red" : "bg-black";
      numsContainer.appendChild(crearCelda(n, "numero", n, cl, `celda-n-${n}`));
    }
    numsContainer.appendChild(
      crearCelda("2:1", "columna", r, "bg-dark-gray text-warning small-cell"),
    );
  }
  mainGrid.appendChild(numsContainer);
  tablero.appendChild(mainGrid);

  const docenasRow = document.createElement("div");
  docenasRow.className = "d-flex gap-1 mt-1 dozens-row";
  ["1st 12", "2nd 12", "3rd 12"].forEach((t, i) =>
    docenasRow.appendChild(
      crearCelda(t, "docena", i + 1, "bg-dark-gray flex-fill py-2"),
    ),
  );
  tablero.appendChild(docenasRow);

  const simplesRow = document.createElement("div");
  simplesRow.className = "d-flex gap-1 mt-1 simple-row";
  const sim = [
    { t: "1-18", k: "rango", v: "bajo" },
    { t: "EVEN", k: "paridad", v: "par" },
    { t: "RED", k: "color", v: "rojo", c: "bg-red" },
    { t: "BLACK", k: "color", v: "negro", c: "bg-black" },
    { t: "ODD", k: "paridad", v: "impar" },
    { t: "19-36", k: "rango", v: "alto" },
  ];
  sim.forEach((s) =>
    simplesRow.appendChild(
      crearCelda(s.t, s.k, s.v, `${s.c || "bg-dark-gray"} flex-fill py-2`),
    ),
  );
  tablero.appendChild(simplesRow);
}

function crearCelda(texto, tipo, valor, clases, id) {
  const div = document.createElement("div");
  div.className = `celda ${clases}`;
  if (id) div.setAttribute("id", id); // ID garantizado
  div.innerHTML = `<span>${texto}</span>`;
  div.onclick = () => añadirApuesta(tipo, valor, div);
  return div;
}

function añadirApuesta(tipo, valor, elemento, esMasa = false) {
  if (girando) return;
  const ficha = Number(document.getElementById("cantidad").value);
  const totalMesa = apuestas.reduce((s, a) => s + a.cantidad, 0);

  if (!ficha || ficha <= 0 || totalMesa + ficha > saldoActual) {
    if (!esMasa) alert("Saldo insuficiente");
    return;
  }

  if (!esMasa && window.AudioManager) AudioManager.play("chips");

  let a = apuestas.find((x) => x.tipo === tipo && x.valor === valor);
  if (a) {
    a.cantidad += ficha;
    elemento.querySelector(".ficha-visual").textContent = a.cantidad;
  } else {
    apuestas.push({ tipo, valor, cantidad: ficha });
    const f = document.createElement("div");
    f.className = "ficha-visual";
    f.textContent = ficha;
    elemento.appendChild(f);
  }
  document.getElementById("btnLimpiar").disabled = false;
}

// FUNCIÓN DE SECCIONES CORREGIDA Y ROBUSTA
function apostarPorSeccion(nombre) {
  if (girando) return;
  const nums = SECCIONES[nombre];
  const ficha = Number(document.getElementById("cantidad").value);
  const costeTotal = nums.length * ficha;
  const apuestaPrevia = apuestas.reduce((s, a) => s + a.cantidad, 0);

  if (apuestaPrevia + costeTotal > saldoActual) {
    return alert("Saldo insuficiente para esta sección.");
  }

  if (window.AudioManager) AudioManager.play("chips");

  nums.forEach((n) => {
    const el = document.getElementById(`celda-n-${n}`);
    if (el) {
      añadirApuesta("numero", n, el, true);
    }
  });
}

function limpiarMesa() {
  apuestas = [];
  document.querySelectorAll(".ficha-visual").forEach((f) => f.remove());
  document.getElementById("btnLimpiar").disabled = true;
}

function girarRuleta() {
  if (girando || apuestas.length === 0) return;
  girando = true;
  const winNum = Math.floor(Math.random() * TOTAL_NUMEROS);
  const idx = ORDEN_RULETA.indexOf(winNum);
  rotacionActual =
    Math.ceil(rotacionActual / 360) * 360 + 5 * 360 - idx * GRADOS;
  document.getElementById("ruleta").style.transform =
    `rotate(${rotacionActual}deg)`;
  setTimeout(() => {
    evaluarResultado(winNum);
    girando = false;
  }, 4000);
}

function evaluarResultado(n) {
  let win = 0,
    total = apuestas.reduce((s, a) => s + a.cantidad, 0),
    pleno = false;
  apuestas.forEach((a) => {
    if (a.tipo === "numero" && a.valor === n) {
      win += a.cantidad * 36;
      pleno = true;
    }
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
    if (a.tipo === "docena" && n !== 0 && a.valor === Math.ceil(n / 12))
      win += a.cantidad * 3;
    if (a.tipo === "columna" && n !== 0 && (n - a.valor) % 3 === 0)
      win += a.cantidad * 3;
  });

  fetch("../../api.php?action=game_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      game: "European Roulette",
      bet: total,
      win: win,
      details: { numero: n },
    }),
  });

  saldoActual += win - total;
  document.getElementById("walletDisplay").textContent =
    saldoActual.toFixed(2) + " €";
  if (win > 0 && window.ConfettiManager)
    pleno ? ConfettiManager.victoryBlast() : ConfettiManager.celebrate();
  historialLocal.unshift(n);
  historialLocal = historialLocal.slice(0, 10);
  actualizarVisualHistorial();
  document.getElementById("resultado").innerHTML =
    win > 0
      ? `<span class="text-success fw-bold">Nº ${n} - ¡GANASTE ${win.toFixed(2)}€!</span>`
      : `<span class="text-danger">Nº ${n} - PIERDES</span>`;
  limpiarMesa();
}

function actualizarVisualHistorial() {
  const res = document.getElementById("resultados");
  res.innerHTML = historialLocal
    .map((n) => {
      const c =
        n === 0 ? "bg-success" : ROJOS.includes(n) ? "bg-danger" : "bg-dark";
      return `<span class="badge ${c} p-2 shadow-sm" style="width:32px">${n}</span>`;
    })
    .join("");
}

function crearRuletaVisual() {
  const r = document.getElementById("ruleta");
  r.innerHTML = `<div class="ruleta-centro"></div>`;
  ORDEN_RULETA.forEach((num, i) => {
    const d = document.createElement("div");
    d.className = "numero-spoke";
    d.style.transform = `rotate(${i * GRADOS}deg)`;
    const s = document.createElement("span");
    s.textContent = num;
    s.style.color =
      num === 0 ? "#2ecc71" : ROJOS.includes(num) ? "#e74c3c" : "#fff";
    d.appendChild(s);
    r.appendChild(d);
  });
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
