/* CasinoDaw/Blackjack/game.js */

const API_URL = "http://localhost:8080/api/blackjack";
let gameId = null;
let saldo = 0;

// Elementos DOM
const btnDeal = document.getElementById('btnDeal');
const btnHit = document.getElementById('btnHit');
const btnStand = document.getElementById('btnStand');
const btnDouble = document.getElementById('btnDouble');
const bettingPanel = document.getElementById('betting-panel');
const actionPanel = document.getElementById('action-panel');
const dealerCardsDiv = document.getElementById('dealer-cards');
const playerCardsDiv = document.getElementById('player-cards');
const dealerScore = document.getElementById('dealer-score');
const playerScore = document.getElementById('player-score');
const msgBox = document.getElementById('game-message');
const statusServer = document.getElementById('server-status');

/* ================= INICIO ================= */
document.addEventListener('DOMContentLoaded', () => {
    cargarSaldo();
    checkServer();
});

// Comprobar si Java está corriendo
async function checkServer() {
    try {
        // Intentamos una llamada dummy (si tienes un endpoint health, mejor)
        // Por ahora asumimos que si falla el fetch es que está apagado
        await fetch(API_URL + "/health", { method: 'HEAD' }).catch(() => {}); 
        // Nota: Como no tenemos endpoint health aun, esto es visual.
        // Lo marcaremos como "conectado" cuando la primera llamada funcione.
    } catch (e) {
        statusServer.textContent = "🔴 Servidor Java desconectado";
        statusServer.className = "text-danger fw-bold";
    }
}

function cargarSaldo() {
    fetch('../Backend/get_user_info.php')
        .then(r => r.json())
        .then(d => {
            if(d.logged_in) {
                saldo = parseFloat(d.saldo);
                document.getElementById('walletDisplay').textContent = saldo.toFixed(2) + " €";
            } else {
                window.location.href = '../Portal/login.html';
            }
        });
}

/* ================= ACCIONES ================= */

btnDeal.addEventListener('click', () => {
    const apuesta = parseInt(document.getElementById('betAmount').value);
    if(apuesta > saldo) return alert("Saldo insuficiente");

    // Llamada al Backend Java
    fetch(`${API_URL}/start?apuesta=${apuesta}`, { method: 'POST' })
        .then(r => {
            if(!r.ok) throw new Error("Error conexión Java");
            return r.json();
        })
        .then(data => {
            statusServer.textContent = "🟢 Conectado a Java";
            statusServer.className = "text-success";
            iniciarInterfaz(data);
        })
        .catch(err => {
            alert("No se puede conectar con el juego. ¿Has iniciado el servidor Java?");
            console.error(err);
        });
});

btnHit.addEventListener('click', () => realizarAccion('hit'));
btnStand.addEventListener('click', () => realizarAccion('stand'));
btnDouble.addEventListener('click', () => realizarAccion('double'));

function realizarAccion(accion) {
    fetch(`${API_URL}/${accion}?id=${gameId}`, { method: 'POST' })
        .then(r => r.json())
        .then(data => actualizarMesa(data));
}

/* ================= UI UPDATES ================= */

function iniciarInterfaz(data) {
    gameId = data.id;
    bettingPanel.classList.add('d-none');
    actionPanel.classList.remove('d-none');
    msgBox.style.opacity = '0';
    actualizarMesa(data);
}

function actualizarMesa(data) {
    // 1. Renderizar Cartas
    renderMano(dealerCardsDiv, data.cartasCroupier || [data.cartaCroupierVisible], !!data.cartaCroupierVisible);
    renderMano(playerCardsDiv, data.cartasJugador);

    // 2. Puntuaciones
    playerScore.textContent = data.puntosJugador;
    dealerScore.textContent = data.puntosCroupier;

    // 3. Estado del juego
    if (data.estado !== 'JUGANDO') {
        finalizarPartida(data);
    }
}

function renderMano(container, cartas, ocultarSegunda = false) {
    container.innerHTML = '';
    
    cartas.forEach(c => {
        const cartaDiv = document.createElement('div');
        // Asumimos que el backend devuelve {palo: "♥", rango: "A"}
        const esRoja = (c.palo === '♥' || c.palo === '♦');
        cartaDiv.className = `carta ${esRoja ? 'roja' : 'negra'}`;
        
        cartaDiv.innerHTML = `
            <div class="top">${c.rango} ${c.palo}</div>
            <div class="center display-4">${c.palo}</div>
            <div class="bottom text-end">${c.rango} ${c.palo}</div>
        `;
        container.appendChild(cartaDiv);
    });

    if (ocultarSegunda) {
        // Carta boca abajo del dealer
        const dorso = document.createElement('div');
        dorso.className = 'carta bg-danger';
        dorso.style.background = 'repeating-linear-gradient(45deg, #c0392b 0, #c0392b 10px, #e74c3c 10px, #e74c3c 20px)';
        container.appendChild(dorso);
    }
}

function finalizarPartida(data) {
    actionPanel.classList.add('d-none');
    
    let mensaje = "";
    let claseAlert = "";
    let gananciaTotal = 0; // Lo que devuelve la banca (Apuesta + Premio)

    // 1. Calcular Ganancias según lo que dijo Java
    if (data.estado === 'GANADOR') {
        mensaje = `🏆 ¡GANASTE! (+${data.apuesta}€)`;
        claseAlert = "alert-success";
        gananciaTotal = data.apuesta * 2; // Te devuelven tu apuesta + lo ganado (1:1)
    } else if (data.estado === 'PERDEDOR') {
        mensaje = `❌ PERDISTE (-${data.apuesta}€)`;
        claseAlert = "alert-danger";
        gananciaTotal = 0; // Se quedan todo
    } else {
        mensaje = `🤝 EMPATE (Recuperas apuesta)`;
        claseAlert = "alert-warning";
        gananciaTotal = data.apuesta; // Te devuelven tu apuesta
    }

    // 2. Mostrar mensaje visual
    msgBox.textContent = mensaje;
    msgBox.className = `alert ${claseAlert} text-center fw-bold`;
    msgBox.style.opacity = '1';

    // 3. 🚀 EL PUENTE: Guardar en Base de Datos (PHP)
    // Usamos el mismo archivo que la Ruleta y los Caballos
    fetch('../Backend/game_logic.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bet: data.apuesta,
            win: gananciaTotal
        })
    })
    .then(r => r.json())
    .then(dbData => {
        if (dbData.success) {
            // Actualizamos el saldo visual con lo que nos confirma la BD
            saldo = parseFloat(dbData.new_balance);
            document.getElementById('walletDisplay').textContent = saldo.toFixed(2) + " €";
            console.log("💰 Saldo sincronizado con MySQL");
        } else {
            console.error("Error guardando saldo:", dbData.message);
        }
    })
    .catch(err => console.error("Error de red:", err));

    // 4. Reactivar botón para jugar otra vez
    setTimeout(() => {
        bettingPanel.classList.remove('d-none');
    }, 3000);
}