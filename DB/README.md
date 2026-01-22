# 🗄️ Capa de Datos - Casino DAW

Este directorio contiene la definición estructural y los datos iniciales necesarios para el funcionamiento del casino. El sistema utiliza **MySQL** como motor de base de datos relacional.

## 1. Archivos en este Directorio
* `schema.sql`: Definición de tablas, restricciones de integridad y claves foráneas.
* `seeds.sql`: Inserción de los 5 logros reales y datos de configuración inicial.
* `erd_diagram.png`: Representación visual de las relaciones entre entidades.

## 2. Diccionario de Datos

### Tabla: `usuarios`
Almacena la información de perfil y el estado financiero centralizado de los jugadores.
* `id`: Identificador único (PK).
* `username`: Nombre de usuario único para inicio de sesión.
* `password`: Hash de seguridad de la cuenta.
* `saldo`: Balance actual del jugador, sincronizado en tiempo real entre todos los juegos.
* `rol`: Nivel de permisos (`user`, `admin`, `owner`).

### Tabla: `logros`
Define el catálogo de medallas disponibles en el sistema.
* `id`: Identificador único (PK).
* `nombre`: Nombre de la medalla (ej. 'GANADOR NOVEL', 'SUPERVIVIENTE').
* `descripcion`: Pista críptica sobre cómo obtener el logro.
* `icono`: Representación visual (Emoji o clase CSS).

### Tabla: `usuarios_logros` (Relación N:M)
Registra qué jugadores han desbloqueado qué medallas y en qué fecha.
* `usuario_id`: Referencia al jugador (FK).
* `logro_id`: Referencia a la medalla obtenida (FK).
* `fecha_obtencion`: Marca de tiempo del desbloqueo.

### Tabla: `transacciones`
Historial detallado de movimientos de dinero para auditoría y visualización en el Dashboard.
* `id`: Identificador único (PK).
* `usuario_id`: Usuario que realiza el movimiento (FK).
* `tipo`: Categoría del movimiento (`apuesta`, `ganancia`, `ingreso`, `retiro`).
* `cantidad`: Valor monetario de la operación en Euros.
* `detalles_json`: Campo flexible para almacenar datos específicos del juego (ej. multiplicador de Crash o número de la Ruleta).

## 3. Integración con el Backend
El archivo `api.php` actúa como controlador principal para interactuar con esta base de datos mediante peticiones asíncronas de los juegos. 

---
*Casino DAW - Proyecto de Fin de Grado 2026*