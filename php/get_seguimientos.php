<?php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

require_once 'conexion.php';

try {
    // Obtener todos los seguimientos con información de mascota y usuario
    $sql = "SELECT 
                s.id_seguimiento,
                s.id_masc,
                s.mail_us,
                s.estado_salud,
                s.fecha_seguimiento,
                s.comportamiento,
                s.observaciones,
                s.foto_seguimiento,
                s.fecha_registro,
                m.nom_masc,
                m.foto_masc,
                m.especie_masc,
                m.raza_masc,
                u.nom_us,
                u.apell_us,
                u.logo_us
            FROM Seguimiento s
            INNER JOIN Mascota m ON s.id_masc = m.id_masc
            INNER JOIN Usuario u ON s.mail_us = u.mail_us
            ORDER BY s.fecha_registro DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $seguimientos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'seguimientos' => $seguimientos,
        'total' => count($seguimientos)
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener seguimientos: ' . $e->getMessage()
    ]);
}
?>

