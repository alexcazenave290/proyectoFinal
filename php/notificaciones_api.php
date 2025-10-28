<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
require_once 'conexion.php';

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail'])) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$email = $_SESSION['user_mail'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Obtener notificaciones del usuario
        $stmt = $pdo->prepare("
            SELECT 
                id_notificacion,
                tipo_notificacion,
                titulo,
                contenido,
                leida,
                id_referencia,
                created_at
            FROM notificaciones
            WHERE email_destinatario = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$email]);
        $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Contar no leídas
        $stmtCount = $pdo->prepare("
            SELECT COUNT(*) as total
            FROM notificaciones
            WHERE email_destinatario = ? AND leida = FALSE
        ");
        $stmtCount->execute([$email]);
        $noLeidas = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
        
        echo json_encode([
            'success' => true,
            'notificaciones' => $notificaciones,
            'no_leidas' => $noLeidas
        ]);
        
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['accion']) && $data['accion'] === 'marcar_leida') {
            // Marcar una notificación como leída
            $idNotificacion = $data['id_notificacion'] ?? null;
            
            if ($idNotificacion) {
                $stmt = $pdo->prepare("
                    UPDATE notificaciones 
                    SET leida = TRUE 
                    WHERE id_notificacion = ? AND email_destinatario = ?
                ");
                $stmt->execute([$idNotificacion, $email]);
                
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'ID no proporcionado']);
            }
            
        } elseif (isset($data['accion']) && $data['accion'] === 'marcar_todas_leidas') {
            // Marcar todas las notificaciones como leídas
            $stmt = $pdo->prepare("
                UPDATE notificaciones 
                SET leida = TRUE 
                WHERE email_destinatario = ? AND leida = FALSE
            ");
            $stmt->execute([$email]);
            
            echo json_encode(['success' => true]);
            
        } elseif (isset($data['accion']) && $data['accion'] === 'crear') {
            // Crear una nueva notificación (solo para uso interno)
            $emailDestinatario = $data['email_destinatario'] ?? null;
            $tipo = $data['tipo_notificacion'] ?? null;
            $titulo = $data['titulo'] ?? null;
            $contenido = $data['contenido'] ?? null;
            $idReferencia = $data['id_referencia'] ?? null;
            
            if (!$emailDestinatario || !$tipo || !$titulo || !$contenido) {
                echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO notificaciones 
                (email_destinatario, tipo_notificacion, titulo, contenido, id_referencia)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$emailDestinatario, $tipo, $titulo, $contenido, $idReferencia]);
            
            echo json_encode(['success' => true, 'id_notificacion' => $pdo->lastInsertId()]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

