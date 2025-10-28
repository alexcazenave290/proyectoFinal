<?php
session_start();
header('Content-Type: application/json');

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Debes iniciar sesión para guardar mascotas'
    ]);
    exit;
}

// Obtener datos del request
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id_masc']) || empty($data['id_masc'])) {
    echo json_encode([
        'success' => false,
        'message' => 'ID de mascota no válido'
    ]);
    exit;
}

$mail_usuario = $_SESSION['user_mail'];
$rol_usuario = $_SESSION['user_rol'];
$id_masc = intval($data['id_masc']);

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
                'message' => 'Tipo de usuario no válido'
            ]);
            exit;
    }
    
    // Verificar si ya existe el guardado
    $check = $pdo->prepare("SELECT id_guardado FROM Guardado WHERE $campo_mail = ? AND id_masc = ?");
    $check->execute([$mail_usuario, $id_masc]);
    $result = $check->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        // Ya existe, entonces lo eliminamos (desguardar)
        $delete = $pdo->prepare("DELETE FROM Guardado WHERE $campo_mail = ? AND id_masc = ?");
        
        if ($delete->execute([$mail_usuario, $id_masc])) {
            echo json_encode([
                'success' => true,
                'action' => 'removed',
                'message' => 'Mascota eliminada de guardados'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar de guardados'
            ]);
        }
    } else {
        // No existe, entonces lo agregamos (guardar)
        $insert = $pdo->prepare("INSERT INTO Guardado (id_masc, $campo_mail) VALUES (?, ?)");
        
        if ($insert->execute([$id_masc, $mail_usuario])) {
            echo json_encode([
                'success' => true,
                'action' => 'added',
                'message' => 'Mascota guardada exitosamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Error al guardar mascota'
            ]);
        }
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>
