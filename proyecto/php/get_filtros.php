<?php

$query = "SELECT DISTINCT Tamaño FROM Filtros WHERE Tamaño IS NOT NULL ORDER BY Tamaño ASC";
$resultado = $conexion->query($query);

$tamanos = [];
while ($fila = $resultado->fetch_assoc()) {
    $tamanos[] = $fila['Tamaño'];
}

echo json_encode($tamanos);
$conexion->close();

?>