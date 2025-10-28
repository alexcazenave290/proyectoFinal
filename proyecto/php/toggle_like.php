<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'conexion.php';

// Verificar si el usuario está logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para dar like'
    ]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $id_masc = $data['id_masc'] ?? null;
    $user_mail = $_SESSION['user_mail'];
    $user_rol = $_SESSION['user_rol'];

    if (!$id_masc) {
        throw new Exception('ID de mascota no proporcionado');
    }

    // Determinar el campo correcto según el tipo de usuario
    $campo_mail = '';
    $tipo_usuario = '';
    
    switch($user_rol) {
        case 'usuario':
            $campo_mail = 'mail_us';
            $tipo_usuario = 'mail_us';
            break;
        case 'empleado':
            $campo_mail = 'mail_empl';
            $tipo_usuario = 'mail_empl';
            break;
        case 'institucion':
            $campo_mail = 'email_inst';
            $tipo_usuario = 'email_inst';
            break;
        default:
            throw new Exception('Tipo de usuario no válido');
    }

    // Verificar si ya existe un like de este usuario para esta mascota
    $sqlCheck = "SELECT id_like FROM Like_Mascota 
                 WHERE id_masc = :id_masc 
                 AND $campo_mail = :user_mail";
    
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([
        ':id_masc' => $id_masc,
        ':user_mail' => $user_mail
    ]);
    
    $existingLike = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existingLike) {
        // Si existe, eliminarlo (quitar like)
        $sqlDelete = "DELETE FROM Like_Mascota WHERE id_like = :id_like";
        $stmtDelete = $pdo->prepare($sqlDelete);
        $stmtDelete->execute([':id_like' => $existingLike['id_like']]);
        
        echo json_encode([
            'success' => true,
            'action' => 'removed',
            'message' => 'Like eliminado'
        ]);
    } else {
        // Si no existe, crearlo (dar like)
        $sqlInsert = "INSERT INTO Like_Mascota (id_masc, $campo_mail, fecha_like) 
                      VALUES (:id_masc, :user_mail, NOW())";
        
        $stmtInsert = $pdo->prepare($sqlInsert);
        $stmtInsert->execute([
            ':id_masc' => $id_masc,
            ':user_mail' => $user_mail
        ]);
        
        echo json_encode([
            'success' => true,
            'action' => 'added',
            'message' => 'Like agregado'
        ]);
    }

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error en la base de datos: ' . $e->getMessage(),
        'details' => $e->getTrace()
    ]);
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'line' => $e->getLine()
    ]);
}
?>


