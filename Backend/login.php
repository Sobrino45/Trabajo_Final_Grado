<?php
// Backend/login.php

// Asegurar que solo devolvemos JSON (por si api.php no lo cubrió)
header('Content-Type: application/json');

// Leer el JSON entrante
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON);

// Obtener datos (soportando tanto JSON como POST clásico)
if ($data) {
    $identifier = $data->email ?? ''; // Usamos 'email' como campo genérico para usuario/correo
    $password = $data->password ?? '';
} else {
    $identifier = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
}

if (!empty($identifier) && !empty($password)) {
    try {
        $db = Database::getConnection();

        // Consulta: Busca por email O por nombre de usuario
        // NOTA: He cambiado la tabla 'users' a 'usuarios' para consistencia
        $query = "SELECT id, username, email, password, saldo FROM usuarios WHERE email = :id OR username = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verificación de contraseña
            // Si usas password_hash en registro:
            $passwordValid = password_verify($password, $row['password']);
            
            // Si usas texto plano (temporalmente):
            // $passwordValid = ($password === $row['password']);

            if ($passwordValid) {
                // Iniciar sesión PHP para guardar estado en servidor
                if (session_status() === PHP_SESSION_NONE) session_start();
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['username'] = $row['username'];

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Login exitoso",
                    "user_id" => $row['id'],
                    "nombre" => $row['username'], // Enviamos 'username' como nombre
                    "saldo" => $row['saldo']
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
            }
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Faltan datos."]);
}
?>