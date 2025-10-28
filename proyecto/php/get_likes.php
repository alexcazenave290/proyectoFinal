<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'conexion.php';

try {
    // Si no hay sesión, devolver array vacío
    if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
        echo json_encode([
            'success' => true,
            'likes' => []
        ]);
        exit;
    }

    $user_mail = $_SESSION['user_mail'];
    $user_rol = $_SESSION['user_rol'];

    // Determinar el campo correcto según el tipo de usuario
    $campo_mail = '';
    
    switch($user_rol) {
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
                'success' => true,
                'likes' => []
            ]);
            exit;
    }

    // Obtener todos los likes del usuario
    $sql = "SELECT id_masc FROM Like_Mascota 
            WHERE $campo_mail = :user_mail";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_mail' => $user_mail]);
    
    $likes = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'likes' => $likes
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener likes: ' . $e->getMessage()
    ]);
}
?>


