<?php
header('Content-Type: application/json; charset=utf-8');

try{
  $pdo = new PDO('mysql:host=localhost;dbname=Conexion;charset=utf8mb4','root','', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);
  $q = $pdo->query("SELECT id_inst, nomb_inst, email_inst FROM Institucion ORDER BY email_inst");
  $rows = $q->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['success'=>true,'instituciones'=>$rows]);
}catch(Throwable $e){
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
