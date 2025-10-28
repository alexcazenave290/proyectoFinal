<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');

require_once 'conexion.php';

// Obtener el tipo de usuario y email del usuario a consultar
$tipo_usuario = $_GET['tipo'] ?? '';
$email_usuario = $_GET['email'] ?? '';

if (empty($tipo_usuario) || empty($email_usuario)) {
    echo json_encode(['success' => false, 'message' => 'Parámetros faltantes']);
    exit();
}

try {
    $perfil = null;
    $tipoCuenta = '';
    
    if ($tipo_usuario === 'empleado') {
        // Obtener perfil de empleado
        $stmt = $pdo->prepare("
            SELECT e.mail_empl as email, e.nomb_empl as nombre, e.apellido_empl as apellido, 
                   e.cedula_empl as cedula, e.tel_empl as telefono, e.direccion_empl as direccion, 
                   e.tipo_empl as tipo, e.logo_empl as logo, i.nomb_inst
            FROM Empleado e
            LEFT JOIN Institucion i ON e.id_inst = i.id_inst
            WHERE e.mail_empl = ?
        ");
        $stmt->execute([$email_usuario]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($perfil) {
            $tipoCuenta = 'Empleado';
        }
        
    } elseif ($tipo_usuario === 'institucion') {
        // Obtener perfil de institución
        $stmt = $pdo->prepare("
            SELECT email_inst as email, nomb_inst as nombre, tel_inst as telefono, 
                   direccion_inst as direccion, dia_inst as dia, 
                   H_apertura as hora_apertura, H_cierre as hora_cierre, logo_inst as logo
            FROM Institucion
            WHERE email_inst = ?
        ");
        $stmt->execute([$email_usuario]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($perfil) {
            $tipoCuenta = 'Institución';
        }
        
    } elseif ($tipo_usuario === 'usuario') {
        // Obtener perfil de usuario normal
        $stmt = $pdo->prepare("
            SELECT mail_us as email, nom_us as nombre, apell_us as apellido, 
                   ci_us as cedula, tel_us as telefono, direccion_us as direccion,
                   adoptante, donante, logo_us as logo
            FROM Usuario
            WHERE mail_us = ?
        ");
        $stmt->execute([$email_usuario]);
        $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($perfil) {
            $tipoCuenta = 'Usuario';
        }
    }
    
    if ($perfil) {
        // Agregar tipo de cuenta al perfil
        $perfil['tipo_cuenta'] = $tipoCuenta;
        
        echo json_encode([
            'success' => true,
            'perfil' => $perfil,
            'tipo' => $tipo_usuario
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al obtener perfil: ' . $e->getMessage()]);
}
