/* =============================================================================
   historia.js — Personajes, diálogos y misiones del Mapa del Merodeador

   Todo el contenido del juego vive aquí, separado del motor (mapa.js):
     - El Sombrero Seleccionador (bienvenida y entrega de la espada)
     - Las 7 misiones: personaje, sala, horrocrux, ruta, diálogo y pista
     - Lord Voldemort (aparece cuando las 7 están completadas)
     - Las patrullas de Filch y la Señora Norris

   Las pistas son PROVISIONALES: cámbialas cuando existan los retos de cada
   misión. Los diálogos reciben el nombre del jugador (n).
   Coordenadas en píxeles del mundo (ver castillo.js); la "ruta" son los puntos
   por los que pasea cada personaje dentro de su sala.
   ============================================================================= */

(function () {
  'use strict';

  const COMENTARIO_CASA = {
    Gryffindor: 'Valor y nobleza de corazón…',
    Slytherin: 'Astucia y ambición, sí, sí…',
    Ravenclaw: 'Una mente brillante y curiosa…',
    Hufflepuff: 'Lealtad y esfuerzo como pocos…',
  };

  const SOMBRERO = {
    id: 'sombrero',
    nombre: 'Sombrero Seleccionador',
    posicion: [1200, 704],
    lineas: (n, casa) => [
      `¡Ajá! Otra cabeza que examinar… Quieto, ${n}, que esto no duele nada.`,
      'Mmm… difícil, muy difícil. Veo valor, una mente despierta, lealtad… y no poca ambición.',
      `Pero tú ya lo has decidido. ${COMENTARIO_CASA[casa] || ''} Veo que eres… ¡${String(casa).toUpperCase()}!`,
      'Escucha bien: siete fragmentos de un alma oscura se esconden en este castillo. Para destruir los horrocruxes tendrás que descubrir los ocho hechizos. Sigue las huellas y habla con quienes te esperan.',
      'Toma esto. La Espada de Godric Gryffindor se presenta ante quien la necesita… Te será útil más adelante en tu estancia en Hogwarts.',
    ],
    accion: 'Recibir la espada',
  };

  const PERSONAJES = [
    {
      id: 'ginny', mision: 1, nombre: 'Ginny Weasley', sala: 'Baño de Myrtle la Llorona',
      horrocrux: 'Diario de Tom Riddle', icono: '📔', titulo: 'Destruir el diario de Tom Riddle',
      apariencia: { piel: 'porcelana', pelo: '2', colorPelo: 'pelirrojo', ojos: 'marron', varita: 'acebo', casa: 'Gryffindor', pecas: true },
      ruta: [[1680, 742], [1900, 830], [1710, 862]],
      lineas: (n) => [
        `¡${n}! Qué bien que estés aquí. Tengo una misión para ti.`,
        'Hace tiempo apareció un diario entre mis libros. Yo le escribía… y él me contestaba.',
        'Era el diario de Tom Riddle. Me fue controlando poco a poco y casi no lo cuento.',
        'Es un horrocrux: guarda un pedazo del alma de Voldemort. El conjuro que lo rompe viaja escondido por el castillo.',
        `A la entrada hay un aviso polvoriento que enumera los pasadizos que nadie debería recorrer. Uno baja hasta la red donde quedó enredado el mensaje que Dobby lanzó al aire. ¿Me ayudas a seguirlo, ${n}?`,
      ],
      gracias: (n) => [`¡Lo conseguiste, ${n}! Ese diario no volverá a hablarle a nadie.`],
      pista: 'En la portada del castillo, un aviso olvidado nombra los pasadizos prohibidos; uno lleva a la red donde quedó atrapado el mensaje de Dobby. Vuelve a oír ese susurro cazado al vuelo y el conjuro saldrá a la luz.',
    },
    {
      id: 'dumbledore', mision: 2, nombre: 'Albus Dumbledore', sala: 'Despacho del director',
      horrocrux: 'Anillo de Sorvolo Gaunt', icono: '💍', titulo: 'Destruir el anillo de Sorvolo Gaunt',
      apariencia: {
        piel: 'porcelana', pelo: '2', colorPelo: 'blanco', ojos: 'azul', gafas: 'media-luna', varita: 'sauco',
        uniforme: false, tunica: 'purpura', barba: true, sombrero: true, chispa: '#d9c2ff',
      },
      ruta: [[1110, 252], [1290, 252], [1200, 200]],
      lineas: (n) => [
        `Ah, ${n}. Pasa, pasa. ¿Un caramelo de limón? Tengo una misión para ti.`,
        'Este anillo perteneció a los Gaunt, los antepasados de Tom Riddle. Su piedra negra es… tentadora.',
        'Cometí la imprudencia de ponérmelo y mi mano pagó el precio. Es un horrocrux, y su maldición sigue viva.',
        'La llave de esta cámara ya pasó por tus manos, escondida entre aquellos susurros atrapados.',
        'Preséntate con ella ante la puerta cerrada y, dentro, lee la carta que un amo cruel dejó a su elfo: el encantamiento está entre sus líneas.',
      ],
      gracias: () => ['Bien hecho. A veces lo más difícil es renunciar a lo que más deseamos.'],
      pista: 'La llave de esta cámara ya la tienes, oculta entre los susurros que cazaste antes. Ábrela, entra en la alcoba de su dueño y lee la carta que un amo dejó a su elfo: el conjuro está escrito en ella.',
    },
    {
      id: 'ron', mision: 3, nombre: 'Ron Weasley', sala: 'Sala común de Gryffindor',
      horrocrux: 'Guardapelo de Slytherin', icono: '📿', titulo: 'Destruir el guardapelo de Slytherin',
      apariencia: { piel: 'porcelana', pelo: '1', colorPelo: 'pelirrojo', ojos: 'azul', varita: 'vid', casa: 'Gryffindor', pecas: true },
      ruta: [[200, 300], [440, 318], [330, 216]],
      lineas: (n) => [
        `Eh, ${n}, ¿tienes un momento? Tengo una misión para ti.`,
        'Encontramos el guardapelo de Slytherin. Es un horrocrux… y cuando lo llevo puesto me susurra cosas horribles.',
        'No pienso ponérmelo otra vez, pero sé por dónde empezar.',
        'En la casa de las serpientes cuelga un retrato. Lo que buscamos no está pintado a la vista: alguien lo escondió dentro de la propia imagen, bajo los colores.',
        'Mira más allá de lo evidente y haz que la imagen hable. ¿Me echas una mano?',
      ],
      gracias: () => ['¡Lo hicimos! Ya no se oye nada… qué silencio más bueno.'],
      pista: 'En la casa de las serpientes cuelga un retrato. El conjuro no está a la vista: está escondido dentro de la propia imagen, bajo los colores. Mira más allá de lo evidente y hazla hablar.',
    },
    {
      id: 'hermione', mision: 4, nombre: 'Hermione Granger', sala: 'Biblioteca',
      horrocrux: 'Copa de Helga Hufflepuff', icono: '🏆', titulo: 'Destruir la copa de Hufflepuff',
      apariencia: { piel: 'melocoton', pelo: '4', colorPelo: 'castano', ojos: 'marron', varita: 'vid', casa: 'Gryffindor', mascota: 'gato' },
      ruta: [[452, 742], [702, 904], [590, 822]],
      lineas: (n) => [
        `¡${n}! Llevo toda la tarde en la biblioteca. Tengo una misión para ti.`,
        'La copa de Helga Hufflepuff está en la bóveda de los Lestrange, en Gringotts.',
        'Esa bóveda solo se abre ante quien ostenta rango suficiente, y tú llegas como simple visitante.',
        'Pero la petición que le entregas al guardián puede reescribirse antes de que llegue a sus manos.',
        'Cámbiate el título por el de un señor con mando y la copa quedará al descubierto. ¿Vienes?',
      ],
      gracias: () => ['¡Brillante! Sabía que lo conseguirías. Lo apunto en mi lista.'],
      pista: 'La bóveda de los Lestrange solo cede ante quien tiene rango. Llegas como visitante, pero la petición que envías al guardián puede reescribirse antes de llegar: cámbiate el título por el de un señor con mando y la copa aparecerá.',
    },
    {
      id: 'luna', mision: 5, nombre: 'Luna Lovegood', sala: 'Torre de Ravenclaw',
      horrocrux: 'Diadema de Ravenclaw', icono: '👑', titulo: 'Destruir la diadema de Ravenclaw',
      apariencia: { piel: 'porcelana', pelo: '2', colorPelo: 'rubioLuna', ojos: 'gris', varita: 'acebo', casa: 'Ravenclaw', pendientes: true },
      ruta: [[1972, 322], [2190, 300], [2080, 196]],
      lineas: (n) => [
        `Hola, ${n}. Los torposoplos me dijeron que vendrías. Tengo una misión para ti.`,
        'La diadema perdida de Ravenclaw estuvo mucho tiempo bajo la custodia de Bellatrix.',
        'Solo desde sus aposentos se alcanza lo que guarda, y ella no deja entrar a cualquiera.',
        'Pero hasta sus defensas tienen una grieta. Cuélate por ella y entra en su morada como si fueras ella misma.',
        'Allí espera lo que escribió de su puño. Yo veo cosas que los demás no ven… y esta la veo clara.',
      ],
      gracias: () => ['Qué bien. La torre huele un poco menos a magia oscura.'],
      pista: 'La diadema estuvo bajo la custodia de Bellatrix, y solo desde sus aposentos se alcanza. Busca la grieta en sus defensas, entra en su morada como si fueras ella y encontrarás lo que escribió de su puño.',
    },
    {
      id: 'neville', mision: 6, nombre: 'Neville Longbottom', sala: 'Invernaderos',
      horrocrux: 'Nagini', icono: '🐍', titulo: 'Acabar con Nagini',
      apariencia: { piel: 'melocoton', pelo: '3', colorPelo: 'castanoClaro', ojos: 'marron', varita: 'acebo', casa: 'Gryffindor', mascota: 'sapo' },
      ruta: [[1736, 1580], [2160, 1660], [1950, 1582]],
      lineas: (n) => [
        `${n}… tengo una misión para ti. Bueno, para los dos.`,
        'Nagini, la serpiente de Voldemort, también es un horrocrux, y nunca se separa de él.',
        'Mi abuela dice que los Longbottom no se rinden. Y yo no pienso rendirme.',
        'Lucius Malfoy presume de una armadura sin defecto, pero todo el mundo mágico conoce ya la grieta por la que se cuela el aire.',
        'Aprovecha ese fallo sabido, entra en sus aposentos y toma lo que guarda contra la serpiente. ¿Aceptas?',
      ],
      gracias: () => ['¡Lo logramos! Que se entere la abuela.'],
      pista: 'Lucius presume de una armadura perfecta, pero ya es sabida la grieta por la que se cuela el aire. Aprovecha ese fallo conocido, entra en sus aposentos y toma lo que guarda contra la serpiente.',
    },
    {
      id: 'snape', mision: 7, nombre: 'Severus Snape', sala: 'Mazmorras',
      horrocrux: 'El último horrocrux: tú', icono: '⚡', titulo: 'Aceptar tu destino: el último horrocrux',
      apariencia: {
        piel: 'palido', pelo: '2', colorPelo: 'negro', ojos: 'negro', varita: 'vid', uniforme: false,
        tunica: 'negra', nariz: 'ganchuda', boca: 'seria', mejillas: false, ceno: true, chispa: '#7dffb0',
      },
      ruta: [[220, 1662], [680, 1662], [440, 1530]],
      lineas: (n) => [
        `${n}. Acércate. Tengo una misión para ti, y no pienso repetirla.`,
        'La noche en que el Señor Tenebroso fracasó, un fragmento de su alma quedó dentro de ti. Eres el último horrocrux.',
        'Para destruirlo tendrás que bajar hasta el corazón mismo del castillo, donde ningún alumno tiene permiso para entrar.',
        'Bajo estas mazmorras hay una puerta vedada. Pero existe un objeto olvidado, forjado con la autoridad de otro, que por un instante te eleva por encima de tu rango.',
        'Tómalo, cruza la puerta prohibida y afronta lo que te espera. Más valor del que imaginas.',
      ],
      gracias: () => ['Has cumplido. Más valor del que nunca imaginé.'],
      pista: 'Bajo el castillo hay una puerta que ningún alumno puede abrir. Busca el objeto olvidado, forjado con la autoridad de otro, que por un instante te eleva sobre tu rango: tómalo, cruza la puerta prohibida y llega al corazón del castillo.',
    },
  ];

  const VOLDEMORT = {
    id: 'voldemort', mision: 8, nombre: 'Lord Voldemort', sala: 'Gran Comedor', final: true,
    horrocrux: 'Duelo final', icono: '💀', titulo: 'Duelo final contra Lord Voldemort',
    apariencia: {
      piel: 'palido', pelo: '0', ojos: 'rojo', varita: 'tejo', mascota: 'serpiente', uniforme: false,
      tunica: 'negra', nariz: 'serpiente', boca: 'malvada', mejillas: false, cejas: false, ceno: true, chispa: '#5dff7a',
    },
    ruta: [[1200, 812]],
    saludo: (n) => `Te estaba esperando, ${n}…`,
    lineas: (n) => [
      `Así que tú eres ${n}, quien ha osado destruir mis horrocruxes.`,
      'Siete pedazos de mi alma… y aun así sigues aquí, temblando ante Lord Voldemort.',
      'No hay bien ni mal. Solo existe el poder… y los demasiado débiles para buscarlo.',
      'Ven. Terminemos esto de una vez. ¿O vas a huir como hicieron tus amigos?',
    ],
    gracias: () => ['…'],
    pista: 'Ya has cruzado la última puerta y ocupas el trono que creías imposible; desde él, cada rincón del castillo te obedece. Entra en la cámara más alta, la del señor de todo, y lee allí el nombre del conjuro final.',
    acciones: { cerrar: 'Huir (por ahora)', aceptar: 'Aceptar duelo' },
  };

  const PATRULLAS = [
    {
      id: 'filch', nombre: 'Argus Filch', velocidad: 80,
      apariencia: {
        piel: 'palido', pelo: '2', colorPelo: 'gris', ojos: 'gris', varita: 'ninguna', uniforme: false,
        tunica: 'marron', boca: 'seria', mejillas: false, ceno: true,
      },
      ruta: [[180, 490], [2220, 490], [2220, 1350], [180, 1350]],
      frase: '¡Alumnos fuera de la cama! Te devuelvo al Gran Comedor… y pierdes una vida.',
    },
    {
      id: 'norris', nombre: 'Señora Norris', velocidad: 105, gato: true,
      ruta: [[640, 1350], [1960, 1350]],
      frase: '¡Miaaau! La Señora Norris ha avisado a Filch: pierdes una vida.',
    },
  ];

  window.Historia = {
    SOMBRERO, PERSONAJES, VOLDEMORT, PATRULLAS,
    INICIO: [1200, 790],         // donde aparece el jugador (Gran Comedor, junto al Sombrero)
    REFUGIO: [1200, 960],        // donde te deja Filch si te pilla
    saludo: (n) => `¡${n}! Tengo una misión para ti.`,
    agradecimiento: (n) => `¡Gracias, ${n}!`,
  };
})();
