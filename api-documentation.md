# Documentación de la API Backend (TFG)

Esta es una lista completa de los endpoints disponibles en el backend y los requisitos para usarlos (DTOs), basada en los controladores de la aplicación Spring Boot. Todas las rutas expuestas asumen el prefijo **`/api/v1`**.

---

## 🔐 1. Autenticación (`/api/v1/auth`)

Endpoints para registro e inicio de sesión de usuarios.

### `POST /register`
Registra un nuevo usuario en la plataforma.
- **Body Requerido (`RegisterRequestDTO`)**:
  ```json
  {
    "username": "string (obligatorio, entre 3 y 32 caracteres)",
    "email": "string (obligatorio, formato email válido, máx 254 chars)",
    "password": "string (obligatorio, mín 8 caracteres, al menos 1 letra y 1 número)"
  }
  ```

### `POST /login`
Inicia sesión y devuelve el token JWT del usuario.
- **Body Requerido (`LoginRequestDTO`)**:
  ```json
  {
    "username": "string (obligatorio)",
    "password": "string (obligatorio)"
  }
  ```

---

## 👤 2. Estadísticas del Jugador (`/api/v1/player/stats`)

- **`GET /`**
  Obtiene las estadísticas personales del jugador autenticado.
- **`GET /leaderboard`**
  Obtiene la tabla de clasificación (leaderboard) global de jugadores.

---

## 🔓 3. Desbloqueos del Jugador (`/api/v1/player/unlocks`)

Endpoints para consultar los elementos que el jugador autenticado ha desbloqueado.

- **`GET /weapons`** - Armas desbloqueadas.
- **`GET /characters`** - Personajes desbloqueados.
- **`GET /items`** - Objetos/Items desbloqueados.
- **`GET /boons`** - Bendiciones (Boons) desbloqueadas.

---

## 🎮 4. Progreso de Partida (Runs) (`/api/v1/runs`)

Endpoints para gestionar el ciclo de vida de una partida.

### `POST /start`
Inicia una nueva partida (crea la sesión verificando que el usuario posee los elementos seleccionados).
- **Body Requerido (`StartRunRequestDTO`)**:
  ```json
  {
    "characterId": 1, // Long (Obligatorio)
    "initialBoonId": 2, // Long (Obligatorio)
    "weaponIds": [1, 3, 5] // Array de Long (Obligatorio, exactamente 3 armas)
  }
  ```

### `POST /{runId}/end`
Finaliza una partida, registra las estadísticas y actualiza el perfil del jugador.
- **Body Requerido (`GameEndStatsRequestDTO`)**:
  ```json
  {
    "score": 1500, // Integer (Obligatorio, mín 0)
    "waveReached": 15, // Integer (Obligatorio, mín 0)
    "enemiesKilled": 320, // Integer (Obligatorio, mín 0)
    "timeSurvivedSec": 1200 // Long (Obligatorio, mín 0)
  }
  ```

### `GET /{runId}/rewards/pool`
Genera y devuelve 3 objetos (items) aleatorios desbloqueados que el jugador no tiene en su partida actual (Reward pool).

### `POST /{runId}/rewards/choose/{itemId}`
Añade la recompensa seleccionada a la partida en curso.

---

## 📖 5. Catálogo de Juego

Endpoints de solo lectura (generalmente) para consultar la información de todos los elementos disponibles en el juego.

### Personajes (`/api/v1/characters`)
- **`GET /`** - Lista todos los personajes.
- **`GET /{id}`** - Obtiene detalles de un personaje específico.

### Armas (`/api/v1/weapons`)
- **`GET /`** - Lista todas las armas.
- **`GET /{id}`** - Obtiene detalles de un arma específica.

### Objetos (`/api/v1/items`)
- **`GET /`** - Lista todos los objetos.
- **`GET /{id}`** - Obtiene detalles de un objeto específico.

### Bendiciones (`/api/v1/boons`)
- **`GET /`** - Lista todas las bendiciones.
- **`GET /{id}`** - Obtiene detalles de una bendición específica.

### Enemigos (`/api/v1/enemies`)
- **`GET /`** - Lista todos los enemigos.
- **`GET /{id}`** - Obtiene detalles de un enemigo específico.


## 6. Datos de las entidades

- **Character**
  - `bigserial id`
  - `varchar(80) name`
  - `integer health`
  - `numeric(6, 2) attack_speed`
  - `numeric(6, 2) range`
  - `integer damage`
  - `integer shield`
  - `timestampWithTimeZone updated_at`
  - `timestampWithTimeZone created_at`