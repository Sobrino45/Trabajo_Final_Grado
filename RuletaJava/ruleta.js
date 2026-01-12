/* ============================
   CONFIGURACIÓN GENERAL
   ============================ */
const TOTAL_NUMEROS = 37;
const GRADOS = 360 / TOTAL_NUMEROS;
const PREMIOS = {
    numero: 35, color: 1, paridad: 1, rango: 1, columna: 2, docena: 2
};
const AJUSTE_VISUAL = -90; 

let apuestas = [];
let historial = [];
let rotacionActual = 0;
let girando = false;
let saldoActual = 0; // Variable local para control rápido

/* ============================
   ELEMENTOS DOM
   ============================ */
const ruleta = document.getElementById("ruleta");
const girarBtn = document.getElementById("girar");
const resultadoTxt = document.getElementById("resultado");
const detalleGanadoresTxt = document.getElementById("detalleGanadores");
const cantidadInput = document.getElementById("cantidad");
const resultadosDiv = document.getElementById("resultados");
const tableroDiv = document.getElementById("tablero");
const btnLimpiar = document.getElementById("btnLimpiar");
const walletDisplay = document.getElementById("walletDisplay"); 

/* ============================
   INICIALIZACIÓN
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
    inicializarJuego();
    cargarSaldoServidor();
});

function cargarSaldoServidor() {
    fetch('../Backend/get_user_info.php')
        .then(r => r.json())
        .then(data => {
            if(data.logged_in) {
                saldoActual = parseFloat(data.saldo);
                actualizarSaldoVisual(saldoActual);
            } else {
                window.location.href = '../Portal/login.html';
            }
        });
}

function inicializarJuego() {
    crearRuletaVisual();
    if(tableroDiv) dibujarTablero(); 
    generarHistorialFicticio();
    renderizarHistorial();
}

function generarHistorialFicticio() {
    historial = [];
    for (let i = 0; i < 10; i++) {
        const numRandom = Math.floor(Math.random() * TOTAL_NUMEROS);
        historial.push(numRandom);
    }
}

function actualizarSaldoVisual(valor) {
    walletDisplay.textContent = valor.toFixed(2) + " €";
    if (valor < 10) {
        walletDisplay.classList.remove("text-success");
        walletDisplay.classList.add("text-danger");
    } else {
        walletDisplay.classList.remove("text-danger");
        walletDisplay.classList.add("text-success");
    }
}

/* ============================
   LÓGICA VISUAL (RULETA Y TABLERO)
   ============================ */
const ROJOS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const esRojo = n => ROJOS.includes(n);

function crearRuletaVisual() {
    for (let i = 0; i < TOTAL_NUMEROS; i++) {
        const div = document.createElement("div");
        div.className = "numero";
        div.style.transform = `rotate(${i * GRADOS}deg)`;
        const span = document.createElement("span");
        span.textContent = i;
        span.style.color = (i === 0) ? "#2ecc71" : (esRojo(i) ? "#e74c3c" : "white");
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
    
    let vacio = document.createElement("div"); tableroDiv.appendChild(vacio);
    crearCeldaTablero("1ª 12", "docena", "1-12", "bg-transparent celda-docena");
    crearCeldaTablero("2ª 12", "docena", "13-24", "bg-transparent celda-docena");
    crearCeldaTablero("3ª 12", "docena", "25-36", "bg-transparent celda-docena");
    vacio = document.createElement("div"); tableroDiv.appendChild(vacio);

    vacio = document.createElement("div"); tableroDiv.appendChild(vacio);
    crearCeldaTablero("1-18", "rango", "1-18", "bg-transparent celda-simple");
    crearCeldaTablero("PAR", "paridad", "par", "bg-transparent celda-simple");
    crearCeldaTablero("ROJO", "color", "rojo", "bg-red celda-simple");
    crearCeldaTablero("NEGRO", "color", "negro", "bg-black celda-simple");
    crearCeldaTablero("IMPAR", "paridad", "impar", "bg-transparent celda-simple");
    crearCeldaTablero("19-36", "rango", "19-36", "bg-transparent celda-simple");
    vacio = document.createElement("div"); tableroDiv.appendChild(vacio);
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
    div.onclick = () => procesarApuesta(div);
    tableroDiv.appendChild(div);
}

/* ============================
   GESTIÓN DE APUESTAS
   ============================ */
function procesarApuesta(elementoDOM) {
    if (girando) return;
    const cantidad = parseFloat(cantidadInput.value);
    
    // Cálculo total actual apostado
    let totalYaApostado = apuestas.reduce((acc, curr) => acc + curr.cantidad, 0);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Cantidad no válida."); return;
    }
    if ((totalYaApostado + cantidad) > saldoActual) {
        alert("Saldo insuficiente para esta apuesta."); return;
    }

    const tipo = elementoDOM.dataset.tipo;
    const valor = elementoDOM.dataset.valor;
    apuestas.push({ tipo, valor, cantidad });

    colocarFichaVisual(elementoDOM, cantidad);
    resultadoTxt.innerHTML = `<span class="text-info fs-6">Ficha de ${cantidad}€ colocada</span>`;
    
    // Actualizamos visualmente el saldo "restando" provisionalmente
    actualizarSaldoVisual(saldoActual - (totalYaApostado + cantidad));

    if (btnLimpiar) btnLimpiar.disabled = false;
}

function colocarFichaVisual(padre, cantidad) {
    const ficha = document.createElement("div");
    ficha.className = "ficha-visual";
    ficha.textContent = cantidad;
    const rx = Math.floor(Math.random()*6) - 3;
    const ry = Math.floor(Math.random()*6) - 3;
    ficha.style.transform = `translate(${rx}px, ${ry}px)`;
    padre.appendChild(ficha);
}

function limpiarMesa() {
    if (girando) return;
    apuestas = [];
    document.querySelectorAll('.ficha-visual').forEach(e => e.remove());
    resultadoTxt.textContent = "Apuestas borradas";
    actualizarSaldoVisual(saldoActual); // Restauramos el saldo visual real
    if (btnLimpiar) btnLimpiar.disabled = true;
}

/* ============================
   GIRAR
   ============================ */
girarBtn.addEventListener("click", () => {
    if (girando) return;
    if (apuestas.length === 0) {
        resultadoTxt.textContent = "¡Coloca fichas en la mesa!";
        return;
    }

    girando = true;
    girarBtn.disabled = true;
    if (btnLimpiar) btnLimpiar.disabled = true;

    resultadoTxt.textContent = "¡Girando!...";
    detalleGanadoresTxt.textContent = "";

    const numeroGanador = Math.floor(Math.random() * TOTAL_NUMEROS);
    const anguloDestino = numeroGanador * GRADOS;
    const targetRotation = (360 - anguloDestino) + AJUSTE_VISUAL; 
    
    const rotacionActualMod = rotacionActual % 360;
    let distanciaGiro = targetRotation - rotacionActualMod;
    if (distanciaGiro < 0) distanciaGiro += 360; 
    
    const vueltasExtra = 5 * 360;
    rotacionActual += vueltasExtra + distanciaGiro;

    ruleta.style.transform = `rotate(${rotacionActual}deg)`;

    setTimeout(() => {
        evaluar(numeroGanador);
        girando = false;
        girarBtn.disabled = false;
    }, 4000);
});

/* ============================
   EVALUACIÓN Y CONEXIÓN BACKEND
   ============================ */
function evaluar(numero) {
    let gananciaTotal = 0;
    let apuestaTotal = 0;

    apuestas.forEach(a => {
        apuestaTotal += a.cantidad;
        let gano = false;
        const valorStr = a.valor.toString(); 

        switch (a.tipo) {
            case "numero":
                if (parseInt(valorStr) === numero) gano = true; break;
            case "color":
                if ((valorStr === "rojo" && esRojo(numero)) || (valorStr === "negro" && !esRojo(numero) && numero !== 0)) gano = true; break;
            case "paridad":
                if (numero !== 0 && ((valorStr === "par" && numero%2===0) || (valorStr === "impar" && numero%2!==0))) gano = true; break;
            case "rango":
                if (numero !== 0 && ((valorStr === "1-18" && numero<=18) || (valorStr === "19-36" && numero>=19))) gano = true; break;
            case "columna":
                if (numero !== 0) {
                    if (valorStr === "3" && numero % 3 === 0) gano = true;
                    if (valorStr === "2" && numero % 3 === 2) gano = true;
                    if (valorStr === "1" && numero % 3 === 1) gano = true;
                } break;
            case "docena":
                if (numero !== 0) {
                    if (valorStr === "1-12" && numero <= 12) gano = true;
                    else if (valorStr === "13-24" && numero > 12 && numero <= 24) gano = true;
                    else if (valorStr === "25-36" && numero > 24) gano = true;
                } break;
        }
        if (gano) gananciaTotal += a.cantidad * (PREMIOS[a.tipo] + 1); // +1 porque devuelve la apuesta + premio
    });

    // --- CONEXIÓN AL SERVIDOR ---
    fetch('../Backend/game_logic.php', {
        method: 'POST',
        body: JSON.stringify({ bet: apuestaTotal, win: gananciaTotal }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            saldoActual = parseFloat(data.new_balance); // Sincronizamos con el servidor
            actualizarSaldoVisual(saldoActual);
            
            if (gananciaTotal > 0) {
                resultadoTxt.innerHTML = `¡Nº <span class="badge bg-primary fs-4">${numero}</span>! <br> GANASTE <span class="text-success display-6 fw-bold">${gananciaTotal}€</span> 🎉`;
            } else {
                resultadoTxt.innerHTML = `Nº <span class="badge bg-primary fs-4">${numero}</span> <br> Pierdes ${apuestaTotal}€`;
            }
        } else {
            alert("Error de conexión: " + data.message);
        }
    });

    const ganadoresTexto = obtenerCategoriasGanadoras(numero);
    detalleGanadoresTxt.innerHTML = `Ganadores: <span class="text-info">${ganadoresTexto}</span>`;

    // Actualizar historial
    historial.unshift(numero);
    if(historial.length > 10) historial.pop();
    renderizarHistorial();

    apuestas = [];
    
    setTimeout(() => {
        document.querySelectorAll('.ficha-visual').forEach(e => e.remove());
        resultadoTxt.textContent = "Hagan juego...";
        detalleGanadoresTxt.textContent = "";
        if (btnLimpiar) btnLimpiar.disabled = true;
    }, 5000);
}

function obtenerCategoriasGanadoras(n) {
    if (n === 0) return "Cero";
    let cats = [];
    cats.push(esRojo(n) ? "Rojo" : "Negro");
    cats.push(n % 2 === 0 ? "Par" : "Impar");
    cats.push(n <= 18 ? "1-18" : "19-36");
    return cats.join(" | ");
}

function renderizarHistorial() {
    resultadosDiv.innerHTML = "";
    historial.forEach(n => {
        const div = document.createElement("div");
        div.className = "rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm";
        div.style.width = "35px"; div.style.height = "35px"; div.style.fontSize = "14px";
        div.textContent = n;
        if (n === 0) div.style.background = "#2ecc71";
        else if (esRojo(n)) div.style.background = "#e74c3c";
        else div.style.background = "#34495e";
        resultadosDiv.appendChild(div);
    });
}