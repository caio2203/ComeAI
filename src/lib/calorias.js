/**
 * BMR / TDEE / macro target formulas. Pure functions, no side effects.
 *
 * Three BMR formulas:
 *   - Mifflin-St Jeor (1990)   — most accurate for the general population.
 *   - Harris-Benedict revised  — older, slightly overestimates BMR.
 *   - Katch-McArdle            — accounts for lean body mass, best for
 *                                lean / athletic users (requires body-fat %).
 *
 * Activity factors come from the FAO/WHO PAL (Physical Activity Level) bands.
 *
 * Goals:
 *   - cutting    : TDEE − 500 kcal (≈ 0.5 kg/week deficit)
 *   - maintenance: TDEE
 *   - bulk       : TDEE + 300 kcal (lean bulk; aggressive bulk would be +500)
 *
 * Default macro split:
 *   - protein 2.2 g/kg (cutting) or 1.8 g/kg (maintenance/bulk)
 *   - fat     25% of kcal (preserves hormonal floor)
 *   - carbs   fill the remainder
 *
 * Atwater factors used to convert macros → kcal: 4·P + 4·C + 9·F.
 *
 * Exports: bmr, tdee, kcalForGoal, macroTargets, computeAll,
 *          ACTIVITY_LEVELS, GOALS, FORMULAS
 */

/**
 * @typedef {'mifflin'|'harris'|'katch'} FormulaId
 * @typedef {'sedentary'|'light'|'moderate'|'active'|'very_active'} ActivityId
 * @typedef {'cutting'|'maintenance'|'bulk'} GoalId
 * @typedef {'m'|'f'} Sex
 */

export const FORMULAS = [
  { id: 'mifflin', label: 'Mifflin-St Jeor', hint: 'Mais preciso (recomendado)' },
  { id: 'harris',  label: 'Harris-Benedict', hint: 'Clássica revisada (1984)' },
  { id: 'katch',   label: 'Katch-McArdle',   hint: 'Requer % de gordura' },
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Sedentário',  hint: 'Trabalho de mesa, sem treino', factor: 1.2 },
  { id: 'light',      label: 'Leve',        hint: '1-3 treinos/semana',           factor: 1.375 },
  { id: 'moderate',   label: 'Moderado',    hint: '3-5 treinos/semana',           factor: 1.55 },
  { id: 'active',     label: 'Ativo',       hint: '6-7 treinos/semana',           factor: 1.725 },
  { id: 'very_active',label: 'Muito ativo', hint: '2x/dia ou trabalho braçal',    factor: 1.9 },
];

export const GOALS = [
  { id: 'cutting',     label: 'Cutting',     hint: '−500 kcal · perda de gordura', delta: -500 },
  { id: 'maintenance', label: 'Manutenção',  hint: 'TDEE inalterado',              delta: 0 },
  { id: 'bulk',        label: 'Bulk',        hint: '+300 kcal · ganho magro',      delta: 300 },
];

/**
 * @description Basal Metabolic Rate via the chosen formula.
 * @param {object} args
 * @param {FormulaId} args.formula
 * @param {Sex} args.sex
 * @param {number} args.weight   kg
 * @param {number} args.height   cm
 * @param {number} args.age      years
 * @param {number} [args.bodyFat] 0..1 — required for katch
 * @returns {number} kcal/day
 */
export function bmr({ formula, sex, weight, height, age, bodyFat }) {
  if (formula === 'katch') {
    // Katch-McArdle: 370 + 21.6 · LBM(kg); LBM = weight · (1 − bf%)
    const bf = Math.max(0, Math.min(0.6, bodyFat ?? 0));
    const lbm = weight * (1 - bf);
    return 370 + 21.6 * lbm;
  }
  if (formula === 'harris') {
    // Roza & Shizgal (1984) — revised Harris-Benedict.
    return sex === 'm'
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
  }
  // Mifflin-St Jeor (1990) — default and most accurate for the general pop.
  return sex === 'm'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

/**
 * @description Total Daily Energy Expenditure = BMR · activity factor.
 * @param {number} basal
 * @param {ActivityId} activity
 * @returns {number} kcal/day
 */
export function tdee(basal, activity) {
  const level = ACTIVITY_LEVELS.find((a) => a.id === activity) ?? ACTIVITY_LEVELS[0];
  return basal * level.factor;
}

/**
 * @description Apply the goal delta to a TDEE.
 * @param {number} tdeeKcal
 * @param {GoalId} goal
 * @returns {number}
 */
export function kcalForGoal(tdeeKcal, goal) {
  const g = GOALS.find((x) => x.id === goal) ?? GOALS[1];
  return tdeeKcal + g.delta;
}

/**
 * @description Default macro distribution for a given kcal target and body
 *   weight. Protein is dosed per kg of body weight (cutting gets more, to
 *   protect muscle); fat is fixed at 25% of kcal to keep a hormonal floor;
 *   carbs fill what's left.
 * @param {object} args
 * @param {number} args.kcalTarget
 * @param {number} args.weight     kg
 * @param {GoalId} args.goal
 * @returns {{protein:number, carbs:number, fat:number}}
 */
export function macroTargets({ kcalTarget, weight, goal }) {
  const proteinPerKg = goal === 'cutting' ? 2.2 : 1.8;
  const protein = weight * proteinPerKg;
  const fatKcal = kcalTarget * 0.25;
  const fat = fatKcal / 9;
  const remainingKcal = Math.max(0, kcalTarget - protein * 4 - fatKcal);
  const carbs = remainingKcal / 4;
  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/**
 * @description One-shot helper that runs BMR → TDEE → goal kcal → macros and
 *   returns everything the calculator UI needs.
 * @param {object} args
 * @param {FormulaId} args.formula
 * @param {Sex} args.sex
 * @param {number} args.weight
 * @param {number} args.height
 * @param {number} args.age
 * @param {ActivityId} args.activity
 * @param {GoalId} args.goal
 * @param {number} [args.bodyFat]
 * @returns {{
 *   bmr:number, tdee:number, kcalTarget:number,
 *   macros:{protein:number,carbs:number,fat:number}
 * }}
 */
export function computeAll(args) {
  const basal = bmr(args);
  const expended = tdee(basal, args.activity);
  const kcalTarget = Math.round(kcalForGoal(expended, args.goal));
  const macros = macroTargets({ kcalTarget, weight: args.weight, goal: args.goal });
  return {
    bmr: Math.round(basal),
    tdee: Math.round(expended),
    kcalTarget,
    macros,
  };
}
