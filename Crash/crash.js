/* =========================================
   ELEMENTOS DOM
   ========================================= */
const canvas = document.getElementById('crashGraph');
const ctx = canvas.getContext('2d');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const statusText = document.getElementById('statusText');
const btnAction = document.getElementById('btnAction');
const betInput = document.getElementById('betInput');
const walletDisplay = document.getElementById('walletDisplay');
const historyDiv = document.getElementById('history');

/* =========================================
   ESTADO DEL JUEGO
   ========================================= */
let gameRunning = false;
let userBet = 0;
let userInGame = false; // Si el usuario ha apostado en la ronda actual
let userCashedOut = false; // Si ya se retiró
let currentMultiplier = 1.00;
let crashPoint = 0;
let animationId;
let startTime;

// Variables de dibujo
let graphData = []; // Guardará puntos [x, y] para dibujar la línea

/* =========================================
   INICIALIZACIÓN
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = '../Portal/login.html';
        return;
    }
    updateWalletVisuals();
    resizeCanvas();
    drawIdleGraph();
});

window.addEventListener('resize', resizeCanvas);

/* =========================================
   LOGICA PRINCIPAL
   ========================================= */

btnAction.addEventListener('click', () => {
    if (gameRunning) {
        // Si el juego corre y el usuario está dentro -> INTENTAR RETIRARSE
        if (userInGame && !userCashedOut) {
            cashOut();
        }
    } else {
        // Si el juego está parado -> INICIAR APUESTA
        startGame();
    }
});

function startGame() {
    // 1. Validar Saldo
    const bet = parseFloat(betInput.value);
    if (isNaN(bet) || bet <= 0) return alert("Apuesta inválida");
    
    if (typeof Wallet !== 'undefined') {
        if (Wallet.getBalance() < bet) return alert("Saldo insuficiente");
        Wallet.updateBalance(-bet); // Cobrar entrada
    }

    // 2. Configurar Estado Inicial
    userBet = bet;
    userInGame = true;
    userCashedOut = false;
    gameRunning = true;
    currentMultiplier = 1.00;
    graphData = [{x: 0, y: canvas.height}]; // Inicio abajo a la izquierda

    // 3. Calcular Crash Point (Algoritmo simple ponderado)
    // El 1% de las veces crashea instantáneamente (1.00x)
    // Fórmula común: E = 100 / (random[1-100]) -> Genera distribución exponencial
    const r = Math.random(); 
    crashPoint = 0.99 / (1 - r);
    if (crashPoint > 100) crashPoint = 100; // Capar a x100 para no romperlo
    if (Math.random() < 0.03) crashPoint = 1.00; // 3% probabilidad de crash instantáneo (La Casa Gana)
    
    // DEBUG: Descomentar para ver cuándo va a explotar en consola
    // console.log("Crash Point: " + crashPoint.toFixed(2));

    // 4. UI Update
    updateWalletVisuals();
    btnAction.classList.replace('btn-success', 'btn-warning');
    btnAction.classList.add('pulse-anim'); // Animación de latido
    btnAction.innerHTML = "💰 RETIRAR";
    statusText.textContent = "¡SUBIENDO!";
    statusText.classList.remove('text-danger', 'text-secondary');
    statusText.classList.add('text-success');
    multiplierDisplay.classList.remove('text-danger');
    multiplierDisplay.classList.add('text-white');

    // 5. Iniciar Loop
    startTime = Date.now();
    animate();
}

function animate() {
    if (!gameRunning) return;

    // Calcular tiempo transcurrido
    const now = Date.now();
    const elapsed = (now - startTime) / 1000; // Segundos

    // Fórmula de crecimiento exponencial: Multiplier sube con el tiempo
    // Ajustar el divisor (8) para que vaya más lento o rápido
    currentMultiplier = 1 + Math.pow(elapsed, 2) / 10; 

    // Actualizar Texto
    multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";

    // ¿HEMOS CHOCADO?
    if (currentMultiplier >= crashPoint) {
        gameOver();
        return;
    }

    // Dibujar Gráfica
    drawGraph(elapsed);

    animationId = requestAnimationFrame(animate);
}

function cashOut() {
    userCashedOut = true;
    userInGame = false;
    
    const winAmount = userBet * currentMultiplier;
    
    // Pagar al usuario
    if (typeof Wallet !== 'undefined') {
        Wallet.updateBalance(winAmount);
        updateWalletVisuals();
        if(window.NavbarManager) NavbarManager.init(); // Actualizar navbar
    }

    // UI Feedback
    btnAction.classList.replace('btn-warning', 'btn-secondary');
    btnAction.disabled = true;
    btnAction.innerHTML = `✅ GANADO: ${winAmount.toFixed(2)}€`;
    btnAction.classList.remove('pulse-anim');
    
    // Efecto visual en el multiplicador
    multiplierDisplay.classList.add('text-success');
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    // Fijar el número final exacto
    multiplierDisplay.textContent = crashPoint.toFixed(2) + "x";
    
    // UI Feedback Crash
    statusText.textContent = "💥 CRASHED!";
    statusText.classList.remove('text-success');
    statusText.classList.add('text-danger');
    multiplierDisplay.classList.remove('text-white', 'text-success');
    multiplierDisplay.classList.add('text-danger');
    
    // Botón Reset
    btnAction.classList.remove('btn-warning', 'pulse-anim');
    btnAction.disabled = false;
    
    if (!userCashedOut && userInGame) {
        // Perdió
        btnAction.classList.replace('btn-secondary', 'btn-danger'); // Si estaba disable
        btnAction.classList.add('btn-danger');
        btnAction.innerHTML = "PERDISTE... JUGAR DE NUEVO";
    } else if (userCashedOut) {
        // Ya había ganado
        btnAction.classList.remove('btn-secondary');
        btnAction.classList.add('btn-success');
        btnAction.innerHTML = "¡JUGAR OTRA VEZ!";
    } else {
        // Reset normal
        btnAction.classList.add('btn-success');
        btnAction.innerHTML = "APOSTAR";
    }
    
    // Añadir al historial
    addToHistory(crashPoint);
}

/* =========================================
   CANVAS Y DIBUJO
   ========================================= */
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    if(!gameRunning) drawIdleGraph();
}

function drawGraph(elapsed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Grid
    drawGrid();

    // Dibujar Línea del Cohete
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    // Simular curva: x es tiempo, y es altura
    // Normalizamos para que encaje en el canvas
    const x = (elapsed * 30); // Velocidad horizontal
    const y = canvas.height - (Math.pow(elapsed, 2) * 5); // Velocidad vertical (curva)

    // Curva Bézier simple para suavizar
    ctx.quadraticCurveTo(x/2, canvas.height, x, y);
    
    ctx.lineWidth = 5;
    ctx.strokeStyle = userCashedOut ? '#2ecc71' : '#f1c40f'; // Verde si ganó, amarillo si jugando
    ctx.stroke();

    // Dibujar el Cohete (Círculo brillante en la punta)
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = userCashedOut ? '#2ecc71' : '#f1c40f';
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0; // Reset shadow

    // Líneas horizontales
    for(let i=0; i<canvas.height; i+=50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    // Líneas verticales
    for(let i=0; i<canvas.width; i+=50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

function drawIdleGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.font = "20px Arial";
    ctx.fillText("Listo para despegar...", 20, canvas.height - 20);
}

/* =========================================
   UTILIDADES
   ========================================= */
function setBet(amount) {
    betInput.value = amount;
}
function doubleBet() {
    betInput.value = (parseFloat(betInput.value) * 2).toFixed(2);
}

function updateWalletVisuals() {
    if (typeof Wallet !== 'undefined' && walletDisplay) {
        walletDisplay.textContent = Wallet.getBalance().toFixed(2) + " €";
    }
}

function addToHistory(val) {
    const span = document.createElement('span');
    span.className = `badge ${val >= 2 ? 'bg-success' : 'bg-danger'}`;
    span.textContent = val.toFixed(2) + 'x';
    historyDiv.prepend(span);
    if(historyDiv.children.length > 8) historyDiv.lastChild.remove();
}