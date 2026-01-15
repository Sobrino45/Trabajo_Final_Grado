<?php
// Backend/test_db.php

// 1. Incluimos la clase Database
require_once 'Config/Database.php';

try {
    // 2. Pedimos la conexión
    $pdo = Database::getConnection();
    
    // 3. Hacemos una consulta simple
    $stmt = $pdo->query("SELECT '¡Conexión Exitosa!' AS mensaje");
    $resultado = $stmt->fetch();
    
    // 4. Mostramos el resultado en JSON (como lo hará tu app real)
    header('Content-Type: application/json');
    echo json_encode($resultado);

} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
}