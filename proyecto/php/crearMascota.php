<?php
// /php/crearMascota.php
declare(strict_types=1);

header('Content-Type: application/json');

session_set_cookie_params(['path' => '/proyecto/']);
session_start();

// Validar que el usuario esté autenticado
$userMail = $_SESSION['user_mail'] ?? null;
$userRol = $_SESSION['user_rol'] ?? null;

if (!$userMail) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Usuario no autenticado']);
  exit;
}

// IMPORTANTE: Solo empleados o instituciones pueden crear mascotas
if ($userRol !== 'empleado' && $userRol !== 'institucion') {
  http_response_code(403);
  echo json_encode(['success' => false, 'error' => 'Solo los empleados o instituciones pueden crear mascotas']);
  exit;
}

require_once __DIR__ . '/conexion.php';

// Variables para almacenar los datos del creador
$id_inst = null;
$mail_empl = null;
$email_inst = null;

// Verificar según el rol
try {
  if ($userRol === 'empleado') {
    // Verificar empleado y obtener su institución
    $checkEmpleado = $pdo->prepare("SELECT mail_empl, id_inst FROM Empleado WHERE mail_empl = ?");
    $checkEmpleado->execute([$userMail]);
    $empleado = $checkEmpleado->fetch(PDO::FETCH_ASSOC);
    
    if (!$empleado) {
      http_response_code(404);
      echo json_encode(['success' => false, 'error' => 'Empleado no encontrado en la base de datos']);
      exit;
    }
    
    $id_inst = $empleado['id_inst'];
    $mail_empl = $userMail;
    
  } elseif ($userRol === 'institucion') {
    // Verificar institución
    $checkInstitucion = $pdo->prepare("SELECT id_inst, email_inst FROM Institucion WHERE email_inst = ?");
    $checkInstitucion->execute([$userMail]);
    $institucion = $checkInstitucion->fetch(PDO::FETCH_ASSOC);
    
    if (!$institucion) {
      http_response_code(404);
      echo json_encode(['success' => false, 'error' => 'Institución no encontrada en la base de datos']);
      exit;
    }
    
    $id_inst = $institucion['id_inst'];
    $email_inst = $userMail;
  }
  
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Error al verificar usuario: ' . $e->getMessage()]);
  exit;
}

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

  // Iniciar transacción para asegurar que ambas operaciones se completen
  $pdo->beginTransaction();

  try {
    // 1. Insertar la mascota con el mail del empleado o institución
    $sqlMascota = "INSERT INTO Mascota (nom_masc, especie_masc, raza_masc, tamano_masc, edad_masc, salud_masc, desc_masc, foto_masc, estadoAdopt_masc, id_inst, mail_empl, email_inst)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)";
    $stmtMascota = $pdo->prepare($sqlMascota);
    $stmtMascota->execute([
      $nom_masc, $especie_masc, $raza_masc, $tamano_masc, $edad_masc, $salud_masc, $desc_masc, $rutaRel, $id_inst, $mail_empl, $email_inst
    ]);
    
    $id_mascota = $pdo->lastInsertId();

    // 2. Crear publicación asociada a la mascota (con id_masc)
    $descripcion_corta = substr($desc_masc, 0, 20); // Limitar a 20 caracteres según la BD
    $sqlPublicacion = "INSERT INTO Publicacion (id_inst, id_masc, fecha_publ, hora_publ, estado_publ, cat_publ, descripcion_publ)
                       VALUES (?, ?, CURDATE(), CURTIME(), 1, ?, ?)";
    $stmtPublicacion = $pdo->prepare($sqlPublicacion);
    $stmtPublicacion->execute([
      $id_inst,
      $id_mascota,
      'Adopción',
      $descripcion_corta
    ]);

    $id_publicacion = $pdo->lastInsertId();

    // Confirmar transacción
    $pdo->commit();

    echo json_encode([
      'success' => true,
      'message' => 'Mascota y publicación creadas exitosamente',
      'id_mascota' => $id_mascota,
      'id_publicacion' => $id_publicacion,
      'foto_masc' => $rutaRel
    ]);

  } catch (Exception $e) {
    // Si algo falla, revertir todo
    $pdo->rollBack();
    throw $e; // Lanzar la excepción para que la capture el catch externo
  }

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success'=>false,'error'=>'Error del servidor: '.$e->getMessage()]);
}

?>
