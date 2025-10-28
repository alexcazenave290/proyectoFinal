<?php
session_start();
header('Content-Type: application/json');
require_once 'conexion.php';

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$email_actual = $_SESSION['user_mail'];
$rol_actual = $_SESSION['user_rol'];

// Función para obtener el identificador del usuario según su rol
function getUsuarioIdentificador($email, $rol, $tipo = 'participante') {
    $campo_email = '';
    $tabla = '';
    
    if ($rol === 'usuario') {
        $campo_email = $tipo === 'emisor' ? 'emisor_mail_us' : 'mail_us';
        $tabla = 'Usuario';
    } elseif ($rol === 'empleado') {
        $campo_email = $tipo === 'emisor' ? 'emisor_mail_empl' : 'mail_empl';
        $tabla = 'Empleado';
    } elseif ($rol === 'institucion') {
        $campo_email = $tipo === 'emisor' ? 'emisor_email_inst' : 'email_inst';
        $tabla = 'Institucion';
    }
    
    return ['campo' => $campo_email, 'tabla' => $tabla];
}

// Función para verificar si el usuario es participante de una conversación
function esParticipante($conversacion_id, $email, $rol, $pdo) {
    $info = getUsuarioIdentificador($email, $rol);
    $campo = $info['campo'];
    
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM conversacion_participantes 
        WHERE conversacion_id = ? AND $campo = ?
    ");
    $stmt->execute([$conversacion_id, $email]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $result['count'] > 0;
}

// ===== GET - Obtener mensajes de una conversación =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $conversacion_id = $_GET['conversacion_id'] ?? null;
    
    if (!$conversacion_id) {
        echo json_encode(['success' => false, 'error' => 'conversacion_id requerido']);
        exit();
    }
    
    // Verificar que el usuario participa en la conversación
    if (!esParticipante($conversacion_id, $email_actual, $rol_actual, $pdo)) {
        echo json_encode(['success' => false, 'error' => 'No tienes acceso a esta conversación']);
        exit();
    }
    
    try {
        // Obtener mensajes con información del emisor
        $stmt = $pdo->prepare("
            SELECT m.*, 
                COALESCE(u.nom_us, e.nomb_empl, i.nomb_inst) as nombre_emisor,
                COALESCE(u.logo_us, e.logo_empl, i.logo_inst) as logo_emisor,
                CASE 
                    WHEN m.emisor_mail_us IS NOT NULL THEN 'usuario'
                    WHEN m.emisor_mail_empl IS NOT NULL THEN 'empleado'
                    WHEN m.emisor_email_inst IS NOT NULL THEN 'institucion'
                END as tipo_emisor,
                COALESCE(m.emisor_mail_us, m.emisor_mail_empl, m.emisor_email_inst) as email_emisor
            FROM mensajes m
            LEFT JOIN Usuario u ON m.emisor_mail_us = u.mail_us
            LEFT JOIN Empleado e ON m.emisor_mail_empl = e.mail_empl
            LEFT JOIN Institucion i ON m.emisor_email_inst = i.email_inst
            WHERE m.conversacion_id = ?
            ORDER BY m.created_at ASC
        ");
        $stmt->execute([$conversacion_id]);
        $mensajes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Marcar mensajes como leídos (los que NO son del usuario actual)
        $info = getUsuarioIdentificador($email_actual, $rol_actual, 'emisor');
        $campo = $info['campo'];
        
        $updateStmt = $pdo->prepare("
            UPDATE mensajes 
            SET leido = TRUE 
            WHERE conversacion_id = ? 
            AND ($campo IS NULL OR $campo != ?)
            AND leido = FALSE
        ");
        $updateStmt->execute([$conversacion_id, $email_actual]);
        
        echo json_encode(['success' => true, 'mensajes' => $mensajes]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Error al obtener mensajes: ' . $e->getMessage()]);
    }
}

// ===== POST - Enviar mensaje =====
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $conversacion_id = $input['conversacion_id'] ?? null;
    $contenido = $input['contenido'] ?? null;
    
    if (!$conversacion_id || !$contenido) {
        echo json_encode(['success' => false, 'error' => 'Datos requeridos faltantes']);
        exit();
    }
    
    // Validar longitud del mensaje
    if (strlen($contenido) > 1000) {
        echo json_encode(['success' => false, 'error' => 'El mensaje es demasiado largo (máximo 1000 caracteres)']);
        exit();
    }
    
    // Verificar participación
    if (!esParticipante($conversacion_id, $email_actual, $rol_actual, $pdo)) {
        echo json_encode(['success' => false, 'error' => 'No tienes acceso a esta conversación']);
        exit();
    }
    
    try {
        // Determinar el campo a usar según el rol (con prefijo 'emisor_')
        $info = getUsuarioIdentificador($email_actual, $rol_actual, 'emisor');
        $campo = $info['campo'];
        
        // Insertar mensaje
        $stmt = $pdo->prepare("
            INSERT INTO mensajes (conversacion_id, $campo, contenido) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$conversacion_id, $email_actual, $contenido]);
        
        $mensaje_id = $pdo->lastInsertId();
        
        // Actualizar timestamp de la conversación
        $updateStmt = $pdo->prepare("
            UPDATE conversaciones 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateStmt->execute([$conversacion_id]);
        
        // Obtener el mensaje completo con datos del emisor
        $stmt = $pdo->prepare("
            SELECT m.*, 
                COALESCE(u.nom_us, e.nomb_empl, i.nomb_inst) as nombre_emisor,
                COALESCE(u.logo_us, e.logo_empl, i.logo_inst) as logo_emisor,
                CASE 
                    WHEN m.emisor_mail_us IS NOT NULL THEN 'usuario'
                    WHEN m.emisor_mail_empl IS NOT NULL THEN 'empleado'
                    WHEN m.emisor_email_inst IS NOT NULL THEN 'institucion'
                END as tipo_emisor,
                COALESCE(m.emisor_mail_us, m.emisor_mail_empl, m.emisor_email_inst) as email_emisor
            FROM mensajes m
            LEFT JOIN Usuario u ON m.emisor_mail_us = u.mail_us
            LEFT JOIN Empleado e ON m.emisor_mail_empl = e.mail_empl
            LEFT JOIN Institucion i ON m.emisor_email_inst = i.email_inst
            WHERE m.id = ?
        ");
        $stmt->execute([$mensaje_id]);
        $mensaje = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'mensaje' => $mensaje]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Error al enviar mensaje: ' . $e->getMessage()]);
    }
}
