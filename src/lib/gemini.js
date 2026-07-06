/**
 * Gemini Flash client — natural-language meal parsing.
 *
 * Sends the user's free-form Portuguese description to Gemini and expects a
 * strict JSON list of food items back. No SDK — plain fetch keeps the bundle
 * small and works in any modern browser.
 *
 * Free tier (Gemini 2.0 Flash): 1500 req/day, 15 req/min — plenty for a
 * single-user PWA.
 *
 * Exports: parseMealDescription, isConfigured, estimateNutrition, GeminiError
 */

import { getApiKey, getModel, hasGemini } from './settings.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** @description True when the user has stored a Gemini API key. */
export const isConfigured = hasGemini;

/** Custom error so callers can branch on Gemini-specific failures. */
export class GeminiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.cause = cause;
  }
}

/**
 * @typedef {object} GeminiFoodItem
 * @property {string} name              Canonical Portuguese name ("arroz branco cozido").
 * @property {string} quantityText      What the user said ("uma concha", "200g").
 * @property {number} grams             Best-effort gram estimate.
 * @property {number} kcal              Total kcal for the portion (not per 100 g).
 * @property {number} protein           Total grams of protein.
 * @property {number} carbs             Total grams of carbs.
 * @property {number} fat               Total grams of fat.
 * @property {number} confidence        0..1 — model's own self-rating.
 */

// JSON schema enforced via `response_mime_type: application/json` +
// `response_schema`. Gemini honours this for Flash models and the response
// is guaranteed-parseable JSON.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantityText: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          confidence: { type: 'number' },
        },
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
      },
    },
  },
  required: ['items'],
};

const SYSTEM_PROMPT = `Você é um nutricionista esportivo brasileiro. O usuário descreve uma refeição em português informal. Sua tarefa:
1. Identifique cada alimento citado (mesmo sem quantidade explícita — estime por porção típica brasileira).
2. Para cada alimento, retorne:
   - name: nome canônico em pt-BR (ex: "arroz branco cozido", "peito de frango grelhado").
   - quantityText: como o usuário descreveu ("uma concha", "200 g", "1 colher").
   - grams: peso estimado em gramas da porção comestível.
   - kcal/protein/carbs/fat: TOTAIS da porção (não por 100 g).
   - confidence: 0 a 1 — quão certo você está dos números.
3. Use a tabela TACO/UNICAMP e bom senso de medidas caseiras brasileiras (concha ≈ 80 g, colher de sopa ≈ 15 g, copo ≈ 200 ml, prato raso ≈ 300 g).
4. Some os macros: kcal ≈ protein·4 + carbs·4 + fat·9.
5. NUNCA retorne texto fora do JSON. Apenas o objeto.`;

async function callGemini(prompt, schema, system = SYSTEM_PROMPT) {
  if (!hasGemini()) throw new GeminiError('Chave Gemini não configurada.');
  const key = getApiKey();
  const model = getModel();

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: schema,
      temperature: 0.2,
    },
  };

  const url = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GeminiError('Falha de rede ao chamar o Gemini.', { cause: err });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new GeminiError(`Gemini respondeu ${res.status}: ${text.slice(0, 200)}`, { status: res.status });
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError('Gemini não retornou conteúdo.');
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new GeminiError('Resposta do Gemini não é JSON válido.', { cause: err });
  }
}

/**
 * @description Send a free-text meal description to Gemini and get a list of
 *   parsed items back. Throws GeminiError on any failure — callers should
 *   catch and fall back to the offline parser.
 * @param {string} description - User-written Portuguese description.
 * @returns {Promise<GeminiFoodItem[]>}
 * @example
 *   const items = await parseMealDescription("almocei arroz, feijão e frango grelhado");
 */
export async function parseMealDescription(description) {
  const out = await callGemini(description, RESPONSE_SCHEMA);
  return Array.isArray(out?.items) ? out.items : [];
}

const SINGLE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    kcal: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'number' },
  },
  required: ['kcal', 'protein', 'carbs', 'fat'],
};

// The default SYSTEM_PROMPT tells the model to return *portion totals*; the
// estimate below needs *per-100g* values, so it ships its own instruction to
// avoid the caller double-scaling (per-100g × grams/100).
const ESTIMATE_SYSTEM = `Você é um nutricionista brasileiro. Para o alimento pedido, retorne os valores nutricionais POR 100 g (não por porção), em JSON: kcal, protein, carbs, fat, confidence (0 a 1). kcal ≈ protein·4 + carbs·4 + fat·9. Apenas o objeto JSON.`;

/**
 * @description Per-100g nutrition estimate for a single named item. Used by
 *   the cascade as the LAST fallback when both TACO and Open Food Facts fail.
 *   Scaling to the actual portion is the caller's responsibility.
 * @param {string} foodName
 * @returns {Promise<{kcal:number,protein:number,carbs:number,fat:number,confidence:number}>}
 */
export async function estimateNutrition(foodName) {
  const out = await callGemini(
    `Estime os valores nutricionais por 100 g do alimento: "${foodName}". Retorne apenas o JSON com kcal, protein, carbs, fat, confidence.`,
    SINGLE_ITEM_SCHEMA,
    ESTIMATE_SYSTEM,
  );
  return {
    kcal: out.kcal,
    protein: out.protein,
    carbs: out.carbs,
    fat: out.fat,
    confidence: out.confidence ?? 0.5,
  };
}
