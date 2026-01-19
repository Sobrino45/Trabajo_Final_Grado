<?php
// public/api.php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if (session_status() === PHP_SESSION_NONE) { session_start(); }

try {
    $dbPath = __DIR__ . '/../Backend/Config/Database.php';
    require_once $dbPath;
    $db = Database::getConnection();
} catch (Exception $e) {
    if (ob_get_length()) ob_end_clean();
    echo json_encode(["success" => false, "message" => "Error conexión BD"]);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            ob_clean();
            // Ejecutamos la lógica de login
            require __DIR__ . '/../Backend/login.php';
            
            // PUNTO 4: Seguridad - Registro de auditoría si el login fue exitoso
            if (isset($_SESSION['user_id'])) {
                $ip = $_SERVER['REMOTE_ADDR'];
                $ua = $_SERVER['HTTP_USER_AGENT'];
                $stmtLog = $db->prepare("INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)");
                $stmtLog->execute([$_SESSION['user_id'], $ip, $ua]);
            }
            break;

        case 'logout': ob_clean(); require __DIR__ . '/../Backend/logout.php'; break;

        case 'get_user_info':
            ob_clean();
            if (!isset($_SESSION['user_id'])) { echo json_encode(["logged_in" => false]); exit; }
            $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = :id");
            $stmt->execute([':id' => $_SESSION['user_id']]);
            $u = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(["logged_in" => true, "username" => $u['username'], "saldo" => (float)$u['saldo'], "rol" => $u['rol']]);
            break;

        case 'game_result':
        case 'game_logic':
            ob_clean();
            if (!isset($_SESSION['user_id'])) exit;
            $d = json_decode(file_get_contents('php://input'), true);
            $bet = floatval($d['bet'] ?? $d['apuesta'] ?? 0);
            $win = floatval($d['win'] ?? $d['ganancia'] ?? 0);
            // PUNTO 3: Detalles de la mano (JSON) para historial detallado
            $details = isset($d['details']) ? json_encode($d['details']) : null;

            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id FOR UPDATE");
            $s->execute([':id' => $_SESSION['user_id']]);
            $current = $s->fetch(PDO::FETCH_ASSOC)['saldo'];

            $newSaldo = $current - $bet + $win;

            if ($newSaldo < 0) {
                $db->rollBack();
                echo json_encode(["success" => false, "message" => "Saldo insuficiente"]);
                exit;
            }

            $db->prepare("UPDATE usuarios SET saldo = :n WHERE id = :id")->execute([':n' => $newSaldo, ':id' => $_SESSION['user_id']]);
            
            // Registro en historial (transacciones)
            $transId = null;
            if ($win > $bet) {
                $neto = $win - $bet;
                $stmtTx = $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'ganancia', :amt, :pos)");
                $stmtTx->execute([':id' => $_SESSION['user_id'], ':amt' => $neto, ':pos' => $newSaldo]);
                $transId = $db->lastInsertId();
            } else if ($win < $bet) {
                $neto = $bet - $win;
                $stmtTx = $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'apuesta', :amt, :pos)");
                $stmtTx->execute([':id' => $_SESSION['user_id'], ':amt' => $neto, ':pos' => $newSaldo]);
                $transId = $db->lastInsertId();
            } else {
                $stmtTx = $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'ganancia', 0, :pos)");
                $stmtTx->execute([':id' => $_SESSION['user_id'], ':pos' => $newSaldo]);
                $transId = $db->lastInsertId();
            }

            // PUNTO 3: Guardar detalles técnicos de la mano si existen
            if ($transId && $details) {
                $db->prepare("INSERT INTO partidas_detalles (transaccion_id, detalles_json) VALUES (?, ?)")
                   ->execute([$transId, $details]);
            }

            $db->commit();
            echo json_encode(["success" => true, "new_balance" => $newSaldo]);
            break;

        case 'deposit':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id FOR UPDATE");
            $s->execute([':id' => $_SESSION['user_id']]);
            $newSaldo = $s->fetch(PDO::FETCH_ASSOC)['saldo'] + floatval($d['amount']);
            $db->prepare("UPDATE usuarios SET saldo = :n WHERE id = :id")->execute([':n' => $newSaldo, ':id' => $_SESSION['user_id']]);
            $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'ingreso', :amt, :pos)")->execute([':id' => $_SESSION['user_id'], ':amt' => floatval($d['amount']), ':pos' => $newSaldo]);
            $db->commit(); echo json_encode(["success" => true]);
            break;

        case 'withdraw':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id FOR UPDATE");
            $s->execute([':id' => $_SESSION['user_id']]);
            $current = $s->fetch(PDO::FETCH_ASSOC)['saldo'];
            if ($current >= floatval($d['amount'])) {
                $newSaldo = $current - floatval($d['amount']);
                $db->prepare("UPDATE usuarios SET saldo = :n WHERE id = :id")->execute([':n' => $newSaldo, ':id' => $_SESSION['user_id']]);
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'retiro', :amt, :pos)")->execute([':id' => $_SESSION['user_id'], ':amt' => floatval($d['amount']), ':pos' => $newSaldo]);
                $db->commit(); echo json_encode(["success" => true]);
            } else { $db->rollBack(); echo json_encode(["success" => false]); }
            break;

        case 'get_transactions':
            ob_clean();
            // Modificado para poder unir con detalles si existen
            $stmt = $db->prepare("SELECT t.*, pd.detalles_json 
                                  FROM transacciones t 
                                  LEFT JOIN partidas_detalles pd ON t.id = pd.transaccion_id 
                                  WHERE t.usuario_id = :id 
                                  ORDER BY t.fecha DESC LIMIT 15");
            $stmt->execute([':id' => $_SESSION['user_id']]);
            echo json_encode(["success" => true, "transacciones" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'admin_get_data':
            ob_clean();
            if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'admin' && $_SESSION['rol'] !== 'owner')) exit;
            
            // Estadísticas generales
            $stats = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(saldo), 0) as pasivo FROM usuarios")->fetch(PDO::FETCH_ASSOC);
            $pend = $db->query("SELECT COUNT(*) as p FROM mensajes_soporte WHERE leido = 0")->fetch(PDO::FETCH_ASSOC);
            
            // Lista de usuarios
            $stmtUsers = $db->prepare("SELECT id, username, email, saldo, rol FROM usuarios WHERE id != :mi_id ORDER BY id ASC");
            $stmtUsers->execute([':mi_id' => $_SESSION['user_id']]);
            
            // PUNTO 4: Obtener logs de acceso para el admin
            $logs = $db->query("SELECT l.*, u.username FROM login_logs l JOIN usuarios u ON l.user_id = u.id ORDER BY l.fecha DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'mi_rol' => $_SESSION['rol'], 
                'stats' => [
                    'total_usuarios' => (int)$stats['total'], 
                    'dinero_en_juego' => (float)$stats['pasivo'], 
                    'pendientes' => (int)$pend['p']
                ], 
                'usuarios' => $stmtUsers->fetchAll(PDO::FETCH_ASSOC), 
                'logs' => $logs
            ]);
            break;
            
        case 'admin_reply_message':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE mensajes_soporte SET respuesta = :res, leido = 1 WHERE id = :id");
            echo json_encode(["success" => $stmt->execute([':res' => $d['respuesta'], ':id' => $d['id']])]);
            break;

        case 'send_support_message':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("INSERT INTO mensajes_soporte (usuario_id, mensaje) VALUES (:uid, :msg)");
            echo json_encode(["success" => $stmt->execute([':uid' => $_SESSION['user_id'], ':msg' => $d['mensaje']])]);
            break;

        case 'get_my_messages':
            ob_clean();
            $stmt = $db->prepare("SELECT mensaje, respuesta, fecha FROM mensajes_soporte WHERE usuario_id = :uid ORDER BY fecha DESC LIMIT 5");
            $stmt->execute([':uid' => $_SESSION['user_id']]);
            echo json_encode(["success" => true, "mensajes" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'admin_get_messages':
            ob_clean();
            $stmt = $db->query("SELECT m.*, u.username FROM mensajes_soporte m JOIN usuarios u ON m.usuario_id = u.id ORDER BY m.leido ASC, m.fecha DESC LIMIT 50");
            echo json_encode(["success" => true, "mensajes" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
} catch (Exception $e) { 
    if(@$db->inTransaction()) $db->rollBack(); 
    echo json_encode(["success" => false, "message" => $e->getMessage()]); 
}
ob_end_flush();