<?php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

require_once 'conexion.php';

// Verificar que el usuario esté logeado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado', 'logged_in' => false]);
    exit;
}

$mail = $_SESSION['user_mail'];
$rol = $_SESSION['user_rol'];

try {
    $usuario = null;
    
    // Obtener datos según el tipo de usuario
    if ($rol === 'usuario') {
        $sql = "SELECT nom_us AS nombre, apell_us AS apellido, tel_us AS telefono, mail_us AS email FROM Usuario WHERE mail_us = :mail";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['mail' => $mail]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
    } elseif ($rol === 'empleado') {
        $sql = "SELECT nomb_empl AS nombre, apellido_empl AS apellido, tel_empl AS telefono, mail_empl AS email FROM Empleado WHERE mail_empl = :mail";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['mail' => $mail]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
    } elseif ($rol === 'institucion') {
        $sql = "SELECT nomb_inst AS nombre, '' AS apellido, tel_inst AS telefono, email_inst AS email FROM Institucion WHERE email_inst = :mail";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['mail' => $mail]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if ($usuario) {
        echo json_encode([
            'success' => true,
            'logged_in' => true,
            'rol' => $rol,
            'usuario' => [
                'nombre' => $usuario['nombre'] ?? '',
                'apellido' => $usuario['apellido'] ?? '',
                'telefono' => $usuario['telefono'] ?? '',
                'email' => $usuario['email'] ?? ''
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado', 'logged_in' => false]);
    }

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener datos: ' . $e->getMessage(),
        'logged_in' => false
    ]);
}
?>

