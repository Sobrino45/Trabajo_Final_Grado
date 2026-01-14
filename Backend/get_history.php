<?php
session_start();
// IMPORTANTE: Usamos tu archivo de conexión real
require 'conexion.php'; 

header('Content-Type: application/json');

// Desactivar visualización de errores en pantalla para no romper el JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['authorized' => false]);
        exit;
    }

    $userId = $_SESSION['user_id'];
    // Si no tienes guardado el rol en sesión, asumimos 'user'
    $rol = $_SESSION['rol'] ?? 'user'; 

    $historial = [];

    if ($rol === 'admin') {
        // ADMIN: JOIN con la tabla 'usuarios'
        $sql = "SELECT h.*, u.username 
                FROM historial h 
                JOIN usuarios u ON h.user_id = u.id 
                ORDER BY h.fecha DESC LIMIT 100";
        $stmt = $conexion->prepare($sql);
    } else {
        // USUARIO: Solo ve sus datos
        $sql = "SELECT * FROM historial WHERE user_id = ? ORDER BY fecha DESC LIMIT 50";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $userId);
    }

    if (!$stmt) {
        throw new Exception("Error en la consulta SQL: " . $conexion->error);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $historial[] = $row;
    }

    echo json_encode([
        'authorized' => true,
        'role' => $rol,
        'data' => $historial
    ]);

} catch (Exception $e) {
    // Si hay error, enviamos un JSON válido con el mensaje
    http_response_code(500);
    echo json_encode([
        'authorized' => true, 
        'error' => $e->getMessage()
    ]);
}
?>