<?php
// public/api.php

// 1. ENCENDER LA ASPIRADORA (Output Buffering)
// Esto captura cualquier espacio en blanco o error que se cuele desde otros archivos
ob_start();

// 2. Configuración de errores
ini_set('display_errors', 0);
error_reporting(E_ALL);

// 3. Cabeceras
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_end_clean(); // Limpiar antes de salir
    http_response_code(200);
    exit();
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 4. Manejador de errores fatales
function jsonShutdownHandler() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE)) {
        // Si hubo error fatal, borramos lo capturado y enviamos error JSON
        if (ob_get_length()) ob_end_clean();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error fatal servidor", "debug" => $error['message']]);
    }
}
register_shutdown_function('jsonShutdownHandler');

// 5. Conexión a BD
try {
    $dbPath = __DIR__ . '/../Backend/Config/Database.php';
    if (!file_exists($dbPath)) {
        throw new Exception("Falta Database.php");
    }
    require_once $dbPath;
    $db = Database::getConnection();
} catch (Exception $e) {
    if (ob_get_length()) ob_end_clean();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error BD: " . $e->getMessage()]);
    exit();
}

// 6. Router
$action = $_GET['action'] ?? '';
$backendPath = __DIR__ . '/../Backend/';

// Preparamos la lógica pero NO imprimimos nada todavía
// Usamos output buffering para atrapar lo que hagan los 'require'
try {
    switch ($action) {
        case 'login':
            // Limpiamos el buffer justo antes de incluir el archivo específico
            // para asegurarnos de que el JSON de ese archivo salga limpio
            ob_clean(); 
            require $backendPath . 'login.php';
            break;
        case 'register':
            ob_clean();
            require $backendPath . 'register.php';
            break;
        case 'get_user_info':
            ob_clean();
            require $backendPath . 'get_user_info.php';
            break;
        case 'game_logic':
            ob_clean();
            require $backendPath . 'game_logic.php';
            break;
        case 'deposit':
            ob_clean();
            require $backendPath . 'deposit.php';
            break;
        case 'logout':
            ob_clean();
            require $backendPath . 'logout.php';
            break;
        default:
            ob_clean();
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Acción desconocida"]);
            break;
    }
} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Error en lógica: " . $e->getMessage()]);
}

// 7. FINALIZAR: Enviar el contenido del buffer al navegador
ob_end_flush();
?>