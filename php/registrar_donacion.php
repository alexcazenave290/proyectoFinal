<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require 'conexion.php';
require 'crear_notificacion.php';

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
$email_institucion = $input['email_institucion'] ?? null;
$monto = $input['monto'] ?? 0;

try {
    // Marcar al usuario como donante
    $sql = "UPDATE Usuario SET donante = 1 WHERE mail_us = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$mail_us]);

    // Registrar la donación en la tabla
    $sqlDonacion = "INSERT INTO donaciones (mail_us, plataforma, tipo_donacion, nombre_refugio, email_institucion, monto) 
                    VALUES (?, ?, ?, ?, ?, ?)";
    $stmtDonacion = $pdo->prepare($sqlDonacion);
    $stmtDonacion->execute([$mail_us, $plataforma, $tipo_donacion, $nombre_refugio, $email_institucion, $monto]);
    
    // Si la donación es a una institución específica, crear notificación
    if ($email_institucion && $tipo_donacion === 'refugio') {
        // Obtener nombre del usuario donante
        $sqlUsuario = "SELECT nom_us, apell_us FROM Usuario WHERE mail_us = ?";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute([$mail_us]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        // Obtener nombre de la institución
        $sqlInstitucion = "SELECT nomb_inst FROM Institucion WHERE email_inst = ?";
        $stmtInstitucion = $pdo->prepare($sqlInstitucion);
        $stmtInstitucion->execute([$email_institucion]);
        $institucion = $stmtInstitucion->fetch(PDO::FETCH_ASSOC);
        
        $nombreUsuario = ($usuario['nom_us'] ?? '') . ' ' . ($usuario['apell_us'] ?? '');
        $nombreInstitucion = $institucion['nomb_inst'] ?? 'tu refugio';
        $tituloNotif = "Nueva donación recibida";
        $contenidoNotif = "$nombreUsuario ha realizado una donación a $nombreInstitucion vía $plataforma";
        crearNotificacion($pdo, $email_institucion, 'donacion', $tituloNotif, $contenidoNotif, null);
    }
    
    echo json_encode([
        'success' => true, 
        'message' => '¡Gracias por tu donación! Ahora eres un donante premium.',
        'plataforma' => $plataforma
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

