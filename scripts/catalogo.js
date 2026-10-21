/**
 * CATÁLOGO DEL PORTFOLIO — OPCIÓN A
 *
 * Este es el único archivo que tienes que editar para añadir, ocultar o actualizar
 * aplicaciones, sus textos, capturas y enlaces.
 *
 * El panel privado futuro podrá guardar estos mismos campos en una base de datos.
 * No incluyas contraseñas, API keys ni información privada en este archivo:
 * cualquier persona puede consultarlo desde el navegador.
 */
window.PORTFOLIO_CONFIG = {
  studio: {
    name: 'Fly High', // Nombre público de la marca.
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
      id: 'pasfh', // Sin espacios; sirve también para enlazar con #app/pasfh.
      name: 'PASfh',
      category: 'Primeros auxilios',
      summary: 'Orientación visual e interactiva de primeros auxilios, creada para consultar información de forma clara.',
      description: 'PASfh organiza información de primeros auxilios mediante rutas de reconocimiento, fichas de técnicas y explicaciones visuales. Su objetivo es facilitar la consulta de contenidos de forma sencilla.',
      platform: ['Android'],
      technology: '.NET MAUI',
      status: 'development', // development | published
      version: '',          // Ejemplo: 1.0.0, cuando exista una versión validada
      icon: { type: 'heart', color: 'coral', image: '' },
      features: [
        { icon: '🧭', title: 'Reconocimiento rápido', description: 'Rutas guiadas para localizar orientaciones.' },
        { icon: '🩹', title: 'Técnicas y procedimientos', description: 'Información organizada para cada situación.' },
        { icon: '📋', title: 'Secuencias visuales', description: 'Pasos y referencias relacionadas.' }
      ],
      screenshots: [
        // Cuando dispongamos de capturas reales, añadir elementos así:
        // { src: './assets/pasfh/inicio.webp', alt: 'Pantalla inicial de PASfh' }
      ],
      links: [
        // SOLO cuando el archivo exista y esté probado, añadir:
        // { label: 'Descargar APK', url: 'https://github.com/USUARIO/REPO/releases/download/v1.0/PASfh-v1.0.apk' }
        // O: { label: 'Google Play', url: 'https://play.google.com/store/apps/details?id=...' }
      ],
      notice: 'PASfh proporciona información general y no sustituye la atención de emergencias, formación acreditada ni consejo sanitario profesional.'
    }

    // Para añadir una segunda app: copia el objeto PASfh, cambia id/nombre/etc.
    // y sepáralo con una coma. Se creará automáticamente su icono y su ficha.
  ]
};
