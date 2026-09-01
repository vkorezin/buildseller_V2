// --- ГЕНЕРАТОР БУКВЕННЫХ ОСЕЙ ---
const AXIS_ALPHABET = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ж",
  "И",
  "К",
  "Л",
  "М",
  "Н",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Э",
  "Ю",
  "Я",
];
const ALPHABET_LEN = AXIS_ALPHABET.length;

export function getAxisLabel(index) {
  if (index < ALPHABET_LEN) {
    return AXIS_ALPHABET[index];
  } else {
    const firstLetterIdx = Math.floor(index / ALPHABET_LEN) - 1;
    const secondLetterIdx = index % ALPHABET_LEN;
    if (firstLetterIdx >= ALPHABET_LEN) return "ERR";
    return AXIS_ALPHABET[firstLetterIdx] + AXIS_ALPHABET[secondLetterIdx];
  }
}

// --- РАСЧЁТ И ВЗАИМОСВЯЗЬ ВЫСОТ И УКЛОНА КРОВЛИ ---

/**
 * Получить расчетную (эффективную) длину ската для вычисления уклона
 */
export function getEffectiveSkateLength(span) {
  const W = Number(span.spanWidth) || 0;
  const isGable = Number(span.skateCount) === 2;
  if (isGable) {
    const s1 = Number(span.skate1Length);
    return s1 > 0 && s1 <= W ? s1 : W / 2;
  }
  return W;
}

/**
 * Вычисляет подъем кровли (rise), высоту конька / верхней точки и параметры замков
 */
export function computeSpanRoofHeights(span) {
  const W = Number(span.spanWidth) || 0;
  const eaveH = Number(span.eaveHeight) || 0;
  const S = Number(span.slope) || 0;
  const Leff = getEffectiveSkateLength(span);
  const rise = Leff * (S / 100);
  const peakH = eaveH + rise;

  return {
    W,
    Leff,
    eaveH,
    slope: S,
    rise: Math.round(rise * 1000) / 1000,
    peakH: Math.round(peakH * 1000) / 1000,
    lockParam: span.lockParam || "none", // "none" | "eave" | "ridge" | "slope"
  };
}

/**
 * Вычисляет угол уклона в градусах
 */
export function slopePctToDegrees(slopePct) {
  const rad = Math.atan((Number(slopePct) || 0) / 100);
  return Math.round((rad * (180 / Math.PI)) * 10) / 10;
}

/**
 * Обновляет параметры пролёта при изменении одного из взаимосвязанных значений:
 * - "eaveHeight" (высота карниза)
 * - "ridgeHeight" / "peakHeight" (высота конька / верхней точки)
 * - "slope" (уклон в %)
 * - "lockParam" (фиксация: "none" | "eave" | "ridge" | "slope")
 * - "spanWidth" / "skate1Length" / "skateCount" / "slopeDirection"
 */
export function updateSpanRoofGeometry(span, field, value) {
  const updated = { ...span };
  const W = Number(field === "spanWidth" ? value : span.spanWidth) || 0;
  const isGable = Number(field === "skateCount" ? value : span.skateCount) === 2;

  let skate1Len = Number(span.skate1Length);
  if (field === "skate1Length") {
    skate1Len = Number(value) || 0;
    if (skate1Len > W) skate1Len = W;
    if (skate1Len < 0) skate1Len = 0;
  } else if (field === "spanWidth" || (field === "skateCount" && isGable)) {
    if (!skate1Len || skate1Len > W || skate1Len <= 0) {
      skate1Len = W / 2;
    }
  }
  const Leff = isGable ? (skate1Len > 0 ? skate1Len : W / 2) : W;

  const currentLock = span.lockParam || "none";
  let eaveH = Number(span.eaveHeight) || 0;
  let S = Number(span.slope) || 0;
  const currentRise = Leff * (S / 100);
  let peakH = eaveH + currentRise;

  if (field === "lockParam") {
    updated.lockParam = value;
    return updated;
  }

  if (field === "eaveHeight") {
    const newEave = parseFloat(value);
    const validNewEave = isNaN(newEave) ? 0 : Math.max(0, newEave);

    if (currentLock === "ridge") {
      // Конёк зафиксирован -> уклон меняется
      const deltaH = Math.max(0, peakH - validNewEave);
      S = Leff > 0 ? (deltaH / Leff) * 100 : S;
      eaveH = validNewEave;
    } else {
      // По умолчанию (или если зафиксирован уклон/карниз/нет замка) уклон НЕ меняется,
      // вторая высота (конёк) смещается
      eaveH = validNewEave;
      peakH = eaveH + (Leff > 0 ? Leff * (S / 100) : 0);
    }
  } else if (field === "ridgeHeight" || field === "peakHeight") {
    const newPeak = parseFloat(value);
    const validNewPeak = isNaN(newPeak) ? 0 : Math.max(0, newPeak);

    if (currentLock === "eave") {
      // Карниз зафиксирован -> уклон меняется
      const deltaH = Math.max(0, validNewPeak - eaveH);
      S = Leff > 0 ? (deltaH / Leff) * 100 : S;
      peakH = validNewPeak;
    } else {
      // По умолчанию (или если зафиксирован уклон/конёк/нет замка) уклон НЕ меняется,
      // карниз смещается
      const rise = Leff > 0 ? Leff * (S / 100) : 0;
      eaveH = Math.max(0, validNewPeak - rise);
      peakH = validNewPeak;
    }
  } else if (field === "slope") {
    const newSlope = parseFloat(value);
    const validNewSlope = isNaN(newSlope) ? 0 : Math.max(0, newSlope);
    S = validNewSlope;
    const newRise = Leff > 0 ? Leff * (S / 100) : 0;

    if (currentLock === "eave") {
      // Карниз зафиксирован -> меняется конёк
      peakH = eaveH + newRise;
    } else if (currentLock === "ridge") {
      // Конёк зафиксирован -> меняется карниз
      eaveH = Math.max(0, peakH - newRise);
    } else {
      // Без фиксации (или lockParam === "slope" / "none"):
      // Высоты меняются равномерно относительно средней отметки
      const Havg = (eaveH + peakH) / 2;
      eaveH = Math.max(0, Havg - newRise / 2);
      peakH = eaveH + newRise;
    }
  } else if (field === "spanWidth" || field === "skate1Length" || field === "skateCount") {
    const newRise = Leff > 0 ? Leff * (S / 100) : 0;
    if (currentLock === "ridge") {
      eaveH = Math.max(0, peakH - newRise);
    } else {
      peakH = eaveH + newRise;
    }
  }

  updated.eaveHeight = Math.round(eaveH * 1000) / 1000;
  updated.slope = Math.round(S * 100) / 100;
  if (isGable) {
    updated.skate1Length = Math.round(skate1Len * 1000) / 1000;
  }
  if (field === "skateCount") updated.skateCount = parseInt(value, 10);
  if (field === "slopeDirection") updated.slopeDirection = value;
  if (field === "spanWidth") updated.spanWidth = W;
  if (field === "frameType") updated.frameType = value;
  if (field === "baseElevation") {
    if (value === "" || value === "-") {
      updated.baseElevation = value;
    } else {
      const num = parseFloat(value);
      updated.baseElevation = isNaN(num) ? 0 : num;
    }
  }

  return updated;
}
