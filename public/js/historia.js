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
      'Escucha bien: siete fragmentos de un alma oscura se esconden en este castillo. Sigue las huellas y habla con quienes te esperan.',
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
        'Es un horrocrux: guarda un pedazo del alma de Voldemort. Sigue escondido en la Cámara, bajo este baño.',
        `¿Me ayudas a destruirlo, ${n}?`,
      ],
      gracias: (n) => [`¡Lo conseguiste, ${n}! Ese diario no volverá a hablarle a nadie.`],
      pista: 'Los diarios guardan lo que escribes… y a veces también lo que borras.',
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
        'Este anillo perteneció a Sorvolo Gaunt, el abuelo de Tom Riddle. Su piedra negra es… tentadora.',
        'Cometí la imprudencia de ponérmelo y mi mano pagó el precio. Es un horrocrux, y su maldición sigue viva.',
        'Necesito a alguien que lo destruya sin caer en su trampa. Confío en ti.',
      ],
      gracias: () => ['Bien hecho. A veces lo más difícil es renunciar a lo que más deseamos.'],
      pista: 'No todo lo que brilla en una piedra es lo que parece: mira su reflejo.',
    },
    {
      id: 'ron', mision: 3, nombre: 'Ron Weasley', sala: 'Sala común de Gryffindor',
      horrocrux: 'Guardapelo de Slytherin', icono: '📿', titulo: 'Destruir el guardapelo de Slytherin',
      apariencia: { piel: 'porcelana', pelo: '1', colorPelo: 'pelirrojo', ojos: 'azul', varita: 'vid', casa: 'Gryffindor', pecas: true },
      ruta: [[200, 300], [440, 318], [330, 216]],
      lineas: (n) => [
        `Eh, ${n}, ¿tienes un momento? Tengo una misión para ti.`,
        'Encontramos el guardapelo de Slytherin. Es un horrocrux… y cuando lo llevo puesto me susurra cosas horribles.',
        'Solo se abre si alguien le habla en pársel. Y te juro que no pienso ponérmelo otra vez.',
        '¿Me echas una mano para destruirlo?',
      ],
      gracias: () => ['¡Lo hicimos! Ya no se oye nada… qué silencio más bueno.'],
      pista: 'Hay cerraduras que no se abren con llave, sino con la lengua adecuada.',
    },
    {
      id: 'hermione', mision: 4, nombre: 'Hermione Granger', sala: 'Biblioteca',
      horrocrux: 'Copa de Helga Hufflepuff', icono: '🏆', titulo: 'Destruir la copa de Hufflepuff',
      apariencia: { piel: 'melocoton', pelo: '4', colorPelo: 'castano', ojos: 'marron', varita: 'vid', casa: 'Gryffindor', mascota: 'gato' },
      ruta: [[452, 742], [702, 904], [590, 822]],
      lineas: (n) => [
        `¡${n}! Llevo toda la tarde en la biblioteca. Tengo una misión para ti.`,
        'La copa de Helga Hufflepuff está en la cámara de los Lestrange, en Gringotts.',
        'La protege una maldición gemino: si la tocas, se multiplica en copias que queman.',
        'Es un horrocrux. Hay que encontrar la copa verdadera entre todas las falsas. ¿Vienes?',
      ],
      gracias: () => ['¡Brillante! Sabía que lo conseguirías. Lo apunto en mi lista.'],
      pista: 'Entre muchas copias, la verdadera es la que no cambia.',
    },
    {
      id: 'luna', mision: 5, nombre: 'Luna Lovegood', sala: 'Torre de Ravenclaw',
      horrocrux: 'Diadema de Ravenclaw', icono: '👑', titulo: 'Destruir la diadema de Ravenclaw',
      apariencia: { piel: 'porcelana', pelo: '2', colorPelo: 'rubioLuna', ojos: 'gris', varita: 'acebo', casa: 'Ravenclaw', pendientes: true },
      ruta: [[1972, 322], [2190, 300], [2080, 196]],
      lineas: (n) => [
        `Hola, ${n}. Los torposoplos me dijeron que vendrías. Tengo una misión para ti.`,
        '¿Conoces la diadema perdida de Ravenclaw? Dicen que da sabiduría a quien la lleva.',
        'La Dama Gris me contó que Tom Riddle la escondió en la Sala de los Menesteres, entre miles de cosas olvidadas.',
        'Es un horrocrux. ¿Me ayudas a encontrarla? Yo veo cosas que los demás no ven.',
      ],
      gracias: () => ['Qué bien. La torre huele un poco menos a magia oscura.'],
      pista: '¿Qué está siempre delante de ti y nunca ves? Pregúntaselo al águila.',
    },
    {
      id: 'neville', mision: 6, nombre: 'Neville Longbottom', sala: 'Invernaderos',
      horrocrux: 'Nagini', icono: '🐍', titulo: 'Acabar con Nagini',
      apariencia: { piel: 'melocoton', pelo: '3', colorPelo: 'castanoClaro', ojos: 'marron', varita: 'acebo', casa: 'Gryffindor', mascota: 'sapo' },
      ruta: [[1736, 1580], [2160, 1660], [1950, 1582]],
      lineas: (n) => [
        `${n}… tengo una misión para ti. Bueno, para los dos.`,
        'Nagini, la serpiente de Voldemort, nunca se separa de él. También es un horrocrux.',
        'Mi abuela dice que los Longbottom no se rinden. Y yo no pienso rendirme.',
        'Si me ayudas a encontrar el momento justo, yo me encargo del resto. ¿Aceptas?',
      ],
      gracias: () => ['¡Lo logramos! Que se entere la abuela.'],
      pista: 'Las serpientes no soportan el grito de una mandrágora.',
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
        'Hay algo que Dumbledore nunca te contó. La noche en que el Señor Tenebroso fracasó, un fragmento de su alma quedó dentro de ti.',
        'Eres el último horrocrux. Mientras tú vivas, él no podrá morir.',
        'Para destruirlo tendrás que ir a su encuentro… y no defenderte. Es la única manera.',
      ],
      gracias: () => ['Has cumplido. Más valor del que nunca imaginé.'],
      pista: '«Siempre». Algunas respuestas solo se encuentran en los recuerdos.',
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
    pista: 'Tu varita conoce el camino: desarmar también es vencer.',
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
