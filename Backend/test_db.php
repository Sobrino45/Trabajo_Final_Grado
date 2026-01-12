<?php
// Backend/test_db.php
require 'conexion.php'; // Importamos el archivo de conexión

echo "<h1>📡 Prueba de Conexión</h1>";

// Intento de consulta a la base de datos
$sql = "SELECT username, saldo FROM usuarios";
$resultado = $conexion->query($sql);

if ($resultado->num_rows > 0) {
    echo "<h3 style='color: green;'>✅ ¡ÉXITO! PHP está conectado a MySQL.</h3>";
    echo "<p>Usuarios encontrados:</p><ul>";
    
    // Mostrar los usuarios que haya (debería salir JugadorPrueba)
    while($fila = $resultado->fetch_assoc()) {
        echo "<li>👤 <b>" . $fila["username"] . "</b> | 💰 Saldo: " . $fila["saldo"] . "€</li>";
    }
    echo "</ul>";
} else {
    echo "<h3 style='color: orange;'>⚠️ Conectado, pero no hay usuarios.</h3>";
}
?>