// src/trussEfficiencyConstants.js
// Расчет скидки/эффективности перехода с балки на ферму по СП и калибровочной сетке

export const generateDefaultTrussTable = () => {
  const heights = [];
  for (let h = 2.0; h <= 15.05; h += 0.5)
    heights.push(parseFloat(h.toFixed(1)));
  const spans = [];
  for (let s = 3; s <= 45; s += 3) spans.push(s);

  const data = {};
  heights.forEach((h) => {
    data[h] = {};
    spans.forEach((s) => {
      let val = 18 + (h - 2) * 0.8 + (s - 3) * 0.5;
      if (val > 50) val = 50;
      data[h][s] = parseFloat(val.toFixed(2));
    });
  });
  return { heights, spans, data };
};

export const DEFAULT_TRUSS_TABLE = generateDefaultTrussTable();

/**
 * Расчет базового процента скидки на ферму по ширине пролета W и эффективной высоте H_eff
 * @param {number} w - Ширина пролета (м)
 * @param {number} h - Эффективная высота колонн H_eff (м)
 * @param {object} [table] - Опциональная таблица коэффициентов (из стейта/хранилища)
 * @returns {number} Процент базовой скидки фермы
 */
export function getTrussDiscount(w, h, table = null) {
  const trussTable = table || DEFAULT_TRUSS_TABLE;
  if (!trussTable || !trussTable.heights || !trussTable.spans || !trussTable.data) {
    return 0;
  }
  const hList = trussTable.heights;
  const sList = trussTable.spans;
  const hSafe = Math.max(hList[0], Math.min(Number(h) || 0, hList[hList.length - 1]));
  const wSafe = Math.max(sList[0], Math.min(Number(w) || 0, sList[sList.length - 1]));

  let h1 = hList[0], h2 = hList[hList.length - 1];
  for (let i = 0; i < hList.length - 1; i++) {
    if (hSafe >= hList[i] && hSafe <= hList[i + 1]) {
      h1 = hList[i];
      h2 = hList[i + 1];
      break;
    }
  }

  let s1 = sList[0], s2 = sList[sList.length - 1];
  for (let i = 0; i < sList.length - 1; i++) {
    if (wSafe >= sList[i] && wSafe <= sList[i + 1]) {
      s1 = sList[i];
      s2 = sList[i + 1];
      break;
    }
  }

  try {
    const Q11 = trussTable.data[h1][s1];
    const Q12 = trussTable.data[h1][s2];
    const Q21 = trussTable.data[h2][s1];
    const Q22 = trussTable.data[h2][s2];
    const interpolate = (x, x1, y1, x2, y2) => (x2 === x1 ? y1 : y1 + ((x - x1) * (y2 - y1)) / (x2 - x1));
    const R1 = interpolate(wSafe, s1, Q11, s2, Q12);
    const R2 = interpolate(wSafe, s1, Q21, s2, Q22);
    return interpolate(hSafe, h1, R1, h2, R2);
  } catch (e) {
    return 0;
  }
}
