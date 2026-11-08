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
- [Captación de leads · Auditoría IA](#captación-de-leads--auditoría-ia)
- [Solvy · chatbot de captación](#solvy--chatbot-de-captación)
- [Medición y analítica](#medición-y-analítica)
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
| Hosting | Netlify (estático + `/api/*` como Function vía `@astrojs/netlify`) |
| Email | [Resend](https://resend.com) (dominio verificado + relay SMTP) |
| Sitemap | `@astrojs/sitemap` |
| Leads | Supabase · Claude (`@anthropic-ai/sdk`) · Slack · zod · vitest |
| Analítica | PostHog (UE) con banner de consentimiento |

## Inicio rápido

```bash
pnpm install     # instalar dependencias
pnpm dev         # desarrollo  → http://localhost:4321
pnpm build       # build de producción → ./dist
pnpm preview     # previsualizar el build
```

> Requiere Node 20+. Si `pnpm` no está instalado, usa el de corepack (incluido en Node): `corepack pnpm install` y `corepack pnpm dev`.

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
| `team` | equipo (nombre, cargo, bio, badges, foto, enlaces) — orden = orden en /nosotros |
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

## Captación de leads · Auditoría IA

Herramienta "Auditoría IA gratis" (`/auditoria` · `/en/audit`) + pipeline único
de leads para la auditoría, el formulario de contacto y las reservas de Cal.com.

```
Formulario /auditoria ──► POST /api/audit
                            ├─ zod + honeypot + rate limit (3/h por IP · 5/día por dominio)
                            ├─ guarda lead (Supabase · leads, source=audit)
                            ├─ safeFetch (SSRF-safe, 8 s, 2 MB, ≤3 redirecciones)
                            ├─ extractSignals (sin IA: SEO, contacto, reservas/pagos, schema, OG…)
                            ├─ Claude → JSON validado con zod
                            ├─ guarda auditoría (audits)
                            ├─ email del informe completo (Resend)
                            └─ lead_score ≥ 70 → Slack + contact@solvyxdigital.com
                         ◄── solo los 3 hallazgos principales + puntuación
ContactModal ───────────► POST /api/contact        (leads, source=contact + email al buzón)
Cal.com BOOKING_CREATED ► POST /api/webhooks/cal   (firma HMAC, leads, source=calcom)
```

Si la web no carga o la IA falla, el lead **se guarda igualmente** y el usuario
ve un mensaje amable con el CTA a la llamada.

### Arquitectura

- `output: 'static'` + adaptador `@astrojs/netlify`: todas las páginas siguen
  siendo HTML estático; solo `src/pages/api/**` (`prerender = false`) se
  despliega como Netlify Function.
- `src/lib/leads/` — lógica de servidor, cada servicio detrás de una interfaz
  (`ILLM`, `IEmail`, `INotifier`, `ILeadStore`, `IRateLimiter` en `types.ts`).
  `services.ts` usa la implementación real si existe la clave y un **mock**
  (consola / memoria / informe basado en reglas) si no.
- `src/components/audit/` — formulario y página de resultados (el resultado
  viaja en `sessionStorage`, nunca en la URL).
- `supabase/migrations/` — tablas `leads`, `audits`, `rate_limit_hits` con RLS
  activado y sin políticas: solo la `service_role` del servidor accede.

### Probar en local

```bash
pnpm install
cp .env.example .env     # opcional: sin claves todo funciona en modo mock
pnpm dev                 # http://localhost:4321/auditoria
pnpm test                # vitest: señales, SSRF, JSON de la IA, rate limit, Cal.com
```

En modo mock los emails, avisos y leads se imprimen en la consola de `pnpm dev`
y el informe lo genera un analizador por reglas (marcado `[MOCK]`). Añade solo
`ANTHROPIC_API_KEY` para probar el análisis real con Claude.

Prueba rápida del endpoint:

```bash
curl -X POST http://localhost:4321/api/audit -H "Content-Type: application/json" \
  -d '{"url":"example.com","name":"Ana","email":"ana@example.com","sector":"otro","consent":true}'
```

> En Windows, `pnpm build` termina con `EPERM: operation not permitted, symlink`
> al empaquetar la función: Windows no deja crear symlinks sin el *Modo
> desarrollador* (Configuración → Sistema → Para programadores). Las páginas se
> generan bien y en Netlify (Linux) el build completo funciona.

### Desplegar en Netlify

1. **Supabase**: crea el proyecto (región UE), abre *SQL Editor* y ejecuta
   `supabase/migrations/20261104000000_leads_audits.sql` (o `supabase db push`).
   Activa la extensión `pg_cron` antes si quieres el borrado automático de los
   registros anti-abuso a los 30 días (lo indica la política de privacidad).
2. **Netlify → Site configuration → Environment variables** (ver `.env.example`):
   `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
   `RESEND_API_KEY`, `SLACK_WEBHOOK_URL`, `CALCOM_WEBHOOK_SECRET`, `IP_HASH_SALT`.
3. **Cal.com → Settings → Developer → Webhooks**: URL
   `https://solvyxdigital.com/api/webhooks/cal`, evento `BOOKING_CREATED` y el
   mismo secreto que `CALCOM_WEBHOOK_SECRET`.
4. Push a `main` → Netlify construye y publica.

**Tiempo límite**: las funciones síncronas de Netlify cortan a ~10–30 s según el
plan. `/api/audit` trabaja con un presupuesto (`AUDIT_BUDGET_MS`, 24 s por
defecto): descarga ≤ 8 s y la IA usa el resto menos un margen. Si tu plan corta
a 10 s, baja `AUDIT_BUDGET_MS` a `9000` y usa `ANTHROPIC_MODEL=claude-haiku-5-5`.
Si la IA no llega a tiempo, el lead queda guardado (`status = llm_failed`) y el
equipo recibe un aviso para revisarlo a mano.

### Ver los leads

En Supabase: tablas `leads` y `audits`, o la vista `hot_leads` (auditorías
ordenadas por `lead_score`). Los avisos de Slack/email enlazan a la fila de la
auditoría en Supabase Studio.

## Solvy · chatbot de captación

Botón flotante con la mascota (encima del de WhatsApp) en todas las páginas
públicas. Convierte visitas en leads cualificados y demuestra en vivo lo que
vendemos: audita la web del visitante, simula su propio bot y lo pasa a una
llamada o a WhatsApp.

```
SolvyChat.astro (botón + reglas proactivas, ~2 KB)
   └─ al abrir: import() de src/scripts/solvy/chat-ui.ts (+ CSS)  ← carga diferida
        └─ POST /api/chat  (NDJSON en streaming)
             ├─ zod · rate limit (30 msg/sesión · 100/día por IP) · 1.000 caracteres
             ├─ filtro de inyección de prompt (respuesta fija, sin llamar al modelo)
             ├─ Claude (CHAT_MODEL, por defecto claude-haiku-5-5) ⇄ herramientas:
             │    run_audit · get_pricing_info · request_consent · save_lead
             │    booking_link · whatsapp_handoff · start_demo
             ├─ conversación anónima (sin emails ni teléfonos) → chat_sessions, 30 días
             └─ si el modelo falla: mensaje amable + botones a WhatsApp y Cal.com
```

- **Prompt y conocimiento editables**: `src/lib/chat/system-prompt.md`
  (personalidad, reglas, modo demo) y `src/lib/chat/knowledge.json` (servicios,
  planes, caso Escapadas Madrid, FAQ). Solvy solo sabe lo que hay ahí; los
  precios son los de la web (sin cifras: presupuesto cerrado en 24 h tras la
  llamada). Si cambias planes o FAQ en `src/data/site.ts`, actualiza el JSON.
- **Consentimiento**: antes de pedir el email Solvy muestra una casilla con
  enlace a la política de privacidad. `save_lead` se niega en el servidor si la
  casilla no está marcada o si el email no lo escribió el visitante.
- **Leads**: misma tabla `leads` (`source = 'chat'`, cualificación en `meta`) y
  vista `chat_leads`. Puntuación ≥ `LEAD_SCORE_ALERT` (70) → Slack/email. Si
  auditó su web en el chat, recibe el informe completo por email.
- **Estado firmado**: el turno de la demo (máx. 5), la auditoría y el lead viajan
  en un token HMAC (`CHAT_STATE_SECRET`); el navegador no puede falsificarlo.
- **Apertura proactiva** (`src/lib/chat/proactive.ts`): 40 s en `#planes`,
  formulario de auditoría empezado y sin enviar en 60 s, o visita con
  `utm_source` de anuncios (tras 8 s). Una vez por sesión y nunca tras cerrarlo.
  En escritorio se abre el panel; en móvil sale una burbuja (no tapamos la
  pantalla entera sin que el usuario lo pida).
- **PostHog**: `chat_opened` (trigger: manual / proactive_pricing / form_abandon
  / ads), `chat_quick_reply`, `chat_audit_run`, `chat_demo_started`,
  `chat_lead_captured` (puntuacion), `chat_booking_click`, `chat_whatsapp_handoff`.

### Probar Solvy en local

```bash
pnpm dev     # sin ANTHROPIC_API_KEY responde un mock con guion (marca los 4 flujos)
pnpm test    # tests/chat.test.ts: proactivo, rate limit, consentimiento, WhatsApp, inyección y flujos
```

Abre http://localhost:4321 y pulsa la mascota. Flujos para probar:

1. **Auditoría → email → lead**: "Audita mi web" → escribe un dominio → "sí" →
   marca la casilla → "Me llamo Ana, ana@ejemplo.com". El lead y el email del
   informe salen en la consola de `pnpm dev`.
2. **Demo**: "Prueba tu propio bot" → "Tengo una inmobiliaria" → 5 mensajes como
   cliente → Solvy sale del personaje y ofrece la llamada.
3. **Precio**: "¿Cuánto cuesta?" → planes y "presupuesto en 24 h", sin cifras.
4. **API caída**: pon `CHAT_SIMULATE_FAILURE=1` en `.env` y reinicia `pnpm dev`
   → mensaje amable + botones a WhatsApp y Cal.com.

Para probar la apertura proactiva abre `/?utm_source=google` (8 s) o quédate 40 s
en la sección de planes. Se recuerda por sesión: usa una pestaña nueva o borra
`solvy-shown` / `solvy-dismissed` de sessionStorage.

En producción ejecuta además `supabase/migrations/20261108000000_solvy_chat.sql`.

## Medición y analítica

Para saber qué hacen las visitas y qué canal trae clientes.

| Pieza | Qué hace | Dónde |
| --- | --- | --- |
| PostHog (UE) | visitas, clics, embudos, mapas de calor, grabaciones | `src/scripts/analytics.ts` |
| Banner de cookies | Aceptar / Rechazar con el mismo peso; se reabre desde "Cookies" en el pie | `src/components/CookieConsent.astro` |
| Atribución | UTM, gclid/fbclid y web de origen de la visita → `leads.meta.attribution` | `src/lib/analytics/attribution.ts` |
| Informes | vistas SQL por semana, canal y embudo de la auditoría | `supabase/migrations/20261105000000_lead_reporting.sql` |

**Privacidad**: sin consentimiento PostHog funciona *sin cookies* (id en
memoria, sin grabación de sesiones). Si aceptan, guarda un id persistente y graba
sesiones con todos los campos de formulario ocultos; al rechazar se borran las
cookies `ph_*`. Sin `PUBLIC_POSTHOG_KEY` no se carga nada y no aparece el banner.
Se carga cuando el navegador está libre, así no frena la carga de la página.

**Eventos** (además de páginas vistas y autocapture):

| Evento | Cuándo |
| --- | --- |
| `audit_cta_click` | clic en cualquier enlace a la auditoría (con la sección) |
| `audit_form_start` → `audit_submitted` → `audit_result` → `audit_result_view` | embudo de la auditoría (`status`, `score`, `top_service`) |
| `booking_click` / `booking_completed` | clic en un CTA de Cal.com / reserva confirmada en el embed |
| `contact_open` / `contact_submitted` | modal de contacto |
| `whatsapp_click`, `phone_click`, `email_click`, `social_click` | métodos de contacto |
| `service_selected` | pills de servicios del hero |
| `scroll_depth` | 25 / 50 / 75 / 100 % |
| `nav_click`, `lang_switch` | navegación |

En desarrollo cada evento sale en la consola del navegador como `[track]`.
Desde cualquier script: `import { track } from '@/scripts/analytics'` o
`window.dispatchEvent(new CustomEvent('sx:track', { detail: { name, props } }))`.

**Activarlo**
1. Crea un proyecto en [PostHog](https://eu.posthog.com) (**región EU**).
2. En Netlify añade `PUBLIC_POSTHOG_KEY` (`phc_…`) y, si hace falta,
   `PUBLIC_POSTHOG_HOST`. Son variables de *build*: vuelve a desplegar.
3. En PostHog crea el embudo `audit_cta_click → audit_submitted → audit_result →
   booking_click` y activa *Heatmaps* y *Session replay*.
4. Ejecuta la segunda migración de Supabase para las vistas
   `leads_weekly`, `audit_funnel_weekly` (tasa de reserva tras la auditoría) y
   `channel_performance` (qué canal trae leads que reservan).

**Campañas**: etiqueta los enlaces con UTM
(`?utm_source=instagram&utm_medium=social&utm_campaign=auditoria-nov`). Cada
lead guarda el canal (`paid_search`, `paid_social`, `organic_search`,
`ai_search`, `social`, `referral`, `email`, `direct`…). El CTA de reserva de los
resultados lleva `utm_source=solvyx_audit`, así las reservas que vienen de la
auditoría se identifican en el webhook de Cal.com.

## Deploy

`netlify.toml` ya define el build (`pnpm build` → `dist`) y la carpeta de
adaptador `@astrojs/netlify`. Cada push a `main` despliega automáticamente.
Variables: ver [Desplegar en Netlify](#desplegar-en-netlify) y `.env.example`.

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

- **Paleta** dark-first muestreada de la mascota: navy profundo + cobalto
  eléctrico (mismo hue que el logo) + acentos cian y magenta, en OKLCH.
  Todos los pares texto/fondo cumplen WCAG AA (≥ 4.5:1). Reglas de uso en
  `.impeccable.md`.
- **Tipografías** self-hosted (`.woff2`, sin request externo): **Clash Display**
  para títulos, **Satoshi** para texto. Precargadas en el `<head>`.
- **Kit premium** (`global.css`): gradiente neón (`--gradient-neon`, `.btn-neon`,
  `.panel-neon`, `.text-gradient`), spotlight que sigue el cursor, glows tintados, hairlines de borde y sombras 3D en capas.
- **Motion** por CSS con curvas de easing fuertes + `IntersectionObserver` para
  los scroll-reveals. Todo respeta `prefers-reduced-motion`.

## Características

- 🎬 **Intro gate** — video a pantalla completa que bloquea el scroll y se revela al terminar (desktop 16:9 / mobile 9:16, best-effort autoplay con sonido).
- 🤖 **Hero en video** con titular animado por partículas y selector de servicios.
- 📱 **Carrusel swipe** de proyectos en mobile · **fan 3D** scroll-driven en desktop.
- 🔎 **SEO + GEO** — JSON-LD (`Organization`, `WebSite`, `ProfessionalService`, `Person`), Open Graph, `sitemap`, `robots.txt` y `llms.txt` para crawlers de IA.
- ⚡ **Performance** — estático, fuentes self-hosted, video lazy + comprimido, JS mínimo y diferido.
- ♿ **Accesibilidad** — foco visible, `prefers-reduced-motion`, skip-link y semántica correcta.
