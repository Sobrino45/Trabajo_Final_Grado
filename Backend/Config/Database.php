<?php
// Backend/Config/Database.php

class Database {
    private static $instance = null;
    private $conn;

    // El constructor es privado para que nadie pueda hacer "new Database()" desde fuera
    private function __construct() {
        // Cargar la configuración
        $config = require __DIR__ . '/../config.php';

        try {
            // Usamos PDO en lugar de mysqli para mayor seguridad y compatibilidad
            $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
            
            $this->conn = new PDO($dsn, $config['db_user'], $config['db_pass']);
            
            // Configurar PDO para que lance errores (Excepciones) si algo falla
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Por defecto, devolver arrays asociativos
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            // Si falla, detenemos todo y mostramos error genérico (no mostramos la contraseña)
            die("Error de conexión a la Base de Datos: " . $e->getMessage());
        }
    }

    // Método estático para obtener la única instancia de la conexión
    public static function getConnection() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance->conn;
    }
}