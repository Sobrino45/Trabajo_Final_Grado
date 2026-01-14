<?php
session_start(); // DEBE SER LA PRIMERA LÍNEA

// Configuración de cabeceras para evitar problemas de caché
header('Content-Type: application/json');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require 'conexion.php';

// Si no hay usuario en sesión, devolvemos false
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Consultamos datos frescos
$stmt = $conexion->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'logged_in' => true,
        'username' => $row['username'],
        'saldo' => $row['saldo'],
        'rol' => $row['rol']
    ]);
} else {
    // Si la sesión existe pero el usuario no está en BD (raro), limpiamos sesión
    session_destroy();
    echo json_encode(['logged_in' => false, 'message' => 'Usuario no encontrado']);
}

$stmt->close();
$conexion->close();
?>