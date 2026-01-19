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
        case 'login': ob_clean(); require __DIR__ . '/../Backend/login.php'; break;
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

            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = :id FOR UPDATE");
            $s->execute([':id' => $_SESSION['user_id']]);
            $current = $s->fetch(PDO::FETCH_ASSOC)['saldo'];

            // Cálculo real del saldo
            $newSaldo = $current - $bet + $win;

            if ($newSaldo < 0) {
                $db->rollBack();
                echo json_encode(["success" => false, "message" => "Saldo insuficiente"]);
                exit;
            }

            $db->prepare("UPDATE usuarios SET saldo = :n WHERE id = :id")->execute([':n' => $newSaldo, ':id' => $_SESSION['user_id']]);
            
            // LÓGICA DE HISTORIAL REFINADA:
            // Si win > bet -> Es una ganancia neta (+)
            // Si win < bet -> Es una pérdida neta (-)
            // Si win == bet -> Es un empate (no se registra o se registra como 0)
            
            if ($win > $bet) {
                $neto = $win - $bet;
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'ganancia', :amt, :pos)")
                   ->execute([':id' => $_SESSION['user_id'], ':amt' => $neto, ':pos' => $newSaldo]);
            } else if ($win < $bet) {
                $neto = $bet - $win;
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'apuesta', :amt, :pos)")
                   ->execute([':id' => $_SESSION['user_id'], ':amt' => $neto, ':pos' => $newSaldo]);
            } else {
                // Empate/Push
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (:id, 'ganancia', 0, :pos)")
                   ->execute([':id' => $_SESSION['user_id'], ':pos' => $newSaldo]);
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
            $stmt = $db->prepare("SELECT tipo, cantidad, saldo_posterior, fecha FROM transacciones WHERE usuario_id = :id ORDER BY fecha DESC LIMIT 10");
            $stmt->execute([':id' => $_SESSION['user_id']]);
            echo json_encode(["success" => true, "transacciones" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'admin_get_data':
            ob_clean();
            if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'admin' && $_SESSION['rol'] !== 'owner')) exit;
            $stats = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(saldo), 0) as pasivo FROM usuarios")->fetch(PDO::FETCH_ASSOC);
            $pend = $db->query("SELECT COUNT(*) as p FROM mensajes_soporte WHERE leido = 0")->fetch(PDO::FETCH_ASSOC);
            $stmtUsers = $db->prepare("SELECT id, username, email, saldo, rol FROM usuarios WHERE id != :mi_id ORDER BY id ASC");
            $stmtUsers->execute([':mi_id' => $_SESSION['user_id']]);
            echo json_encode(['success' => true, 'access' => true, 'mi_rol' => $_SESSION['rol'], 'stats' => ['total_usuarios' => (int)$stats['total'], 'dinero_en_juego' => (float)$stats['pasivo'], 'pendientes' => (int)$pend['p']], 'usuarios' => $stmtUsers->fetchAll(PDO::FETCH_ASSOC), 'logs' => []]);
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
} catch (Exception $e) { if(@$db->inTransaction()) $db->rollBack(); echo json_encode(["success" => false, "message" => "Error"]); }
ob_end_flush();