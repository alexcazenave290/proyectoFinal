<?php
session_start();
header('Content-Type: application/json');
require 'conexion.php';

if (!isset($_SESSION['usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa.']);
    exit;
}

$mail = $_SESSION['usuario'];

try {
    $stmt = $pdo->prepare("SELECT mail_us, nom_us, apell_us, ci_us, tel_us, direccion_us FROM Usuario WHERE mail_us = ?");
    $stmt->execute([$mail]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        echo json_encode(['success' => true, 'perfil' => $perfil]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
