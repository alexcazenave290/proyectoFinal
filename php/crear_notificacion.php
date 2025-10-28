<?php
// Función helper para crear notificaciones
// Este archivo se incluye en otros scripts PHP para crear notificaciones

function crearNotificacion($pdo, $emailDestinatario, $tipoNotificacion, $titulo, $contenido, $idReferencia = null) {
    try {
        // Verificar que el tipo de notificación es válido
        $tiposValidos = ['mensaje', 'seguimiento', 'donacion', 'comentario'];
        if (!in_array($tipoNotificacion, $tiposValidos)) {
            error_log("Tipo de notificación inválido: $tipoNotificacion");
            return false;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO notificaciones 
            (email_destinatario, tipo_notificacion, titulo, contenido, id_referencia)
            VALUES (?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([$emailDestinatario, $tipoNotificacion, $titulo, $contenido, $idReferencia]);
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            error_log("Error al insertar notificación: " . json_encode($errorInfo));
            error_log("Datos: email=$emailDestinatario, tipo=$tipoNotificacion, titulo=$titulo");
            return false;
        }
        
        return true;
    } catch (PDOException $e) {
        error_log("Error PDO al crear notificación: " . $e->getMessage());
        error_log("Código de error: " . $e->getCode());
        error_log("Datos: email=$emailDestinatario, tipo=$tipoNotificacion");
        return false;
    } catch (Exception $e) {
        error_log("Error general al crear notificación: " . $e->getMessage());
        return false;
    }
}
?>

