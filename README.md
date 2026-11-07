# 🏰 Howgarts CTF — base del proyecto

CTF **educativo** con temática Harry Potter para niños. Entorno de prácticas
**local y controlado** para enseñar dos conceptos de seguridad:

1. **Inyección SQL** (en el login).
2. **Inspección de código fuente** (frase oculta en el DOM).

> ⚠️ Este proyecto contiene una vulnerabilidad **intencional**. Es una mecánica
> del juego. **No lo despliegues en Internet** ni lo uses como base de un login
> real. Úsalo solo en tu máquina.

---

## 📁 Estructura

```
hogwarts-ctf/
├── package.json
├── server.js              # Backend Express (login VULNERABLE a SQLi, a propósito)
├── db/
│   ├── init.js            # Crea y siembra la BD SQLite
│   └── hogwarts.db        # (se genera al ejecutar initdb)
└── public/
    ├── index.html         # 1) Login  (pestaña: "Howgarts")
    ├── personalizacion.html # 2) Personalización del personaje
    ├── mapa.html          # 3) Mapa del Merodeador (pestaña: "Mapa del Merodeador")
    ├── css/
    │   ├── global.css     # Tema compartido (fondo, castillo, transiciones)
    │   ├── login.css
    │   ├── personalizacion.css
    │   └── mapa.css       # HUD, niebla de guerra, modales, animaciones
    └── js/
        ├── login.js
        ├── personalizacion.js
        ├── animaciones.js # Placeholders: espada, horrocrux, cinemáticas
        ├── hud.js         # Temporizador, vidas (perderVida()), pistas
        └── mapa.js        # Movimiento, niebla, POIs, misiones, frase secreta
```

## ▶️ Cómo ejecutar

```bash
cd hogwarts-ctf
npm install
npm run initdb
npm start
```

Abre <http://localhost:3000>.

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

### Reto 2 — Inspección de código (Mapa)
Al entrar al mapa, todo está a oscuras (niebla de guerra) y hay una **carta**
(✉️ abajo a la derecha). Dice: *"en la fuente del castillo debes mirar"* → pista
para abrir las **DevTools** e inspeccionar el código fuente. Escondido en el DOM
(`mapa.html`) hay un `div` con `display:none` que contiene:

```
Juro solemnemente que mis intenciones no son buenas
```

Al escribir esa frase en la caja de texto del mapa: se disipa la niebla y se
revela la **Espada de Gryffindor**.

---

## 🧩 Qué está hecho y qué queda como placeholder

**Completo y funcional:**
- Login + backend con la SQLi intencional y BD SQLite sembrada.
- Personalización (3 peinados, gafas sí/no, 4 casas) guardada en `localStorage`.
- Mapa: movimiento con flechas, niebla de guerra, 8 POIs (huellas→personaje),
  pop-up "Iniciar misión", HUD (temporizador 20:00, 3 vidas, pistas).
- Reto de la frase oculta → disipa niebla + animación de espada.

**Placeholders listos para ampliar** (funciones ya cableadas):
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
