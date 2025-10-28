<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require 'conexion.php';

if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'message' => 'No hay sesión activa.']);
    exit;
}

$mail = $_SESSION['user_mail'];
$rol = $_SESSION['user_rol'];

try {
    $perfil = null;
    
    // Consultar según el tipo de usuario
    if ($rol === 'usuario') {
        $stmt = $pdo->prepare("SELECT mail_us AS mail, nom_us AS nombre, apell_us AS apellido, ci_us AS cedula, tel_us AS telefono, direccion_us AS direccion, donante, logo_us AS logo FROM Usuario WHERE mail_us = ?");
        $stmt->execute([$mail]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($perfil) {
            $perfil['tipo_cuenta'] = 'Usuario';
            $perfil['donante'] = (bool)$perfil['donante'];
        }
    } 
    elseif ($rol === 'empleado') {
        $stmt = $pdo->prepare("SELECT mail_empl AS mail, nomb_empl AS nombre, apellido_empl AS apellido, cedula_empl AS cedula, tel_empl AS telefono, direccion_empl AS direccion, tipo_empl AS tipo, logo_empl AS logo FROM Empleado WHERE mail_empl = ?");
        $stmt->execute([$mail]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($perfil) {
            $perfil['tipo_cuenta'] = 'Empleado';
            $perfil['donante'] = false; // Empleados no pueden ser donantes
        }
    } 
    elseif ($rol === 'institucion') {
        $stmt = $pdo->prepare("SELECT email_inst AS mail, nomb_inst AS nombre, tel_inst AS telefono, direccion_inst AS direccion, dia_inst AS dia, H_apertura AS hora_apertura, H_cierre AS hora_cierre, logo_inst AS logo FROM Institucion WHERE email_inst = ?");
        $stmt->execute([$mail]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($perfil) {
            $perfil['tipo_cuenta'] = 'Institución';
            $perfil['apellido'] = ''; // Instituciones no tienen apellido
            $perfil['cedula'] = ''; // Instituciones no tienen cédula
            $perfil['donante'] = false; // Instituciones no pueden ser donantes
        }
    }

    if ($perfil) {
        echo json_encode(['success' => true, 'perfil' => $perfil, 'rol' => $rol]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Perfil no encontrado.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
