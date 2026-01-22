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
    $db->exec("set names utf8mb4"); 
} catch (Exception $e) {
    if (ob_get_length()) ob_end_clean();
    echo json_encode(["success" => false, "message" => "Error conexión BD"]);
    exit;
}

$action = $_GET['action'] ?? '';

function otorgarLogro($db, $userId, $logroId) {
    $stmt = $db->prepare("INSERT IGNORE INTO logros_usuarios (usuario_id, logro_id) VALUES (?, ?)");
    $stmt->execute([$userId, $logroId]);
}

function verificarAdmin() {
    if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'admin' && $_SESSION['rol'] !== 'owner')) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Acceso denegado"]);
        exit;
    }
}

try {
    switch ($action) {
        // --- SECCIÓN: USUARIO ---
        case 'login':
            ob_clean();
            require __DIR__ . '/../Backend/login.php';
            if (isset($_SESSION['user_id'])) {
                $ip = $_SERVER['REMOTE_ADDR'];
                $ua = $_SERVER['HTTP_USER_AGENT'];
                $stmtLog = $db->prepare("INSERT INTO login_logs (user_id, ip_address, user_agent) VALUES (?, ?, ?)");
                $stmtLog->execute([$_SESSION['user_id'], $ip, $ua]);
            }
            exit;

        case 'get_user_info':
            ob_clean();
            if (!isset($_SESSION['user_id'])) { echo json_encode(["logged_in" => false]); exit; }
            $stmt = $db->prepare("SELECT username, saldo, rol FROM usuarios WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $u = $stmt->fetch(PDO::FETCH_ASSOC);
            $_SESSION['rol'] = $u['rol'];

            $stmtMedallas = $db->prepare("SELECT COUNT(*) FROM logros_usuarios WHERE usuario_id = ?");
            $stmtMedallas->execute([$_SESSION['user_id']]);
            $numMedallas = (int)$stmtMedallas->fetchColumn();

            $rango = "Visitante";
            if ($numMedallas >= 1) $rango = "Apostador";
            if ($numMedallas >= 3) $rango = "Estratega";
            if ($numMedallas >= 4) $rango = "High Roller"; 
            if ($numMedallas == 5) $rango = "Leyenda del Templo";

            echo json_encode([
                "logged_in" => true, 
                "username" => $u['username'], 
                "saldo" => (float)$u['saldo'], 
                "rol" => $u['rol'],
                "rango" => $rango,
                "progreso" => ($numMedallas / 5) * 100
            ]);
            exit;

        case 'game_result':
            ob_clean();
            $userId = $_SESSION['user_id'] ?? null;
            if (!$userId) exit;
            $d = json_decode(file_get_contents('php://input'), true);
            $bet = floatval($d['bet'] ?? 0);
            $win = floatval($d['win'] ?? 0);
            $game = $d['game'] ?? 'Juego';
            $details = isset($d['details']) ? json_encode($d['details']) : null;
            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = ? FOR UPDATE");
            $s->execute([$userId]);
            $current = $s->fetchColumn();
            $newSaldo = $current - $bet + $win;
            $db->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?")->execute([$newSaldo, $userId]);
            $stmtTx = $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, ?, ?, ?)");
            if ($win > $bet) {
                $stmtTx->execute([$userId, 'ganancia', ($win - $bet), $newSaldo]);
            } else {
                $stmtTx->execute([$userId, 'apuesta', $bet, $newSaldo]);
            }
            $transId = $db->lastInsertId();
            if ($transId && $details) {
                $db->prepare("INSERT INTO partidas_detalles (transaccion_id, detalles_json) VALUES (?, ?)")->execute([$transId, $details]);
            }
            otorgarLogro($db, $userId, 1);
            if ($win > 0) otorgarLogro($db, $userId, 2);
            if ($game === 'Crash Rocket' && $win > 0) otorgarLogro($db, $userId, 3);
            if ($game === 'Poker Classic' && $win > 0) otorgarLogro($db, $userId, 4);
            if ($game === "Texas Hold'em" && $win > 0) otorgarLogro($db, $userId, 5);
            $db->commit();
            echo json_encode(["success" => true, "new_balance" => $newSaldo]);
            exit;

        case 'deposit':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $amt = floatval($d['amount'] ?? 0);
            $db->beginTransaction();
            $db->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?")->execute([$amt, $_SESSION['user_id']]);
            $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, 'ingreso', ?, (SELECT saldo FROM usuarios WHERE id = ?))")->execute([$_SESSION['user_id'], $amt, $_SESSION['user_id']]);
            otorgarLogro($db, $_SESSION['user_id'], 1); 
            $db->commit();
            echo json_encode(["success" => true]);
            exit;

        case 'withdraw':
            ob_clean();
            $d = json_decode(file_get_contents('php://input'), true);
            $amt = floatval($d['amount'] ?? 0);
            $db->beginTransaction();
            $s = $db->prepare("SELECT saldo FROM usuarios WHERE id = ? FOR UPDATE"); $s->execute([$_SESSION['user_id']]);
            $current = $s->fetchColumn();
            if ($current >= $amt) {
                $newSaldo = $current - $amt;
                $db->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?")->execute([$newSaldo, $_SESSION['user_id']]);
                $db->prepare("INSERT INTO transacciones (usuario_id, tipo, cantidad, saldo_posterior) VALUES (?, 'retiro_pendiente', ?, ?)")->execute([$_SESSION['user_id'], $amt, $newSaldo]);
                $db->commit(); echo json_encode(["success" => true]);
            } else { echo json_encode(["success" => false, "message" => "Saldo insuficiente"]); }
            exit;

        case 'get_achievements':
            ob_clean();
            $stmt = $db->prepare("SELECT l.*, (lu.usuario_id IS NOT NULL) as obtenido FROM logros l LEFT JOIN logros_usuarios lu ON l.id = lu.logro_id AND lu.usuario_id = ? ORDER BY l.id ASC");
            $stmt->execute([$_SESSION['user_id']]);
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach($res as &$l) { $l['obtenido'] = (bool)$l['obtenido']; }
            echo json_encode(["success" => true, "logros" => $res]);
            exit;

        case 'get_leaderboard':
            ob_clean();
            $stmt = $db->query("SELECT u.username, u.saldo, (SELECT COUNT(*) FROM logros_usuarios lu WHERE lu.usuario_id = u.id) as medallas FROM usuarios u ORDER BY u.saldo DESC LIMIT 10");
            echo json_encode(["success" => true, "ranking" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;

        case 'get_transactions':
            ob_clean();
            $stmt = $db->prepare("SELECT t.*, pd.detalles_json FROM transacciones t LEFT JOIN partidas_detalles pd ON t.id = pd.transaccion_id WHERE t.usuario_id = ? ORDER BY t.fecha DESC LIMIT 12");
            $stmt->execute([$_SESSION['user_id']]);
            echo json_encode(["success" => true, "transacciones" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;

        case 'send_support_ticket':
            ob_clean();
            if (!isset($_SESSION['user_id'])) exit;
            $d = json_decode(file_get_contents('php://input'), true);
            $msg = trim($d['mensaje'] ?? '');
            if (empty($msg)) exit;
            $db->prepare("INSERT INTO mensajes_soporte (usuario_id, mensaje) VALUES (?, ?)")->execute([$_SESSION['user_id'], $msg]);
            echo json_encode(["success" => true, "message" => "Ticket enviado"]);
            exit;

        // --- SECCIÓN: ADMINISTRACIÓN ---
        case 'admin_get_data':
            ob_clean(); verificarAdmin();
            $stats = $db->query("SELECT COUNT(*) as total, COALESCE(SUM(saldo), 0) as pasivo FROM usuarios")->fetch(PDO::FETCH_ASSOC);
            $pendientes = $db->query("SELECT COUNT(*) FROM mensajes_soporte WHERE leido = 0")->fetchColumn();
            $logs = $db->query("SELECT l.*, u.username FROM login_logs l JOIN usuarios u ON l.user_id = u.id ORDER BY l.fecha DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
            $users = $db->prepare("SELECT id, username, saldo, rol FROM usuarios WHERE id != ? ORDER BY id DESC");
            $users->execute([$_SESSION['user_id']]);
            echo json_encode(['success' => true, 'mi_rol' => $_SESSION['rol'], 'stats' => ['total_usuarios' => (int)$stats['total'], 'dinero_en_juego' => (float)$stats['pasivo'], 'pendientes' => (int)$pendientes], 'usuarios' => $users->fetchAll(PDO::FETCH_ASSOC), 'logs' => $logs]);
            exit;

        case 'admin_get_withdrawals':
            ob_clean(); verificarAdmin();
            $sql = "SELECT t.id, t.cantidad, t.fecha, u.username FROM transacciones t JOIN usuarios u ON t.usuario_id = u.id WHERE t.tipo = 'retiro_pendiente' ORDER BY t.fecha ASC";
            echo json_encode(["solicitudes" => $db->query($sql)->fetchAll(PDO::FETCH_ASSOC)]);
            exit;

        case 'admin_process_withdrawal':
            ob_clean(); verificarAdmin();
            $d = json_decode(file_get_contents('php://input'), true);
            $db->beginTransaction();
            $stmt = $db->prepare("SELECT usuario_id, cantidad FROM transacciones WHERE id = ?");
            $stmt->execute([$d['id']]);
            $tx = $stmt->fetch();
            if ($d['decision'] === 'aprobar') {
                $db->prepare("UPDATE transacciones SET tipo = 'retiro' WHERE id = ?")->execute([$d['id']]);
            } else {
                $db->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?")->execute([$tx['cantidad'], $tx['usuario_id']]);
                $db->prepare("UPDATE transacciones SET tipo = 'retiro_rechazado' WHERE id = ?")->execute([$d['id']]);
            }
            $db->commit(); echo json_encode(["success" => true]);
            exit;

        case 'admin_get_messages':
            ob_clean(); verificarAdmin();
            $sql = "SELECT m.*, u.username FROM mensajes_soporte m JOIN usuarios u ON m.usuario_id = u.id ORDER BY m.leido ASC, m.fecha DESC LIMIT 50";
            echo json_encode(["mensajes" => $db->query($sql)->fetchAll(PDO::FETCH_ASSOC)]);
            exit;

        case 'admin_reply_message':
            ob_clean(); verificarAdmin();
            $d = json_decode(file_get_contents('php://input'), true);
            $db->prepare("UPDATE mensajes_soporte SET respuesta = ?, leido = 1 WHERE id = ?")->execute([$d['respuesta'], $d['id']]);
            echo json_encode(["success" => true]);
            exit;

        case 'admin_update_user':
            ob_clean(); verificarAdmin();
            $d = json_decode(file_get_contents('php://input'), true);
            $db->prepare("UPDATE usuarios SET username = ?, saldo = ? WHERE id = ?")->execute([$d['username'], $d['saldo'], $d['id']]);
            echo json_encode(["success" => true]);
            exit;

        case 'admin_change_role':
            ob_clean(); if ($_SESSION['rol'] !== 'owner') exit;
            $d = json_decode(file_get_contents('php://input'), true);
            $db->prepare("UPDATE usuarios SET rol = ? WHERE id = ?")->execute([$d['nuevo_rol'], $d['id']]);
            echo json_encode(["success" => true]);
            exit;

        case 'logout': 
            ob_clean(); session_destroy(); echo json_encode(["success" => true]); 
            exit;
    }
} catch (Exception $e) { 
    if(@$db->inTransaction()) $db->rollBack(); 
    echo json_encode(["success" => false, "message" => $e->getMessage()]); 
}
ob_end_flush();