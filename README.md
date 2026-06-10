<div align="center">

# SolvyX — Landing

**Estudio de automatización con IA y desarrollo de software a medida.**
Landing de alto rendimiento construida para convertir: intro cinematográfico,
hero en video, SEO/GEO completo y un único archivo de contenido.

`Astro 5` · `Tailwind CSS v4` · `TypeScript` · `pnpm` · deploy en `Netlify`

</div>

---

## Tabla de contenido

- [Stack](#stack)
- [Inicio rápido](#inicio-rápido)
- [Editar el contenido](#editar-el-contenido)
- [Imágenes y media](#imágenes-y-media)
- [Formulario de contacto](#formulario-de-contacto)
- [Deploy](#deploy)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Sistema de diseño](#sistema-de-diseño)
- [Características](#características)

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [Astro 5](https://astro.build) — estático, cero JS por defecto |
| Estilos | [Tailwind CSS v4](https://tailwindcss.com) (tokens en OKLCH vía `@theme`) |
| Lenguaje | TypeScript |
| Gestor de paquetes | pnpm |
| Hosting | Netlify (build + Functions v2) |
| Email | [Resend](https://resend.com) (dominio verificado + relay SMTP) |
| Sitemap | `@astrojs/sitemap` |

## Inicio rápido

```bash
pnpm install     # instalar dependencias
pnpm dev         # desarrollo  → http://localhost:4321
pnpm build       # build de producción → ./dist
pnpm preview     # previsualizar el build
```

> Requiere Node 20+ y pnpm.

## Editar el contenido

**Todo** el texto, los enlaces y las rutas de imagen viven en un único archivo:

```
src/data/site.ts
```

No hace falta tocar componentes para personalizar la página. Cada sección es un
objeto o array exportado:

| Export | Controla |
| --- | --- |
| `brand` | nombre, logo, email, teléfono, dominio, link de agenda, redes |
| `founder` | bio del fundador (E-E-A-T), enlaces y avatar |
| `heroMedia` | video de fondo del hero (desktop + mobile + poster) |
| `hero` | titular, palabras animadas, lead, selector de servicios |
| `services` · `work` · `process` · `stats` | bloques de cada sección |
| `testimonials` · `packages` · `faqs` | prueba social, planes y preguntas |
| `contact` | endpoint del formulario y copy del modal |
| `footer` | columnas y enlaces del pie |

## Imágenes y media

- **Servidas** (van a producción): se colocan en `/public` y se referencian con
  ruta absoluta, p. ej. `image: '/work/novapay.jpg'`.
- **Originales pesados** (masters 4K, fuentes de logo, referencias): viven en
  `_assets-src/` — **ignorado por git y fuera del deploy**. Es el material fuente
  para regenerar assets, no se sirve.

### Pipeline de video (intro + hero)

Los clips se comprimen desde el master 4K con `ffmpeg` antes de servirse:

```bash
# 1080p H.264 (Safari) + WebM VP9 (Chrome/Firefox) + poster
ffmpeg -i master.mp4 -vf "scale=1920:-2" -c:v libx264 -crf 24 -movflags +faststart \
  -c:a aac -b:a 128k public/hero/intro.mp4
ffmpeg -i master.mp4 -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 33 \
  -c:a libopus -b:a 96k public/hero/intro.webm
```

Resultado típico: **12.7 MB → ~1.5 MB**. La versión mobile usa un recorte
vertical (9:16) centrado en el sujeto.

### Logo y favicon

En `/public`: `logo-3d.png` (marca), `favicon-16x16/32x32.png` y
`apple-touch-icon.png`. Al reemplazarlos, sube el parámetro de caché
(`?v=N`) en `src/layouts/BaseLayout.astro` para forzar la actualización.

## Formulario de contacto

El modal de contacto hace POST a una **Netlify Function** que reenvía el lead
por Resend:

```
netlify/functions/contact.mjs   → api.resend.com/emails → bandeja del negocio
```

Variable de entorno requerida en Netlify:

```
RESEND_API_KEY=re_********************
```

Sin la key, la función responde `500` (no se filtra ningún secreto al cliente).

## Deploy

`netlify.toml` ya define el build (`pnpm build` → `dist`) y la carpeta de
funciones. Cada push a `main` despliega automáticamente. Variables a configurar
en el panel de Netlify: `RESEND_API_KEY` (y `NODE_VERSION=20`).

## Estructura del proyecto

```
src/
├── data/site.ts              # ÚNICA fuente de contenido (edita aquí)
├── styles/
│   ├── global.css            # tokens de diseño + utilidades (motion, kit premium)
│   └── fonts.css             # @font-face self-hosted (Clash Display + Satoshi)
├── layouts/
│   ├── BaseLayout.astro      # shell, <head>, SEO + JSON-LD
│   └── PublicLayout.astro    # intro gate + navbar + footer + reveals
├── components/
│   ├── IntroGate.astro       # intro a pantalla completa con video
│   ├── Navbar.astro · Footer.astro
│   ├── ui/                   # Button, Icon, SectionHeading
│   └── sections/             # Hero, Services, Work, Process, Stats, …
├── scripts/
│   ├── particle-text.ts      # titular animado por partículas
│   ├── work-fan.ts           # fan 3D (desktop) + carrusel swipe (mobile)
│   └── enhance.ts            # count-up, tilt, spotlight, lazy video
└── pages/index.astro         # ensambla las secciones
public/
├── hero/                     # videos + posters (intro y loop)
├── fonts/                    # .woff2 self-hosted
└── work/ · clients/          # imágenes de casos y avatares
_assets-src/                  # originales pesados (git-ignored, no deploy)
```

## Sistema de diseño

- **Paleta** derivada del logo: azul cobalto + casi-negro + blanco cálido, en
  OKLCH (perceptualmente uniforme), neutros tintados hacia el matiz de marca.
- **Tipografías** self-hosted (`.woff2`, sin request externo): **Clash Display**
  para títulos, **Satoshi** para texto. Precargadas en el `<head>`.
- **Kit premium** (`global.css`): texto en gradiente, spotlight que sigue el
  cursor, glows tintados, hairlines de borde y sombras 3D en capas.
- **Motion** por CSS con curvas de easing fuertes + `IntersectionObserver` para
  los scroll-reveals. Todo respeta `prefers-reduced-motion`.

## Características

- 🎬 **Intro gate** — video a pantalla completa que bloquea el scroll y se revela al terminar (desktop 16:9 / mobile 9:16, best-effort autoplay con sonido).
- 🤖 **Hero en video** con titular animado por partículas y selector de servicios.
- 📱 **Carrusel swipe** de proyectos en mobile · **fan 3D** scroll-driven en desktop.
- 🔎 **SEO + GEO** — JSON-LD (`Organization`, `WebSite`, `ProfessionalService`, `Person`), Open Graph, `sitemap`, `robots.txt` y `llms.txt` para crawlers de IA.
- ⚡ **Performance** — estático, fuentes self-hosted, video lazy + comprimido, JS mínimo y diferido.
- ♿ **Accesibilidad** — foco visible, `prefers-reduced-motion`, skip-link y semántica correcta.
