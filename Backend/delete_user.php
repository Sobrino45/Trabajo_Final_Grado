<?php
// Backend/delete_user.php
session_start();
require 'conexion.php';

$input = json_decode(file_get_contents('php://input'), true);
$id_a_borrar = $input['id'] ?? null;

// Verificación de seguridad rápida (Rol Admin)
$admin_id = $_SESSION['user_id'];
$check = $conexion->query("SELECT rol FROM usuarios WHERE id = $admin_id")->fetch_assoc();

if ($check['rol'] !== 'admin' || !$id_a_borrar) {
    echo json_encode(['success' => false]);
    exit;
}

// Borrar usuario
$stmt = $conexion->prepare("DELETE FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $id_a_borrar);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}
?>