<?php
// Backend/get_user_info.php
// NOTA: NO poner session_start() ni require aquí. api.php ya lo ha hecho.

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Usamos la conexión que api.php ya abrió
    $db = Database::getConnection();

    $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = :id LIMIT 1");
    $stmt->bindParam(":id", $user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // IMPORTANTE: floatval asegura que enviamos un número, no texto
        echo json_encode([
            'logged_in' => true,
            'username' => $user['username'],
            'saldo' => floatval($user['saldo']), 
            'rol' => $user['rol']
        ]);
    } else {
        session_destroy();
        echo json_encode(['logged_in' => false, 'message' => 'Usuario no encontrado']);
    }

} catch (Exception $e) {
    // Enviar error JSON limpio
    echo json_encode(['logged_in' => false, 'error' => $e->getMessage()]);
}
?>