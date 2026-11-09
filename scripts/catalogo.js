/* Public app metadata. Localized copy lives in catalogo-localizacion.js. */
window.FLYHIGH_CATEGORIES = {
  health: 'Salud', games: 'Juegos', home: 'Hogar', productivity: 'Productividad',
  education: 'Educación', tools: 'Herramientas', entertainment: 'Entretenimiento', utilities: 'Utilidades'
};
window.PORTFOLIO_CONFIG = {
  studio: {
    name: 'Fly High', pageTitle: 'Fly High · Aplicaciones personales', headline: 'Fly High',
    icon: './assets/flyhigh-logo.webp', translations: window.FLYHIGH_STUDIO_TRANSLATIONS
  },
  apps: [
    {
      id: 'pasfh', name: 'PASfh', typeId: 'application', categoryId: 'health', status: 'development', version: '',
      embedPath: './apps/pasfh/', externalPath: './apps/pasfh/', mobilePath: './apps/pasfh/?from=flyhigh',
      platforms: ['pc-browser', 'smartphone'], capabilities: [],
      icon: { type: 'heart', color: 'coral', image: '' }, screenshots: [],
      android: { status: 'pending', version: '', packageId: '', sizeBytes: null, sha256: '', url: '' },
      translations: window.FLYHIGH_APP_TRANSLATIONS.pasfh
    },
    {
      id: 'partriv', name: 'ParTriv', typeId: 'application', categoryId: 'games', status: 'development', version: '',
      embedPath: './apps/party/', externalPath: './apps/party/', mobilePath: './apps/party/?from=flyhigh',
      platforms: ['pc-browser', 'smartphone'], capabilities: ['pwa', 'offline'],
      icon: { type: 'image', image: './assets/partriv_logo_dark.png' }, screenshots: [],
      android: { status: 'pending', version: '', packageId: '', sizeBytes: null, sha256: '', url: '' },
      translations: window.FLYHIGH_APP_TRANSLATIONS.partriv
    }
  ]
};
