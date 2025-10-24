<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir el archivo de conexión
require_once 'conexion.php';

try {
    // Obtener tamaños únicos de la base de datos
    $queryTamanos = "SELECT DISTINCT tamano_masc FROM Mascota WHERE tamano_masc IS NOT NULL AND tamano_masc != ''";
    $resultTamanos = $conexion->query($queryTamanos);
    
    $tamanos = [];
    if ($resultTamanos) {
        while ($row = $resultTamanos->fetch_assoc()) {
            $tamanos[] = $row['tamano_masc'];
        }
    }
    
    // Obtener especies únicas
    $queryEspecies = "SELECT DISTINCT especie_masc FROM Mascota WHERE especie_masc IS NOT NULL AND especie_masc != ''";
    $resultEspecies = $conexion->query($queryEspecies);
    
    $especies = [];
    if ($resultEspecies) {
        while ($row = $resultEspecies->fetch_assoc()) {
            $especies[] = $row['especie_masc'];
        }
    }
    
    // Obtener razas únicas
    $queryRazas = "SELECT DISTINCT raza_masc FROM Mascota WHERE raza_masc IS NOT NULL AND raza_masc != ''";
    $resultRazas = $conexion->query($queryRazas);
    
    $razas = [];
    if ($resultRazas) {
        while ($row = $resultRazas->fetch_assoc()) {
            $razas[] = $row['raza_masc'];
        }
    }
    
    // Obtener estados de salud únicos
    $querySalud = "SELECT DISTINCT salud_masc FROM Mascota WHERE salud_masc IS NOT NULL AND salud_masc != ''";
    $resultSalud = $conexion->query($querySalud);
    
    $salud = [];
    if ($resultSalud) {
        while ($row = $resultSalud->fetch_assoc()) {
            $salud[] = $row['salud_masc'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'tamanos' => $tamanos,
        'especies' => $especies,
        'razas' => $razas,
        'salud' => $salud
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conexion)) {
        $conexion->close();
    }
}
?>