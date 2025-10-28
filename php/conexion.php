<?php
$host = 'localhost';
$dbname = 'Conexion'; 
$username = 'root';
$password = ''; 
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => $e->getMessage()]));
}
