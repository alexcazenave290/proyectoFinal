<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require 'conexion.php';

if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit;
}

// Solo usuarios pueden ser donantes
if ($_SESSION['user_rol'] !== 'usuario') {
    echo json_encode(['success' => false, 'message' => 'Solo los usuarios pueden realizar donaciones.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$mail_us = $_SESSION['user_mail'];
$plataforma = $input['plataforma'] ?? '';
$tipo_donacion = $input['tipo_donacion'] ?? 'general';
$nombre_refugio = $input['nombre_refugio'] ?? '';

try {
    // Marcar al usuario como donante
    $sql = "UPDATE Usuario SET donante = 1 WHERE mail_us = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mail_us]);

    // Opcional: Registrar la donación en la tabla Donacion
    // Por ahora solo marcamos al usuario como donante premium
    
    echo json_encode([
        'success' => true, 
        'message' => '¡Gracias por tu donación! Ahora eres un donante premium.',
        'plataforma' => $plataforma
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

