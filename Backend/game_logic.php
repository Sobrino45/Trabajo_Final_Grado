<?php
// Backend/game_logic.php
session_start();
header('Content-Type: application/json');
require 'conexion.php'; // Usamos tu archivo de conexión original

// 1. Seguridad: Verificar Login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);

// 2. Recibir datos: Apuesta, Ganancia y Nombre del Juego
$bet = $input['bet'] ?? 0;
$win = $input['win'] ?? 0;
$gameName = $input['game'] ?? 'Juego Desconocido'; // Nombre para el historial

// Validaciones
if (!is_numeric($bet) || $bet < 0 || !is_numeric($win) || $win < 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit;
}

// Iniciamos transacción para que todo se guarde o nada (seguridad de datos)
$conexion->begin_transaction();

try {
    // 3. Verificar saldo actual
    $stmt = $conexion->prepare("SELECT saldo FROM usuarios WHERE id = ? FOR UPDATE");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $current_saldo = floatval($row['saldo']);
    $stmt->close();

    if ($current_saldo < $bet) {
        throw new Exception('Saldo insuficiente');
    }

    // 4. Calcular nuevo saldo
    $new_saldo = $current_saldo - $bet + $win;

    // 5. Actualizar saldo en la tabla 'usuarios'
    $update = $conexion->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?");
    $update->bind_param("di", $new_saldo, $user_id);
    if (!$update->execute()) {
        throw new Exception('Error actualizando saldo');
    }
    $update->close();

    // 6. Insertar registro en la tabla 'historial'
    // IMPORTANTE: Asegúrate de que ya creaste la tabla 'historial' en tu base de datos
    $historial = $conexion->prepare("INSERT INTO historial (user_id, juego, apuesta, ganancia) VALUES (?, ?, ?, ?)");
    $historial->bind_param("isdd", $user_id, $gameName, $bet, $win);
    if (!$historial->execute()) {
        throw new Exception('Error guardando historial');
    }
    $historial->close();

    // Si todo fue bien, confirmamos los cambios
    $conexion->commit();

    echo json_encode([
        'success' => true,
        'new_balance' => $new_saldo,
        'message' => ($win > 0) ? "¡Has ganado $win €!" : "Suerte para la próxima"
    ]);

} catch (Exception $e) {
    // Si algo falló, deshacemos los cambios
    $conexion->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conexion->close();
?>