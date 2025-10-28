<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
    echo json_encode(['success' => false, 'error' => 'Sesión no iniciada.']);
    exit;
}

if (!isset($_FILES['logo'])) {
    echo json_encode(['success' => false, 'error' => 'No se recibió imagen']);
    exit;
}

$archivo = $_FILES['logo'];
$nombre = basename($archivo["name"]);
$extension = strtolower(pathinfo($nombre, PATHINFO_EXTENSION));
$permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Validar extensión
if (!in_array($extension, $permitidas)) {
    echo json_encode(['success' => false, 'error' => 'Formato de imagen no permitido']);
    exit;
}

// Validar tamaño (máximo 5MB)
if ($archivo['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'La imagen es demasiado grande (máximo 5MB)']);
    exit;
}

// Directorio de destino
$directorio = "../img/";

// Crear directorio si no existe
if (!file_exists($directorio)) {
    mkdir($directorio, 0777, true);
}

// Nombre único basado en el tipo de usuario y su email
$rol = $_SESSION['user_rol'];
$mail = $_SESSION['user_mail'];
$prefijo = ($rol === 'usuario' ? 'user_' : ($rol === 'empleado' ? 'empl_' : 'inst_'));
$nombreFinal = $prefijo . uniqid() . "." . $extension;
$rutaDestino = $directorio . $nombreFinal;

if (move_uploaded_file($archivo["tmp_name"], $rutaDestino)) {
    // Ruta absoluta para la base de datos
    $rutaAbsoluta = "/proyecto/img/" . $nombreFinal;
    
    echo json_encode([
        'success' => true, 
        'ruta' => $rutaAbsoluta,
        'nombre_archivo' => $nombreFinal
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Error al mover imagen']);
}
?>

