const ruleta = document.getElementById("ruleta");
const botonGirar = document.getElementById("girar");
const resultadoTexto = document.getElementById("resultado");

const tipoApuesta = document.getElementById("tipoApuesta");
const valorApuesta = document.getElementById("valorApuesta");
const cantidadInput = document.getElementById("cantidad");
const listaApuestas = document.getElementById("listaApuestas");

const totalNumeros = 37;
const gradosPorNumero = 360 / totalNumeros;

const resultadosDiv = document.getElementById("resultados");
const MAX_RESULTADOS = 10;
let historial = [];


let rotacionActual = 0;
let apuestas = [];

/* =========================
   CREAR NÚMEROS EN LA RULETA
   ========================= */
for (let i = 0; i < totalNumeros; i++) {
    const numero = document.createElement("div");
    numero.classList.add("numero");
    numero.style.transform = `rotate(${i * gradosPorNumero}deg)`;

    const span = document.createElement("span");
    span.textContent = i;

    if (i === 0) span.style.color = "green";
    else if (i % 2 === 0) span.style.color = "red";
    else span.style.color = "white";

    numero.appendChild(span);
    ruleta.appendChild(numero);
}

/* =========================
   AÑADIR APUESTAS
   ========================= */
document.getElementById("añadirApuesta").addEventListener("click", () => {

    const tipo = tipoApuesta.value;
    const valor = valorApuesta.value.toLowerCase();
    const cantidad = Number(cantidadInput.value);

    if (!valor || cantidad <= 0) return;

    apuestas.push({ tipo, valor, cantidad });
    actualizarLista();

    valorApuesta.value = "";
    cantidadInput.value = "";
});

function actualizarLista() {
    listaApuestas.innerHTML = "";
    apuestas.forEach(a => {
        const li = document.createElement("li");
        li.textContent = `${a.tipo} → ${a.valor} (${a.cantidad}€)`;
        listaApuestas.appendChild(li);
    });
}

/* =========================
   LÓGICA DE COLOR
   ========================= */
const numerosRojos = [
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36
];

function esRojo(n) {
    return numerosRojos.includes(n);
}


/* =========================
   GIRAR RULETA
   ========================= */
botonGirar.addEventListener("click", () => {

    if (apuestas.length === 0) {
        resultadoTexto.textContent = "Añade al menos una apuesta";
        return;
    }

    const numeroRuleta = Math.floor(Math.random() * totalNumeros);

    const vueltas = 6;
    const anguloNumero = numeroRuleta * gradosPorNumero;
    const centroSector = gradosPorNumero / 2;
    const anguloFlecha = 270;

    rotacionActual =
        vueltas * 360
        - (anguloNumero + centroSector)
        + anguloFlecha;

    ruleta.style.transform = `rotate(${rotacionActual}deg)`;

    setTimeout(() => {
        evaluarApuestas(numeroRuleta);
    }, 4000);
});

/* =========================
   EVALUAR APUESTAS
   ========================= */
function evaluarApuestas(numeroRuleta) {

    let ganancia = 0;

    apuestas.forEach(a => {
        switch (a.tipo) {

            case "numero":
                if (Number(a.valor) === numeroRuleta)
                    ganancia += a.cantidad * 35;
                break;

            case "color":
                if (a.valor === "rojo" && esRojo(numeroRuleta))
                    ganancia += a.cantidad * 2;
                if (a.valor === "negro" && !esRojo(numeroRuleta) && numeroRuleta !== 0)
                    ganancia += a.cantidad * 2;
                break;

            case "paridad":
                if (numeroRuleta !== 0) {
                    if (a.valor === "par" && numeroRuleta % 2 === 0)
                        ganancia += a.cantidad * 2;
                    if (a.valor === "impar" && numeroRuleta % 2 !== 0)
                        ganancia += a.cantidad * 2;
                }
                break;

            case "rango":
                if (a.valor === "1-18" && numeroRuleta >= 1 && numeroRuleta <= 18)
                    ganancia += a.cantidad * 2;
                if (a.valor === "19-36" && numeroRuleta >= 19 && numeroRuleta <= 36)
                    ganancia += a.cantidad * 2;
                break;
        }
    });

    historial.unshift(numeroRuleta);
if (historial.length > MAX_RESULTADOS) historial.pop();
renderizarHistorial();


    resultadoTexto.textContent =
        `Ha salido ${numeroRuleta}. Ganancia total: ${ganancia}€`;

    apuestas = [];
    actualizarLista();
}

for (let i = 0; i < MAX_RESULTADOS; i++) {
    historial.push(Math.floor(Math.random() * totalNumeros));
}
renderizarHistorial();


function renderizarHistorial() {
    resultadosDiv.innerHTML = "";

    historial.forEach(n => {
        const div = document.createElement("div");
        div.classList.add("resultado");
        div.textContent = n;

        if (n === 0) div.style.background = "green";
        else if (esRojo(n)) div.style.background = "red";
        else div.style.background = "black";

        resultadosDiv.appendChild(div);
    });
}

