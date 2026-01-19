<?php
// Backend/get_user_info.php

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $db = Database::getConnection();

    $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Sincronizamos el rol por si ha cambiado en la base de datos
        $_SESSION['rol'] = $user['rol']; 

        echo json_encode([
            'logged_in' => true,
            'username' => $user['username'],
            'saldo' => floatval($user['saldo']), 
            'rol' => $user['rol']
        ]);
    } else {
        session_destroy();
        echo json_encode(['logged_in' => false, 'message' => 'Sesión inválida']);
    }

} catch (Exception $e) {
    echo json_encode(['logged_in' => false, 'error' => $e->getMessage()]);
}