<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'conexion.php';

try {
    // Consulta para obtener mascotas con información de la institución
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
                i.nomb_inst
            FROM Mascota m
            INNER JOIN Institucion i ON m.id_inst = i.id_inst
            ORDER BY m.id_masc DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $mascotas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos para el frontend
    $mascotasFormateadas = array_map(function($mascota) {
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
            'nomb_inst' => $mascota['nomb_inst'] ?: 'Institución no especificada'
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
