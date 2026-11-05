# Fly High — Portfolio v4

Web estática inspirada en un escritorio de aplicaciones (implementación original). Primera aplicación: PASfh, **En desarrollo**. No contiene un APK validado.

## Abrir y probar

Descomprime el ZIP, abre `index.html` en tu navegador. Puedes cambiar entre **Azul Noche Elegante** y **Amanecer Radiante** en la barra superior. El tema se recuerda en el navegador; al abrirlo por primera vez se usa la preferencia clara/oscura del sistema. Funciona en móvil, tablet y escritorio.

## Cambiar la información de una app

Edita únicamente `scripts/catalogo.js`: allí están nombre, descripción, icono, estado, características, capturas y enlaces. No coloques contraseñas o claves allí: el archivo es público.

## Actualizar el repositorio de GitHub ya creado

Descomprime y **sustituye en la raíz de tu repositorio** los archivos `index.html`, `assets/`, `scripts/` y `README.md` por los de esta v4. Evita colocar la carpeta v4 entera dentro del repositorio; `index.html` debe permanecer en la raíz. Desde Git Bash, dentro del proyecto:

```bash
git status
git add index.html assets scripts README.md
git commit -m "Fly High v4: temas Noche y Amanecer"
git push origin main
```

## Publicar en Cloudflare Pages

Conecta tu repositorio en Cloudflare Pages desde el apartado **Workers & Pages**. Para esta web estática no se necesita compilación: selecciona framework `None`, deja el comando de build vacío y el directorio de salida como `.` (raíz). Si ya has conectado Cloudflare Pages, cada push a main actualizará el sitio.

## PASfh real

Cuando exista una APK firmada y probada, súbela a GitHub Releases o enlaza Google Play; añade la dirección real en `links` de PASfh en `catalogo.js` y cambia `status` a `published`. Incluye capturas reales en `assets/pasfh/` y configura `screenshots` en el catálogo. No se han inventado instaladores o capturas de PASfh.

## Party / ParTriv

Party se mantiene como una aplicación web independiente. Su ficha está en `scripts/catalogo.js` y usa el icono oficial copiado a `assets/partriv_logo_dark.png`.

La ficha separa las tres acciones: jugar integrado, abrir `/apps/party/` como página de nivel superior para instalar la PWA y descargar Android. La descarga Android permanece desactivada hasta configurar una URL HTTPS real, tamaño y SHA-256 en `apps[].android`; no se inventan enlaces ni se ofrecen artefactos de desarrollo.

## Distribución local integrada

Con ParTriv disponible en `..\ParTriv`, ejecuta desde PowerShell:

```powershell
.\scripts\build-local.ps1
```

El script siempre recompila `ParTriv.Web` desde el código fuente actual, limpia las salidas anteriores y genera `dist/apps/party/` con las rutas de `base href`, manifiesto y service worker limitadas a `/apps/party/`. No se reutiliza una publicación Release previa.

La salida `dist/` no forma parte del repositorio. En producción, el pipeline deberá construir ParTriv desde su repositorio y entregar esa carpeta como artefacto del Worker.

La modalidad ZIP es avanzada y opcional. Genera todos los estáticos, no solo `index.html`, y debe ejecutarse con un servidor HTTP local:

```powershell
.\scripts\build-local.ps1 -ZipPath .local\ParTriv-Web-offline.zip
python -m http.server 8080 --directory dist\apps\party
```

Para publicar FlyHigh y Party bajo el mismo dominio, el pipeline debe usar `dist/` como único directorio de salida y ejecutar `build-local.ps1` antes del despliegue. No hay configuración Wrangler ni credenciales de Cloudflare en este repositorio; la cuenta, proyecto Worker y reglas de assets deben aportarse antes de autorizar la publicación.

## Archivos

- `index.html`: estructura HTML y selector de tema.
- `assets/styles.css`: estilos base + los dos temas.
- `assets/flyhigh-logo.webp`: emblema elegido de la pluma/bombilla.
- `assets/partriv_logo_dark.png`: icono oficial de Party / ParTriv Web.
- `assets/favicon-64.png` y `favicon-192.png`: iconos para pestañas y dispositivos.
- `scripts/catalogo.js`: aplicaciones publicadas.
- `scripts/app.js`: ventanas, navegación y preferencia de tema.

La web no tiene panel privado; puede añadirse más adelante manteniendo la estructura de catálogo.
