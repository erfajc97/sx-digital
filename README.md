# SolvyX — Landing

Landing page para captar clientes. Vende software a medida, apps móviles,
páginas web, dashboards y automatización con IA.

Construida con **Astro** (astro-first, cero React), **Tailwind CSS v4** y
**pnpm**. Todo el contenido vive en un solo archivo de datos para que puedas
editar textos, links e imágenes sin tocar componentes.

## Comandos

```bash
pnpm install     # instalar dependencias
pnpm dev         # servidor de desarrollo (http://localhost:4321)
pnpm build       # build de producción -> ./dist
pnpm preview     # previsualizar el build
```

## Editar el contenido (lo más importante)

Todo el texto, los links y las imágenes están en **`src/data/site.ts`**.
No necesitas tocar nada más para personalizar la página.

- **Marca**: nombre, logo, email, teléfono, link de agenda (`brand`).
- **Hero, servicios, trabajo, proceso, planes, testimonios, FAQ**: cada sección
  es un objeto/array exportado en ese archivo.

### Imágenes

Las imágenes usan placeholders de `picsum.photos` para que la página funcione
de inmediato. Para usar tus propias imágenes:

1. Coloca los archivos en `/public` (ya existen `public/work/` y
   `public/clients/`).
2. En `src/data/site.ts`, cambia la URL por la ruta absoluta. Ejemplo:

   ```ts
   // antes
   image: 'https://picsum.photos/seed/solvyx-ledger/1200/900',
   // después
   image: '/work/ledgerframe.jpg',
   ```

### Logo y favicon

Están en `/public/logo.png` y `/public/favicon.png`. Reemplaza esos archivos
manteniendo el nombre y se actualizan en toda la página.

## Estructura

```
src/
├── data/site.ts            # ÚNICA fuente de contenido (edita aquí)
├── styles/global.css       # tokens de diseño (colores, fuentes, motion)
├── layouts/                # BaseLayout (shell + SEO) + PublicLayout (nav/footer)
├── components/
│   ├── Navbar.astro / Footer.astro
│   ├── ui/                 # Button, Icon, SectionHeading
│   └── sections/           # Hero, Services, Work, Process, Stats, etc.
└── pages/index.astro       # ensambla las secciones
```

## Notas de diseño

- Paleta derivada del logo: azul cobalto + casi-negro + blanco cálido (OKLCH).
- Tipografías: Clash Display (títulos) + Satoshi (texto), vía Fontshare.
- Animaciones por CSS (curvas de easing fuertes) + un script de scroll-reveal.
  Respeta `prefers-reduced-motion`.
