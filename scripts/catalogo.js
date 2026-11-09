/* Public app metadata. Localized copy lives in catalogo-localizacion.js. */
window.PORTFOLIO_CONFIG = {
  studio: {
    name: 'Fly High',
    pageTitle: 'Fly High · Aplicaciones personales',
    headline: 'Fly High',
    icon: './assets/flyhigh-logo.webp',
    translations: window.FLYHIGH_STUDIO_TRANSLATIONS
  },
  apps: [
    {
      id: 'pasfh', name: 'PASfh', status: 'development', version: '',
      embedPath: './apps/pasfh/', mobilePath: './apps/pasfh/?from=flyhigh',
      icon: { type: 'heart', color: 'coral', image: '' }, screenshots: [], links: [],
      actions: { install: { url: './apps/pasfh/' }, android: { url: '' } },
      translations: window.FLYHIGH_APP_TRANSLATIONS.pasfh
    },
    {
      id: 'partriv', name: 'ParTriv', status: 'development', version: '',
      embedPath: './apps/party/', mobilePath: './apps/party/?from=flyhigh',
      icon: { type: 'image', image: './assets/partriv_logo_dark.png' }, screenshots: [], links: [],
      actions: { install: { url: './apps/party/' }, android: { url: '' } },
      android: { version: '1.3.6', packageId: 'com.flyhigh.partriv', sizeBytes: null, sha256: '', url: '' },
      translations: window.FLYHIGH_APP_TRANSLATIONS.partriv
    }
  ]
};
