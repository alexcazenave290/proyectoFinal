<?php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

require_once 'conexion.php';

// Verificar que el usuario esté logeado
if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$mail = $_SESSION['user_mail'];
$rol = $_SESSION['user_rol'];

try {
    // Solo los USUARIOS pueden tener adopciones
    // Los empleados e instituciones pueden ver la sección pero no tendrán mascotas adoptadas
    if ($rol !== 'usuario') {
        echo json_encode([
            'success' => true,
            'mascotas' => [],
            'message' => 'Solo los usuarios pueden adoptar mascotas',
            'debug' => [
                'rol' => $rol,
                'mail' => $mail
            ]
        ]);
        exit;
    }
    
    // Obtener mascotas adoptadas por el usuario con sus datos
    $sql = "SELECT DISTINCT 
                m.id_masc,
                m.nom_masc,
                m.foto_masc,
                m.especie_masc,
                m.raza_masc,
                a.id_adop,
                a.fecha_adop
            FROM Adopcion a
            INNER JOIN Mascota m ON a.id_masc = m.id_masc
            WHERE a.mail_us = :mail_us
            ORDER BY a.fecha_adop DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['mail_us' => $mail]);
    $mascotas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'mascotas' => $mascotas,
        'debug' => [
            'rol' => $rol,
            'mail' => $mail,
            'total' => count($mascotas)
        ]
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener mascotas: ' . $e->getMessage()
    ]);
}
?>

