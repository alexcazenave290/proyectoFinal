<?php
session_set_cookie_params(['path' => '/proyecto/']);
session_start();
header('Content-Type: application/json');

require_once 'conexion.php';
require_once 'crear_notificacion.php';

// Función para obtener información del usuario actual
function getUserInfo() {
    if (!isset($_SESSION['user_mail']) || !isset($_SESSION['user_rol'])) {
        return null;
    }
    
    return [
        'email' => $_SESSION['user_mail'],
        'tipo' => $_SESSION['user_rol']
    ];
}

// Función para obtener el nombre del usuario
function getUserName($pdo, $email, $tipo) {
    try {
        if ($tipo === 'usuario') {
            $stmt = $pdo->prepare("SELECT nom_us, apell_us, logo_us FROM Usuario WHERE mail_us = ?");
            $stmt->execute([$email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return [
                    'nombre' => trim(($row['nom_us'] ?? '') . ' ' . ($row['apell_us'] ?? '')),
                    'logo' => $row['logo_us']
                ];
            }
        } elseif ($tipo === 'empleado') {
            $stmt = $pdo->prepare("SELECT nomb_empl, apellido_empl, logo_empl FROM Empleado WHERE mail_empl = ?");
            $stmt->execute([$email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return [
                    'nombre' => trim(($row['nomb_empl'] ?? '') . ' ' . ($row['apellido_empl'] ?? '')),
                    'logo' => $row['logo_empl']
                ];
            }
        } elseif ($tipo === 'institucion') {
            $stmt = $pdo->prepare("SELECT nomb_inst, logo_inst FROM Institucion WHERE email_inst = ?");
            $stmt->execute([$email]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                return [
                    'nombre' => $row['nomb_inst'] ?? 'Institución',
                    'logo' => $row['logo_inst']
                ];
            }
        }
    } catch (Exception $e) {
        error_log("Error al obtener nombre de usuario: " . $e->getMessage());
    }
    
    return [
        'nombre' => 'Usuario',
        'logo' => null
    ];
}

// ===== OBTENER COMENTARIOS =====
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        if (!isset($_GET['id_masc'])) {
            echo json_encode(['success' => false, 'error' => 'ID de mascota no proporcionado']);
            exit;
        }
        
        $id_masc = intval($_GET['id_masc']);
        
        // Obtener comentarios de la mascota
        $query = "SELECT c.*, 
                  u.nom_us, u.apell_us, u.logo_us,
                  e.nomb_empl, e.apellido_empl, e.logo_empl,
                  i.nomb_inst, i.logo_inst
                  FROM Comentarios c
                  LEFT JOIN Usuario u ON c.mail_us = u.mail_us
                  LEFT JOIN Empleado e ON c.mail_empl = e.mail_empl
                  LEFT JOIN Institucion i ON c.email_inst = i.email_inst
                  WHERE c.id_masc = ?
                  ORDER BY c.fecha_comentario DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id_masc]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $comentarios = [];
        foreach ($results as $row) {
            // Determinar el autor del comentario
            $autor_nombre = '';
            $autor_logo = null;
            $autor_tipo = '';
            
            if ($row['mail_us']) {
                $autor_nombre = trim(($row['nom_us'] ?? '') . ' ' . ($row['apell_us'] ?? ''));
                $autor_logo = $row['logo_us'];
                $autor_tipo = 'usuario';
            } elseif ($row['mail_empl']) {
                $autor_nombre = trim(($row['nomb_empl'] ?? '') . ' ' . ($row['apellido_empl'] ?? ''));
                $autor_logo = $row['logo_empl'];
                $autor_tipo = 'empleado';
            } elseif ($row['email_inst']) {
                $autor_nombre = $row['nomb_inst'] ?? 'Institución';
                $autor_logo = $row['logo_inst'];
                $autor_tipo = 'institucion';
            }
            
            if (empty($autor_nombre)) {
                $autor_nombre = 'Usuario';
            }
            
            $comentarios[] = [
                'id_comentario' => $row['id_comentario'],
                'contenido' => $row['contenido'],
                'fecha_comentario' => $row['fecha_comentario'],
                'autor_nombre' => $autor_nombre,
                'autor_logo' => $autor_logo,
                'autor_tipo' => $autor_tipo
            ];
        }
        
        echo json_encode([
            'success' => true,
            'comentarios' => $comentarios
        ]);
        
    } catch (Exception $e) {
        error_log("Error al obtener comentarios: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => 'Error al obtener comentarios: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ===== CREAR COMENTARIO =====
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Verificar que el usuario esté logueado
        $userInfo = getUserInfo();
        if (!$userInfo) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Debes iniciar sesión para comentar']);
            exit;
        }
        
        // Obtener datos del POST
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id_masc']) || !isset($input['contenido'])) {
            echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
            exit;
        }
        
        $id_masc = intval($input['id_masc']);
        $contenido = trim($input['contenido']);
        
        if (empty($contenido)) {
            echo json_encode(['success' => false, 'error' => 'El comentario no puede estar vacío']);
            exit;
        }
        
        // Verificar que la mascota existe
        $stmt = $pdo->prepare("SELECT id_masc FROM Mascota WHERE id_masc = ?");
        $stmt->execute([$id_masc]);
        if (!$stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Mascota no encontrada']);
            exit;
        }
        
        // Determinar el campo correcto según el tipo de usuario
        $email = $userInfo['email'];
        $tipo = $userInfo['tipo'];
        
        $campo_mail = '';
        switch($tipo) {
            case 'usuario':
                $campo_mail = 'mail_us';
                break;
            case 'empleado':
                $campo_mail = 'mail_empl';
                break;
            case 'institucion':
                $campo_mail = 'email_inst';
                break;
            default:
                echo json_encode(['success' => false, 'error' => 'Tipo de usuario no válido']);
                exit;
        }
        
        // Insertar comentario
        $query = "INSERT INTO Comentarios (id_masc, $campo_mail, contenido) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id_masc, $email, $contenido]);
        
        $id_comentario = $pdo->lastInsertId();
        
        // Obtener información del autor
        $autorInfo = getUserName($pdo, $email, $tipo);
        
        // Crear notificación para el creador de la mascota
        try {
            $stmtMascota = $pdo->prepare("
                SELECT 
                    m.nom_masc,
                    COALESCE(m.mail_empl, m.email_inst) as email_creador,
                    CASE 
                        WHEN m.mail_empl IS NOT NULL THEN 'empleado'
                        WHEN m.email_inst IS NOT NULL THEN 'institucion'
                    END as tipo_creador
                FROM Mascota m
                WHERE m.id_masc = ?
            ");
            $stmtMascota->execute([$id_masc]);
            $mascota = $stmtMascota->fetch(PDO::FETCH_ASSOC);
            
            // Solo crear notificación si el que comenta NO es el creador de la mascota
            if ($mascota && $mascota['email_creador'] && $mascota['email_creador'] !== $email) {
                $nombreAutor = $autorInfo['nombre'];
                $nombreMascota = $mascota['nom_masc'] ?? 'una mascota';
                $tituloNotif = "Nuevo comentario en $nombreMascota";
                $contenidoNotif = "$nombreAutor comentó: " . substr($contenido, 0, 80) . (strlen($contenido) > 80 ? '...' : '');
                crearNotificacion($pdo, $mascota['email_creador'], 'comentario', $tituloNotif, $contenidoNotif, $id_masc);
            }
        } catch (Exception $e) {
            error_log("Error al crear notificación de comentario: " . $e->getMessage());
            // No fallar la operación si falla la notificación
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Comentario agregado exitosamente',
            'comentario' => [
                'id_comentario' => $id_comentario,
                'contenido' => $contenido,
                'fecha_comentario' => date('Y-m-d H:i:s'),
                'autor_nombre' => $autorInfo['nombre'],
                'autor_logo' => $autorInfo['logo'],
                'autor_tipo' => $tipo
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error al crear comentario: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al crear comentario: ' . $e->getMessage()
        ]);
    }
    exit;
}

// ===== ELIMINAR COMENTARIO =====
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Verificar que el usuario esté logueado
        $userInfo = getUserInfo();
        if (!$userInfo) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Debes iniciar sesión']);
            exit;
        }
        
        parse_str(file_get_contents("php://input"), $input);
        
        if (!isset($input['id_comentario'])) {
            echo json_encode(['success' => false, 'error' => 'ID de comentario no proporcionado']);
            exit;
        }
        
        $id_comentario = intval($input['id_comentario']);
        $email = $userInfo['email'];
        $tipo = $userInfo['tipo'];
        
        // Determinar el campo correcto según el tipo de usuario
        $campo_mail = '';
        switch($tipo) {
            case 'usuario':
                $campo_mail = 'mail_us';
                break;
            case 'empleado':
                $campo_mail = 'mail_empl';
                break;
            case 'institucion':
                $campo_mail = 'email_inst';
                break;
            default:
                echo json_encode(['success' => false, 'error' => 'Tipo de usuario no válido']);
                exit;
        }
        
        // Verificar que el comentario pertenece al usuario y eliminarlo
        $query = "DELETE FROM Comentarios WHERE id_comentario = ? AND $campo_mail = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id_comentario, $email]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Comentario eliminado exitosamente'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'No se pudo eliminar el comentario (puede que no exista o no tengas permisos)'
            ]);
        }
        
    } catch (Exception $e) {
        error_log("Error al eliminar comentario: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error al eliminar comentario: ' . $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
?>
