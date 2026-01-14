// Генерация базовой матрицы 210 (примерные данные)
export function generateBase210Matrix() {
  const heights = [];
  for (let h = 2.0; h <= 15.0; h += 0.5) {
    heights.push(h);
  }

  const spans = [];
  for (let w = 3; w <= 45; w += 3) {
    spans.push(w);
  }

  // Генерируем примерные значения на основе текущей формулы
  const data = {};
  heights.forEach((h) => {
    data[h] = {};
    spans.forEach((w) => {
      // Базовая формула: вес зависит от пролёта и высоты
      // Для снега 210 берём из текущей таблицы или интерполируем
      let baseRate = 20; // минимальный вес

      // Зависимость от пролёта
      if (w <= 12) baseRate = 18;
      else if (w <= 15) baseRate = 20;
      else if (w <= 18) baseRate = 25;
      else if (w <= 24) baseRate = 32;
      else if (w <= 30) baseRate = 40;
      else if (w <= 36) baseRate = 45;
      else baseRate = 50 + (w - 36) * 1.5;

      // Зависимость от высоты (коэффициент)
      const h_diff = Math.max(0, h - 6.0);
      const h_mult = 1 + h_diff * 0.03;

      data[h][w] = Math.round(baseRate * h_mult * 10) / 10;
    });
  });

  return {
    heights,
    spans,
    data,
  };
}

// Генерация коэффициентов снега (теперь массив объектов)
export function generateSnowCoefficients() {
  return [
    { snow: 70, coefficient: 0.7 },
    { snow: 140, coefficient: 0.85 },
    { snow: 210, coefficient: 1.0 }, // база
    { snow: 280, coefficient: 1.12 },
    { snow: 350, coefficient: 1.23 },
    { snow: 420, coefficient: 1.35 },
    { snow: 490, coefficient: 1.46 },
    { snow: 560, coefficient: 1.58 },
  ];
}

// Генерация металлоемкости прогонов (массив объектов)
export function generateRoofPurlins() {
  return [
    { snow: 70, weight: 4.5 },
    { snow: 140, weight: 5.5 },
    { snow: 210, weight: 6.5 }, // база
    { snow: 280, weight: 7.5 },
    { snow: 350, weight: 8.5 },
    { snow: 420, weight: 9.5 },
    { snow: 490, weight: 10.5 },
    { snow: 560, weight: 11.5 },
  ];
}

// Интерполяция в 2D таблице
export function interpolate2D(matrix, targetH, targetW) {
  const { heights, spans, data } = matrix;

  // Ограничиваем значения диапазоном таблицы
  const hSafe = Math.max(
    heights[0],
    Math.min(targetH, heights[heights.length - 1])
  );
  const wSafe = Math.max(spans[0], Math.min(targetW, spans[spans.length - 1]));

  // Находим ближайшие точки по высоте
  let h1 = heights[0],
    h2 = heights[heights.length - 1];
  for (let i = 0; i < heights.length - 1; i++) {
    if (hSafe >= heights[i] && hSafe <= heights[i + 1]) {
      h1 = heights[i];
      h2 = heights[i + 1];
      break;
    }
  }

  // Находим ближайшие точки по пролёту
  let w1 = spans[0],
    w2 = spans[spans.length - 1];
  for (let i = 0; i < spans.length - 1; i++) {
    if (wSafe >= spans[i] && wSafe <= spans[i + 1]) {
      w1 = spans[i];
      w2 = spans[i + 1];
      break;
    }
  }

  // Вспомогательная функция для 1D интерполяции
  const interpolate1D = (x, x1, y1, x2, y2) => {
    if (x2 === x1) return y1;
    return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
  };

  // Билинейная интерполяция
  const Q11 = data[h1][w1];
  const Q12 = data[h1][w2];
  const Q21 = data[h2][w1];
  const Q22 = data[h2][w2];

  if (h1 === h2 && w1 === w2) return Q11;
  if (h1 === h2) return interpolate1D(wSafe, w1, Q11, w2, Q12);
  if (w1 === w2) return interpolate1D(hSafe, h1, Q11, h2, Q21);

  const R1 = interpolate1D(wSafe, w1, Q11, w2, Q12);
  const R2 = interpolate1D(wSafe, w1, Q21, w2, Q22);

  return interpolate1D(hSafe, h1, R1, h2, R2);
}

// Получение коэффициента снега с интерполяцией (обновлённая)
export function getSnowCoefficient(coefficientsArray, targetSnow) {
  if (!coefficientsArray || coefficientsArray.length === 0) return 1.0;

  // Сортируем по снегу
  const sorted = [...coefficientsArray].sort((a, b) => a.snow - b.snow);

  // Если точное совпадение
  const exact = sorted.find((item) => item.snow === targetSnow);
  if (exact) return exact.coefficient;

  // Если меньше минимального
  if (targetSnow <= sorted[0].snow) return sorted[0].coefficient;

  // Если больше максимального
  if (targetSnow >= sorted[sorted.length - 1].snow) {
    return sorted[sorted.length - 1].coefficient;
  }

  // Интерполяция между двумя ближайшими значениями
  for (let i = 0; i < sorted.length - 1; i++) {
    if (targetSnow >= sorted[i].snow && targetSnow <= sorted[i + 1].snow) {
      const s1 = sorted[i].snow;
      const s2 = sorted[i + 1].snow;
      const c1 = sorted[i].coefficient;
      const c2 = sorted[i + 1].coefficient;

      return c1 + ((targetSnow - s1) * (c2 - c1)) / (s2 - s1);
    }
  }

  return 1.0;
}

// Получение веса прогонов с интерполяцией (обновлённая)
export function getRoofPurlinWeight(purlinsArray, targetSnow) {
  if (!purlinsArray || purlinsArray.length === 0) return 6.5;

  // Сортируем по снегу
  const sorted = [...purlinsArray].sort((a, b) => a.snow - b.snow);

  // Если точное совпадение
  const exact = sorted.find((item) => item.snow === targetSnow);
  if (exact) return exact.weight;

  // Если меньше минимального
  if (targetSnow <= sorted[0].snow) return sorted[0].weight;

  // Если больше максимального
  if (targetSnow >= sorted[sorted.length - 1].snow) {
    return sorted[sorted.length - 1].weight;
  }

  // Интерполяция
  for (let i = 0; i < sorted.length - 1; i++) {
    if (targetSnow >= sorted[i].snow && targetSnow <= sorted[i + 1].snow) {
      const s1 = sorted[i].snow;
      const s2 = sorted[i + 1].snow;
      const w1 = sorted[i].weight;
      const w2 = sorted[i + 1].weight;

      return w1 + ((targetSnow - s1) * (w2 - w1)) / (s2 - s1);
    }
  }

  return 6.5;
}
