<?php
// public/api.php
ob_start(); // Previene cualquier salida de texto antes del JSON
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
    // Soporte para emojis de medallas y nombres con tildes
    $db->exec("set names utf8mb4"); 
} catch (Exception $e) {
    if (ob_get_length()) ob_end_clean();
    echo json_encode(["success" => false, "message" => "Error conexión BD"]);
    exit;
}

$action = $_GET['action'] ?? '';

// Función auxiliar para otorgar logros
function otorgarLogro($db, $userId, $logroId) {
    $stmt = $db->prepare("INSERT IGNORE INTO logros_usuarios (usuario_id, logro_id) VALUES (?, ?)");
    $stmt->execute([$userId, $logroId]);
}

try {
    switch ($action) {
        case 'login':
            ob_clean();
            // Ejecutamos la lógica de login del backend
            require __DIR__ . '/../Backend/login.php';
            
            // Registro de auditoría si el login fue exitoso
            if (isset($_SESSION['user_id'])) {
                $ip = $_SERVER['REMOTE_ADDR'];
                $ua = $_SERVER['HTTP_USER_AGENT'];
                $stmtLog = $db->prepare("INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)");
                $stmtLog->execute([$_SESSION['user_id'], $ip, $ua]);
            }
            exit; // Importante para no enviar datos extra

        case 'get_user_info':
            ob_clean();
            if (!isset($_SESSION['user_id'])) { echo json_encode(["logged_in" => false]); exit; }
            $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $u = $stmt->fetch(PDO::FETCH_ASSOC);
            $_SESSION['rol'] = $u['rol']; // Persistencia de rol para el panel admin
            echo json_encode(["logged_in" => true, "username" => $u['username'], "saldo" => (float)$u['saldo'], "rol" => $u['rol']]);
            break;

        case 'game_result':
            ob_clean();
            if (!isset($_SESSION['user_id'])) exit;
            $d = json_decode(file_get_contents('php://input'), true);
            
            $bet = floatval($d['bet'] ?? 0);
            $win = floatval($d['win'] ?? 0);
            $game = $d['game'] ?? 'Juego';
            $details = isset($d['details']) ? json_encode($d['details']) : null;

            $db->beginTransaction();
            
            // Obtenemos saldo real actual
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = ? FOR UPDATE");
            $s->execute([$_SESSION['user_id']]);
            $current = $s->fetchColumn();
            
            // Cálculo final: Si win=0 (pérdida), resta la apuesta. Si win>0, suma la ganancia.
            $newSaldo = $current - $bet + $win;
            $db->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?")->execute([$newSaldo, $_SESSION['user_id']]);
            
            // Registro en historial
            $stmtTx = $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, ?, ?, ?)");
            if ($win > $bet) {
                $stmtTx->execute([$_SESSION['user_id'], 'ganancia', ($win - $bet), $newSaldo]);
            } else {
                $stmtTx->execute([$_SESSION['user_id'], 'apuesta', $bet, $newSaldo]);
            }
            
            $transId = $db->lastInsertId();
            if ($transId && $details) {
                $db->prepare("INSERT INTO partidas_detalles (transaccion_id, detalles_json) VALUES (?, ?)")->execute([$transId, $details]);
            }

            $db->commit();
            echo json_encode(["success" => true, "new_balance" => $newSaldo]);
            break;

        case 'get_achievements':
            ob_clean();
            $stmt = $db->prepare("SELECT l.*, (lu.usuario_id IS NOT NULL) as obtenido FROM logros l LEFT JOIN logros_usuarios lu ON l.id = lu.logro_id AND lu.usuario_id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach($res as &$l) { $l['obtenido'] = (bool)$l['obtenido']; }
            echo json_encode(["success" => true, "logros" => $res]);
            break;

        case 'get_leaderboard':
            ob_clean();
            $stmt = $db->query("SELECT u.username, u.saldo, COUNT(lu.logro_id) as medallas FROM usuarios u LEFT JOIN logros_usuarios lu ON u.id = lu.usuario_id GROUP BY u.id ORDER BY u.saldo DESC LIMIT 10");
            echo json_encode(["success" => true, "ranking" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'get_transactions':
            ob_clean();
            $stmt = $db->prepare("SELECT t.*, pd.detalles_json FROM transacciones t LEFT JOIN partidas_detalles pd ON t.id = pd.transaccion_id WHERE t.usuario_id = ? ORDER BY t.fecha DESC LIMIT 12");
            $stmt->execute([$_SESSION['user_id']]);
            echo json_encode(["success" => true, "transacciones" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'deposit':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $amt = floatval($d['amount']);
            $db->beginTransaction();
            $db->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?")->execute([$amt, $_SESSION['user_id']]);
            $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, 'ingreso', ?, (SELECT saldo FROM usuarios WHERE id = ?))")->execute([$_SESSION['user_id'], $amt, $_SESSION['user_id']]);
            otorgarLogro($db, $_SESSION['user_id'], 1); // Logro: Primer ingreso
            $db->commit(); echo json_encode(["success" => true]);
            break;

        case 'withdraw':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $amt = floatval($d['amount']);
            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = ? FOR UPDATE"); $s->execute([$_SESSION['user_id']]);
            $current = $s->fetchColumn();
            if ($current >= $amt) {
                $newSaldo = $current - $amt;
                $db->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?")->execute([$newSaldo, $_SESSION['user_id']]);
                // El retiro se guarda como pendiente para el administrador
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, 'retiro_pendiente', ?, ?)")->execute([$_SESSION['user_id'], $amt, $newSaldo]);
                $db->commit(); echo json_encode(["success" => true]);
            } else { $db->rollBack(); echo json_encode(["success" => false, "message" => "Saldo insuficiente"]); }
            break;

        case 'admin_get_data':
            ob_clean();
            if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'admin' && $_SESSION['rol'] !== 'owner')) exit;
            $stats = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(saldo), 0) as pasivo FROM usuarios")->fetch(PDO::FETCH_ASSOC);
            $logs = $db->query("SELECT l.*, u.username FROM login_logs l JOIN usuarios u ON l.user_id = u.id ORDER BY l.fecha DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
            $users = $db->prepare("SELECT id, username, saldo, rol FROM usuarios WHERE id != ?");
            $users->execute([$_SESSION['user_id']]);
            echo json_encode(['success' => true, 'mi_rol' => $_SESSION['rol'], 'stats' => ['total_usuarios' => (int)$stats['total'], 'dinero_en_juego' => (float)$stats['pasivo'], 'pendientes' => 0], 'usuarios' => $users->fetchAll(PDO::FETCH_ASSOC), 'logs' => $logs]);
            break;

        case 'logout': 
            ob_clean(); 
            session_destroy(); 
            echo json_encode(["success" => true]); 
            break;
    }
} catch (Exception $e) { 
    if(@$db->inTransaction()) $db->rollBack(); 
    echo json_encode(["success" => false, "message" => $e->getMessage()]); 
}
ob_end_flush();