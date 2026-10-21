# FlyHigh Misegamaegh Misegamae — portfolio de aplicaciones (versión 2, opción A)

Sitio **estático**, sin servidor propio ni base de datos, inspirado en el patrón de interfaz de escritorio de FramAra. Diseño, código y gráficos de esta implementación son independientes. PASfh es la primera aplicación del catálogo.

## 1. Abrir en tu ordenador

Extrae el ZIP y abre `index.html`. No es necesaria ninguna instalación.

Para simular la publicación en un servidor local (recomendado para probar enlaces e imágenes):

```bash
cd pasfh-portfolio-v2
python3 -m http.server 8000
```

Abre `http://localhost:8000/`.

## 2. ¿Cómo añadir una aplicación SIN programar?

**Edita únicamente `scripts/catalogo.js`.** En `apps`, copia la ficha de PASfh y cambia los valores:

- `id`: identificador único, por ejemplo `inventario` (minúsculas, guiones, sin espacios).
- `name`, `category`, `summary`, `description`: nombre y presentación pública.
- `platform`: por ejemplo `['Android']`, `['Windows']` o `['Web', 'Android']`.
- `status`: `development` (en desarrollo) o `published` (publicada).
- `icon`: `type: '📦'`, `color: 'blue'`, o `image: './assets/inventario/icono.png'` (si pones imagen se usa en lugar del emoji).
- `features`: características con `icon`, `title` y `description`.
- `screenshots`: capturas reales, por ejemplo `{src:'./assets/pasfh/inicio.webp', alt:'Pantalla de inicio'}`.
- `links`: destinos **reales y revisados**, por ejemplo `{label:'Descargar APK', url:'https://...'}`.

El catálogo genera automáticamente los iconos del escritorio, los accesos del dock, las fichas y el menú. **No se necesita tocar `index.html` ni `scripts/app.js`.**

Para editar nombre/titulares del portfolio cambia `studio` al inicio de `catalogo.js`.

**Importante:** `catalogo.js` es público. No guardes claves, contraseñas ni correos privados en él.

## 3. Diseño responsive

- **PC** (más de 760 px): escritorio, barra de menús, dock y varias ventanas con arrastre, minimizar, cerrar o maximizar.
- **Móvil** (hasta 760 px): cuadrícula táctil de iconos; cada app se abre como pantalla completa con botón **Inicio**, pestañas grandes y contenido desplazable. El dock se oculta al abrir una ficha para liberar espacio.
- **Tablet/tamaños intermedios**: el layout se ajusta al espacio disponible.
- No usamos detección de sistema operativo: la presentación cambia según el espacio disponible. Se puede usar en una ventana estrecha del PC, y al rotar el móvil.

## 4. Publicar en GitHub y Cloudflare Pages (sin dominio de pago)

1. Crea un repositorio de GitHub para el portfolio (por ejemplo, `mi-studio-web`).
2. Sube **el contenido de esta carpeta** a la raíz del repositorio: `index.html`, `assets/`, `scripts/`, `README.md`.
3. En Cloudflare, ve a **Workers & Pages → Create → Pages → Connect to Git** y conecta ese repositorio. La ubicación exacta de estos menús puede cambiar.
4. Usa la configuración de sitio **estático / sin framework**, con **build command vacío** y **build output directory `.`** (la raíz del repositorio). Confirma esos valores en el asistente antes de desplegar.
5. Cuando termine tendrás una dirección tipo `nombre-del-proyecto.pages.dev` sin comprar aún un dominio.
6. Cada actualización de `catalogo.js`, de capturas o de estilos se publica con un commit/push a GitHub.
7. Cuando quieras registrar un dominio, añádelo desde la configuración **Custom domains** del proyecto, ajustando DNS según las instrucciones del proveedor.

**Alternativa:** GitHub Pages también aloja este sitio estático, sin configuración de compilación.

## 5. ¿Dónde va PASfh.apk?

La web **no compila** ni ejecuta el código Android. El APK firmado se distribuye por separado, por ejemplo:

1. Generar y probar `PASfh-v1.0.apk` en un dispositivo físico.
2. Crear una versión en **GitHub Releases** (o distribuir por Google Play).
3. Copiar la URL real de descarga a `links` de PASfh en `scripts/catalogo.js`.
4. Cambiar `status` a `published`, indicar `version` y publicar el commit.

No se incluye APK ni enlace de descarga ficticio: PASfh figura **En desarrollo** hasta que exista una versión validada.

## 6. Evolución al panel privado (opción B)

La ficha ya está estructurada como datos. El futuro panel podrá editar los mismos campos, almacenarlos en una base de datos y gestionar las subidas de imágenes y versiones con permisos seguros. Eso requerirá backend, autenticación, almacenamiento y posiblemente costes extra; **no viene integrado ni simulado como operativo en esta versión**.

## 7. Cosas pendientes para una publicación pública definitiva

- Escoger nombre y dominio; revisar los textos generales.
- Sustituir el icono provisional y añadir capturas reales de PASfh.
- Preparar y validar la versión instalable, si se ofrecerá descarga.
- Revisar avisos legales, privacidad y licencias según la actividad que realices.

El catálogo funciona sin llamadas a servicios de terceros; no se recopilan datos personales desde esta demo.


## Cambios rápidos de la v3

- Branding principal actualizado a **FlyHi**.
- Inicio simplificado: solo título e indicación **Aplicaciones personales**.
- Controles de ventana más claros, sin estilo tipo macOS.
- Al pulsar una app ya abierta, ahora se **oculta**; al pulsarla de nuevo, **reaparece**.
