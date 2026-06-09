/* =====================================================================
   Netlify Function — recibe el formulario de contacto de la landing y
   envía el lead por email usando Resend (https://resend.com).

   Endpoint:  /.netlify/functions/contact
   Requiere:  variable de entorno RESEND_API_KEY (configurada en Netlify).
   Destino:   solvyxdigital@gmail.com
   ===================================================================== */

const TO = 'solvyxdigital@gmail.com';
const FROM = 'SolvyX Web <noreply@solvyxdigital.com>';

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({ error: 'Email service not configured' }, 500);
  }

  // Aceptamos tanto multipart/form-data (FormData del navegador) como JSON.
  let data = {};
  const type = req.headers.get('content-type') || '';
  try {
    if (type.includes('application/json')) {
      data = await req.json();
    } else {
      const form = await req.formData();
      data = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const nombre = str(data.nombre);
  const correo = str(data.correo);
  const empresa = str(data.empresa);
  const proyecto = str(data.proyecto);
  const mensaje = str(data.mensaje);

  if (!nombre || !correo) {
    return json({ error: 'Faltan campos requeridos (nombre y correo).' }, 400);
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#1a1a2e;line-height:1.6">
      <h2 style="margin:0 0 12px">Nuevo lead desde solvyxdigital.com</h2>
      <p><strong>Nombre:</strong> ${esc(nombre)}</p>
      <p><strong>Correo:</strong> ${esc(correo)}</p>
      <p><strong>Empresa:</strong> ${esc(empresa) || '—'}</p>
      <p><strong>Tipo de proyecto:</strong> ${esc(proyecto) || '—'}</p>
      <p><strong>Mensaje:</strong><br>${esc(mensaje).replace(/\n/g, '<br>') || '—'}</p>
    </div>
  `;

  const text = [
    'Nuevo lead desde solvyxdigital.com',
    `Nombre: ${nombre}`,
    `Correo: ${correo}`,
    `Empresa: ${empresa || '—'}`,
    `Tipo de proyecto: ${proyecto || '—'}`,
    '',
    mensaje || '—',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: correo,
      subject: `Nuevo proyecto: ${proyecto || 'Contacto'} — ${nombre}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return json({ error: 'No se pudo enviar el mensaje.', detail }, 502);
  }

  return json({ ok: true });
};

function str(v) {
  return (v == null ? '' : String(v)).trim();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
