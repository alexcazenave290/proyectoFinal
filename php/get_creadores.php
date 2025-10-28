<?php
// get_creadores.php - Obtener lista de todos los creadores (empleados e instituciones)
header('Content-Type: application/json; charset=utf-8');

try {
  $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);

  $creadores = [];

  // Obtener empleados
  $stEmpleados = $pdo->prepare("
    SELECT DISTINCT 
      e.mail_empl AS email,
      e.nomb_empl AS nombre,
      e.apellido_empl AS apellido,
      'empleado' AS tipo
    FROM Empleado e
    ORDER BY e.nomb_empl
  ");
  $stEmpleados->execute();
  $empleados = $stEmpleados->fetchAll(PDO::FETCH_ASSOC);

  foreach ($empleados as $emp) {
    $nombreCompleto = trim($emp['nombre'] . ' ' . ($emp['apellido'] ?? ''));
    if ($nombreCompleto) {
      $creadores[] = [
        'email' => $emp['email'],
        'nombre' => $nombreCompleto,
        'tipo' => 'empleado'
      ];
    }
  }

  // Obtener instituciones
  $stInstituciones = $pdo->prepare("
    SELECT DISTINCT 
      email_inst AS email,
      nomb_inst AS nombre,
      'institucion' AS tipo
    FROM Institucion
    WHERE email_inst IS NOT NULL AND email_inst != ''
    ORDER BY nomb_inst
  ");
  $stInstituciones->execute();
  $instituciones = $stInstituciones->fetchAll(PDO::FETCH_ASSOC);

  foreach ($instituciones as $inst) {
    if ($inst['nombre']) {
      $creadores[] = [
        'email' => $inst['email'],
        'nombre' => $inst['nombre'],
        'tipo' => 'institucion'
      ];
    }
  }

  echo json_encode([
    'success' => true,
    'creadores' => $creadores
  ]);

} catch(Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => $e->getMessage()
  ]);
}

