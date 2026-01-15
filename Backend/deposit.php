<?php
// Backend/deposit.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// 1. Verificar sesión
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No estás logueado']);
    exit;
}

$user_id = $_SESSION['user_id'];

// 2. Recibir datos
$input = json_decode(file_get_contents('php://input'), true);
$amount = $input['amount'] ?? 0;

// 3. Validar
if (!is_numeric($amount) || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Cantidad inválida']);
    exit;
}

try {
    $db = Database::getConnection();

    // 4. Actualizar saldo (UPDATE)
    // Usamos parámetros nombrados (:cantidad, :id)
    $stmt = $db->prepare("UPDATE usuarios SET saldo = saldo + :cantidad WHERE id = :id");
    
    // Vinculamos parámetros
    $stmt->bindParam(':cantidad', $amount);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        // 5. Obtener el nuevo saldo para actualizar la pantalla
        // Es necesario hacer un SELECT nuevo para estar seguros
        $stmtSelect = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id");
        $stmtSelect->bindParam(':id', $user_id, PDO::PARAM_INT);
        $stmtSelect->execute();
        $row = $stmtSelect->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true, 
            'message' => 'Depósito realizado correctamente',
            'new_balance' => (float) $row['saldo']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el saldo']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
}
?>