<?php
// Backend/get_user_info.php

// 1. Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Comprobar si hay usuario logueado
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // 3. Usar la conexión que api.php ya ha creado
    // NOTA: No hacemos 'require' de la base de datos aquí, porque api.php ya lo hizo.
    $db = Database::getConnection();

    // 4. Consultar saldo actualizado
    $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $user_id);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode([
            'logged_in' => true,
            'username' => $user['username'],
            'saldo' => (float) $user['saldo'],
            'rol' => $user['rol'] ?? 'user'
        ]);
    } else {
        // Sesión fantasma (usuario borrado), cerrar sesión
        session_destroy();
        echo json_encode(['logged_in' => false, 'message' => 'Usuario no encontrado']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['logged_in' => false, 'error' => 'Error de servidor: ' . $e->getMessage()]);
}
?>