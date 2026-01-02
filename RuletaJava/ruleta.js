/* ============================
   CONFIGURACIÓN GENERAL
   ============================ */
const TOTAL_NUMEROS = 37;
const GRADOS = 360 / TOTAL_NUMEROS;
const PREMIOS = {
    numero: 35,
    color: 2,
    paridad: 2,
    rango: 2
};

/* ============================
   VARIABLES DE ESTADO
   ============================ */
let apuestas = [];
let historial = [];
let rotacionActual = 0;

/* ============================
   ELEMENTOS DOM
   ============================ */
const ruleta = document.getElementById("ruleta");
const girarBtn = document.getElementById("girar");
const resultadoTxt = document.getElementById("resultado");
const listaApuestas = document.getElementById("listaApuestas");
const cantidadInput = document.getElementById("cantidad");
const resultadosDiv = document.getElementById("resultados");

/* ============================
   DATOS DE RULETA EUROPEA
   ============================ */
const ROJOS = [
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
];

const esRojo = n => ROJOS.includes(n);

/* ============================
   CREAR RULETA VISUAL
   ============================ */
for (let i = 0; i < TOTAL_NUMEROS; i++) {
    const div = document.createElement("div");
    div.className = "numero";
    div.style.transform = `rotate(${i * GRADOS}deg)`;

    const span = document.createElement("span");
    span.textContent = i;

    if (i === 0) span.style.color = "green";
    else span.style.color = esRojo(i) ? "red" : "white";

    div.appendChild(span);
    ruleta.appendChild(div);
}

/* ============================
   CREAR BOTONES DE NÚMEROS
   ============================ */
const contNumeros = document.getElementById("numeros");

for (let i = 0; i < TOTAL_NUMEROS; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.dataset.tipo = "numero";
    btn.dataset.valor = i;
    contNumeros.appendChild(btn);
}

/* ============================
   GESTIÓN DE APUESTAS
   ============================ */
document.querySelectorAll("[data-tipo]").forEach(btn => {
    btn.addEventListener("click", () => {

        const cantidad = Number(cantidadInput.value);
        if (cantidad <= 0) return;

        apuestas.push({
            tipo: btn.dataset.tipo,
            valor: btn.dataset.valor,
            cantidad
        });

        btn.classList.add("apostado");
        actualizarLista();
    });
});

function actualizarLista() {
    listaApuestas.innerHTML = "";
    apuestas.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${a.tipo} → ${a.valor} (${a.cantidad}€)`;
        listaApuestas.appendChild(li);
    });
}

/* ============================
   GIRAR RULETA
   ============================ */
girarBtn.addEventListener("click", () => {

    if (apuestas.length === 0) return;

    const numero = Math.floor(Math.random() * TOTAL_NUMEROS);
    const vueltas = 6;

    rotacionActual =
        vueltas * 360
        - (numero * GRADOS + GRADOS / 2)
        + 270;

    ruleta.style.transform = `rotate(${rotacionActual}deg)`;

    setTimeout(() => evaluar(numero), 4000);
});

/* ============================
   EVALUAR APUESTAS
   ============================ */
function evaluar(numero) {

    let ganancia = 0;

    apuestas.forEach(a => {

        switch (a.tipo) {

            case "numero":
                if (+a.valor === numero)
                    ganancia += a.cantidad * PREMIOS.numero;
                break;

            case "color":
                if (
                    (a.valor === "rojo" && esRojo(numero)) ||
                    (a.valor === "negro" && !esRojo(numero) && numero !== 0)
                ) ganancia += a.cantidad * PREMIOS.color;
                break;

            case "paridad":
                if (numero !== 0 &&
                    ((a.valor === "par" && numero % 2 === 0) ||
                     (a.valor === "impar" && numero % 2 !== 0)))
                    ganancia += a.cantidad * PREMIOS.paridad;
                break;

            case "rango":
                if (
                    (a.valor === "1-18" && numero >= 1 && numero <= 18) ||
                    (a.valor === "19-36" && numero >= 19 && numero <= 36)
                ) ganancia += a.cantidad * PREMIOS.rango;
                break;
        }
    });

    resultadoTxt.textContent = `Ha salido ${numero}. Ganancia: ${ganancia}€`;

    historial.unshift(numero);
    historial = historial.slice(0, 10);
    renderizarHistorial();

    apuestas = [];
    document.querySelectorAll(".apostado").forEach(b => b.classList.remove("apostado"));
    actualizarLista();
}

/* ============================
   HISTORIAL
   ============================ */
for (let i = 0; i < 10; i++)
    historial.push(Math.floor(Math.random() * TOTAL_NUMEROS));

renderizarHistorial();

function renderizarHistorial() {
    resultadosDiv.innerHTML = "";
    historial.forEach(n => {
        const div = document.createElement("div");
        div.className = "resultado";
        div.textContent = n;

        div.style.background =
            n === 0 ? "green" : esRojo(n) ? "red" : "black";

        resultadosDiv.appendChild(div);
    });
}
