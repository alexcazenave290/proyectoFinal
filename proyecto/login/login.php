<?php
// login.php
header('Content-Type: application/json; charset=utf-8');
session_start();

try {
    $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $mail = trim($_POST['mail_us'] ?? '');
    $pass = trim($_POST['contrasena_us'] ?? '');

    if ($mail === '' || $pass === '') {
        throw new Exception('Faltan credenciales.');
    }

    $st = $pdo->prepare("SELECT mail_us, contrasena_us, nom_us FROM Usuario WHERE mail_us = ?");
    $st->execute([$mail]);
    $row = $st->fetch(PDO::FETCH_ASSOC);

    if ($row && password_verify($pass, $row['contrasena_us'])) {
        session_regenerate_id(true);
        $_SESSION['user_mail'] = $row['mail_us'];
        $_SESSION['user_name'] = $row['nom_us'];
        echo json_encode(['success' => true]);
        exit;
    }
    // Login OK -> guarda sesión básica
    $_SESSION['user_mail'] = $row['mail_us'];
    $_SESSION['user_name'] = $row['nom_us'];

    echo json_encode(['success' => true, 'message' => 'Login correcto']);
} catch (Throwable $e) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
