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

## Archivos

- `index.html`: estructura HTML y selector de tema.
- `assets/styles.css`: estilos base + los dos temas.
- `assets/flyhigh-logo.webp`: emblema elegido de la pluma/bombilla.
- `assets/favicon-64.png` y `favicon-192.png`: iconos para pestañas y dispositivos.
- `scripts/catalogo.js`: aplicaciones publicadas.
- `scripts/app.js`: ventanas, navegación y preferencia de tema.

La web no tiene panel privado; puede añadirse más adelante manteniendo la estructura de catálogo.
