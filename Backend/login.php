<?php
// Backend/login.php
header('Content-Type: application/json');
require 'conexion.php';

session_start();

$input = json_decode(file_get_contents('php://input'), true);

// Ahora le llamamos 'identifier' porque puede ser Usuario o Email
// (Aunque el JS nos lo envíe bajo la etiqueta 'username', lo tratamos como ambos)
$identifier = $input['username'] ?? ''; 
$password = $input['password'] ?? '';

if (empty($identifier) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos']);
    exit;
}

// ---------------------------------------------------------
// CAMBIO CLAVE: Buscamos en username O (OR) en email
// ---------------------------------------------------------
$stmt = $conexion->prepare("SELECT id, username, password, saldo FROM usuarios WHERE username = ? OR email = ?");

// Vinculamos la variable $identifier DOS VECES ("ss") porque hay dos signos de interrogación ?
$stmt->bind_param("ss", $identifier, $identifier);

$stmt->execute();
$resultado = $stmt->get_result();

if ($usuario = $resultado->fetch_assoc()) {
    if (password_verify($password, $usuario['password'])) {
        
        $_SESSION['user_id'] = $usuario['id'];
        $_SESSION['username'] = $usuario['username'];
        
        echo json_encode([
            'success' => true, 
            'message' => 'Login correcto',
            'saldo' => $usuario['saldo'],
            'username' => $usuario['username']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Usuario o correo no encontrado']);
}

$stmt->close();
$conexion->close();
?>