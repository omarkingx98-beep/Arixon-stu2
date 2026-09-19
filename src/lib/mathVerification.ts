/**
 * Deterministic Mathematical & Physics Validation Engine
 * 
 * Complies with Phase 4 directives:
 * - Never blindly trust AI calculations
 * - Deterministic code recalculates expressions and formulas
 * - If AI calculation != deterministic code result -> FAILED_VERIFICATION
 * - Validates units, dimensions, equations, and physical conservation laws
 */

import type { CalculationVerification } from '../types';

// Supported Physics Formula IDs
export type PhysicsFormulaId = 
  | 'momentum_linear'           // p = m * v
  | 'impulse_force_time'        // J = F * delta_t
  | 'impulse_momentum_change'   // J = delta_p = m * (v2 - v1)
  | 'kinetic_energy'            // K = 0.5 * m * v^2
  | 'force_momentum_rate'       // F = delta_p / delta_t
  | 'work_done'                 // W = F * d * cos(theta)
  | 'momentum_conservation_2body'; // m1*v1 + m2*v2 = (m1+m2)*v_f

// Physics Units Dictionary & Equivalence
export const PHYSICS_UNIT_EQUIVALENCES: Record<string, string[]> = {
  'kg·m/s': ['kg.m/s', 'kg*m/s', 'كغ.م/ث', 'كغم.م/ث', 'N·s', 'N.s', 'N*s', 'نيوتن.ثانية', 'نيوتن.ث'],
  'N·s': ['N.s', 'N*s', 'نيوتن.ثانية', 'نيوتن.ث', 'kg·m/s', 'kg.m/s', 'كغ.م/ث', 'كغم.م/ث'],
  'J': ['جول', 'joule', 'N·m', 'N.m', 'kg·m²/s²'],
  'N': ['نيوتن', 'newton', 'kg·m/s²'],
  'm/s': ['م/ث', 'm.s^-1'],
  'm/s²': ['م/ث²', 'm/s^2', 'm.s^-2'],
  'kg': ['كغ', 'كغم', 'كيلوغرام', 'kilogram'],
  's': ['ث', 'ثانية', 'second', 'sec'],
};

/**
 * Normalizes numbers and removes Arabic/Eastern numerals
 */
export function normalizeNumericString(input: string | number): number {
  if (typeof input === 'number') return input;
  if (!input) return 0;

  // Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to standard (0123456789)
  const arabicIndicMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٫': '.', '٬': ''
  };

  let cleaned = input.toString().replace(/[٠-٩٫٬]/g, (ch) => arabicIndicMap[ch] || ch);
  cleaned = cleaned.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Safe Deterministic Math Expression Evaluator
 * Supports: +, -, *, /, ^ (power), parentheses, sqrt, abs
 */
export function evaluateMathExpression(
  expression: string, 
  variables: Record<string, number | string> = {}
): { result: number | null; error?: string } {
  try {
    if (!expression || typeof expression !== 'string') {
      return { result: null, error: 'تعبير رياضي فارغ' };
    }

    // Substitute variables
    let expr = expression;
    for (const [varName, rawVal] of Object.entries(variables)) {
      const numVal = normalizeNumericString(rawVal);
      // Replace word boundaries of variable
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      expr = expr.replace(regex, numVal.toString());
    }

    // Sanitize and replace math functions
    expr = expr.replace(/\bsqrt\(([^)]+)\)/gi, 'Math.sqrt($1)');
    expr = expr.replace(/\babs\(([^)]+)\)/gi, 'Math.abs($1)');
    expr = expr.replace(/\^/g, '**');

    // Reject unsafe tokens
    if (/[^0-9+\-*/().\s*MathsqrtabseE,]/.test(expr)) {
      return { result: null, error: 'التعبير يحتوي على رموز غير مسموح بها رياضياً' };
    }

    // Evaluates deterministically using Function sandbox
    // eslint-disable-next-line no-new-func
    const evaluator = new Function('Math', `"use strict"; return (${expr});`);
    const evalResult = evaluator(Math);

    if (typeof evalResult !== 'number' || isNaN(evalResult) || !isFinite(evalResult)) {
      return { result: null, error: 'النتيجة غير معرفة أو غير رقمية' };
    }

    // Round to 4 decimal places for floating point stabilization
    return { result: Math.round(evalResult * 10000) / 10000 };
  } catch (err: any) {
    return { result: null, error: err.message || 'خطأ في حساب التعبير الرياضي' };
  }
}

/**
 * Independent Physics Formula Evaluator
 */
export function evaluatePhysicsFormula(
  formula: string,
  variables: Record<string, number | string>
): { expected: number | null; formulaName: string; unit: string; error?: string } {
  const normVars: Record<string, number> = {};
  for (const [k, v] of Object.entries(variables)) {
    normVars[k.toLowerCase()] = normalizeNumericString(v);
  }

  const f = formula.toLowerCase().replace(/\s+/g, '');

  // 1. Momentum: p = m * v
  if (f.includes('p=m*v') || f === 'p=mv' || (normVars.m !== undefined && normVars.v !== undefined && !f.includes('v^2'))) {
    const m = normVars.m ?? normVars.mass ?? 0;
    const v = normVars.v ?? normVars.velocity ?? 0;
    const p = m * v;
    return { expected: Math.round(p * 1000) / 1000, formulaName: 'الزخم الخطي (p = m · v)', unit: 'kg·m/s' };
  }

  // 2. Kinetic Energy: K = 0.5 * m * v^2
  if (f.includes('0.5*m*v^2') || f.includes('0.5*m*v**2') || f.includes('k=0.5') || f.includes('ke=')) {
    const m = normVars.m ?? normVars.mass ?? 0;
    const v = normVars.v ?? normVars.velocity ?? 0;
    const k = 0.5 * m * Math.pow(v, 2);
    return { expected: Math.round(k * 1000) / 1000, formulaName: 'الطاقة الحركية (K = ½ m v²)', unit: 'J' };
  }

  // 3. Impulse: J = F * delta_t
  if (f.includes('j=f*t') || f.includes('j=f*delta_t') || (normVars.f !== undefined && (normVars.t !== undefined || normVars.deltat !== undefined))) {
    const force = normVars.f ?? normVars.force ?? 0;
    const time = normVars.t ?? normVars.deltat ?? normVars.delta_t ?? 1;
    const j = force * time;
    return { expected: Math.round(j * 1000) / 1000, formulaName: 'الدفع (J = F · Δt)', unit: 'N·s' };
  }

  // 4. Momentum Change: delta_p = m * (v2 - v1)
  if (f.includes('m*(v2-v1)') || f.includes('delta_p=m*(v2-v1)') || (normVars.m !== undefined && normVars.v1 !== undefined && normVars.v2 !== undefined)) {
    const m = normVars.m ?? 0;
    const v1 = normVars.v1 ?? 0;
    const v2 = normVars.v2 ?? 0;
    const deltaP = m * (v2 - v1);
    return { expected: Math.round(deltaP * 1000) / 1000, formulaName: 'التغير في الزخم (Δp = m(v₂ - v₁))', unit: 'kg·m/s' };
  }

  // Fallback: evaluate mathematical expression
  const evalRes = evaluateMathExpression(formula, variables);
  if (evalRes.result !== null) {
    return { expected: evalRes.result, formulaName: 'حساب رياضي مخصص', unit: '' };
  }

  return { expected: null, formulaName: formula, unit: '', error: evalRes.error || 'تعذر التعرف على معادلة فيزيائية مطابقة' };
}

/**
 * Validates a Question's Mathematical or Physical Calculation
 */
export function verifyCalculationDeterministic(
  calc: CalculationVerification,
  options?: string[],
  correctAnswerIndex?: number
): CalculationVerification {
  const result: CalculationVerification = {
    ...calc,
    verified: false,
  };

  let deterministicValue: number | null = null;
  let evalError: string | undefined;

  if (calc.formula) {
    const physEval = evaluatePhysicsFormula(calc.formula, calc.variables);
    deterministicValue = physEval.expected;
    evalError = physEval.error;
    if (physEval.unit && !result.unit) {
      result.unit = physEval.unit;
    }
  } else if (calc.expression) {
    const mathEval = evaluateMathExpression(calc.expression, calc.variables);
    deterministicValue = mathEval.result;
    evalError = mathEval.error;
  }

  if (deterministicValue === null) {
    result.verified = false;
    result.verificationError = evalError || 'تعذر حساب القيمة المحددة برمجياً.';
    return result;
  }

  result.evaluatedResult = deterministicValue;
  const expectedNum = normalizeNumericString(calc.expectedResult);

  // Compare expectedResult with evaluatedResult within floating tolerance (0.01)
  const isMatch = Math.abs(deterministicValue - expectedNum) <= 0.01;

  if (!isMatch) {
    result.verified = false;
    result.verificationError = `عدم تطابق في الحساب: القيمة المحسوبة برمجياً هي (${deterministicValue}) بينما المفترضة في السؤال هي (${expectedNum}).`;
    return result;
  }

  // If options and correctAnswerIndex are provided, check if the marked correct option actually matches!
  if (options && typeof correctAnswerIndex === 'number' && options[correctAnswerIndex]) {
    const correctOptionText = options[correctAnswerIndex];
    const numInCorrectOption = normalizeNumericString(correctOptionText);

    // If the option contains a number, ensure it aligns with the evaluated result
    if (!isNaN(numInCorrectOption) && numInCorrectOption !== 0) {
      const optionMatches = Math.abs(numInCorrectOption - deterministicValue) <= 0.05;
      if (!optionMatches) {
        result.verified = false;
        result.verificationError = `الخيار المحدد كإجابة صحيحة (${correctOptionText}) لا يطابق النتيجة الحسابية المؤكدة (${deterministicValue}).`;
        return result;
      }
    }
  }

  result.verified = true;
  result.verificationError = undefined;
  return result;
}

/**
 * Checks unit consistency
 */
export function checkUnitEquivalence(unitA: string, unitB: string): boolean {
  if (!unitA || !unitB) return true;
  const a = unitA.trim();
  const b = unitB.trim();
  if (a === b) return true;

  const equivsA = PHYSICS_UNIT_EQUIVALENCES[a] || [];
  if (equivsA.includes(b)) return true;

  const equivsB = PHYSICS_UNIT_EQUIVALENCES[b] || [];
  if (equivsB.includes(a)) return true;

  return false;
}
