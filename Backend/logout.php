<?php
session_start();

// 1. Borrar todas las variables de sesión
$_SESSION = array();

// 2. Borrar la cookie de sesión del navegador (para limpieza total)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 3. Destruir la sesión en el servidor
session_destroy();

// 4. Responder al JS
header('Content-Type: application/json');
echo json_encode(['success' => true]);
?>