<?php
// backend/conexion.php
$host = "localhost";
$usuario = "root";
$password = "";      
$base_datos = "casino_db";

try {
    $conexion = new mysqli($host, $usuario, $password, $base_datos);

    if ($conexion->connect_error) {
        die("❌ Error de conexión: " . $conexion->connect_error);
    }
    
    $conexion->set_charset("utf8");

} catch (Exception $e) {
    die("❌ Error crítico: " . $e->getMessage());
}
?>