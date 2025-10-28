<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'conexion.php';

try {
    // Consulta para obtener mascotas con información de la institución y del creador
    $sql = "SELECT 
                m.id_masc,
                m.nom_masc,
                m.especie_masc,
                m.raza_masc,
                m.tamano_masc,
                m.edad_masc,
                m.salud_masc,
                m.desc_masc,
                m.foto_masc,
                m.estadoAdopt_masc,
                m.mail_empl,
                m.email_inst,
                i.nomb_inst,
                e.nomb_empl,
                e.apellido_empl,
                e.logo_empl,
                inst_creador.nomb_inst AS institucion_creador,
                inst_creador.logo_inst AS logo_institucion_creador
            FROM Mascota m
            INNER JOIN Institucion i ON m.id_inst = i.id_inst
            LEFT JOIN Empleado e ON m.mail_empl = e.mail_empl
            LEFT JOIN Institucion inst_creador ON m.email_inst = inst_creador.email_inst
            ORDER BY m.id_masc DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $mascotas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos para el frontend
    $mascotasFormateadas = array_map(function($mascota) {
        // Determinar quién creó la mascota
        $creador = '';
        $tipo_creador = '';
        $email_creador = '';
        $logo_creador = '';
        
        if ($mascota['mail_empl']) {
            $creador = trim(($mascota['nomb_empl'] ?? '') . ' ' . ($mascota['apellido_empl'] ?? ''));
            $tipo_creador = 'empleado';
            $email_creador = $mascota['mail_empl'];
            $logo_creador = $mascota['logo_empl'] ?? '';
        } elseif ($mascota['email_inst']) {
            $creador = $mascota['institucion_creador'] ?? 'Institución';
            $tipo_creador = 'institucion';
            $email_creador = $mascota['email_inst'];
            $logo_creador = $mascota['logo_institucion_creador'] ?? '';
        }
        
        return [
            'id_masc' => $mascota['id_masc'],
            'nom_masc' => $mascota['nom_masc'] ?: 'Sin nombre',
            'especie_masc' => $mascota['especie_masc'] ?: 'Otro',
            'raza_masc' => $mascota['raza_masc'] ?: 'Desconocida',
            'tamano_masc' => $mascota['tamano_masc'] ?: 'Desconocida',
            'edad_masc' => $mascota['edad_masc'] ?: 'Desconocida',
            'salud_masc' => $mascota['salud_masc'] ?: 'Desconocida',
            'desc_masc' => $mascota['desc_masc'] ?: 'Sin descripción',
            'foto_masc' => $mascota['foto_masc'] ?: '../img/default.svg',
            'estadoAdopt_masc' => (bool)$mascota['estadoAdopt_masc'],
            'nomb_inst' => $mascota['nomb_inst'] ?: 'Institución no especificada',
            'creado_por' => $creador ?: 'Desconocido',
            'tipo_creador' => $tipo_creador,
            'email_creador' => $email_creador,
            'logo_creador' => $logo_creador
        ];
    }, $mascotas);
    
    echo json_encode([
        'success' => true,
        'data' => $mascotasFormateadas,
        'total' => count($mascotasFormateadas)
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener mascotas: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error general: ' . $e->getMessage()
    ]);
}
?>
