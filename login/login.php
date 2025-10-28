<?php
// login.php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

try {
  $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);

  // Validar si ya hay una sesión activa
  if (isset($_SESSION['user_mail']) && isset($_SESSION['user_rol'])) {
    echo json_encode([
      'success' => false, 
      'message' => 'Ya tienes una sesión activa. Por favor, cierra sesión antes de iniciar otra.',
      'sesion_activa' => true,
      'rol_actual' => $_SESSION['user_rol'],
      'mail_actual' => $_SESSION['user_mail']
    ]);
    exit;
  }

  $mail = trim($_POST['mail_us'] ?? '');
  $pass = trim($_POST['contrasena_us'] ?? '');
  $tipo_login = trim($_POST['tipo_login'] ?? '');
  
  if ($mail === '' || $pass === '') throw new Exception('Faltan credenciales.');

  $row = null;

  // Buscar según el tipo de login seleccionado
  if ($tipo_login === 'usuario') {
    $st = $pdo->prepare("SELECT mail_us AS mail, contrasena_us AS pass_hash, nom_us AS nombre, 'usuario' AS rol FROM Usuario WHERE mail_us=?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
  } 
  elseif ($tipo_login === 'empleado') {
    $st = $pdo->prepare("SELECT mail_empl AS mail, contrasena_us AS pass_hash, nomb_empl AS nombre, 'empleado' AS rol FROM Empleado WHERE mail_empl=?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
  }
  elseif ($tipo_login === 'institucion') {
    $st = $pdo->prepare("SELECT email_inst AS mail, contrasena_inst AS pass_hash, nomb_inst AS nombre, 'institucion' AS rol FROM Institucion WHERE email_inst=?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
  }
  else {
    // Si no se especifica tipo, buscar en todas las tablas (compatibilidad)
    $st = $pdo->prepare("SELECT mail_us AS mail, contrasena_us AS pass_hash, nom_us AS nombre, 'usuario' AS rol FROM Usuario WHERE mail_us=?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
      $st = $pdo->prepare("SELECT mail_empl AS mail, contrasena_us AS pass_hash, nomb_empl AS nombre, 'empleado' AS rol FROM Empleado WHERE mail_empl=?");
      $st->execute([$mail]);
      $row = $st->fetch(PDO::FETCH_ASSOC);
    }

    if (!$row) {
      $st = $pdo->prepare("SELECT email_inst AS mail, contrasena_inst AS pass_hash, nomb_inst AS nombre, 'institucion' AS rol FROM Institucion WHERE email_inst=?");
      $st->execute([$mail]);
      $row = $st->fetch(PDO::FETCH_ASSOC);
    }
  }

  if (!$row) {
    if ($tipo_login) {
      throw new Exception("No se encontró una cuenta de tipo '$tipo_login' con ese email.");
    } else {
      throw new Exception('Cuenta no encontrada.');
    }
  }

  // permitir contraseñas antiguas no hasheadas (por compatibilidad)
  $ok = password_verify($pass, $row['pass_hash']) || hash_equals($row['pass_hash'], $pass);

  if ($ok) {
    session_regenerate_id(true);
    $_SESSION['user_mail']  = $row['mail'];
    $_SESSION['user_name']  = $row['nombre'];
    $_SESSION['user_rol']   = $row['rol'];
    echo json_encode(['success'=>true, 'rol'=>$row['rol']]);
  } else {
    throw new Exception('Contraseña incorrecta.');
  }

} catch(Throwable $e){
  http_response_code(401);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
