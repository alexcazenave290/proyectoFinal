DROP DATABASE IF EXISTS Conexion;
CREATE DATABASE Conexion;
USE Conexion;


CREATE TABLE Institucion(
  id_inst VARCHAR(50) NOT NULL PRIMARY KEY,
  nomb_inst VARCHAR(50) NOT NULL,
  email_inst VARCHAR(100) UNIQUE NOT NULL,
  tel_inst VARCHAR(50) NOT NULL,
  dia_inst VARCHAR(50) NOT NULL,
  H_cierre TIME NOT NULL,
  H_apertura TIME NOT NULL, 
  direccion_inst VARCHAR(50) NOT NULL,
  contrasena_inst VARCHAR(255) NOT NULL
);

CREATE TABLE Empleado(
  mail_empl VARCHAR(50) NOT NULL PRIMARY KEY,
  contrasena_us VARCHAR(255) NOT NULL, 
  nomb_empl VARCHAR(50) NOT NULL,
  apellido_empl VARCHAR(50),
  tel_empl VARCHAR(50),
  direccion_empl VARCHAR(50), 
  tipo_empl VARCHAR(50),
  id_inst VARCHAR(50) NOT NULL,
  CONSTRAINT FK_empleado_inst FOREIGN KEY (id_inst) REFERENCES Institucion(id_inst)
);

CREATE TABLE InstitucionSeq (
  seq INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (seq)
) ENGINE=InnoDB;

DELIMITER //
CREATE TRIGGER bi_institucion BEFORE INSERT ON Institucion
FOR EACH ROW
BEGIN
  IF NEW.id_inst IS NULL OR NEW.id_inst = '' THEN
    INSERT INTO InstitucionSeq VALUES (NULL);
    SET NEW.id_inst = CONCAT('INST', LAST_INSERT_ID());
  END IF;
END//
DELIMITER ;

CREATE TABLE Pertenece(
  mail_empl VARCHAR(50) NOT NULL,
  id_inst VARCHAR(50) NOT NULL,
  PRIMARY KEY (mail_empl, id_inst) 
);

CREATE TABLE Veterinaria ( 
  id_inst VARCHAR(50) NOT NULL PRIMARY KEY,
  especialidad_vet VARCHAR(50), 
  descripcion_vet VARCHAR(50),
  CONSTRAINT FK_vet_inst FOREIGN KEY (id_inst) REFERENCES Institucion(id_inst)
);

CREATE TABLE Refugio (
  id_inst VARCHAR(50) NOT NULL PRIMARY KEY,
  tipo_Ref VARCHAR(50),
  CONSTRAINT FK_refugio_inst FOREIGN KEY (id_inst) REFERENCES Institucion(id_inst)
);

CREATE TABLE Usuario (
  mail_us VARCHAR(50) NOT NULL PRIMARY KEY,
  contrasena_us VARCHAR(255) NOT NULL, 
  ci_us VARCHAR(20), 
  nom_us VARCHAR(20), 
  apell_us VARCHAR(20),
  tel_us VARCHAR(30),
  direccion_us VARCHAR(50),
  adoptante BOOLEAN NOT NULL DEFAULT 0,
  donante   BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE Donacion (
  id_Don INT NOT NULL PRIMARY KEY,
  id_inst VARCHAR(50) NOT NULL,
  mail_us VARCHAR(50) NOT NULL, 
  monto_don INT NOT NULL, 
  destino_don VARCHAR(50) NOT NULL,
  fecha_don DATE NOT NULL,
  medioPago_don VARCHAR(20) NOT NULL
);

CREATE TABLE Consulta (
  id_con VARCHAR(20) NOT NULL PRIMARY KEY,
  mail_us VARCHAR(50) NOT NULL,
  hora_con TIME,
  fecha_con DATE,
  etiqueta_con VARCHAR(20),
  descripcion_con VARCHAR(20)
);

CREATE TABLE Publicacion(
  id_publ INT PRIMARY KEY AUTO_INCREMENT,
  id_inst VARCHAR(50) NOT NULL,
  fecha_publ DATE, 
  hora_publ TIME,
  estado_publ BOOLEAN,
  cat_publ VARCHAR(20),
  descripcion_publ VARCHAR(20)
);

CREATE TABLE Interacion(
  codigo_inte INT PRIMARY KEY AUTO_INCREMENT,
  id_publ INT,
  id_con VARCHAR(20),
  mail_us VARCHAR(50) NOT NULL,
  forma_int VARCHAR(20),
  hora_int TIME,
  fecha_int DATE
);
 
CREATE TABLE Mascota(
  id_masc INT AUTO_INCREMENT PRIMARY KEY,
  id_inst VARCHAR(50) NOT NULL,
  mail_empl VARCHAR(50) NULL,
  email_inst VARCHAR(100) NULL,
  tamano_masc VARCHAR(20),
  edad_masc VARCHAR(20),
  foto_masc VARCHAR(200),
  desc_masc VARCHAR(200),
  nom_masc VARCHAR(20),
  especie_masc VARCHAR(20),
  raza_masc VARCHAR(20),
  salud_masc VARCHAR(30),
  estadoAdopt_masc BOOLEAN,
  CONSTRAINT CHK_creador CHECK (
    (mail_empl IS NOT NULL AND email_inst IS NULL) OR 
    (mail_empl IS NULL AND email_inst IS NOT NULL)
  )
);

CREATE TABLE Guardado (
  id_guardado INT AUTO_INCREMENT PRIMARY KEY,
  id_masc INT NOT NULL,
  
  -- Campos para los 3 tipos de usuarios (solo uno debe estar lleno)
  mail_us VARCHAR(50) NULL,
  mail_empl VARCHAR(50) NULL,
  email_inst VARCHAR(100) NULL,
  
  fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT FK_guardado_masc FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc) ON DELETE CASCADE,
  CONSTRAINT FK_guardado_usuario FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us) ON DELETE CASCADE,
  CONSTRAINT FK_guardado_empleado FOREIGN KEY (mail_empl) REFERENCES Empleado(mail_empl) ON DELETE CASCADE,
  CONSTRAINT FK_guardado_institucion FOREIGN KEY (email_inst) REFERENCES Institucion(email_inst) ON DELETE CASCADE,
  
  -- Constraint para asegurar que solo uno de los 3 campos esté lleno
  CONSTRAINT CHK_guardado_user_type CHECK (
    (mail_us IS NOT NULL AND mail_empl IS NULL AND email_inst IS NULL) OR 
    (mail_us IS NULL AND mail_empl IS NOT NULL AND email_inst IS NULL) OR 
    (mail_us IS NULL AND mail_empl IS NULL AND email_inst IS NOT NULL)
  ),
  
  -- Índice único combinado para evitar guardados duplicados
  UNIQUE KEY unique_guardado_usuario (id_masc, mail_us),
  UNIQUE KEY unique_guardado_empleado (id_masc, mail_empl),
  UNIQUE KEY unique_guardado_institucion (id_masc, email_inst)
);
 
CREATE TABLE Adopcion (
  id_adop INT PRIMARY KEY AUTO_INCREMENT,
  id_masc INT NOT NULL,
  mail_us VARCHAR(50) NOT NULL,
  fecha_adop DATE NOT NULL,
  CONSTRAINT FK_adop_masc FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc),
  CONSTRAINT FK_adop_us   FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us)
);

CREATE TABLE Like_Mascota (
  id_like INT PRIMARY KEY AUTO_INCREMENT,
  id_masc INT NOT NULL,
  
  -- Campos para los 3 tipos de usuarios (solo uno debe estar lleno)
  mail_us VARCHAR(50) NULL,
  mail_empl VARCHAR(50) NULL,
  email_inst VARCHAR(100) NULL,
  
  fecha_like DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT FK_like_masc FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc) ON DELETE CASCADE,
  CONSTRAINT FK_like_usuario FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us) ON DELETE CASCADE,
  CONSTRAINT FK_like_empleado FOREIGN KEY (mail_empl) REFERENCES Empleado(mail_empl) ON DELETE CASCADE,
  CONSTRAINT FK_like_institucion FOREIGN KEY (email_inst) REFERENCES Institucion(email_inst) ON DELETE CASCADE,
  
  -- Constraint para asegurar que solo uno de los 3 campos esté lleno
  CONSTRAINT CHK_like_user_type CHECK (
    (mail_us IS NOT NULL AND mail_empl IS NULL AND email_inst IS NULL) OR 
    (mail_us IS NULL AND mail_empl IS NOT NULL AND email_inst IS NULL) OR 
    (mail_us IS NULL AND mail_empl IS NULL AND email_inst IS NOT NULL)
  ),
  
  -- Índice único combinado para evitar likes duplicados
  UNIQUE KEY unique_like_usuario (id_masc, mail_us),
  UNIQUE KEY unique_like_empleado (id_masc, mail_empl),
  UNIQUE KEY unique_like_institucion (id_masc, email_inst)
);

ALTER TABLE Empleado ADD COLUMN cedula_empl VARCHAR(20) NULL AFTER apellido_empl;

-- Agregar campos de logo para los perfiles
ALTER TABLE Usuario ADD COLUMN logo_us VARCHAR(200) NULL AFTER donante;
ALTER TABLE Empleado ADD COLUMN logo_empl VARCHAR(200) NULL AFTER cedula_empl;
ALTER TABLE Institucion ADD COLUMN logo_inst VARCHAR(200) NULL AFTER contrasena_inst;

-- Agregar id_masc a Publicacion
ALTER TABLE Publicacion ADD COLUMN id_masc INT NULL UNIQUE AFTER id_inst;

-- FKs
ALTER TABLE Mascota     ADD CONSTRAINT FK_masc_inst       FOREIGN KEY (id_inst) REFERENCES Institucion (id_inst);
ALTER TABLE Mascota     ADD CONSTRAINT FK_masc_empl       FOREIGN KEY (mail_empl) REFERENCES Empleado (mail_empl);
ALTER TABLE Mascota     ADD CONSTRAINT FK_masc_email_inst FOREIGN KEY (email_inst) REFERENCES Institucion (email_inst);
ALTER TABLE Publicacion ADD CONSTRAINT FK_publi_inst      FOREIGN KEY (id_inst) REFERENCES Institucion(id_inst);
ALTER TABLE Publicacion ADD CONSTRAINT FK_publ_masc       FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc) ON DELETE CASCADE;
ALTER TABLE Donacion    ADD CONSTRAINT FK_don_inst   FOREIGN KEY (id_inst) REFERENCES Institucion (id_inst);
ALTER TABLE Donacion    ADD CONSTRAINT FK_don_us     FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Consulta    ADD CONSTRAINT FK_cons_us    FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_us    FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_con   FOREIGN KEY (id_con) REFERENCES Consulta (id_con);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_publi FOREIGN KEY (id_publ) REFERENCES Publicacion (id_publ);
ALTER TABLE Pertenece   ADD CONSTRAINT FK_pertenece_mail FOREIGN KEY (mail_empl) REFERENCES Empleado(mail_empl);
ALTER TABLE Pertenece   ADD CONSTRAINT FK_pertenece_inst FOREIGN KEY (id_inst)   REFERENCES Institucion(id_inst);

-- ===== SISTEMA DE CHAT =====
-- Tabla de conversaciones entre usuarios
CREATE TABLE conversaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('privada', 'grupo') DEFAULT 'privada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de participantes en conversaciones
CREATE TABLE conversacion_participantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversacion_id INT NOT NULL,
    
    -- Campos para los 3 tipos de usuarios (solo uno debe estar lleno)
    mail_us VARCHAR(50) NULL,
    mail_empl VARCHAR(50) NULL,
    email_inst VARCHAR(100) NULL,
    
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT FK_conv_part_conv FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
    CONSTRAINT FK_conv_part_usuario FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us) ON DELETE CASCADE,
    CONSTRAINT FK_conv_part_empleado FOREIGN KEY (mail_empl) REFERENCES Empleado(mail_empl) ON DELETE CASCADE,
    CONSTRAINT FK_conv_part_institucion FOREIGN KEY (email_inst) REFERENCES Institucion(email_inst) ON DELETE CASCADE,
    
    -- Constraint para asegurar que solo uno de los 3 campos esté lleno
    CONSTRAINT CHK_conv_part_user_type CHECK (
        (mail_us IS NOT NULL AND mail_empl IS NULL AND email_inst IS NULL) OR 
        (mail_us IS NULL AND mail_empl IS NOT NULL AND email_inst IS NULL) OR 
        (mail_us IS NULL AND mail_empl IS NULL AND email_inst IS NOT NULL)
    )
);

-- Tabla de mensajes
CREATE TABLE mensajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversacion_id INT NOT NULL,
    
    -- Campos para los 3 tipos de usuarios emisores (solo uno debe estar lleno)
    emisor_mail_us VARCHAR(50) NULL,
    emisor_mail_empl VARCHAR(50) NULL,
    emisor_email_inst VARCHAR(100) NULL,
    
    contenido TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT FK_mensaje_conv FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
    CONSTRAINT FK_mensaje_usuario FOREIGN KEY (emisor_mail_us) REFERENCES Usuario(mail_us) ON DELETE CASCADE,
    CONSTRAINT FK_mensaje_empleado FOREIGN KEY (emisor_mail_empl) REFERENCES Empleado(mail_empl) ON DELETE CASCADE,
    CONSTRAINT FK_mensaje_institucion FOREIGN KEY (emisor_email_inst) REFERENCES Institucion(email_inst) ON DELETE CASCADE,
    
    -- Constraint para asegurar que solo uno de los 3 campos esté lleno
    CONSTRAINT CHK_mensaje_user_type CHECK (
        (emisor_mail_us IS NOT NULL AND emisor_mail_empl IS NULL AND emisor_email_inst IS NULL) OR 
        (emisor_mail_us IS NULL AND emisor_mail_empl IS NOT NULL AND emisor_email_inst IS NULL) OR 
        (emisor_mail_us IS NULL AND emisor_mail_empl IS NULL AND emisor_email_inst IS NOT NULL)
    ),
    
    -- Índice para optimizar búsquedas
    INDEX idx_conversacion_fecha (conversacion_id, created_at)
);

