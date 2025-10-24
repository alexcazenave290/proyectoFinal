<?php
header('Content-Type: application/json');

$directorio = "img/";

if (!isset($_FILES['imagen'])) {
    echo json_encode(['success' => false, 'error' => 'No se recibió imagen']);
    exit;
}

$archivo = $_FILES['imagen'];
$nombre = basename($archivo["name"]);
$extension = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
$permitidas = ['jpg', 'jpeg', 'png', 'gif'];

// Validar extensión
if (!in_array($extension, $permitidas)) {
    echo json_encode(['success' => false, 'error' => 'Formato de imagen no permitido']);
    exit;
}

// Nombre único
$nombreFinal = uniqid("masc_") . "." . $extension;
$rutaDestino = $directorio . $nombreFinal;

if (move_uploaded_file($archivo["tmp_name"], $rutaDestino)) {
    echo json_encode(['success' => true, 'ruta' => $rutaDestino]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al mover imagen']);
}
?>
