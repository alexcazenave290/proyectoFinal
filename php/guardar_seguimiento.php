<?php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

require_once 'conexion.php';
require_once 'crear_notificacion.php';

// Verificar que el usuario esté logeado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

// Solo los USUARIOS pueden publicar seguimientos (no empleados ni instituciones)
if ($_SESSION['user_rol'] !== 'usuario') {
    echo json_encode(['success' => false, 'error' => 'Solo los usuarios que adoptaron mascotas pueden publicar seguimientos']);
    exit;
}

$mail_us = $_SESSION['user_mail'];

try {
    // Recibir datos del formulario
    $id_masc = isset($_POST['id_masc']) ? intval($_POST['id_masc']) : 0;
    $estado_salud = isset($_POST['estado_salud']) ? trim($_POST['estado_salud']) : '';
    $fecha_seguimiento = isset($_POST['fecha_seguimiento']) ? trim($_POST['fecha_seguimiento']) : '';
    $comportamiento = isset($_POST['comportamiento']) ? trim($_POST['comportamiento']) : '';
    $observaciones = isset($_POST['observaciones']) ? trim($_POST['observaciones']) : '';
    
    // Validaciones básicas
    if ($id_masc <= 0 || empty($estado_salud) || empty($fecha_seguimiento)) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
        exit;
    }
    
    // Verificar que el usuario haya adoptado esta mascota
    $sqlVerif = "SELECT id_adop FROM Adopcion WHERE id_masc = :id_masc AND mail_us = :mail_us";
    $stmtVerif = $pdo->prepare($sqlVerif);
    $stmtVerif->execute([
        'id_masc' => $id_masc,
        'mail_us' => $mail_us
    ]);
    
    $adopcion = $stmtVerif->fetch(PDO::FETCH_ASSOC);
    
    if (!$adopcion) {
        echo json_encode(['success' => false, 'error' => 'No tienes permiso para crear seguimiento de esta mascota']);
        exit;
    }
    
    $id_adop = $adopcion['id_adop'];
    
    // Procesar la foto si se subió
    $foto_ruta = null;
    
    if (isset($_FILES['foto_seguimiento']) && $_FILES['foto_seguimiento']['error'] === UPLOAD_ERR_OK) {
        $archivo = $_FILES['foto_seguimiento'];
        $extension = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $extensiones_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($extension, $extensiones_permitidas)) {
            echo json_encode(['success' => false, 'error' => 'Formato de imagen no permitido']);
            exit;
        }
        
        // Tamaño máximo: 5MB
        if ($archivo['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'error' => 'La imagen es demasiado grande (máx 5MB)']);
            exit;
        }
        
        // Crear directorio si no existe
        $directorio_destino = __DIR__ . '/../img/seguimientos/';
        if (!is_dir($directorio_destino)) {
            mkdir($directorio_destino, 0755, true);
        }
        
        // Generar nombre único
        $nombre_archivo = 'seg_' . uniqid() . '.' . $extension;
        $ruta_completa = $directorio_destino . $nombre_archivo;
        
        // Mover archivo
        if (move_uploaded_file($archivo['tmp_name'], $ruta_completa)) {
            // Guardar ruta relativa desde la raíz del proyecto
            $foto_ruta = '/proyecto/img/seguimientos/' . $nombre_archivo;
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al subir la imagen']);
            exit;
        }
    }
    
    // Insertar seguimiento en la base de datos
    $sqlInsert = "INSERT INTO Seguimiento 
                  (id_adop, id_masc, mail_us, estado_salud, fecha_seguimiento, 
                   comportamiento, observaciones, foto_seguimiento) 
                  VALUES 
                  (:id_adop, :id_masc, :mail_us, :estado_salud, :fecha_seguimiento, 
                   :comportamiento, :observaciones, :foto_seguimiento)";
    
    $stmtInsert = $pdo->prepare($sqlInsert);
    $resultado = $stmtInsert->execute([
        'id_adop' => $id_adop,
        'id_masc' => $id_masc,
        'mail_us' => $mail_us,
        'estado_salud' => $estado_salud,
        'fecha_seguimiento' => $fecha_seguimiento,
        'comportamiento' => $comportamiento,
        'observaciones' => $observaciones,
        'foto_seguimiento' => $foto_ruta
    ]);
    
    if ($resultado) {
        $id_seguimiento = $pdo->lastInsertId();
        
        // Obtener información de la mascota y su creador para la notificación
        $sqlMascota = "SELECT 
                            m.nom_masc, 
                            COALESCE(m.mail_empl, m.email_inst) as email_creador,
                            COALESCE(e.nomb_empl, i.nomb_inst) as nombre_creador
                       FROM Mascota m
                       LEFT JOIN Empleado e ON m.mail_empl = e.mail_empl
                       LEFT JOIN Institucion i ON m.email_inst = i.email_inst
                       WHERE m.id_masc = :id_masc";
        $stmtMascota = $pdo->prepare($sqlMascota);
        $stmtMascota->execute(['id_masc' => $id_masc]);
        $mascota = $stmtMascota->fetch(PDO::FETCH_ASSOC);
        
        // Obtener nombre del usuario que creó el seguimiento
        $sqlUsuario = "SELECT nom_us, apell_us FROM Usuario WHERE mail_us = :mail_us";
        $stmtUsuario = $pdo->prepare($sqlUsuario);
        $stmtUsuario->execute(['mail_us' => $mail_us]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        // Crear notificación para el creador de la mascota
        if ($mascota && !empty($mascota['email_creador'])) {
            $nombreUsuario = ($usuario['nom_us'] ?? '') . ' ' . ($usuario['apell_us'] ?? '');
            $nombreMascota = $mascota['nom_masc'] ?? 'una mascota';
            $tituloNotif = "Nuevo seguimiento de $nombreMascota";
            $contenidoNotif = "$nombreUsuario publicó un seguimiento de $nombreMascota";
            crearNotificacion($pdo, $mascota['email_creador'], 'seguimiento', $tituloNotif, $contenidoNotif, $id_seguimiento);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Seguimiento guardado correctamente',
            'id_seguimiento' => $id_seguimiento
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Error al guardar el seguimiento']);
    }

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
}
?>

