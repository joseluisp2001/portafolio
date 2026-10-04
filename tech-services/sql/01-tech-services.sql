-- TechServices: base de datos para la tienda de Desamparados Tech
-- Uso: mysql -u root -p < 01-tech-services.sql

CREATE DATABASE IF NOT EXISTS TechServices
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE TechServices;

DROP TABLE IF EXISTS Productos;

CREATE TABLE Productos (
  IdProducto    INT            NOT NULL AUTO_INCREMENT,
  Nombre        VARCHAR(150)   NOT NULL,
  Descripcion   TEXT           NULL,
  TipoProducto  VARCHAR(80)    NULL,
  Talla         VARCHAR(40)    NULL,
  Precio        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  RutaImagen    VARCHAR(255)   NULL,
  PRIMARY KEY (IdProducto),
  INDEX idx_tipo (TipoProducto),
  INDEX idx_spec (Talla)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Productos de ejemplo
INSERT INTO Productos (Nombre, Descripcion, TipoProducto, Talla, Precio, RutaImagen) VALUES
('Mouse Logitech G203', 'Mouse gaming con sensor de 8000 DPI, 6 botones programables', 'Periféricos', 'USB', 18500.00, 'Sin imagen'),
('Teclado mecánico Redragon', 'Teclado mecánico RGB, switches red, formato TKL', 'Periféricos', 'USB', 25000.00, 'Sin imagen'),
('Cable UTP Cat 6 (metro)', 'Cable de red categoría 6, para cableado estructurado', 'Redes', '1 metro', 450.00, 'Sin imagen'),
('Disco SSD 480GB Kingston', 'Unidad de estado sólido SATA III, lectura 500MB/s', 'Almacenamiento', 'SATA 2.5"', 28000.00, 'Sin imagen'),
('Memoria RAM DDR4 8GB', 'Módulo DDR4 3200MHz para laptop o desktop', 'Componentes', 'DDR4 SODIMM', 22000.00, 'Sin imagen'),
('Pasta térmica Arctic MX-4', 'Pasta térmica de alto rendimiento, 4g', 'Componentes', '4 gramos', 5500.00, 'Sin imagen'),
('Cámara IP WiFi 1080p', 'Cámara de seguridad inalámbrica con visión nocturna', 'Seguridad', 'WiFi', 32000.00, 'Sin imagen'),
('Router TP-Link Archer C6', 'Router WiFi AC1200 doble banda, 4 antenas', 'Redes', 'AC1200', 35000.00, 'Sin imagen'),
('Fuente de poder 600W', 'Fuente ATX 80+ Bronze, modular', 'Componentes', 'ATX', 28000.00, 'Sin imagen'),
('Cable HDMI 2.0 (2 metros)', 'Cable HDMI 4K@60Hz, con Ethernet', 'Accesorios', '2 metros', 4500.00, 'Sin imagen'),
('Adaptador USB WiFi', 'Adaptador inalámbrico USB 2.0, 300Mbps', 'Redes', 'USB', 6500.00, 'Sin imagen'),
('Cargador Universal Laptop', 'Cargador genérico 65W con puntas intercambiables', 'Accesorios', '65W', 12000.00, 'Sin imagen');

SELECT CONCAT('✓ Base TechServices lista: ', COUNT(*), ' productos cargados.') AS resultado FROM Productos;
