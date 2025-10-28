<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require 'conexion.php';

if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'message' => 'Sesión no iniciada.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

$mail = $_SESSION['user_mail'];
$rol = $_SESSION['user_rol'];

try {
    // Actualizar según el tipo de usuario
    if ($rol === 'usuario') {
        // Construir SQL dinámicamente dependiendo si hay logo
        if (isset($input['logo']) && !empty($input['logo'])) {
            $sql = "UPDATE Usuario SET nom_us = ?, apell_us = ?, ci_us = ?, tel_us = ?, direccion_us = ?, logo_us = ? WHERE mail_us = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['apellido'] ?? '',
                $input['cedula'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $input['logo'],
                $mail
            ]);
        } else {
            $sql = "UPDATE Usuario SET nom_us = ?, apell_us = ?, ci_us = ?, tel_us = ?, direccion_us = ? WHERE mail_us = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['apellido'] ?? '',
                $input['cedula'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $mail
            ]);
        }
    } 
    elseif ($rol === 'empleado') {
        if (isset($input['logo']) && !empty($input['logo'])) {
            $sql = "UPDATE Empleado SET nomb_empl = ?, apellido_empl = ?, cedula_empl = ?, tel_empl = ?, direccion_empl = ?, logo_empl = ? WHERE mail_empl = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['apellido'] ?? '',
                $input['cedula'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $input['logo'],
                $mail
            ]);
        } else {
            $sql = "UPDATE Empleado SET nomb_empl = ?, apellido_empl = ?, cedula_empl = ?, tel_empl = ?, direccion_empl = ? WHERE mail_empl = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['apellido'] ?? '',
                $input['cedula'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $mail
            ]);
        }
    } 
    elseif ($rol === 'institucion') {
        if (isset($input['logo']) && !empty($input['logo'])) {
            $sql = "UPDATE Institucion SET nomb_inst = ?, tel_inst = ?, direccion_inst = ?, dia_inst = ?, H_apertura = ?, H_cierre = ?, logo_inst = ? WHERE email_inst = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $input['dia'] ?? '',
                $input['hora_apertura'] ?? null,
                $input['hora_cierre'] ?? null,
                $input['logo'],
                $mail
            ]);
        } else {
            $sql = "UPDATE Institucion SET nomb_inst = ?, tel_inst = ?, direccion_inst = ?, dia_inst = ?, H_apertura = ?, H_cierre = ? WHERE email_inst = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nombre'] ?? '',
                $input['telefono'] ?? '',
                $input['direccion'] ?? '',
                $input['dia'] ?? '',
                $input['hora_apertura'] ?? null,
                $input['hora_cierre'] ?? null,
                $mail
            ]);
        }
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
