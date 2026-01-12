<?php
// Backend/deposit.php
session_start();
header('Content-Type: application/json');
require 'conexion.php';

// 1. Verificar sesión
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No estás logueado']);
    exit;
}

$user_id = $_SESSION['user_id'];

// 2. Recibir datos
$input = json_decode(file_get_contents('php://input'), true);
$amount = $input['amount'] ?? 0;

// 3. Validar cantidad (debe ser número positivo)
if (!is_numeric($amount) || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Cantidad inválida']);
    exit;
}

// 4. Actualizar saldo en la Base de Datos
// Sumamos la cantidad nueva al saldo existente
$stmt = $conexion->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?");
$stmt->bind_param("di", $amount, $user_id); // "d" = double/decimal, "i" = integer

if ($stmt->execute()) {
    // 5. Obtener el nuevo saldo para actualizar la pantalla
    $query = $conexion->query("SELECT saldo FROM usuarios WHERE id = $user_id");
    $row = $query->fetch_assoc();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Depósito realizado',
        'new_balance' => $row['saldo']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos']);
}

$stmt->close();
$conexion->close();
?>