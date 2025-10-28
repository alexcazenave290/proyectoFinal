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
$email_destinatario = $input['email_destinatario'] ?? null;
$tipo_destinatario = $input['tipo_destinatario'] ?? null;

if (!$email_destinatario || !$tipo_destinatario) {
    echo json_encode(['success' => false, 'error' => 'Datos requeridos faltantes']);
    exit();
}

try {
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
    
    if ($tipo_destinatario === 'usuario') {
        $campo_destino = 'mail_us';
    } elseif ($tipo_destinatario === 'empleado') {
        $campo_destino = 'mail_empl';
    } elseif ($tipo_destinatario === 'institucion') {
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
    $stmt->execute([$email_actual, $email_destinatario]);
    $conversacion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($conversacion) {
        // La conversación ya existe
        echo json_encode([
            'success' => true, 
            'conversacion_id' => $conversacion['conversacion_id'],
            'nueva' => false
        ]);
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
            
            // Agregar participante destinatario
            $stmt = $pdo->prepare("
                INSERT INTO conversacion_participantes (conversacion_id, $campo_destino) 
                VALUES (?, ?)
            ");
            $stmt->execute([$conversacion_id, $email_destinatario]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true, 
                'conversacion_id' => $conversacion_id,
                'nueva' => true
            ]);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error al crear conversación: ' . $e->getMessage()]);
}
