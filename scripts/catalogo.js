/*
 * CATÁLOGO DEL PORTFOLIO — OPCIÓN A
 *
 * Este es el único archivo que tienes que editar para añadir, ocultar o actualizar
 * aplicaciones, sus textos, capturas y enlaces.
 */
window.PORTFOLIO_CONFIG = {
  studio: {
    name: 'Fly High',
    pageTitle: 'Fly High · Aplicaciones personales',
    eyebrow: '',
    headline: 'Fly High',
    accentHeadline: '',
    subtitle: 'Aplicaciones personales',
    aboutTitle: 'Aplicaciones personales de Fly High.',
    aboutText: 'Fly High reúne ideas y aplicaciones personales. Empezamos por PASfh y añadiremos otras aplicaciones cuando estén listas.'
  },
  apps: [
    {
      id: 'pasfh',
      name: 'PASfh',
      category: 'Primeros auxilios',
      summary: 'Orientación visual e interactiva de primeros auxilios, creada para consultar información de forma clara.',
      description: 'PASfh organiza información de primeros auxilios mediante rutas de reconocimiento, fichas de técnicas y explicaciones visuales. Su objetivo es facilitar la consulta de contenidos de forma sencilla.',
      platform: ['Android'],
      technology: '.NET MAUI',
      status: 'development',
      version: '',
      icon: { type: 'heart', color: 'coral', image: '' },
      features: [
        { icon: '🧭', title: 'Reconocimiento rápido', description: 'Rutas guiadas para localizar orientaciones.' },
        { icon: '🩹', title: 'Técnicas y procedimientos', description: 'Información organizada para cada situación.' },
        { icon: '📋', title: 'Secuencias visuales', description: 'Pasos y referencias relacionadas.' }
      ],
      screenshots: [],
      links: [],
      notice: 'PASfh proporciona información general y no sustituye la atención de emergencias, formación acreditada ni consejo sanitario profesional.'
    },
    {
      id: 'partriv',
      name: 'ParTriv',
      category: 'Juego por equipos',
      summary: 'Juego de conceptos por equipos con tres rondas.',
      description: 'ParTriv es un juego de conceptos por equipos en el que la mesa avanza a través de tres rondas con reglas diferentes. Se puede jugar desde el navegador en PC o smartphone, instalar como PWA y continuar sin conexión después de cargar sus recursos.',
      platform: ['Navegador PC', 'Smartphone', 'PWA sin conexión'],
      technology: 'Blazor WebAssembly',
      status: 'development',
      version: '',
      embedPath: './apps/party/',
      mobilePath: './apps/party/?from=flyhigh',
      icon: { type: 'image', image: './assets/partriv_logo_dark.png' },
      features: [
        { icon: '🎯', title: 'Tres rondas', description: 'Una partida estructurada en tres formas de jugar.' },
        { icon: '📱', title: 'PC y smartphone', description: 'Diseñado para jugar desde el navegador en distintos tamaños de pantalla.' },
        { icon: '⚡', title: 'PWA y sin conexión', description: 'Instala la aplicación y juega sin conexión cuando sus recursos ya estén cargados.' }
      ],
      screenshots: [],
      links: [],
      actions: {
        play: { label: 'Jugar ahora' },
        install: { label: 'Instalar versión web', url: './apps/party/' },
        android: { label: 'Descargar APK Android', url: '', pendingLabel: 'APK pendiente de publicación' }
      },
      android: {
        version: '1.3.6',
        packageId: 'com.flyhigh.partriv',
        sizeBytes: null,
        sha256: '',
        url: ''
      },
      notice: 'La versión web se abre de forma independiente para instalarla como PWA. La descarga Android solo aparecerá cuando exista una APK Release firmada, alojada y verificada.'
    }
  ]
};
