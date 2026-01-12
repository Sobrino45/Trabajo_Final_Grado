<?php
// Backend/register.php
header('Content-Type: application/json');
require 'conexion.php';

// Recibir datos JSON
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$email    = $input['email'] ?? '';
$password = $input['password'] ?? '';
$saldo    = $input['saldo'] ?? 100; // Si no envían nada, ponemos 100 por defecto

// 1. Validaciones
if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, rellena los campos obligatorios.']);
    exit;
}

// Validar que el saldo sea un número positivo
if (!is_numeric($saldo) || $saldo < 0) {
    $saldo = 100; 
}

// 2. Comprobar duplicados
$checkStmt = $conexion->prepare("SELECT id FROM usuarios WHERE username = ? OR email = ?");
$checkStmt->bind_param("ss", $username, $email);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'El usuario o el correo ya están registrados.']);
    $checkStmt->close();
    exit;
}
$checkStmt->close();

// 3. Crear usuario
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$insertStmt = $conexion->prepare("INSERT INTO usuarios (username, email, password, saldo) VALUES (?, ?, ?, ?)");
// "sssd" significa: String, String, String, Decimal/Double
$insertStmt->bind_param("sssd", $username, $email, $passwordHash, $saldo);

if ($insertStmt->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Usuario registrado con éxito!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $insertStmt->error]);
}

$insertStmt->close();
$conexion->close();
?>