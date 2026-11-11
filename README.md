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
    ├── personalizacion.html  # 2) Crea tu mago (personaje SVG + opciones)
    ├── juramento.html        # 3) El pergamino cerrado: carta + juramento (Reto 2)
    ├── mapa.html             # 4) Mapa del Merodeador (pestaña: "Mapa del Merodeador")
    ├── mision.html           # 5) Tablero de cada misión (se sirve en /mision/1..8)
    ├── css/
    │   ├── global.css        # Tema compartido (fondo, botones, modales, transiciones)
    │   ├── avatar.css        # Colores y variantes del mago chibi (jugador y personajes)
    │   ├── login.css
    │   ├── personalizacion.css  # Medallón, pestañas, tarjetas y estandartes
    │   ├── juramento.css     # Pergamino en 3D, sobre lacrado, barra del conjuro
    │   ├── mapa.css          # HUD, plano, niebla, huellas, diálogos, cinemáticas
    │   └── mision.css        # Tablero de misión, salas decoradas, rayo del hechizo
    └── js/
        ├── flujo.js          # Orden de las pantallas y guardias de ruta
        ├── avatar.js         # Dibujo SVG del mago (jugador y personajes), Sombrero, espada
        ├── login.js
        ├── personalizacion.js   # Opciones, miniaturas, nombre, "Sorpréndeme", guardado
        ├── juramento.js      # Carta, validación del juramento, apertura del mapa
        ├── estado.js         # Partida: vidas, reloj de 40 min, misiones, pistas
        ├── castillo.js       # Plano de Hogwarts: salas, pasillos, puertas, colisiones
        ├── historia.js       # Personajes, diálogos, misiones y pistas (contenido)
        ├── animaciones.js    # Cinemáticas: espada, horrocrux, game over, victoria
        ├── hud.js            # Barra superior: misiones, pistas, tiempo, vidas, pausa
        ├── mapa.js           # Motor: movimiento, cámara, huellas, diálogos, patrullas
        ├── mision.js         # Pantalla de misión: tablero, hechizo, rayo, vidas y reloj
        ├── salas.js          # Decoración de las 8 salas alrededor del tablero
        └── salas-piezas.js   # Piezas SVG: ventanas, estanterías, velas, calderos, plantas…
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

La partida del mapa (vidas, reloj, misiones, pistas, posición) se guarda en
`howgarts_partida` (ver `js/estado.js`).

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

## 🗺️ El Mapa del Merodeador

**Inicio.** El jugador aparece en el Gran Comedor junto al **Sombrero
Seleccionador**, que le dice su casa («Veo que eres… ¡GRYFFINDOR!») y le
entrega la **Espada de Gryffindor** («te será útil más adelante en tu estancia
en Hogwarts»). En ese momento empieza a correr el reloj.

**El mapa.** Es sombrío, con la paleta del login: solo se ve con claridad
alrededor del mago del jugador (el mismo de la personalización, con su
nombre). Bajo la sombra se ven las **huellas con el nombre** de cada personaje;
al acercarse aparece el personaje y al alejarse vuelve a ser huellas. Se
camina por los pasillos y las salas: **las paredes no se atraviesan**.

**Personajes y misiones** (cada uno pide ayuda con un horrocrux):

| # | Personaje | Misión | Dónde está |
|---|---|---|---|
| 1 | Ginny Weasley | Diario de Tom Riddle | Baño de Myrtle la Llorona |
| 2 | Albus Dumbledore | Anillo de Sorvolo Gaunt | Despacho del director |
| 3 | Ron Weasley | Guardapelo de Slytherin | Sala común de Gryffindor |
| 4 | Hermione Granger | Copa de Hufflepuff | Biblioteca |
| 5 | Luna Lovegood | Diadema de Ravenclaw | Torre de Ravenclaw |
| 6 | Neville Longbottom | Nagini | Invernaderos |
| 7 | Severus Snape | El último horrocrux: el propio jugador (aparece al completar las 6 primeras) | Mazmorras |
| 8 | Lord Voldemort | Duelo final (aparece al completar las 7) | Gran Comedor |

Las misiones 1 a 6 se pueden hacer en cualquier orden. Snape no está en el mapa
hasta completarlas: aparece entre una nube de humo, sin aviso, y hay que
buscarlo. Al completar la 7 llega Voldemort y **el reloj baja a 5 minutos** (si
quedaba menos, se mantiene); en los dos casos el reloj tiembla en rojo para
avisar al jugador.

Al acercarse sale un bocadillo («¡Nombre! Tengo una misión para ti»). El
diálogo termina con **Cerrar** (entrega la pista) o **Aceptar misión** (entrega
la pista y lleva a `/mision/N`). La misión aparece en la lista al hablar y se
tacha al completarla. Voldemort tiene su propio diálogo desafiante y termina
con **Aceptar duelo**.

**Barra superior.** Misiones (n/7), Pistas, barra de **tiempo de 40 minutos**
(global: sigue corriendo dentro de las misiones y no se reinicia al recargar),
**3 vidas**, la espada y **Pausa** («¡Travesura realizada!»: tapa el mapa y
detiene el reloj).

**Vidas.** Se pierde una al fallar dentro de una misión, o si te pillan **Argus
Filch** o la **Señora Norris**, que patrullan los pasillos (sus huellas se ven
en rojo). Las vidas no restan tiempo.

**Horrocrux destruido.** Al volver de una misión superada, el mago del jugador
alza la Espada de Gryffindor por detrás de la cabeza y la deja caer como un
hachazo: el horrocrux se parte y escapan almas entre humo negro. En la misión 7
(el horrocrux es el propio jugador) el mago cae, el fragmento oscuro sale de él
y la Piedra de la Resurrección le devuelve la vida.

**Fin de partida.** Sin vidas o sin tiempo, Voldemort lanza su hechizo, el mago
del jugador cae con los ojos en X y la lengua fuera, y aparece **GAME OVER**
con **Reintentar**, que empieza la partida desde cero. Al superar el duelo
final aparece la victoria.

**Controles.** Flechas o WASD para moverse, **E** (o Enter) para hablar,
**P** o Esc para pausar.

---

## 🧩 Qué está hecho y qué queda como placeholder

**Completo y funcional:**
- Login + backend con la SQLi intencional y BD SQLite sembrada.
- Creación del personaje: mago chibi en SVG sobre un medallón de pergamino,
  con pestañas **Aspecto** (4 peinados, 6 colores de pelo, 6 tonos de piel,
  5 colores de ojos, cicatriz), **Equipo** (gafas, varita y mascota) y
  **Casa** (estandartes con descripción). Miniaturas en vivo, botón
  "Sorpréndeme" y recuerdo de la última elección en `localStorage`.
- Pergamino: carta de Hogwarts en sobre lacrado, reto de la frase oculta y
  animación del mapa que se abre (respeta `prefers-reduced-motion`).
- Mapa del Merodeador completo (ver la sección de abajo): Sombrero
  Seleccionador, 7 misiones con diálogo, Voldemort final, pasillos con
  paredes, niebla, huellas con nombre, Filch y la Señora Norris, barra de
  misiones / pistas / tiempo (40 min) / vidas / pausa, game over y victoria.
- Ruta ordenada entre pantallas (`js/flujo.js`).
- Pantallas de misión (`/mision/1..8`, ver abajo).

**Pendiente:**
- Las pistas y algunos diálogos de `js/historia.js` son provisionales:
  cámbialas por pistas de cada reto.

## 🪄 Pantallas de misión (`/mision/N`)

Todas usan la misma página (`mision.html`): un **tablero** central con el
horrocrux en su altar de runas, la pista del personaje, el reloj, las vidas y
la caja del hechizo. Alrededor se dibuja la **sala** de la misión (baño de
Myrtle, despacho, sala común, biblioteca, torre de Ravenclaw, invernaderos,
mazmorras o Gran Comedor), con su propia decoración animada.

- **Hechizo correcto:** el rayo alcanza al horrocrux, que se agrieta, y se
  vuelve al mapa (`/mapa.html?completada=N`), donde se ve la animación de la
  espada. En la misión 8 se gana la partida.
- **Hechizo incorrecto:** el rayo rebota y se pierde una vida. Sin vidas, se
  vuelve al mapa y aparece el game over.
- **Caja vacía o hechizo ya fallado en esa misión:** aviso, sin perder vida.
- **Volver al mapa** (o Esc): sin penalización. El reloj sigue corriendo.

El hechizo correcto **nunca llega al navegador**: la página envía lo que
escribe el jugador a `POST /api/hechizo` y el servidor solo responde si acierta
(tabla `HECHIZOS` en `server.js`). Se ignoran mayúsculas, tildes, espacios,
guiones y guiones bajos (`Avada Kedavra` = `avada_kedavra`).

> Quien pueda leer `server.js` (por ejemplo, con una shell en la VM) verá los
> hechizos. Es una práctica: si hiciera falta, se pueden guardar como hash.

### Funciones útiles (consola del navegador en el mapa)
```js
perderVida();        // quita 1 corazón (a 0: game over)
completarMision(3);  // completa la misión 3 (horrocrux destruido, tachada)
```

También se puede simular el regreso de una misión con `/mapa.html?completada=3`
o `/mapa.html?fallo=3`.

Para probar un hechizo sin el navegador:
```bash
curl -X POST http://localhost/api/hechizo -H 'Content-Type: application/json' -d '{"mision":1,"hechizo":"lumos"}'
```

Para empezar el recorrido desde cero (consola del navegador):
```js
localStorage.clear(); location.href = '/';
```
