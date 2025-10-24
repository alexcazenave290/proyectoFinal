<?php
session_start();
header('Content-Type: application/json');
require 'conexion.php';

if (!isset($_SESSION['user_mail'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$mail = $_SESSION['user_mail'];

try {
    $sql = "UPDATE Usuario SET nom_us = ?, apell_us = ?, ci_us = ?, tel_us = ?, direccion_us = ? WHERE mail_us = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['nom_us'] ?? '',
        $input['apell_us'] ?? '',
        $input['ci_us'] ?? '',
        $input['tel_us'] ?? '',
        $input['direccion_us'] ?? '',
        $mail
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
