<?php
// Backend/game_logic.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesión expirada']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Recibir datos JSON del juego (Blackjack, Ruleta, etc.)
$input = json_decode(file_get_contents('php://input'), true);
$game = $input['game'] ?? 'Unknown';
$bet = floatval($input['bet'] ?? 0);
$win = floatval($input['win'] ?? 0);

if ($bet < 0 || $win < 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit;
}

try {
    $db = Database::getConnection();
    
    // 1. Verificar que el usuario tenga saldo suficiente (Doble check de seguridad)
    // Nota: El saldo ya se restó visualmente en el JS, pero aquí validamos la integridad
    $stmtCheck = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id");
    $stmtCheck->bindParam(':id', $user_id);
    $stmtCheck->execute();
    $currentSaldo = $stmtCheck->fetchColumn();

    // Calculamos el balance final: Saldo Actual - Apuesta + Ganancia
    // (Si el juego ya restó la apuesta antes, la lógica puede variar, pero asumimos transacción completa aquí)
    $nuevoSaldo = $currentSaldo - $bet + $win;

    if ($nuevoSaldo < 0) {
        echo json_encode(['success' => false, 'message' => 'Saldo insuficiente en el servidor']);
        exit;
    }

    // 2. Actualizar el saldo
    $stmtUpdate = $db->prepare("UPDATE usuarios SET saldo = :saldo WHERE id = :id");
    $stmtUpdate->bindParam(':saldo', $nuevoSaldo);
    $stmtUpdate->bindParam(':id', $user_id);
    $stmtUpdate->execute();

    // 3. (Opcional) Guardar en historial de partidas
    // Si tienes una tabla 'historial', descomenta esto:
    /*
    $stmtHist = $db->prepare("INSERT INTO historial (user_id, juego, apuesta, ganancia, fecha) VALUES (:uid, :game, :bet, :win, NOW())");
    $stmtHist->execute([':uid'=>$user_id, ':game'=>$game, ':bet'=>$bet, ':win'=>$win]);
    */

    echo json_encode([
        'success' => true,
        'new_balance' => $nuevoSaldo,
        'message' => 'Partida guardada'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error BD: ' . $e->getMessage()]);
}
?>