<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
echo json_encode([
  'logged' => isset($_SESSION['user_mail']),
  'user'   => $_SESSION['user_name'] ?? null,
  'rol'    => $_SESSION['user_rol'] ?? null,
  'email'  => $_SESSION['user_mail'] ?? null
], JSON_UNESCAPED_UNICODE);
?>