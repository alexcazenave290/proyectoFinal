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

try {
    // Determinar el campo según el rol
    $campo_email = '';
    $campo_email_emisor = '';
    if ($rol_actual === 'usuario') {
        $campo_email = 'mail_us';
        $campo_email_emisor = 'emisor_mail_us';
    } elseif ($rol_actual === 'empleado') {
        $campo_email = 'mail_empl';
        $campo_email_emisor = 'emisor_mail_empl';
    } elseif ($rol_actual === 'institucion') {
        $campo_email = 'email_inst';
        $campo_email_emisor = 'emisor_email_inst';
    }
    
    // Obtener conversaciones del usuario con información del otro participante
    $stmt = $pdo->prepare("
        SELECT DISTINCT c.id as conversacion_id, c.updated_at,
            CASE 
                WHEN cp2.mail_us IS NOT NULL THEN cp2.mail_us
                WHEN cp2.mail_empl IS NOT NULL THEN cp2.mail_empl
                WHEN cp2.email_inst IS NOT NULL THEN cp2.email_inst
            END as email_otro,
            CASE 
                WHEN cp2.mail_us IS NOT NULL THEN 'usuario'
                WHEN cp2.mail_empl IS NOT NULL THEN 'empleado'
                WHEN cp2.email_inst IS NOT NULL THEN 'institucion'
            END as tipo_otro,
            COALESCE(u.nom_us, e.nomb_empl, i.nomb_inst) as nombre_otro,
            COALESCE(u.logo_us, e.logo_empl, i.logo_inst) as logo_otro,
            (SELECT contenido FROM mensajes WHERE conversacion_id = c.id ORDER BY created_at DESC LIMIT 1) as ultimo_mensaje,
            (SELECT created_at FROM mensajes WHERE conversacion_id = c.id ORDER BY created_at DESC LIMIT 1) as fecha_ultimo_mensaje,
            (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id AND (m.$campo_email_emisor IS NULL OR m.$campo_email_emisor != ?) AND m.leido = FALSE) as no_leidos
        FROM conversaciones c
        INNER JOIN conversacion_participantes cp1 ON c.id = cp1.conversacion_id
        INNER JOIN conversacion_participantes cp2 ON c.id = cp2.conversacion_id 
            AND cp2.id != cp1.id
        LEFT JOIN Usuario u ON cp2.mail_us = u.mail_us
        LEFT JOIN Empleado e ON cp2.mail_empl = e.mail_empl
        LEFT JOIN Institucion i ON cp2.email_inst = i.email_inst
        WHERE cp1.$campo_email = ?
        ORDER BY c.updated_at DESC
    ");
    $stmt->execute([$email_actual, $email_actual]);
    $conversaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'conversaciones' => $conversaciones]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener conversaciones: ' . $e->getMessage()]);
}
