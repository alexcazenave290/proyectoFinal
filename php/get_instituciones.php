<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    // Obtener todas las instituciones activas
    $stmt = $pdo->prepare("
        SELECT 
            email_inst,
            nomb_inst,
            logo_inst,
            direc_inst,
            tel_inst
        FROM Institucion
        ORDER BY nomb_inst ASC
    ");
    $stmt->execute();
    $instituciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'instituciones' => $instituciones
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>


