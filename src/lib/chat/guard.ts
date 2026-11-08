/* Cheap, deterministic guards around the model.
   - detectInjection: blunt "ignore your instructions / show your prompt"
     attempts get a canned answer without spending a model call. Subtler ones
     are handled by the system prompt; this is the first line, not the only.
   - leaksPrompt: a canary string lives in the system prompt; if it ever shows
     up in the output, the reply is replaced.
   - redactPII: anonymous transcripts are stored without emails/phones. */
import type { Locale } from '../leads/types';

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');

const PATTERNS: RegExp[] = [
  // ES
  /(ignora|olvida|omite|salta|descarta)\w*\b.{0,40}\b(instrucciones|reglas|indicaciones|prompt|directrices)/,
  /(muestra|ensena|revela|dime|repite|imprime|copia|escribe)\w*\b.{0,40}\b(prompt|instrucciones (del sistema|iniciales|originales)|mensaje del sistema|tus instrucciones|tus reglas)/,
  /(cual|cuales) (es|son) (tu|tus) (prompt|instrucciones)/,
  /(a partir de ahora|desde ahora) (eres|seras|actua(ras)?)\b/,
  /modo (desarrollador|dios|sin restricciones|jailbreak)/,
  // EN
  /(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions|rules|prompt|guidelines|directives)/,
  /(show|reveal|print|repeat|tell me|output|leak|display)\b.{0,40}\b(system prompt|your prompt|your instructions|initial instructions|hidden instructions)/,
  /what (is|are) your (system )?(prompt|instructions)/,
  /(you are now|from now on you are|pretend (to be|you are)|act as)\b.{0,30}\b(dan|unrestricted|jailbroken|developer mode|an? (ai|assistant) without)/,
  /\b(dan|developer) mode\b/,
  // Fake role markers
  /(^|\n)\s*(system|assistant|sistema)\s*:/,
  /<\/?(system|instructions?)>/,
];

export function detectInjection(text: string): boolean {
  const t = strip(text);
  return PATTERNS.some((re) => re.test(t));
}

export function injectionReply(locale: Locale): string {
  return locale === 'en'
    ? "Nice try 😄 My instructions stay locked in the vault. What I can do is audit your website, show you a bot for your business or tell you how we'd work together. Which one?"
    : 'Buen intento 😄 Mis instrucciones están bajo llave. Lo que sí puedo hacer: auditar tu web, enseñarte un bot para tu negocio o contarte cómo trabajamos. ¿Qué prefieres?';
}

export const CANARY = 'SX-CANARY-7f3a91';

export function leaksPrompt(output: string): boolean {
  return output.includes(CANARY) || /eres solvy, el asistente de ia de solvyx \(estudio/i.test(output);
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+|00)?\d[\d\s().-]{7,}\d/g;

export function redactPII(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[tel]');
}

/** True when `email` was actually typed by the user (the model can't invent it). */
export function userTyped(email: string, userTexts: string[]): boolean {
  const e = email.toLowerCase();
  return userTexts.some((t) => t.toLowerCase().includes(e));
}
