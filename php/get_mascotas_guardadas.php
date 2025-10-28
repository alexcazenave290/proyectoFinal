<?php
session_start();
header('Content-Type: application/json');

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para ver tus guardados',
        'data' => []
    ]);
    exit;
}

$mail_usuario = $_SESSION['user_mail'];
$rol_usuario = $_SESSION['user_rol'];

try {
    require_once 'conexion.php';
    
    // Determinar qué columna usar según el rol
    $campo_mail = '';
    
    switch($rol_usuario) {
        case 'usuario':
            $campo_mail = 'mail_us';
            break;
        case 'empleado':
            $campo_mail = 'mail_empl';
            break;
        case 'institucion':
            $campo_mail = 'email_inst';
            break;
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Tipo de usuario no válido',
                'data' => []
            ]);
            exit;
    }
    
    // Obtener las mascotas guardadas completas con información de la institución
    $query = "
        SELECT 
            m.*,
            i.nomb_inst,
            CASE 
                WHEN m.mail_empl IS NOT NULL THEN CONCAT(e.nomb_empl, ' ', COALESCE(e.apellido_empl, ''))
                WHEN m.email_inst IS NOT NULL THEN i2.nomb_inst
                ELSE NULL
            END as creado_por,
            CASE 
                WHEN m.mail_empl IS NOT NULL THEN 'empleado'
                WHEN m.email_inst IS NOT NULL THEN 'institucion'
                ELSE NULL
            END as tipo_creador,
            g.fecha_guardado
        FROM Guardado g
        INNER JOIN Mascota m ON g.id_masc = m.id_masc
        LEFT JOIN Institucion i ON m.id_inst = i.id_inst
        LEFT JOIN Empleado e ON m.mail_empl = e.mail_empl
        LEFT JOIN Institucion i2 ON m.email_inst = i2.email_inst
        WHERE g.$campo_mail = ?
        ORDER BY g.fecha_guardado DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$mail_usuario]);
    $mascotas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $mascotas,
        'count' => count($mascotas)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>
