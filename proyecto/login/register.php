<?php
// register.php
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    // Ajusta a tus credenciales:
    $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4','root','', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Sanitizar entradas
    $mail = trim($_POST['mail_us'] ?? '');
    $pass = trim($_POST['contrasena_us'] ?? '');
    $nom  = trim($_POST['nom_us'] ?? '');
    $isInstitution = filter_var($_POST['is_institution'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if ($mail === '' || $pass === '' || $nom === '') {
        throw new Exception('Campos de usuario incompletos.');
    }

    // Comprobar duplicado
    $st = $pdo->prepare("SELECT 1 FROM Usuario WHERE mail_us = ?");
    $st->execute([$mail]);
    if ($st->fetchColumn()) {
        throw new Exception('El correo ya está registrado.');
    }

    $pdo->beginTransaction();

    // Crear Usuario (adoptante/donante por defecto 0, gracias al ALTER)
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $insUser = $pdo->prepare("
        INSERT INTO Usuario (mail_us, contrasena_us, ci_us, nom_us, apell_us, tel_us, direccion_us, adoptante, donante)
        VALUES (?, ?, NULL, ?, NULL, NULL, NULL, DEFAULT, DEFAULT)
    ");
    $insUser->execute([$mail, $hash, $nom]);

    if ($isInstitution) {
        // Datos de institución requeridos
        $nomb_inst = trim($_POST['nomb_inst'] ?? '');
        $tel_inst  = trim($_POST['tel_inst'] ?? '');
        $dia_inst  = trim($_POST['dia_inst'] ?? '');
        $dir_inst  = trim($_POST['direccion_inst'] ?? '');
        // Pueden venir como "HH:MM"
        $h_apertura = trim($_POST['hora_apertura'] ?? '');
        $h_cierre   = trim($_POST['hora_cierre'] ?? '');

        if ($nomb_inst === '' || $tel_inst === '' || $dia_inst === '' || $dir_inst === '' || $h_apertura === '' || $h_cierre === '') {
            throw new Exception('Completa todos los datos de la institución.');
        }

        // Insert a Institucion: NO mandamos id_inst -> lo genera el trigger como INSTn
        $insInst = $pdo->prepare("
            INSERT INTO Institucion (id_inst, nomb_inst, tel_inst, dia_inst, H_cierre, H_apertura, direccion_inst)
            VALUES (NULL, ?, ?, ?, ?, ?, ?)
        ");
        $insInst->execute([$nomb_inst, $tel_inst, $dia_inst, $h_cierre, $h_apertura, $dir_inst]);

        // Si quieres vincular al usuario con la institución en alguna tabla, aquí es el lugar.
        // OJO: Tu tabla Pertenece relaciona Empleado ↔ Institucion, no Usuario ↔ Institucion.
        // Si necesitas esa relación, define una tabla nueva (UsuarioInstitucion) o usa Empleado.
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Registro exitoso.']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
