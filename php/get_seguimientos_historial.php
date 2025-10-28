<?php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

require_once 'conexion.php';

try {
    // Verificar que el usuario esté logueado
    if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
        echo json_encode([
            'success' => false,
            'error' => 'No autorizado. Debe iniciar sesión.'
        ]);
        exit;
    }

    $rol = $_SESSION['user_rol'];
    $email = $_SESSION['user_mail'];

    // Verificar que sea empleado o institución
    if ($rol !== 'empleado' && $rol !== 'institucion') {
        echo json_encode([
            'success' => false,
            'error' => 'Acceso denegado. Solo empleados e instituciones pueden ver este historial.'
        ]);
        exit;
    }

    // Obtener los seguimientos de las mascotas creadas por este empleado/institución
    if ($rol === 'empleado') {
        // Para empleados
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
                WHERE m.mail_empl = :email
                ORDER BY s.fecha_seguimiento DESC, s.fecha_registro DESC";
    } else {
        // Para instituciones
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
                WHERE m.email_inst = :email
                ORDER BY s.fecha_seguimiento DESC, s.fecha_registro DESC";
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
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


