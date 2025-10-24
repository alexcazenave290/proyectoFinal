<?php
// register.php
header('Content-Type: application/json; charset=utf-8');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();

try {
    // Ajusta a tus credenciales:
    $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4','root','', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Sanitizar entradas comunes
    $mail = trim($_POST['mail_us'] ?? '');
    $pass = trim($_POST['contrasena_us'] ?? '');
    $nom  = trim($_POST['nom_us'] ?? '');
    $isInstitution = filter_var($_POST['is_institution'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if ($mail === '' || $pass === '' || $nom === '') {
        throw new Exception('Campos básicos incompletos.');
    }

    $pdo->beginTransaction();
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    if ($isInstitution) {
        // ========== REGISTRO COMO EMPLEADO + INSTITUCIÓN ==========
        
        // Comprobar duplicado en Empleado
        $st = $pdo->prepare("SELECT 1 FROM Empleado WHERE mail_empl = ?");
        $st->execute([$mail]);
        if ($st->fetchColumn()) {
            throw new Exception('El correo de empleado ya está registrado.');
        }

        // Datos de institución
        $nomb_inst = trim($_POST['nomb_inst'] ?? '');
        $tel_inst  = trim($_POST['tel_inst'] ?? '');
        $dia_inst  = trim($_POST['dia_inst'] ?? '');
        $dir_inst  = trim($_POST['direccion_inst'] ?? '');
        $h_apertura = trim($_POST['hora_apertura'] ?? '');
        $h_cierre   = trim($_POST['hora_cierre'] ?? '');

        if ($nomb_inst === '' || $tel_inst === '' || $dia_inst === '' || $dir_inst === '' || $h_apertura === '' || $h_cierre === '') {
            throw new Exception('Completa todos los datos de la institución.');
        }

        // Primero insertar Institución (trigger genera id_inst como INSTn)
        $insInst = $pdo->prepare("
            INSERT INTO Institucion (id_inst, nomb_inst, tel_inst, dia_inst, H_cierre, H_apertura, direccion_inst)
            VALUES (NULL, ?, ?, ?, ?, ?, ?)
        ");
        $insInst->execute([$nomb_inst, $tel_inst, $dia_inst, $h_cierre, $h_apertura, $dir_inst]);

        // Obtener el id_inst generado por el trigger (formato: INSTn)
        $stGet = $pdo->prepare("SELECT id_inst FROM Institucion WHERE nomb_inst = ? ORDER BY id_inst DESC LIMIT 1");
        $stGet->execute([$nomb_inst]);
        $id_inst_real = $stGet->fetchColumn();

        if (!$id_inst_real) {
            throw new Exception('Error al crear la institución.');
        }

        // Insertar en Empleado (sin datos adicionales de empleado, solo los básicos)
        $insEmpl = $pdo->prepare("
            INSERT INTO Empleado (mail_empl, nomb_user, contrasena_us, nomb_empl, apellido_empl, tel_empl, direccion_empl, tipo_empl, id_inst)
            VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?)
        ");
        $insEmpl->execute([$mail, $nom, $hash, $id_inst_real]);

    } else {
        // ========== REGISTRO COMO USUARIO NORMAL ==========
        
        // Comprobar duplicado en Usuario
        $st = $pdo->prepare("SELECT 1 FROM Usuario WHERE mail_us = ?");
        $st->execute([$mail]);
        if ($st->fetchColumn()) {
            throw new Exception('El correo ya está registrado.');
        }

        // Crear Usuario (adoptante/donante por defecto 0)
        $insUser = $pdo->prepare("
            INSERT INTO Usuario (mail_us, contrasena_us, ci_us, nom_us, apell_us, tel_us, direccion_us, adoptante, donante)
            VALUES (?, ?, NULL, ?, NULL, NULL, NULL, DEFAULT, DEFAULT)
        ");
        $insUser->execute([$mail, $hash, $nom]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Registro exitoso.']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
