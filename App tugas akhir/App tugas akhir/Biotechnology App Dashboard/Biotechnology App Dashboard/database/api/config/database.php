<?php
/**
 * Database Configuration
 * Biotechnology Dashboard App
 * 
 * Copy this file to your XAMPP htdocs folder:
 * C:\xampp\htdocs\biotech-api\config\database.php
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'biotech_dashboard';
    private $username = 'root';
    private $password = ''; // Default XAMPP is empty
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Connection Error: ' . $e->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
