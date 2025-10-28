<?php
session_start();
header('Content-Type: application/json');

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para ver tus guardados',
        'guardados' => []
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
                'guardados' => []
            ]);
            exit;
    }
    
    // Obtener los IDs de mascotas guardadas por el usuario
    $query = "
        SELECT g.id_masc 
        FROM Guardado g
        WHERE g.$campo_mail = ?
        ORDER BY g.fecha_guardado DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$mail_usuario]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $guardados = [];
    foreach ($rows as $row) {
        $guardados[] = intval($row['id_masc']);
    }
    
    echo json_encode([
        'success' => true,
        'guardados' => $guardados
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'guardados' => []
    ]);
}
?>
