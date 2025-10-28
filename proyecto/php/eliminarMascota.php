<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_mail'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado - sesión no iniciada']);
    exit;
}

// Verificar que sea empleado o institución
if (!isset($_SESSION['user_rol']) || !in_array($_SESSION['user_rol'], ['empleado', 'institucion'])) {
    echo json_encode(['success' => false, 'error' => 'Solo empleados e instituciones pueden eliminar mascotas. Rol actual: ' . ($_SESSION['user_rol'] ?? 'sin rol')]);
    exit;
}

require_once 'conexion.php';

try {
    // Obtener los datos del request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id_masc']) || empty($input['id_masc'])) {
        echo json_encode(['success' => false, 'error' => 'ID de mascota no proporcionado']);
        exit;
    }
    
    $id_masc = intval($input['id_masc']);
    
    // Verificar que la mascota existe
    $stmtCheck = $pdo->prepare("SELECT id_masc FROM Mascota WHERE id_masc = ?");
    $stmtCheck->execute([$id_masc]);
    
    if (!$stmtCheck->fetch()) {
        echo json_encode(['success' => false, 'error' => 'La mascota no existe']);
        exit;
    }
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    try {
        // Eliminar interacciones relacionadas con publicaciones de esta mascota
        $stmtInteracciones = $pdo->prepare("DELETE FROM Interacion WHERE id_publ IN (SELECT id_publ FROM Publicacion WHERE id_masc = ?)");
        $stmtInteracciones->execute([$id_masc]);
        
        // Eliminar adopciones relacionadas (no tienen CASCADE)
        $stmtAdopcion = $pdo->prepare("DELETE FROM Adopcion WHERE id_masc = ?");
        $stmtAdopcion->execute([$id_masc]);
        
        // Eliminar la mascota (esto eliminará automáticamente por CASCADE:
        // - Publicacion (FK_publ_masc)
        // - Guardado (FK_guardado_masc)
        // - Like_Mascota (FK_like_masc))
        $stmtMascota = $pdo->prepare("DELETE FROM Mascota WHERE id_masc = ?");
        $stmtMascota->execute([$id_masc]);
        
        // Confirmar transacción
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Mascota eliminada correctamente']);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Error en la base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
?>


