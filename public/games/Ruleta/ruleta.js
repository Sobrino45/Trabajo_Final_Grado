/* public/games/Ruleta/ruleta.js */

const TOTAL_NUMEROS = 37;
const GRADOS = 360 / TOTAL_NUMEROS;
const AJUSTE_VISUAL = -90;
const ROJOS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];
const SECCIONES = {
  voisins: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  tiers: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  orph: [1, 20, 14, 31, 9, 17, 34, 6],
};

let apuestas = [];
let rotacionActual = 0;
let girando = false;
let saldoActual = 0;
let historialLocal = []; // Aquí guardaremos los números previos y nuevos

document.addEventListener("DOMContentLoaded", () => {
  crearRuletaVisual();
  dibujarTablero();
  cargarSaldoServidor();
  cargarHistorialPrevio(); // Carga datos de la BD al iniciar
  setupBotonesSecciones();
});

// NUEVO: Función para cargar el historial de la base de datos
function cargarHistorialPrevio() {
  fetch("../../api.php?action=get_transactions&t=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        // Filtramos solo las jugadas de Ruleta que tengan número guardado
        const previos = data.transacciones
          .filter((t) => t.detalles_json)
          .map((t) => {
            try {
              const d = JSON.parse(t.detalles_json);
              return d.numero;
            } catch (e) {
              return null;
            }
          })
          .filter((n) => n !== null);

        historialLocal = previos.slice(0, 10); // Guardamos los 10 últimos
        actualizarVisualHistorial();
      }
    });
}

function crearRuletaVisual() {
  const ruleta = document.getElementById("ruleta");
  ruleta.innerHTML = '<div class="ruleta-centro"></div>';
  for (let i = 0; i < TOTAL_NUMEROS; i++) {
    const div = document.createElement("div");
    div.className = "numero";
    div.style.transform = `rotate(${i * GRADOS}deg)`;
    const span = document.createElement("span");
    span.textContent = i;
    span.style.color =
      i === 0 ? "#2ecc71" : ROJOS.includes(i) ? "#e74c3c" : "white";
    div.appendChild(span);
    ruleta.appendChild(div);
  }
}

function dibujarTablero() {
  const tableroDiv = document.getElementById("tablero");
  tableroDiv.innerHTML = "";

  // Nivel 1: El 0 + Los Números + Columnas
  const mainRow = document.createElement("div");
  mainRow.className = "d-flex gap-1 justify-content-center";

  const cero = crearCelda("0", "numero", 0, "bg-green celda-0");
  mainRow.appendChild(cero);

  const grid = document.createElement("div");
  grid.className = "grid-numeros";
  for (let r = 3; r >= 1; r--) {
    for (let c = 1; c <= 12; c++) {
      const n = (c - 1) * 3 + r;
      grid.appendChild(
        crearCelda(n, "numero", n, ROJOS.includes(n) ? "bg-red" : "bg-black"),
      );
    }
    grid.appendChild(
      crearCelda("2to1", "columna", r, "bg-transparent text-warning small"),
    );
  }
  mainRow.appendChild(grid);
  tableroDiv.appendChild(mainRow);

  // Nivel 2: Docenas
  const docenasRow = document.createElement("div");
  docenasRow.className = "d-flex gap-1 mt-1 justify-content-center ms-5";
  ["1st 12", "2nd 12", "3rd 12"].forEach((t, i) => {
    const c = crearCelda(t, "docena", i + 1, "bg-transparent flex-fill");
    docenasRow.appendChild(c);
  });
  tableroDiv.appendChild(docenasRow);

  // Nivel 3: Apuestas Sencillas
  const simpleRow = document.createElement("div");
  simpleRow.className = "d-flex gap-1 mt-1 justify-content-center ms-5";
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
      crearCelda(s.t, s.k, s.v, `${s.c || "bg-transparent"} flex-fill`),
    );
  });
  tableroDiv.appendChild(simpleRow);
}

function crearCelda(texto, tipo, valor, clases) {
  const div = document.createElement("div");
  div.className = `celda ${clases}`;
  div.textContent = texto;
  div.onclick = () => añadirApuesta(tipo, valor, div);
  return div;
}

function añadirApuesta(tipo, valor, elemento) {
  const cant = parseFloat(document.getElementById("cantidad").value);
  if (
    isNaN(cant) ||
    cant <= 0 ||
    apuestas.reduce((a, b) => a + b.cantidad, 0) + cant > saldoActual
  ) {
    return alert("Saldo insuficiente");
  }
  if (window.AudioManager) AudioManager.play("chips");
  apuestas.push({ tipo, valor, cantidad: cant });
  const ficha = document.createElement("div");
  ficha.className = "ficha-visual";
  ficha.textContent = cant;
  elemento.appendChild(ficha);
  document.getElementById("btnLimpiar").disabled = false;
}

document.getElementById("girar").onclick = () => {
  if (girando || !apuestas.length) return;
  girando = true;
  if (window.AudioManager) AudioManager.play("spin");

  const numGanador = Math.floor(Math.random() * TOTAL_NUMEROS);
  const targetRotation = 360 - numGanador * GRADOS + AJUSTE_VISUAL + 360 * 5;
  rotacionActual += targetRotation;
  document.getElementById("ruleta").style.transform =
    `rotate(${rotacionActual}deg)`;

  setTimeout(() => {
    evaluarResultado(numGanador);
    girando = false;
  }, 4000);
};

function evaluarResultado(numero) {
  let gananciaTotal = 0;
  let apuestaTotal = 0;
  apuestas.forEach((a) => {
    apuestaTotal += a.cantidad;
    let gano = false;
    if (a.tipo === "numero" && a.valor === numero) gano = true;
    if (
      a.tipo === "color" &&
      ((a.valor === "rojo" && ROJOS.includes(numero)) ||
        (a.valor === "negro" && !ROJOS.includes(numero) && numero !== 0))
    )
      gano = true;
    if (
      a.tipo === "paridad" &&
      numero !== 0 &&
      ((a.valor === "par" && numero % 2 === 0) ||
        (a.valor === "impar" && numero % 2 !== 0))
    )
      gano = true;
    if (
      a.tipo === "docena" &&
      numero !== 0 &&
      a.valor === Math.ceil(numero / 12)
    )
      gano = true;
    if (a.tipo === "seccion" && SECCIONES[a.valor].includes(numero)) {
      const mult = { voisins: 2, tiers: 3, orph: 4.5 };
      gananciaTotal += a.cantidad * mult[a.valor];
      return;
    }
    if (gano) {
      const pagos = { numero: 35, color: 1, paridad: 1, docena: 2 };
      gananciaTotal += a.cantidad * (pagos[a.tipo] + 1);
    }
  });

  fetch("../../api.php?action=game_result", {
    method: "POST",
    body: JSON.stringify({
      game: "Ruleta",
      bet: apuestaTotal,
      win: gananciaTotal,
      details: { numero: numero },
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((d) => {
      if (d.success) {
        if (window.AudioManager)
          AudioManager.play(gananciaTotal > 0 ? "win" : "loss");
        saldoActual = d.new_balance;
        document.getElementById("walletDisplay").textContent =
          saldoActual.toFixed(2) + " €";

        // ACTUALIZACIÓN DEL HISTORIAL (NUEVO Y PREVIO)
        historialLocal.unshift(numero);
        if (historialLocal.length > 10) historialLocal.pop();
        actualizarVisualHistorial();

        const color =
          numero === 0
            ? "text-success"
            : ROJOS.includes(numero)
              ? "text-danger"
              : "text-white";
        document.getElementById("resultado").innerHTML =
          `Nº <span class="${color}">${numero}</span> - ${gananciaTotal > 0 ? "GANASTE" : "PIERDES"}`;
      }
    });
  limpiarMesa();
}

function actualizarVisualHistorial() {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = historialLocal
    .map((n) => {
      const color =
        n === 0 ? "bg-success" : ROJOS.includes(n) ? "bg-danger" : "bg-dark";
      return `<span class="badge ${color} p-2 shadow-sm" style="width:35px; height:35px; display:flex; align-items:center; justify-content:center;">${n}</span>`;
    })
    .join("");
}

function limpiarMesa() {
  apuestas = [];
  document.querySelectorAll(".ficha-visual").forEach((f) => f.remove());
  document.getElementById("btnLimpiar").disabled = true;
}

function cargarSaldoServidor() {
  fetch("../../api.php?action=get_user_info")
    .then((r) => r.json())
    .then((data) => {
      if (data.logged_in) {
        saldoActual = data.saldo;
        document.getElementById("walletDisplay").textContent =
          saldoActual.toFixed(2) + " €";
      }
    });
}

function setupBotonesSecciones() {
  ["voisins", "orph", "tiers"].forEach((s) => {
    const btn = document.getElementById(`bet-${s}`);
    if (btn) btn.onclick = () => añadirApuesta("seccion", s, btn);
  });
}
