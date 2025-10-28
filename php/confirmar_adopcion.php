<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require_once 'conexion.php';
require_once 'crear_notificacion.php';

// Verificar que el usuario esté logueado y sea empleado o institución
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$rol_actual = $_SESSION['user_rol'];

// Solo empleados e instituciones pueden confirmar adopciones
if ($rol_actual !== 'empleado' && $rol_actual !== 'institucion') {
    echo json_encode(['success' => false, 'error' => 'No tienes permisos para confirmar adopciones']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$email_actual = $_SESSION['user_mail'];
$id_mascota = $input['id_mascota'] ?? null;
$conversacion_id = $input['conversacion_id'] ?? null;

if (!$id_mascota || !$conversacion_id) {
    echo json_encode(['success' => false, 'error' => 'Datos requeridos faltantes']);
    exit();
}

try {
    // Verificar que la mascota existe y no está adoptada
    $stmt = $pdo->prepare("
        SELECT m.id_masc, m.nom_masc, m.estadoAdopt_masc,
            COALESCE(m.mail_empl, m.email_inst) as creador_mascota
        FROM Mascota m
        WHERE m.id_masc = ?
    ");
    $stmt->execute([$id_mascota]);
    $mascota = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$mascota) {
        echo json_encode(['success' => false, 'error' => 'Mascota no encontrada']);
        exit();
    }
    
    if ($mascota['estadoAdopt_masc']) {
        echo json_encode(['success' => false, 'error' => 'Esta mascota ya fue adoptada']);
        exit();
    }
    
    // Verificar que el usuario actual es el creador de la mascota
    if ($mascota['creador_mascota'] !== $email_actual) {
        echo json_encode(['success' => false, 'error' => 'Solo el creador de la mascota puede confirmar la adopción']);
        exit();
    }
    
    // Obtener el email del usuario que solicitó la adopción
    $stmt = $pdo->prepare("
        SELECT emisor_mail_us 
        FROM mensajes 
        WHERE conversacion_id = ? 
        AND id_mascota_adopcion = ?
        AND emisor_mail_us IS NOT NULL
        ORDER BY created_at ASC
        LIMIT 1
    ");
    $stmt->execute([$conversacion_id, $id_mascota]);
    $solicitud = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$solicitud || !$solicitud['emisor_mail_us']) {
        echo json_encode(['success' => false, 'error' => 'No se encontró una solicitud de adopción válida de un usuario']);
        exit();
    }
    
    $mail_adoptante = $solicitud['emisor_mail_us'];
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    try {
        // 1. Crear registro en la tabla Adopcion
        $stmt = $pdo->prepare("
            INSERT INTO Adopcion (id_masc, mail_us, fecha_adop) 
            VALUES (?, ?, CURDATE())
        ");
        $stmt->execute([$id_mascota, $mail_adoptante]);
        
        // 2. Actualizar el estado de la mascota a adoptada
        $stmt = $pdo->prepare("
            UPDATE Mascota 
            SET estadoAdopt_masc = TRUE 
            WHERE id_masc = ?
        ");
        $stmt->execute([$id_mascota]);
        
        $pdo->commit();
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        throw $e;
    }
    
    // Obtener nombre del adoptante
    $stmt = $pdo->prepare("SELECT nom_us, apell_us FROM Usuario WHERE mail_us = ?");
    $stmt->execute([$mail_adoptante]);
    $adoptante = $stmt->fetch(PDO::FETCH_ASSOC);
    $nombre_adoptante = trim(($adoptante['nom_us'] ?? '') . ' ' . ($adoptante['apell_us'] ?? ''));
    
    // Enviar mensaje de confirmación en el chat
    $campo_emisor = '';
    if ($rol_actual === 'empleado') {
        $campo_emisor = 'emisor_mail_empl';
    } else {
        $campo_emisor = 'emisor_email_inst';
    }
    
    $contenido_mensaje = "✅ Adopción confirmada para " . $mascota['nom_masc'] . ". ¡Felicidades" . ($nombre_adoptante ? " $nombre_adoptante" : "") . "! 🎉";
    
    $stmt = $pdo->prepare("
        INSERT INTO mensajes (conversacion_id, $campo_emisor, contenido) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$conversacion_id, $email_actual, $contenido_mensaje]);
    
    // Actualizar timestamp de la conversación
    $updateStmt = $pdo->prepare("
        UPDATE conversaciones 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $updateStmt->execute([$conversacion_id]);
    
    // Crear notificación para el usuario adoptante
    try {
        // Obtener nombre del creador (institución o empleado)
        $nombreCreador = '';
        if ($rol_actual === 'empleado') {
            $stmtCreador = $pdo->prepare("SELECT nomb_empl, apellido_empl FROM Empleado WHERE mail_empl = ?");
            $stmtCreador->execute([$email_actual]);
            $creador = $stmtCreador->fetch(PDO::FETCH_ASSOC);
            if ($creador) {
                $nombreCreador = trim(($creador['nomb_empl'] ?? '') . ' ' . ($creador['apellido_empl'] ?? ''));
            }
        } else {
            $stmtCreador = $pdo->prepare("SELECT nomb_inst FROM Institucion WHERE email_inst = ?");
            $stmtCreador->execute([$email_actual]);
            $creador = $stmtCreador->fetch(PDO::FETCH_ASSOC);
            if ($creador) {
                $nombreCreador = $creador['nomb_inst'] ?? '';
            }
        }
        
        $tituloNotif = "¡Adopción confirmada!";
        $contenidoNotif = ($nombreCreador ? "$nombreCreador ha confirmado" : "Se ha confirmado") . " tu adopción de " . $mascota['nom_masc'] . " 🎉";
        crearNotificacion($pdo, $mail_adoptante, 'mensaje', $tituloNotif, $contenidoNotif, $conversacion_id);
    } catch (Exception $e) {
        error_log("Error al crear notificación de confirmación de adopción: " . $e->getMessage());
        // No fallar la operación si falla la notificación
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Adopción confirmada exitosamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error al confirmar adopción: ' . $e->getMessage()]);
}

