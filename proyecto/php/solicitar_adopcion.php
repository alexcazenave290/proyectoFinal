<?php
session_start();
header('Content-Type: application/json');
require_once 'conexion.php';

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$email_actual = $_SESSION['user_mail'];
$rol_actual = $_SESSION['user_rol'];
$id_mascota = $input['id_mascota'] ?? null;

if (!$id_mascota) {
    echo json_encode(['success' => false, 'error' => 'ID de mascota requerido']);
    exit();
}

try {
    // Obtener información de la mascota y su creador
    $stmt = $pdo->prepare("
        SELECT m.id_masc, m.nom_masc, m.estadoAdopt_masc,
            COALESCE(m.mail_empl, m.email_inst) as email_creador,
            CASE 
                WHEN m.mail_empl IS NOT NULL THEN 'empleado'
                WHEN m.email_inst IS NOT NULL THEN 'institucion'
            END as tipo_creador,
            COALESCE(e.nomb_empl, i.nomb_inst) as nombre_creador,
            COALESCE(e.logo_empl, i.logo_inst) as logo_creador
        FROM Mascota m
        LEFT JOIN Empleado e ON m.mail_empl = e.mail_empl
        LEFT JOIN Institucion i ON m.email_inst = i.email_inst
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
    
    if (!$mascota['email_creador'] || !$mascota['tipo_creador']) {
        echo json_encode(['success' => false, 'error' => 'No se pudo determinar el creador de la mascota']);
        exit();
    }
    
    // Determinar campos según roles
    $campo_actual = '';
    $campo_destino = '';
    
    if ($rol_actual === 'usuario') {
        $campo_actual = 'mail_us';
    } elseif ($rol_actual === 'empleado') {
        $campo_actual = 'mail_empl';
    } elseif ($rol_actual === 'institucion') {
        $campo_actual = 'email_inst';
    }
    
    if ($mascota['tipo_creador'] === 'empleado') {
        $campo_destino = 'mail_empl';
    } else {
        $campo_destino = 'email_inst';
    }
    
    // Verificar si ya existe una conversación entre estos dos usuarios
    $stmt = $pdo->prepare("
        SELECT c.id as conversacion_id
        FROM conversaciones c
        INNER JOIN conversacion_participantes cp1 ON c.id = cp1.conversacion_id
        INNER JOIN conversacion_participantes cp2 ON c.id = cp2.conversacion_id
        WHERE cp1.$campo_actual = ? 
        AND cp2.$campo_destino = ?
        AND c.tipo = 'privada'
        LIMIT 1
    ");
    $stmt->execute([$email_actual, $mascota['email_creador']]);
    $conversacion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $conversacion_id = null;
    
    if ($conversacion) {
        // La conversación ya existe
        $conversacion_id = $conversacion['conversacion_id'];
    } else {
        // Crear nueva conversación
        $pdo->beginTransaction();
        
        try {
            // Crear conversación
            $stmt = $pdo->prepare("INSERT INTO conversaciones (tipo) VALUES ('privada')");
            $stmt->execute();
            $conversacion_id = $pdo->lastInsertId();
            
            // Agregar participante actual
            $stmt = $pdo->prepare("
                INSERT INTO conversacion_participantes (conversacion_id, $campo_actual) 
                VALUES (?, ?)
            ");
            $stmt->execute([$conversacion_id, $email_actual]);
            
            // Agregar participante destinatario (creador de la mascota)
            $stmt = $pdo->prepare("
                INSERT INTO conversacion_participantes (conversacion_id, $campo_destino) 
                VALUES (?, ?)
            ");
            $stmt->execute([$conversacion_id, $mascota['email_creador']]);
            
            $pdo->commit();
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
    
    // Verificar si ya existe una solicitud de adopción para esta mascota en esta conversación
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM mensajes 
        WHERE conversacion_id = ? 
        AND id_mascota_adopcion = ?
    ");
    $stmt->execute([$conversacion_id, $id_mascota]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $ya_existe_solicitud = $result['count'] > 0;
    $mensaje_enviado = false;
    
    if (!$ya_existe_solicitud) {
        // Enviar mensaje automático con la solicitud de adopción
        $campo_emisor = '';
        if ($rol_actual === 'usuario') {
            $campo_emisor = 'emisor_mail_us';
        } elseif ($rol_actual === 'empleado') {
            $campo_emisor = 'emisor_mail_empl';
        } elseif ($rol_actual === 'institucion') {
            $campo_emisor = 'emisor_email_inst';
        }
        
        $contenido_mensaje = "Estoy interesado en la mascota.";
        
        $stmt = $pdo->prepare("
            INSERT INTO mensajes (conversacion_id, $campo_emisor, contenido, id_mascota_adopcion) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$conversacion_id, $email_actual, $contenido_mensaje, $id_mascota]);
        
        // Actualizar timestamp de la conversación
        $updateStmt = $pdo->prepare("
            UPDATE conversaciones 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateStmt->execute([$conversacion_id]);
        
        $mensaje_enviado = true;
    }
    
    echo json_encode([
        'success' => true,
        'conversacion_id' => $conversacion_id,
        'mensaje_enviado' => $mensaje_enviado,
        'ya_existe_solicitud' => $ya_existe_solicitud,
        'creador' => [
            'email' => $mascota['email_creador'],
            'tipo' => $mascota['tipo_creador'],
            'nombre' => $mascota['nombre_creador'],
            'logo' => $mascota['logo_creador']
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error al procesar solicitud: ' . $e->getMessage()]);
}

