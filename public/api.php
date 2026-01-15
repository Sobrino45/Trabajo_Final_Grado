<?php
// public/api.php

// 1. Configuración de errores para que no rompan el JSON
ini_set('display_errors', 0); // No mostrar errores en el output
error_reporting(E_ALL);

// 2. Cabeceras CORS (Soluciona el error 405)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 3. Responder OK a la petición preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 4. Manejador de errores fatales (devuelve JSON en vez de HTML roto)
function jsonShutdownHandler() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE)) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error fatal en servidor", "debug" => $error['message']]);
    }
}
register_shutdown_function('jsonShutdownHandler');

// 5. Incluir Base de Datos (Ruta absoluta segura)
try {
    $dbPath = __DIR__ . '/../Backend/Config/Database.php';
    if (!file_exists($dbPath)) {
        throw new Exception("No se encuentra Database.php en: " . $dbPath);
    }
    require_once $dbPath;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
    exit();
}

// 6. Router
$action = $_GET['action'] ?? '';
$backendPath = __DIR__ . '/../Backend/'; // Ruta base para los includes

switch ($action) {
    case 'login':
        require $backendPath . 'login.php';
        break;
        
    case 'register':
        require $backendPath . 'register.php';
        break;
        
    case 'get_user_info':
        require $backendPath . 'get_user_info.php';
        break;

    case 'deposit':
        require $backendPath . 'deposit.php';
        break;

    case 'logout':
        require $backendPath . 'logout.php';
        break;

    case 'game_logic':
        require $backendPath . 'game_logic.php';
        break;

    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Acción no válida: " . $action]);
        break;
}
?>