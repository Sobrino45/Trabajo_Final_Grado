<?php
// Backend/login.php
// IMPORTANTE: No usar header('Content-Type') aquí porque en api.php ya se usa ob_clean() y se configuran los headers

$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON);

if ($data) {
    $identifier = $data->email ?? '';
    $password = $data->password ?? '';
} else {
    $identifier = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
}

if (!empty($identifier) && !empty($password)) {
    try {
        // En api.php ya se inicializa la conexión y se guarda en $db
        global $db; 
        if (!$db) {
            $db = Database::getConnection();
        }

        $query = "SELECT id, username, email, password, saldo, rol FROM usuarios WHERE email = :id OR username = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $identifier);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $passwordValid = password_verify($password, $row['password']);

            if ($passwordValid) {
                if (session_status() === PHP_SESSION_NONE) session_start();
                
                $_SESSION['user_id'] = $row['id'];
                $_SESSION['username'] = $row['username'];
                $_SESSION['rol'] = $row['rol']; 

                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Login exitoso",
                    "user" => [
                        "id" => $row['id'],
                        "username" => $row['username'],
                        "rol" => $row['rol'],
                        "saldo" => floatval($row['saldo'])
                    ]
                ]);
            } else {
                http_response_code(200); // 200 para que el frontend atrape el JSON, el ok va en success
                echo json_encode(["success" => false, "message" => "Contraseña incorrecta."]);
            }
        } else {
            http_response_code(200);
            echo json_encode(["success" => false, "message" => "Usuario no encontrado."]);
        }
    } catch (Exception $e) {
        http_response_code(200);
        echo json_encode(["success" => false, "message" => "Error DB: " . $e->getMessage()]);
    }
} else {
    http_response_code(200);
    echo json_encode(["success" => false, "message" => "Faltan datos."]);
}