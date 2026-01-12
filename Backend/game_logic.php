<?php
// Backend/game_logic.php
session_start();
header('Content-Type: application/json');
require 'conexion.php';

// 1. Seguridad: Login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para jugar']);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);

// 2. Recibimos la Apuesta (bet) y la Ganancia (win)
$bet = $input['bet'] ?? 0;   // Cantidad apostada (se restará)
$win = $input['win'] ?? 0;   // Cantidad ganada (se sumará)

// Validaciones básicas
if (!is_numeric($bet) || $bet < 0 || !is_numeric($win) || $win < 0) {
    echo json_encode(['success' => false, 'message' => 'Datos de juego inválidos']);
    exit;
}

// 3. Comprobar si tiene saldo suficiente para la apuesta
$stmt = $conexion->prepare("SELECT saldo FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$current_saldo = floatval($row['saldo']);

if ($current_saldo < $bet) {
    echo json_encode(['success' => false, 'message' => 'Saldo insuficiente']);
    exit;
}

// 4. Calcular nuevo saldo
// Fórmula: Saldo Actual - Lo que apostó + Lo que ganó
$new_saldo = $current_saldo - $bet + $win;

// 5. Guardar en Base de Datos
$update = $conexion->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?");
$update->bind_param("di", $new_saldo, $user_id);

if ($update->execute()) {
    echo json_encode([
        'success' => true, 
        'new_balance' => $new_saldo,
        'message' => ($win > 0) ? "¡Has ganado $win €!" : "Suerte para la próxima"
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error guardando partida']);
}

$stmt->close();
$update->close();
$conexion->close();
?>