<?php
// /php/crearMascota.php
declare(strict_types=1);

header('Content-Type: application/json');

session_set_cookie_params(['path' => '/proyecto/']);
session_start();
// Acepta distintos nombres de clave en la sesión
$userMail = $_SESSION['user_mail'] ?? $_SESSION['user_id'] ?? null;
if (!$userMail) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Usuario no autenticado']);
  exit;
}

require_once __DIR__ . '/conexion.php';

try {
  // Validación básica
  $need = ['nom_masc','especie_masc','raza_masc','tamano_masc','edad_masc','salud_masc','desc_masc'];
  foreach ($need as $k) {
    if (empty($_POST[$k])) {
      echo json_encode(['success'=>false,'error'=>'Todos los campos son obligatorios']);
      exit;
    }
  }

  $nom_masc     = trim($_POST['nom_masc']);
  $especie_masc = trim($_POST['especie_masc']);
  $raza_masc    = trim($_POST['raza_masc']);
  $tamano_masc  = trim($_POST['tamano_masc']);
  $edad_masc    = trim($_POST['edad_masc']);
  $salud_masc   = trim($_POST['salud_masc']) === 'Mas o Menos' ? 'Más o Menos' : trim($_POST['salud_masc']);
  $desc_masc    = trim($_POST['desc_masc']);

  // Imagen (ruta a guardar en BD y ruta FS donde se sube)
  $rutaRel = '/proyecto/img/default.svg';
  if (isset($_FILES['foto_masc']) && $_FILES['foto_masc']['error'] === UPLOAD_ERR_OK) {
    $archivo = $_FILES['foto_masc'];
    $ext = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg','jpeg','png','gif'], true)) {
      echo json_encode(['success'=>false,'error'=>'Formato no permitido (usa JPG/PNG/GIF)']);
      exit;
    }
    if ($archivo['size'] > 5 * 1024 * 1024) {
      echo json_encode(['success'=>false,'error'=>'La imagen supera 5MB']);
      exit;
    }

    // Carpeta /proyecto/img/ (desde /proyecto/php/)
    $dirFs = __DIR__ . '/../img/';
    if (!is_dir($dirFs)) { mkdir($dirFs, 0755, true); }

    $nombreFinal = 'masc_' . uniqid() . '.' . $ext;
    $rutaFs = $dirFs . $nombreFinal;   // para mover el archivo en el servidor
    $rutaRel = '/proyecto/img/' . $nombreFinal;  // ruta absoluta para la BD y la web

    if (!move_uploaded_file($archivo['tmp_name'], $rutaFs)) {
      echo json_encode(['success'=>false,'error'=>'Error al subir la imagen']);
      exit;
    }
  }

  // Obtener id_inst
  $id_inst = null;
  
  if (isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'empleado') {
    // Si es empleado (institución), usa su id_inst de la sesión
    $id_inst = $_SESSION['id_inst'] ?? null;
  } else {
    // Si es usuario normal, usa la institución por defecto 'INST1' (Refugio Casa Patitas)
    // En un futuro, podrías permitir que el usuario elija la institución
    $id_inst = 'INST1';
  }
  
  if (!$id_inst) {
    echo json_encode(['success'=>false,'error'=>'No se pudo obtener la institución. Intenta cerrar sesión e iniciar sesión nuevamente.']);
    exit;
  }

  // Insert - incluye mail_us ya que es campo obligatorio en la tabla Mascota
  $sql = "INSERT INTO Mascota (nom_masc, especie_masc, raza_masc, tamano_masc, edad_masc, salud_masc, desc_masc, foto_masc, estadoAdopt_masc, id_inst, mail_us)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)";
  $ok = $pdo->prepare($sql)->execute([
    $nom_masc, $especie_masc, $raza_masc, $tamano_masc, $edad_masc, $salud_masc, $desc_masc, $rutaRel, $id_inst, $userMail
  ]);

  if ($ok) {
    echo json_encode(['success'=>true,'message'=>'Mascota creada exitosamente','id_mascota'=>$pdo->lastInsertId(),'foto_masc'=>$rutaRel]);
  } else {
    echo json_encode(['success'=>false,'error'=>'No se pudo crear la mascota']);
  }

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Error del servidor: '.$e->getMessage()]);
}

?>