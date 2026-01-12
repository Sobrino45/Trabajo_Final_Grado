<?php
// Backend/fix_password.php
require 'conexion.php';

// 1. Generar el hash REAL de "123"
$password_real = "123";
$hash_correcto = password_hash($password_real, PASSWORD_DEFAULT);

// 2. Actualizar el usuario en la base de datos
$sql = "UPDATE usuarios SET password = '$hash_correcto' WHERE username = 'JugadorPrueba'";

if ($conexion->query($sql) === TRUE) {
    echo "<h1>✅ ¡Arreglado!</h1>";
    echo "<p>La contraseña de <b>JugadorPrueba</b> ahora es realmente '123' (encriptada).</p>";
    echo "<p>Hash generado: $hash_correcto</p>";
    echo "<br><a href='../Portal/login.html'>Volver al Login</a>";
} else {
    echo "Error al actualizar: " . $conexion->error;
}
?>