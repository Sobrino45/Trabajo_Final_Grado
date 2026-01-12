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
let userInGame = false; 
let userCashedOut = false; 
let currentMultiplier = 1.00;
let crashPoint = 0;
let animationId;
let startTime;
let saldoActual = 0;

/* =========================================
   INICIALIZACIÓN
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosUsuario();
    resizeCanvas();
    drawIdleGraph();
});

function cargarDatosUsuario() {
    fetch('../Backend/get_user_info.php')
        .then(r => r.json())
        .then(data => {
            if(data.logged_in) {
                saldoActual = parseFloat(data.saldo);
                updateWalletVisuals();
            } else {
                window.location.href = '../Portal/login.html';
            }
        });
}

window.addEventListener('resize', resizeCanvas);

/* =========================================
   LOGICA PRINCIPAL
   ========================================= */

btnAction.addEventListener('click', () => {
    if (gameRunning) {
        if (userInGame && !userCashedOut) {
            cashOut();
        }
    } else {
        startGame();
    }
});

function startGame() {
    const bet = parseFloat(betInput.value);
    if (isNaN(bet) || bet <= 0) return alert("Apuesta inválida");
    if (saldoActual < bet) return alert("Saldo insuficiente");

    // Restamos visualmente la apuesta al empezar
    // (OJO: Se descontará realmente en BD al terminar la partida para simplificar lógica)
    saldoActual -= bet;
    updateWalletVisuals();

    userBet = bet;
    userInGame = true;
    userCashedOut = false;
    gameRunning = true;
    currentMultiplier = 1.00;

    // Calcular Crash Point
    const r = Math.random(); 
    crashPoint = 0.99 / (1 - r);
    if (crashPoint > 100) crashPoint = 100; 
    if (Math.random() < 0.03) crashPoint = 1.00; 
    
    btnAction.classList.replace('btn-success', 'btn-warning');
    btnAction.classList.add('pulse-anim'); 
    btnAction.innerHTML = "💰 RETIRAR";
    statusText.textContent = "¡SUBIENDO!";
    statusText.classList.remove('text-danger', 'text-secondary');
    statusText.classList.add('text-success');
    multiplierDisplay.classList.remove('text-danger');
    multiplierDisplay.classList.add('text-white');

    startTime = Date.now();
    animate();
}

function animate() {
    if (!gameRunning) return;

    const now = Date.now();
    const elapsed = (now - startTime) / 1000; 

    // Fórmula del multiplicador
    currentMultiplier = 1 + Math.pow(elapsed, 2) / 10; 

    multiplierDisplay.textContent = currentMultiplier.toFixed(2) + "x";

    if (currentMultiplier >= crashPoint) {
        gameOver();
        return;
    }

    drawGraph(elapsed);

    animationId = requestAnimationFrame(animate);
}

function cashOut() {
    userCashedOut = true;
    userInGame = false;
    
    const winAmount = userBet * currentMultiplier;
    
    // --- CONEXIÓN BACKEND (GANANCIA) ---
    // El usuario gana, enviamos apuesta y ganancia
    fetch('../Backend/game_logic.php', {
        method: 'POST',
        body: JSON.stringify({ bet: userBet, win: winAmount }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            saldoActual = parseFloat(data.new_balance);
            updateWalletVisuals();
        }
    });

    btnAction.classList.replace('btn-warning', 'btn-secondary');
    btnAction.disabled = true;
    btnAction.innerHTML = `✅ GANADO: ${winAmount.toFixed(2)}€`;
    btnAction.classList.remove('pulse-anim');
    multiplierDisplay.classList.add('text-success');
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    multiplierDisplay.textContent = crashPoint.toFixed(2) + "x";
    
    statusText.textContent = "💥 CRASHED!";
    statusText.classList.remove('text-success');
    statusText.classList.add('text-danger');
    multiplierDisplay.classList.remove('text-white', 'text-success');
    multiplierDisplay.classList.add('text-danger');
    
    btnAction.classList.remove('btn-warning', 'pulse-anim');
    btnAction.disabled = false;
    
    // Si el usuario NO se retiró, PERDIÓ
    if (!userCashedOut && userInGame) {
        btnAction.classList.replace('btn-secondary', 'btn-danger'); 
        btnAction.classList.add('btn-danger');
        btnAction.innerHTML = "PERDISTE... JUGAR DE NUEVO";
        
        // --- CONEXIÓN BACKEND (PÉRDIDA) ---
        // Enviamos la apuesta y ganancia 0
        fetch('../Backend/game_logic.php', {
            method: 'POST',
            body: JSON.stringify({ bet: userBet, win: 0 }),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(r => r.json())
        .then(data => {
             saldoActual = parseFloat(data.new_balance);
             updateWalletVisuals();
        });

    } else if (userCashedOut) {
        btnAction.classList.remove('btn-secondary');
        btnAction.classList.add('btn-success');
        btnAction.innerHTML = "¡JUGAR OTRA VEZ!";
    } else {
        btnAction.classList.add('btn-success');
        btnAction.innerHTML = "APOSTAR";
    }
    
    addToHistory(crashPoint);
}

/* =========================================
   CANVAS Y DIBUJO (CON ZOOM)
   ========================================= */
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    if(!gameRunning) drawIdleGraph();
}

function drawGraph(elapsed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rawX = (elapsed * 30); 
    const rawY = (Math.pow(elapsed, 2) * 5); 

    const maxVisibleHeight = canvas.height * 0.8;
    let scale = 1;

    if (rawY > maxVisibleHeight) {
        scale = maxVisibleHeight / rawY;
    }

    drawGrid(scale);

    const x = rawX * scale;
    const y = canvas.height - (rawY * scale); 

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.quadraticCurveTo(x/2, canvas.height, x, y);
    ctx.lineWidth = 5;
    ctx.strokeStyle = userCashedOut ? '#2ecc71' : '#f1c40f'; 
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.shadowBlur = 20;
    ctx.shadowColor = userCashedOut ? '#2ecc71' : '#f1c40f';
}

function drawGrid(scale = 1) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0; 

    for(let i = 0; i < canvas.height * (1/scale) + 100; i += 50) {
        let yPos = canvas.height - (i * scale);
        if(yPos < 0) continue; 
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(canvas.width, yPos);
        ctx.stroke();
    }

    for(let i = 0; i < canvas.width * (1/scale) + 100; i += 50) {
        let xPos = i * scale;
        if(xPos > canvas.width) break;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, canvas.height);
        ctx.stroke();
    }
}

function drawIdleGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(1); 
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
    walletDisplay.textContent = saldoActual.toFixed(2) + " €";
}

function addToHistory(val) {
    const span = document.createElement('span');
    span.className = `badge ${val >= 2 ? 'bg-success' : 'bg-danger'}`;
    span.textContent = val.toFixed(2) + 'x';
    historyDiv.prepend(span);
    if(historyDiv.children.length > 8) historyDiv.lastChild.remove();
}