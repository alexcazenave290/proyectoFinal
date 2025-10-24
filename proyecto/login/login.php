<?php
// login.php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $mail = trim($_POST['mail_us'] ?? '');
    $pass = trim($_POST['contrasena_us'] ?? '');

    if ($mail === '' || $pass === '') {
        throw new Exception('Faltan credenciales.');
    }

    // Intentar buscar en tabla Usuario
    $st = $pdo->prepare("SELECT mail_us, contrasena_us, nom_us FROM Usuario WHERE mail_us = ?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if ($row && password_verify($pass, $row['contrasena_us'])) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $row['mail_us'];
        $_SESSION['user_mail'] = $row['mail_us'];
        $_SESSION['user_name'] = $row['nom_us'];
        $_SESSION['user_type'] = 'usuario';
        echo json_encode(['success' => true, 'message' => 'Login correcto']);
        exit;
    }

    // Si no se encuentra en Usuario, buscar en Empleado
    $stEmpl = $pdo->prepare("SELECT mail_empl, contrasena_us, nomb_user, id_inst FROM Empleado WHERE mail_empl = ?");
    $stEmpl->execute([$mail]);
    $rowEmpl = $stEmpl->fetch(PDO::FETCH_ASSOC);

    if ($rowEmpl && password_verify($pass, $rowEmpl['contrasena_us'])) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $rowEmpl['mail_empl'];
        $_SESSION['user_mail'] = $rowEmpl['mail_empl'];
        $_SESSION['user_name'] = $rowEmpl['nomb_user'];
        $_SESSION['user_type'] = 'empleado';
        $_SESSION['id_inst'] = $rowEmpl['id_inst'];
        echo json_encode(['success' => true, 'message' => 'Login correcto']);
        exit;
    }

    // Si no se encuentra en ninguna tabla
    throw new Exception('Usuario o contraseña incorrectos');

} catch (Throwable $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
