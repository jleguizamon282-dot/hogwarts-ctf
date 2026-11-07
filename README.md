# 🏰 Howgarts CTF — base del proyecto

CTF **educativo** con temática Harry Potter. Pensado como **laboratorio de
pentesting**: una máquina **Kali** escanea una **VM Ubuntu** que aloja esta app
web en el **puerto 80**. Enseña dos conceptos de seguridad:

1. **Inyección SQL** (en el login).
2. **Inspección de código fuente** (frase oculta en el DOM).

El login es **funcional**: los usuarios registrados entran con sus credenciales
y, además, existe la **brecha SQLi intencional** para fines académicos.

> ⚠️ Este proyecto contiene una vulnerabilidad **intencional**. Es una mecánica
> del laboratorio. **No lo despliegues en Internet** ni lo uses como base de un
> login real. Úsalo solo en una VM aislada y controlada.

---

## 📁 Estructura

```
hogwarts-ctf/
├── package.json
├── server.js              # Backend Express (login VULNERABLE a SQLi, a propósito)
├── db/
│   ├── init.js                 # Crea/siembra la BD (importa usuarios de /etc/passwd)
│   ├── lab-users.example.json  # Plantilla de contraseñas de lab por usuario
│   └── hogwarts.db             # (se genera al ejecutar initdb)
└── public/
    ├── index.html            # 1) Login  (pestaña: "Howgarts")
    ├── personalizacion.html  # 2) Personalización del personaje
    ├── juramento.html        # 3) El pergamino cerrado: carta + juramento (Reto 2)
    ├── mapa.html             # 4) Mapa del Merodeador (pestaña: "Mapa del Merodeador")
    ├── css/
    │   ├── global.css        # Tema compartido (fondo, botones, modales, transiciones)
    │   ├── login.css
    │   ├── personalizacion.css
    │   ├── juramento.css     # Pergamino en 3D, sobre lacrado, barra del conjuro
    │   └── mapa.css          # HUD, niebla de guerra, animaciones
    └── js/
        ├── flujo.js          # Orden de las pantallas y guardias de ruta
        ├── login.js
        ├── personalizacion.js
        ├── juramento.js      # Carta, validación del juramento, apertura del mapa
        ├── animaciones.js    # Placeholders: espada, horrocrux, cinemáticas
        ├── hud.js            # Temporizador, vidas (perderVida()), pistas
        └── mapa.js           # Movimiento, niebla, POIs, misiones
```

## 🧭 Ruta del juego

```
index.html ──► personalizacion.html ──► juramento.html ──► mapa.html ──► /mision/1..8
  Login           Crea tu mago            Pergamino +          Mapa del
  (Reto 1)                                carta (Reto 2)       Merodeador
```

Cada pantalla deja una marca en `localStorage` al completarse, y la siguiente
la exige al cargar (`js/flujo.js`). Si falta un paso, el navegador vuelve al
primero pendiente antes de pintar la página.

| Paso completado | Clave en `localStorage` | La exige |
|---|---|---|
| Login | `howgarts_sesion` | `personalizacion.html` |
| Personaje creado | `howgarts_personaje` | `juramento.html` |
| Juramento pronunciado | `howgarts_juramento` | `mapa.html` |

> Es un control de navegación para ordenar el recorrido, no una medida de
> seguridad: cualquiera puede editar `localStorage` desde la consola.

## ▶️ Cómo ejecutar (en la VM Ubuntu)

```bash
cd hogwarts-ctf
npm install
npm run initdb
sudo npm start
```

Abre <http://localhost:80> (o `http://IP-DE-LA-VM` desde Kali).

El puerto 80 necesita privilegios. Tres opciones:

```bash
sudo npm start                                                   # opción simple
```
```bash
sudo setcap 'cap_net_bind_service=+ep' "$(command -v node)"      # permitir el puerto a node y luego: npm start
```
```bash
PORT=3000 npm start                                              # usar otro puerto (sin privilegios)
```

---

## 🧪 Laboratorio Kali → Ubuntu

**Topología:** Kali (atacante) y Ubuntu (víctima, aloja la web) en la misma red.

1. **Escaneo / recon desde Kali:**
   ```bash
   nmap -sV -p- IP-DE-LA-VM          # detecta el puerto 80 (http) y el stack (Express)
   whatweb http://IP-DE-LA-VM        # fingerprint del servicio web
   ```
2. Kali encuentra el **puerto 80** abierto → abre el navegador → aparece el **login**.
3. Dos formas de entrar:
   - **Legítima:** usuario + contraseña válidos (ver tabla que imprime `initdb`).
   - **SQLi:** en el campo usuario, `' OR 1=1 --`.

### Usuarios del login
`npm run initdb` siembra la BD con:

- **Cuentas demo de Hogwarts** (siempre presentes): `harry`, `hermione`, `ron`,
  `luna`, `cedric`, `draco`, `dumbledore`.
- **Usuarios de login reales de la VM**: los nombres con shell de login tomados
  de `/etc/passwd` (p. ej. `root` y tus usuarios humanos). Así el recon que
  enumera usuarios de la VM coincide con el login web.

> **Contraseñas:** la app usa contraseñas de **laboratorio** guardadas en su BD
> SQLite. **No** lee `/etc/shadow` ni usa PAM; del sistema solo toma los
> **nombres** de usuario (de `/etc/passwd`, que es de lectura pública). Las
> contraseñas del login son independientes de las reales del sistema.

**Definir contraseñas por usuario** (opcional): copia la plantilla y edítala.

```bash
cp db/lab-users.example.json db/lab-users.json   # luego edita y vuelve a: npm run initdb
```

Variables de entorno útiles:

```bash
DEFAULT_LAB_PASSWORD='MiClaveLab'  IMPORT_SYSTEM_USERS=false  npm run initdb
```

- `DEFAULT_LAB_PASSWORD`: contraseña por defecto de los usuarios importados.
- `IMPORT_SYSTEM_USERS=false`: no importar usuarios de `/etc/passwd` (solo demo).

> `db/lab-users.json` está en `.gitignore` para que tus contraseñas de lab no se
> publiquen en GitHub.

---

## 🎯 Los dos retos del CTF

### Reto 1 — Inyección SQL (Login)
El backend construye la consulta concatenando la entrada del usuario
(`server.js`, zona marcada). Para entrar **sin conocer ninguna contraseña**,
escribe en el campo **usuario**:

```
' OR 1=1 --
```

(la contraseña puede quedar vacía o con cualquier texto).

### Reto 2 — Inspección de código (Pergamino)
Tras crear el personaje aparece `juramento.html`: la portada del **Mapa del
Merodeador**, todavía cerrado, y un **sobre lacrado** (con el escudo y el lacre
rojo). Al hacer clic se rompe el lacre y se lee la carta de Hogwarts, que dice:
*"en la fuente del castillo debes mirar"* → pista para abrir las **DevTools** e
inspeccionar el código fuente. Escondido en el DOM (`juramento.html`) hay un
`div` con `display:none` que contiene:

```
Juro solemnemente que mis intenciones no son buenas
```

Al escribirlo en la barra del conjuro (no distingue mayúsculas, tildes ni
puntuación), la tinta se extiende por el pergamino, **el mapa se despliega** y
se entra en el Mapa del Merodeador. Con un juramento incorrecto responde uno de
los merodeadores (Lunático, Colagusano, Canuto o Cornamenta).

> La frase no está escrita en `juramento.js`: el script la lee del `div`
> oculto, así que ese `div` es el único sitio donde encontrarla.

El arte del pergamino es SVG dibujado para esta pantalla (sin imágenes
externas): portada en español, interior del castillo y sobre.

---

## 🧩 Qué está hecho y qué queda como placeholder

**Completo y funcional:**
- Login + backend con la SQLi intencional y BD SQLite sembrada.
- Personalización (3 peinados, gafas sí/no, 4 casas) guardada en `localStorage`.
- Pergamino: carta de Hogwarts en sobre lacrado, reto de la frase oculta y
  animación del mapa que se abre (respeta `prefers-reduced-motion`).
- Mapa: movimiento con flechas, niebla de guerra, 8 POIs (huellas→personaje),
  pop-up "Iniciar misión", HUD (temporizador 20:00, 3 vidas, pistas).
- Ruta ordenada entre pantallas (`js/flujo.js`).

**Placeholders listos para ampliar** (funciones ya cableadas):
- `Animaciones.revelarEspada()` — Espada de Gryffindor; ya no la dispara la
  frase (ahora abre el mapa), queda lista para la misión que la entregue.
- `Animaciones.destruirHorrocrux()` — al completar una misión (anillo azul→verde).
- `Animaciones.gameOver()` — Voldemort vence (reloj a 00:00 o 0 corazones).
- `Animaciones.victoria()` — Avada Kedavra del héroe (al completar las 8 misiones).
- `/mision/:id` — vistas de nivel vacías (1..8) por construir.

### Funciones globales útiles (consola del navegador en el mapa)
```js
perderVida();        // quita 1 corazón y resta 5:00 al reloj
completarMision(3);  // marca la misión 3 (anillo verde + horrocrux)
Animaciones.victoria();
Animaciones.gameOver();
```

Para simular el regreso de una misión completada, redirige a:
`/mapa.html?completada=3`

Para empezar el recorrido desde cero (consola del navegador):
```js
localStorage.clear(); location.href = '/';
```
