DROP DATABASE IF EXISTS Conexion;
CREATE DATABASE Conexion;
USE Conexion;


CREATE TABLE Institucion(
  id_inst VARCHAR(50) NOT NULL PRIMARY KEY,
  nomb_inst VARCHAR(50) NOT NULL,
  tel_inst VARCHAR(50) NOT NULL,
  dia_inst VARCHAR(50) NOT NULL,
  H_cierre TIME NOT NULL,
  H_apertura TIME NOT NULL, 
  direccion_inst VARCHAR(50) NOT NULL
);

CREATE TABLE Empleado(
  mail_empl VARCHAR(50) NOT NULL PRIMARY KEY,
  nomb_user VARCHAR(50) NOT NULL,
  contrasena_us VARCHAR(255) NOT NULL, 
  nomb_empl VARCHAR(50),
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
  coment_int VARCHAR(500),
  forma_int VARCHAR(20),
  hora_int TIME,
  fecha_int DATE
);
 
CREATE TABLE Mascota(
  id_masc INT AUTO_INCREMENT PRIMARY KEY,
  id_inst VARCHAR(50) NOT NULL,
  mail_us VARCHAR(50) NOT NULL,
  tamano_masc VARCHAR(20),
  edad_masc VARCHAR(20),
  foto_masc VARCHAR(200),
  desc_masc VARCHAR(200),
  nom_masc VARCHAR(20),
  especie_masc VARCHAR(20),
  raza_masc VARCHAR(20),
  salud_masc VARCHAR(30),
  estadoAdopt_masc BOOLEAN
);

CREATE TABLE Guardado (
  id_guardado INT AUTO_INCREMENT PRIMARY KEY,
  mail_us VARCHAR(50) NOT NULL,
  id_masc INT NOT NULL,
  fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_guardado_us   FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us),
  CONSTRAINT FK_guardado_masc FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc),
  UNIQUE (mail_us, id_masc)
);
 
CREATE TABLE Adopcion (
  id_adop INT PRIMARY KEY AUTO_INCREMENT,
  id_masc INT NOT NULL,
  mail_us VARCHAR(50) NOT NULL,
  fecha_adop DATE NOT NULL,
  CONSTRAINT FK_adop_masc FOREIGN KEY (id_masc) REFERENCES Mascota(id_masc),
  CONSTRAINT FK_adop_us   FOREIGN KEY (mail_us) REFERENCES Usuario(mail_us)
);

-- FKs
ALTER TABLE Mascota     ADD CONSTRAINT FK_masc_inst  FOREIGN KEY (id_inst) REFERENCES Institucion (id_inst);
ALTER TABLE Mascota     ADD CONSTRAINT FK_masc_us    FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Publicacion ADD CONSTRAINT FK_publi_inst FOREIGN KEY (id_inst) REFERENCES Institucion(id_inst);
ALTER TABLE Donacion    ADD CONSTRAINT FK_don_inst   FOREIGN KEY (id_inst) REFERENCES Institucion (id_inst);
ALTER TABLE Donacion    ADD CONSTRAINT FK_don_us     FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Consulta    ADD CONSTRAINT FK_cons_us    FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_us    FOREIGN KEY (mail_us) REFERENCES Usuario (mail_us);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_con   FOREIGN KEY (id_con) REFERENCES Consulta (id_con);
ALTER TABLE Interacion  ADD CONSTRAINT FK_inte_publi FOREIGN KEY (id_publ) REFERENCES Publicacion (id_publ);
ALTER TABLE Pertenece   ADD CONSTRAINT FK_pertenece_mail FOREIGN KEY (mail_empl) REFERENCES Empleado(mail_empl);
ALTER TABLE Pertenece   ADD CONSTRAINT FK_pertenece_inst FOREIGN KEY (id_inst)   REFERENCES Institucion(id_inst);


-- Añadir usuario institucion y mascotas

INSERT INTO Institucion (nomb_inst, tel_inst, dia_inst, H_cierre, H_apertura, direccion_inst) 
VALUES ('Refugio Casa Patitas', '099123456', 'Lunes a Domingo', '18:00:00', '08:00:00', 'Av. Principal 123');

-- Insertar usuario
INSERT INTO Usuario (mail_us, contrasena_us, nom_us, apell_us, adoptante, donante) 
VALUES ('admin@casapatitas.com', 'password123', 'Admin', 'Sistema', 1, 1);

-- Insertar mascotas de ejemplo
INSERT INTO Mascota (id_inst, mail_us, nom_masc, especie_masc, raza_masc, tamano_masc, edad_masc, salud_masc, desc_masc, estadoAdopt_masc) 
VALUES 
('INST1', 'admin@casapatitas.com', 'Luna', 'Gato', 'Persa', 'Mediano', '2 años', 'Bien', 'Gata muy cariñosa y tranquila. Le gusta dormir en el sol.', 0),
('INST1', 'admin@casapatitas.com', 'Max', 'Perro', 'Golden', 'Grande', '3 años', 'Impecable', 'Perro muy juguetón y leal. Ideal para familias con niños.', 0),
('INST1', 'admin@casapatitas.com', 'Mimi', 'Gato', 'Siames', 'Chico', '1 año', 'Bien', 'Gatita joven y activa. Le encanta jugar con pelotas.', 1),
('INST1', 'admin@casapatitas.com', 'Rocky', 'Perro', 'Bulldog', 'Mediano', '4 años', 'Más o Menos', 'Perro tranquilo y cariñoso. Necesita cuidados especiales.', 0),
('INST1', 'admin@casapatitas.com', 'Piolín', 'Ave', 'Canario', 'Chico', '6 meses', 'Bien', 'Pajarito muy cantarín y alegre. Ideal para apartamentos.', 0);