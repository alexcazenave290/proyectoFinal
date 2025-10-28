<?php
// register.php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

try {
  $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);

  $tipo = trim($_POST['tipo_registro'] ?? '');

  // Para institución no se requieren credenciales, solo los datos de la institución
  if ($tipo !== 'institucion') {
    $mail = trim($_POST['mail_us'] ?? '');
    $pass = trim($_POST['contrasena_us'] ?? '');
    $user = trim($_POST['nom_us'] ?? '');

    if ($mail === '' || $pass === '' || $user === '') {
      throw new Exception('Campos básicos incompletos.');
    }
  }

  // asegurar columna cedula_empl si no existe (por si aún no la agregaste)
  $q = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='Empleado' AND COLUMN_NAME='cedula_empl'");
  $q->execute();
  if (!$q->fetchColumn()) {
    $pdo->exec("ALTER TABLE Empleado ADD COLUMN cedula_empl VARCHAR(20) NULL AFTER apellido_empl");
  }

  // ===== FUNCIÓN PARA VALIDAR EMAIL EN TODAS LAS TABLAS =====
  function validarEmailUnico($pdo, $email, $tipoActual) {
    // Verificar en tabla Usuario
    $st = $pdo->prepare("SELECT 1 FROM Usuario WHERE mail_us=?");
    $st->execute([$email]);
    if ($st->fetchColumn()) {
      if ($tipoActual === 'usuario') {
        throw new Exception('Este email ya está registrado como usuario.');
      } else {
        throw new Exception('Este email ya está en uso por un usuario. Por favor, usa otro correo electrónico.');
      }
    }
    
    // Verificar en tabla Empleado
    $st = $pdo->prepare("SELECT 1 FROM Empleado WHERE mail_empl=?");
    $st->execute([$email]);
    if ($st->fetchColumn()) {
      if ($tipoActual === 'empleado') {
        throw new Exception('Este email ya está registrado como empleado.');
      } else {
        throw new Exception('Este email ya está en uso por un empleado. Por favor, usa otro correo electrónico.');
      }
    }
    
    // Verificar en tabla Institucion
    $st = $pdo->prepare("SELECT 1 FROM Institucion WHERE email_inst=?");
    $st->execute([$email]);
    if ($st->fetchColumn()) {
      if ($tipoActual === 'institucion') {
        throw new Exception('Este email ya está registrado como institución.');
      } else {
        throw new Exception('Este email ya está en uso por una institución. Por favor, usa otro correo electrónico.');
      }
    }
  }

  $pdo->beginTransaction();

  if ($tipo === 'usuario') {
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    // Validar que el email no exista en ninguna tabla
    validarEmailUnico($pdo, $mail, 'usuario');

    $ins = $pdo->prepare("INSERT INTO Usuario (mail_us, contrasena_us, ci_us, nom_us, apell_us, tel_us, direccion_us, adoptante, donante)
                          VALUES (?, ?, NULL, ?, NULL, NULL, NULL, DEFAULT, DEFAULT)");
    $ins->execute([$mail, $hash, $user]);
  }

  elseif ($tipo === 'empleado') {
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    // Validar que el email no exista en ninguna tabla
    validarEmailUnico($pdo, $mail, 'empleado');

    $nomb_empl      = trim($_POST['nomb_empl'] ?? '');
    $apellido_empl  = trim($_POST['apellido_empl'] ?? '');
    $cedula_empl    = trim($_POST['cedula_empl'] ?? '');
    $tel_empl       = trim($_POST['tel_empl'] ?? '');
    $direccion_empl = trim($_POST['direccion_empl'] ?? '');
    $tipo_empl      = trim($_POST['tipo_empl'] ?? '');
    $id_inst        = trim($_POST['id_inst'] ?? '');

    if ($nomb_empl==='' || $apellido_empl==='' || $cedula_empl==='' || $tel_empl==='' || $direccion_empl==='' || $tipo_empl==='' || $id_inst==='') {
      throw new Exception('Completa todos los campos del empleado.');
    }

    // validación de institución
    $chk = $pdo->prepare("SELECT 1 FROM Institucion WHERE id_inst=?");
    $chk->execute([$id_inst]);
    if (!$chk->fetchColumn()) throw new Exception('La institución seleccionada no existe.');

    $ins = $pdo->prepare("INSERT INTO Empleado (mail_empl, contrasena_us, nomb_empl, apellido_empl, cedula_empl, tel_empl, direccion_empl, tipo_empl, id_inst)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $ins->execute([$mail, $hash, $nomb_empl, $apellido_empl, $cedula_empl, $tel_empl, $direccion_empl, $tipo_empl, $id_inst]);
  }

  elseif ($tipo === 'institucion') {
    // Asegurar que existe la columna email_inst ANTES de usarla
    $q = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='Institucion' AND COLUMN_NAME='email_inst'");
    $q->execute();
    if (!$q->fetchColumn()) {
      $pdo->exec("ALTER TABLE Institucion ADD COLUMN email_inst VARCHAR(100) NULL AFTER nomb_inst");
    }

    // Asegurar que existe la columna contrasena_inst ANTES de usarla
    $q = $pdo->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='Institucion' AND COLUMN_NAME='contrasena_inst'");
    $q->execute();
    if (!$q->fetchColumn()) {
      $pdo->exec("ALTER TABLE Institucion ADD COLUMN contrasena_inst VARCHAR(255) NULL");
    }

    // Datos de institución
    $nomb_inst = trim($_POST['nomb_inst'] ?? '');
    $email_inst = trim($_POST['email_inst'] ?? '');
    $pass_inst = trim($_POST['contrasena_inst'] ?? '');
    $tel_inst  = trim($_POST['tel_inst'] ?? '');
    $dia_inst  = trim($_POST['dia_inst'] ?? '');
    $h_ap      = trim($_POST['hora_apertura'] ?? '');
    $h_ci      = trim($_POST['hora_cierre'] ?? '');
    $dir_inst  = trim($_POST['direccion_inst'] ?? '');

    if ($nomb_inst==='' || $email_inst==='' || $pass_inst==='' || $tel_inst==='' || $dia_inst==='' || $h_ap==='' || $h_ci==='' || $dir_inst==='') {
      throw new Exception('Completa todos los datos de la institución.');
    }

    // Verificar que no exista una institución con el mismo nombre
    $chk = $pdo->prepare("SELECT 1 FROM Institucion WHERE nomb_inst=?");
    $chk->execute([$nomb_inst]);
    if ($chk->fetchColumn()) throw new Exception('Ya existe una institución con ese nombre.');

    // Validar que el email no exista en ninguna tabla
    validarEmailUnico($pdo, $email_inst, 'institucion');

    // Hashear la contraseña
    $hash_inst = password_hash($pass_inst, PASSWORD_DEFAULT);

    // Insert institución (trigger genera id_inst = INSTn)
    $insI = $pdo->prepare("INSERT INTO Institucion (id_inst, nomb_inst, email_inst, tel_inst, dia_inst, H_cierre, H_apertura, direccion_inst, contrasena_inst)
                           VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)");
    $insI->execute([$nomb_inst, $email_inst, $tel_inst, $dia_inst, $h_ci, $h_ap, $dir_inst, $hash_inst]);
    
    // La institución se creó exitosamente
    // Los empleados (incluyendo administradores) se registrarán por separado
  }

  else {
    throw new Exception('Tipo de registro no válido.');
  }

  $pdo->commit();
  echo json_encode(['success'=>true]);
} catch(Throwable $e){
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
