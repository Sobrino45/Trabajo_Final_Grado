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

// --- NUEVA VARIABLE DE CALIBRACIÓN ---
// Si el número se queda corto, suma grados (ej: 90).
// Si se pasa, resta grados (ej: -90 o 270).
const AJUSTE_VISUAL = -90;

/* ============================
   VARIABLES DE ESTADO
   ============================ */
let apuestas = [];
let historial = [];
let rotacionActual = 0;
let girando = false;

/* ============================
   ELEMENTOS DOM
   ============================ */
const ruleta = document.getElementById("ruleta");
const girarBtn = document.getElementById("girar");
const resultadoTxt = document.getElementById("resultado");
const listaApuestas = document.getElementById("listaApuestas");
const cantidadInput = document.getElementById("cantidad");
const resultadosDiv = document.getElementById("resultados");
const contNumeros = document.getElementById("numeros");

/* ============================
   INICIALIZACIÓN Y SEGURIDAD
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Proteger ruta: Si no hay usuario, fuera.
    // Verificamos si Auth existe para evitar errores si abres el archivo localmente sin el resto del proyecto
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = '../Portal/login.html';
        return;
    }

    inicializarJuego();
});

function inicializarJuego() {
    crearRuletaVisual();
    crearBotonesNumeros();      // Genera botones 0-36
    configurarBotonesApuestas(); // Conecta botones Rojo/Negro/Par...
    renderizarHistorial();
}

/* ============================
   LÓGICA DE JUEGO (VISUAL)
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
        if (i === 0) span.style.color = "#2ecc71"; // Verde
        else span.style.color = esRojo(i) ? "#e74c3c" : "white"; // Rojo/Blanco

        div.appendChild(span);
        ruleta.appendChild(div);
    }
}

function crearBotonesNumeros() {
    // Limpiamos por si acaso
    contNumeros.innerHTML = "";

    for (let i = 0; i < TOTAL_NUMEROS; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.dataset.tipo = "numero";
        btn.dataset.valor = i;
        // Estilos Bootstrap
        btn.className = `btn btn-sm m-1 fw-bold ${
            i === 0 ? 'btn-success' : esRojo(i) ? 'btn-danger' : 'btn-dark border-secondary'
        }`;
        
        btn.onclick = () => procesarApuesta(btn);
        contNumeros.appendChild(btn);
    }
}

function configurarBotonesApuestas() {
    // CORRECCIÓN: Buscamos botones por su atributo data-tipo explícitamente
    // independientemente de en qué div estén metidos.
    const selectores = 'button[data-tipo="color"], button[data-tipo="paridad"], button[data-tipo="rango"]';
    const botonesEstaticos = document.querySelectorAll(selectores);
    
    botonesEstaticos.forEach(btn => {
        // Usamos onclick para evitar acumulación de eventos si se reinicia
        btn.onclick = () => procesarApuesta(btn);
    });
}

/* ============================
   GESTIÓN DE APUESTAS (CORE)
   ============================ */
function procesarApuesta(btn) {
    if (girando) return;

    const cantidad = parseFloat(cantidadInput.value);
    
    // Validaciones
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Introduce una cantidad válida.");
        return;
    }

    // Verificar Wallet
    if (typeof Wallet !== 'undefined') {
        const saldoActual = Wallet.getBalance();
        if (cantidad > saldoActual) {
            alert(`Saldo insuficiente. Tienes ${saldoActual.toFixed(2)}€`);
            return;
        }
        // Descontar dinero
        Wallet.updateBalance(-cantidad);
        // Actualizar UI Navbar
        if(window.NavbarManager) NavbarManager.init();
    }

    // Registrar apuesta
    apuestas.push({
        tipo: btn.dataset.tipo,
        valor: btn.dataset.valor,
        cantidad
    });

    // Feedback
    actualizarLista();
    const nombreApuesta = btn.textContent || btn.dataset.valor;
    resultadoTxt.innerHTML = `<span class="text-info">Apostado ${cantidad}€ a <b>${nombreApuesta}</b></span>`;
    resultadoTxt.className = "text-center mt-3";
}

function actualizarLista() {
    listaApuestas.innerHTML = "";
    apuestas.forEach(a => {
        const li = document.createElement("li");
        li.className = "mb-1";
        li.innerHTML = `
            <span class="badge bg-secondary">${a.tipo.toUpperCase()}</span> 
            <span class="fw-bold text-warning">${a.valor.toUpperCase()}</span> 
            ➝ ${a.cantidad}€
        `;
        listaApuestas.appendChild(li);
    });
}

/* ============================
   GIRAR RULETA (CON AJUSTE VISUAL)
   ============================ */
girarBtn.addEventListener("click", () => {
    if (girando) return;
    if (apuestas.length === 0) {
        resultadoTxt.textContent = "¡Haz al menos una apuesta para jugar!";
        resultadoTxt.className = "text-center text-warning fw-bold mt-3";
        return;
    }

    girando = true;
    girarBtn.disabled = true;
    resultadoTxt.textContent = "¡Girando!...";
    resultadoTxt.className = "text-center text-light fw-bold mt-3";

    const numeroGanador = Math.floor(Math.random() * TOTAL_NUMEROS);
    
    // --- LÓGICA DE GIRO CON CALIBRACIÓN ---
    const anguloDestino = numeroGanador * GRADOS;
    
    // AQUI APLICAMOS EL AJUSTE:
    // (360 - anguloDestino) lleva el número al 0º (Arriba)
    // + AJUSTE_VISUAL mueve el número hacia donde esté tu flecha realmente
    const targetRotation = (360 - anguloDestino) + AJUSTE_VISUAL; 
    
    const rotacionActualMod = rotacionActual % 360;
    
    let distanciaGiro = targetRotation - rotacionActualMod;
    // Normalizar el giro para que siempre sea positivo (derecha)
    if (distanciaGiro < 0) distanciaGiro += 360; 
    if (distanciaGiro < 0) distanciaGiro += 360; // Doble check por si el ajuste es negativo grande

    // Añadimos vueltas extra para el efecto visual
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
   EVALUAR RESULTADOS
   ============================ */
function evaluar(numero) {
    let gananciaTotal = 0;

    apuestas.forEach(a => {
        let gano = false;
        const valorApuesta = a.valor.toString(); 

        switch (a.tipo) {
            case "numero":
                if (parseInt(valorApuesta) === numero) gano = true;
                break;
            case "color":
                if ((valorApuesta === "rojo" && esRojo(numero)) ||
                    (valorApuesta === "negro" && !esRojo(numero) && numero !== 0)) {
                    gano = true;
                }
                break;
            case "paridad":
                if (numero !== 0) {
                    if ((valorApuesta === "par" && numero % 2 === 0) ||
                        (valorApuesta === "impar" && numero % 2 !== 0)) {
                        gano = true;
                    }
                }
                break;
            case "rango":
                if ((valorApuesta === "1-18" && numero >= 1 && numero <= 18) ||
                    (valorApuesta === "19-36" && numero >= 19 && numero <= 36)) {
                    gano = true;
                }
                break;
        }

        if (gano) {
            gananciaTotal += a.cantidad * PREMIOS[a.tipo];
        }
    });

    // Gestionar Ganancias
    if (gananciaTotal > 0) {
        if(typeof Wallet !== 'undefined') Wallet.updateBalance(gananciaTotal);
        
        resultadoTxt.innerHTML = `¡Nº <span class="badge bg-primary fs-4">${numero}</span>! <br> GANASTE <span class="text-success display-6 fw-bold">${gananciaTotal}€</span> 🎉`;
    } else {
        resultadoTxt.innerHTML = `Nº <span class="badge bg-primary fs-4">${numero}</span> <br> Suerte la próxima vez.`;
        resultadoTxt.className = "text-center text-muted fw-bold mt-3";
    }

    if(window.NavbarManager) NavbarManager.init();

    // Historial
    historial.unshift(numero);
    if(historial.length > 10) historial.pop();
    renderizarHistorial();

    apuestas = [];
    setTimeout(() => actualizarLista(), 4000); 
}

function renderizarHistorial() {
    resultadosDiv.innerHTML = "";
    historial.forEach(n => {
        const div = document.createElement("div");
        div.className = "rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm";
        div.style.width = "35px";
        div.style.height = "35px";
        div.style.fontSize = "14px";
        div.textContent = n;

        if (n === 0) div.style.background = "#2ecc71";
        else if (esRojo(n)) div.style.background = "#e74c3c";
        else div.style.background = "#34495e";

        resultadosDiv.appendChild(div);
    });
}