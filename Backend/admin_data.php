<?php
// Backend/admin_data.php
session_start();
header('Content-Type: application/json');
require 'conexion.php';

// 1. SEGURIDAD: Verificar si es admin
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['access' => false, 'message' => 'No logueado']);
    exit;
}

// Consultamos el rol del usuario que hace la petición
$id = $_SESSION['user_id'];
$stmt = $conexion->prepare("SELECT rol FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if ($row['rol'] !== 'admin') {
    echo json_encode(['access' => false, 'message' => 'Acceso denegado']);
    exit;
}

// 2. OBTENER DATOS (Sin contraseñas)
// Solo traemos usuarios normales (rol = 'user') para no borrar otros admins por error
$query = "SELECT id, username, email, saldo FROM usuarios WHERE rol = 'user'";
$result = $conexion->query($query);

$usuarios = [];
$total_jugadores = 0; // Dinero total que tienen los jugadores

while ($user = $result->fetch_assoc()) {
    $usuarios[] = $user;
    $total_jugadores += floatval($user['saldo']);
}

// El "Beneficio del Casino" se calcula normalmente como: (Depósitos - Retiros - Saldo Actual).
// Como aun no tenemos historial de depósitos, mostraremos el "Pasivo" (cuánto dinero deben pagar a los jugadores).

echo json_encode([
    'access' => true,
    'usuarios' => $usuarios,
    'stats' => [
        'total_usuarios' => count($usuarios),
        'dinero_en_juego' => $total_jugadores
    ]
]);

$conexion->close();
?>