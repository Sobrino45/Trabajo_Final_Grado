<?php
// Backend/Config/Database.php
class Database {
    private static $host = 'localhost';
    private static $db_name = 'casino_db'; // Asegúrate que este sea el nombre real de tu BD en phpMyAdmin
    private static $username = 'root';
    private static $password = '';
    private static $conn;

    public static function getConnection() {
        self::$conn = null;
        try {
            self::$conn = new PDO("mysql:host=" . self::$host . ";dbname=" . self::$db_name, self::$username, self::$password);
            self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$conn->exec("set names utf8");
        } catch(PDOException $exception) {
            // IMPORTANTE: Si falla, lanzamos error pero NO hacemos echo para no romper el JSON
            throw new Exception("Error de conexión: " . $exception->getMessage());
        }
        return self::$conn;
    }
}