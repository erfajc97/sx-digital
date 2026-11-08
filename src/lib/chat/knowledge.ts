/* Solvy's knowledge base (knowledge.json), validated at load so a bad edit
   fails loudly in tests/build instead of feeding the model garbage. */
import { z } from 'zod';
import raw from './knowledge.json';

const Plan = z.object({
  nombre: z.string().min(1),
  precio: z.string().min(1),
  plazo: z.string().min(1),
  para_quien: z.string().min(1),
  incluye: z.array(z.string()),
});

export const KnowledgeSchema = z.object({
  empresa: z.object({ nombre: z.string(), que_hacemos: z.string() }).loose(),
  servicios: z.array(z.object({ id: z.string(), nombre: z.string(), descripcion: z.string() }).loose()).min(1),
  planes: z.array(Plan).min(1),
  politica_precios: z.string().min(1),
  plazos: z.string().min(1),
  casos_reales: z.array(z.object({ cliente: z.string(), url: z.string() }).loose()),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  contacto: z.object({}).loose(),
}).loose();

export type Knowledge = z.infer<typeof KnowledgeSchema>;

export const knowledge: Knowledge = KnowledgeSchema.parse(raw);

/** Output of get_pricing_info: plans + policy, nothing else. */
export const PricingSchema = z.object({
  planes: z.array(Plan),
  politica: z.string(),
  siguiente_paso: z.string(),
});

export function pricingInfo() {
  return PricingSchema.parse({
    planes: knowledge.planes,
    politica: knowledge.politica_precios,
    siguiente_paso: 'Llamada de 30 min (booking_link) → presupuesto cerrado en 24 h. Alternativa: WhatsApp (whatsapp_handoff).',
  });
}

/** Compact JSON for the system prompt (no editor notes). */
export function knowledgeForPrompt(): string {
  const { _nota: _n, ...rest } = raw as Record<string, unknown>;
  return JSON.stringify(rest);
}
