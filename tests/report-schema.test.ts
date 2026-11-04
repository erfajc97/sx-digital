import { describe, expect, it } from 'vitest';
import { publicView, validateReport } from '@/lib/leads/report-schema';

const hallazgo = (n: number, servicio = 'automatizacion_ia') => ({
  titulo: `Hallazgo ${n}`,
  problema: 'No hay WhatsApp ni tel:',
  impacto: 'Se pierden contactos móviles',
  solucion: 'Añadir WhatsApp con asistente IA',
  servicio_solvyx: servicio,
});

const valid = () => ({
  negocio_detectado: 'Pizzería Lucca',
  sector: 'restauracion',
  puntuacion_web: 42,
  hallazgos: [hallazgo(1), hallazgo(2, 'marketing_ads'), hallazgo(3, 'web_app'), hallazgo(4, 'multimedia_ia')],
  quick_wins: ['a', 'b', 'c'],
  lead_score: 81,
  resumen_para_ventas: 'Línea 1\nLínea 2\nLínea 3',
});

describe('validateReport', () => {
  it('accepts a valid report object', () => {
    const r = validateReport(valid());
    expect(r.ok).toBe(true);
  });

  it('accepts JSON strings, including ```json fences', () => {
    expect(validateReport(JSON.stringify(valid())).ok).toBe(true);
    expect(validateReport('```json\n' + JSON.stringify(valid()) + '\n```').ok).toBe(true);
  });

  it('rejects malformed JSON', () => {
    expect(validateReport('{"negocio_detectado": ')).toEqual({ ok: false, error: 'invalid_json' });
  });

  it('rounds scores and rejects out-of-range values', () => {
    const r = validateReport({ ...valid(), puntuacion_web: 41.6 });
    expect(r.ok && r.report.puntuacion_web).toBe(42);
    expect(validateReport({ ...valid(), lead_score: 140 }).ok).toBe(false);
    expect(validateReport({ ...valid(), puntuacion_web: -1 }).ok).toBe(false);
    expect(validateReport({ ...valid(), lead_score: '80' }).ok).toBe(false);
  });

  it('rejects unknown SolvyX services', () => {
    const bad = valid();
    bad.hallazgos[0].servicio_solvyx = 'seo_magic';
    const r = validateReport(bad);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/hallazgos\.0\.servicio_solvyx/);
  });

  it('trims to max 6 findings and exactly 3 quick wins, but never pads', () => {
    const many = { ...valid(), hallazgos: Array.from({ length: 9 }, (_, i) => hallazgo(i + 1)), quick_wins: ['1', '2', '3', '4'] };
    const r = validateReport(many);
    expect(r.ok && r.report.hallazgos.length).toBe(6);
    expect(r.ok && r.report.quick_wins).toEqual(['1', '2', '3']);
    expect(validateReport({ ...valid(), quick_wins: ['1', '2'] }).ok).toBe(false);
    expect(validateReport({ ...valid(), hallazgos: [] }).ok).toBe(false);
  });

  it('rejects missing or empty required fields', () => {
    const { resumen_para_ventas: _omit, ...rest } = valid();
    expect(validateReport(rest).ok).toBe(false);
    expect(validateReport({ ...valid(), negocio_detectado: '  ' }).ok).toBe(false);
    expect(validateReport(null).ok).toBe(false);
    expect(validateReport([valid()]).ok).toBe(false);
  });

  it('publicView exposes only the top 3 findings and the score', () => {
    const r = validateReport(valid());
    if (!r.ok) throw new Error(r.error);
    const view = publicView(r.report);
    expect(view.hallazgos).toHaveLength(3);
    expect(view).not.toHaveProperty('lead_score');
    expect(view).not.toHaveProperty('resumen_para_ventas');
  });
});
