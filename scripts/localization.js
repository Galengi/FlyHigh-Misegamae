'use strict';

window.FlyHighI18n = (() => {
  const locales = [
    ['es-ES', 'Español (España)'], ['ca-ES-valencia', 'Valencià'], ['es-LATAM', 'Español (Latinoamérica)'],
    ['en-US', 'English (United States)'], ['en-GB', 'English (United Kingdom)'], ['fr-FR', 'Français'],
    ['de-DE', 'Deutsch'], ['it-IT', 'Italiano'], ['pt-PT', 'Português']
  ];
  const common = {
    file: 'Archivo', view: 'Ver', window: 'Ventana', help: 'Ayuda', night: 'Noche', dawn: 'Amanecer', language: 'Idioma',
    desktop: 'Escritorio de aplicaciones', quickAccess: 'Acceso rápido a aplicaciones', open: 'Abrir', development: 'En desarrollo',
    description: 'Descripción', screenshots: 'Capturas', publication: 'Publicación', appStatus: 'Estado de la publicación',
    published: 'Publicada', pending: 'Pendiente', version: 'Versión', technology: 'Tecnología', platform: 'Plataforma',
    captures: 'Capturas', pendingCaptures: 'Capturas pendientes', addCaptures: 'Añadiremos imágenes reales cuando estén disponibles.',
    back: 'Volver', explore: 'Explorar', soon: 'Más aplicaciones, próximamente.', preparing: 'En preparación',
    reserved: 'Espacio reservado para la siguiente app', welcome: 'Bienvenido al escritorio', close: 'Cerrar', minimize: 'Minimizar',
    restore: 'Restaurar', backDesktop: 'Volver al escritorio', showDesktop: 'Mostrar escritorio', center: 'Centrar ventanas',
    minimizeActive: 'Minimizar ventana activa', hideActive: 'Ocultar ventana activa', closeActive: 'Cerrar ventana activa',
    aboutPortfolio: 'Acerca del portfolio', centered: 'Ventanas centradas',
    closeUnavailable: 'ParTriv no ha respondido a la solicitud de cierre. La partida se mantiene abierta.'
  };
  const dictionaries = {
    'es-ES': common,
    'es-LATAM': { ...common, addCaptures: 'Agregaremos imágenes reales cuando estén disponibles.', closeUnavailable: 'ParTriv no respondió a la solicitud de cierre. La partida permanece abierta.' },
    'ca-ES-valencia': {
      ...common, file: 'Arxiu', view: 'Veure', window: 'Finestra', help: 'Ajuda', night: 'Nit', dawn: 'Alba',
      desktop: 'Escriptori d’aplicacions', quickAccess: 'Accés ràpid a aplicacions', open: 'Obrir', development: 'En desenvolupament',
      description: 'Descripció', publication: 'Publicació', appStatus: 'Estat de la publicació', published: 'Publicada', pending: 'Pendent',
      version: 'Versió', pendingCaptures: 'Captures pendents', soon: 'Més aplicacions, pròximament.', preparing: 'En preparació',
      reserved: 'Espai reservat per a la pròxima app', welcome: 'Benvingut a l’escriptori', close: 'Tancar', minimize: 'Minimitzar',
      back: 'Tornar', backDesktop: 'Tornar a l’escriptori', showDesktop: 'Mostrar escriptori', center: 'Centrar finestres',
      minimizeActive: 'Minimitzar finestra activa', hideActive: 'Ocultar finestra activa', closeActive: 'Tancar finestra activa',
      aboutPortfolio: 'Sobre el portfoli', centered: 'Finestres centrades',
      closeUnavailable: 'ParTriv no ha respost a la sol·licitud de tancament. La partida continua oberta.'
    },
    'en-US': {
      ...common, file: 'File', view: 'View', window: 'Window', help: 'Help', night: 'Night', dawn: 'Dawn', language: 'Language',
      desktop: 'Application desktop', quickAccess: 'Quick access to applications', open: 'Open', development: 'In development',
      description: 'Description', publication: 'Release', appStatus: 'Release status', published: 'Published', pending: 'Pending',
      addCaptures: 'Real images will be added when available.', back: 'Back', explore: 'Explore', soon: 'More applications coming soon.',
      preparing: 'In preparation', reserved: 'Space reserved for the next app', welcome: 'Welcome to the desktop', close: 'Close',
      minimize: 'Minimize', restore: 'Restore', backDesktop: 'Back to desktop', showDesktop: 'Show desktop', center: 'Center windows',
      minimizeActive: 'Minimize active window', hideActive: 'Hide active window', closeActive: 'Close active window',
      aboutPortfolio: 'About this portfolio', centered: 'Windows centered', closeUnavailable: 'ParTriv did not answer the close request. The match remains open.'
    },
    'en-GB': {
      ...common, file: 'File', view: 'View', window: 'Window', help: 'Help', night: 'Night', dawn: 'Dawn', language: 'Language',
      desktop: 'Application desktop', quickAccess: 'Quick access to applications', open: 'Open', development: 'In development',
      description: 'Description', publication: 'Release', appStatus: 'Release status', published: 'Published', pending: 'Pending',
      addCaptures: 'Real images will be added when available.', back: 'Back', explore: 'Explore', soon: 'More applications coming soon.',
      preparing: 'In preparation', reserved: 'Space reserved for the next app', welcome: 'Welcome to the desktop', close: 'Close',
      minimize: 'Minimise', restore: 'Restore', backDesktop: 'Back to desktop', showDesktop: 'Show desktop', center: 'Centre windows',
      minimizeActive: 'Minimise active window', hideActive: 'Hide active window', closeActive: 'Close active window',
      aboutPortfolio: 'About this portfolio', centered: 'Windows centred', closeUnavailable: 'ParTriv did not answer the close request. The match remains open.'
    },
    'fr-FR': {
      ...common, file: 'Fichier', view: 'Affichage', window: 'Fenêtre', help: 'Aide', night: 'Nuit', dawn: 'Aube', language: 'Langue',
      desktop: 'Bureau des applications', quickAccess: 'Accès rapide aux applications', open: 'Ouvrir', development: 'En développement',
      description: 'Description', publication: 'Publication', appStatus: 'État de la publication', published: 'Publiée', pending: 'En attente',
      pendingCaptures: 'Captures à venir', addCaptures: 'De vraies images seront ajoutées lorsqu’elles seront disponibles.', back: 'Retour',
      explore: 'Explorer', soon: 'D’autres applications bientôt.', preparing: 'En préparation', reserved: 'Espace réservé à la prochaine application',
      welcome: 'Bienvenue sur le bureau', close: 'Fermer', minimize: 'Réduire', restore: 'Restaurer', backDesktop: 'Retour au bureau',
      showDesktop: 'Afficher le bureau', center: 'Centrer les fenêtres', minimizeActive: 'Réduire la fenêtre active',
      hideActive: 'Masquer la fenêtre active', closeActive: 'Fermer la fenêtre active', aboutPortfolio: 'À propos de ce portfolio',
      centered: 'Fenêtres centrées', closeUnavailable: 'ParTriv n’a pas répondu à la demande de fermeture. La partie reste ouverte.'
    },
    'de-DE': {
      ...common, file: 'Datei', view: 'Ansicht', window: 'Fenster', help: 'Hilfe', night: 'Nacht', dawn: 'Morgenrot', language: 'Sprache',
      desktop: 'App-Desktop', quickAccess: 'Schnellzugriff auf Apps', open: 'Öffnen', development: 'In Entwicklung',
      description: 'Beschreibung', publication: 'Veröffentlichung', appStatus: 'Veröffentlichungsstatus', published: 'Veröffentlicht',
      pending: 'Ausstehend', addCaptures: 'Echte Bilder werden ergänzt, sobald sie verfügbar sind.', back: 'Zurück', explore: 'Entdecken',
      soon: 'Weitere Apps folgen bald.', preparing: 'In Vorbereitung', reserved: 'Platz für die nächste App', welcome: 'Willkommen auf dem Desktop',
      close: 'Schließen', minimize: 'Minimieren', restore: 'Wiederherstellen', backDesktop: 'Zum Desktop', showDesktop: 'Desktop anzeigen',
      center: 'Fenster zentrieren', minimizeActive: 'Aktives Fenster minimieren', hideActive: 'Aktives Fenster ausblenden',
      closeActive: 'Aktives Fenster schließen', aboutPortfolio: 'Über dieses Portfolio', centered: 'Fenster zentriert',
      closeUnavailable: 'ParTriv hat nicht auf die Schließanfrage reagiert. Das Spiel bleibt geöffnet.'
    },
    'it-IT': {
      ...common, file: 'Archivio', view: 'Vista', window: 'Finestra', help: 'Aiuto', night: 'Notte', dawn: 'Alba', language: 'Lingua',
      desktop: 'Desktop delle applicazioni', quickAccess: 'Accesso rapido alle applicazioni', open: 'Apri', development: 'In sviluppo',
      description: 'Descrizione', publication: 'Pubblicazione', appStatus: 'Stato della pubblicazione', published: 'Pubblicata', pending: 'In attesa',
      pendingCaptures: 'Schermate in arrivo', addCaptures: 'Aggiungeremo immagini reali quando saranno disponibili.', back: 'Indietro',
      explore: 'Esplora', soon: 'Altre applicazioni in arrivo.', preparing: 'In preparazione', reserved: 'Spazio riservato alla prossima app',
      welcome: 'Benvenuto sul desktop', close: 'Chiudi', minimize: 'Riduci', restore: 'Ripristina', backDesktop: 'Torna al desktop',
      showDesktop: 'Mostra desktop', center: 'Centra finestre', minimizeActive: 'Riduci finestra attiva', hideActive: 'Nascondi finestra attiva',
      closeActive: 'Chiudi finestra attiva', aboutPortfolio: 'Informazioni sul portfolio', centered: 'Finestre centrate',
      closeUnavailable: 'ParTriv non ha risposto alla richiesta di chiusura. La partita resta aperta.'
    },
    'pt-PT': {
      ...common, file: 'Ficheiro', view: 'Ver', window: 'Janela', help: 'Ajuda', night: 'Noite', dawn: 'Amanhecer', language: 'Idioma',
      desktop: 'Área de aplicações', quickAccess: 'Acesso rápido às aplicações', open: 'Abrir', development: 'Em desenvolvimento',
      description: 'Descrição', publication: 'Publicação', appStatus: 'Estado da publicação', published: 'Publicada', pending: 'Pendente',
      pendingCaptures: 'Capturas pendentes', addCaptures: 'Serão adicionadas imagens reais quando estiverem disponíveis.', back: 'Voltar',
      explore: 'Explorar', soon: 'Mais aplicações em breve.', preparing: 'Em preparação', reserved: 'Espaço reservado para a próxima app',
      welcome: 'Bem-vindo ao ambiente de trabalho', close: 'Fechar', minimize: 'Minimizar', restore: 'Restaurar',
      backDesktop: 'Voltar ao ambiente de trabalho', showDesktop: 'Mostrar ambiente de trabalho', center: 'Centrar janelas',
      minimizeActive: 'Minimizar janela ativa', hideActive: 'Ocultar janela ativa', closeActive: 'Fechar janela ativa',
      aboutPortfolio: 'Sobre este portfólio', centered: 'Janelas centradas', closeUnavailable: 'A ParTriv não respondeu ao pedido de fecho. A partida continua aberta.'
    }
  };
  const fallback = dictionaries['es-ES'];
  function dictionary(code) { return dictionaries[code] || fallback; }
  function t(code, key, ...args) {
    let value = dictionary(code)[key] || fallback[key] || key;
    args.forEach((arg, index) => { value = value.replace(`{${index}}`, String(arg)); });
    return value;
  }
  return { locales, dictionaries, t };
})();
