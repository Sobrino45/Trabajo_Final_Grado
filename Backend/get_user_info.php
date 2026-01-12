<?php
// Archivo: Backend/get_user_info.php
session_start();
header('Content-Type: application/json');
require 'conexion.php'; // Asegúrate de que este path sea correcto a tu archivo de conexión

// 1. Verificar si el usuario ha iniciado sesión
// IMPORTANTE: Esto asume que en tu login.php guardaste el ID del usuario en $_SESSION['user_id']
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user_id = $_SESSION['user_id'];

// 2. Buscamos el saldo, nombre Y ROL actualizados en la BD
// AÑADIMOS "rol" A LA LISTA DE CAMPOS
$stmt = $conexion->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'logged_in' => true,
        'username' => $row['username'],
        'saldo' => $row['saldo'],
        'rol' => $row['rol'] // <--- IMPORTANTE: Enviamos el rol al frontend
    ]);
} else {
    echo json_encode(['logged_in' => false, 'message' => 'Usuario no encontrado']);
}

$stmt->close();
$conexion->close();
?>