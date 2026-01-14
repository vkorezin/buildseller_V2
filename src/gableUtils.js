/**
 * Утилиты для расчёта геометрии торцов
 */

/**
 * Вычисляет максимальную высоту торца для масштабирования
 */
export function getMaxHeight(spans) {
  let maxHeight = 0;
  spans.forEach((span) => {
    const h =
      span.eaveHeight +
      (span.spanWidth / (span.skateCount === 1 ? 1 : 2)) * (span.slope / 100);
    if (h > maxHeight) maxHeight = h;
  });
  return maxHeight;
}

/**
 * Строит массив точек осей с координатами и метками
 */
export function buildAxisPoints(spans, getAxisLabel) {
  const axisPoints = [];
  let currentX = 0;
  axisPoints.push({ x: currentX, label: getAxisLabel(0) });

  spans.forEach((span, idx) => {
    currentX += span.spanWidth;
    axisPoints.push({ x: currentX, label: getAxisLabel(idx + 1) });
  });

  return axisPoints;
}

/**
 * Строит массив сегментов крыши с высотами hStart и hEnd для каждого пролёта
 * И пути для SVG
 */
export function buildRoofSegments(spans, startX, groundY, scale) {
  const roofSegments = [];
  const roofPath = [];
  let currentX = 0;

  spans.forEach((span) => {
    const xStart = currentX;
    const xEnd = currentX + span.spanWidth;
    const slopeRatio = span.slope / 100;
    let localRoofPath = "";

    if (span.skateCount === 1) {
      const rise = span.spanWidth * slopeRatio;
      let yLeft, yRight;
      const direction = span.slopeDirection || "right";

      if (direction === "right") {
        yLeft = groundY - span.eaveHeight * scale;
        yRight = groundY - (span.eaveHeight + rise) * scale;
      } else {
        yLeft = groundY - (span.eaveHeight + rise) * scale;
        yRight = groundY - span.eaveHeight * scale;
      }

      const svgX1 = startX + xStart * scale;
      const svgX2 = startX + xEnd * scale;
      localRoofPath = `M ${svgX1} ${yLeft} L ${svgX2} ${yRight}`;

      const hLeft =
        direction === "right" ? span.eaveHeight : span.eaveHeight + rise;
      const hRight =
        direction === "right" ? span.eaveHeight + rise : span.eaveHeight;
      roofSegments.push({ hStart: hLeft, hEnd: hRight });
    } else {
      const rise = (span.spanWidth / 2) * slopeRatio;
      const svgX1 = startX + xStart * scale;
      const svgY1 = groundY - span.eaveHeight * scale;
      const svgXMid = startX + (xStart + span.spanWidth / 2) * scale;
      const svgYMid = groundY - (span.eaveHeight + rise) * scale;
      const svgX2 = startX + xEnd * scale;
      localRoofPath = `M ${svgX1} ${svgY1} L ${svgXMid} ${svgYMid} L ${svgX2} ${svgY1}`;

      roofSegments.push({ hStart: span.eaveHeight, hEnd: span.eaveHeight });
    }

    roofPath.push(localRoofPath);
    currentX += span.spanWidth;
  });

  return { roofSegments, roofPath };
}

/**
 * Интерполирует высоту в точке внутри конкретного пролёта
 * @param {number} localX - координата внутри пролёта (0..spanWidth)
 * @param {object} span - объект пролёта
 * @param {object} seg - сегмент крыши с hStart, hEnd
 */
export function getInterpolatedHeightInSpan(localX, span, seg) {
  if (span.skateCount === 1) {
    const ratio = localX / span.spanWidth;
    return seg.hStart + (seg.hEnd - seg.hStart) * ratio;
  } else {
    const half = span.spanWidth / 2;
    const rise = half * (span.slope / 100);
    const hPeak = span.eaveHeight + rise;

    if (localX <= half) {
      const ratio = localX / half;
      return span.eaveHeight + (hPeak - span.eaveHeight) * ratio;
    } else {
      const ratio = (localX - half) / half;
      return hPeak - (hPeak - span.eaveHeight) * ratio;
    }
  }
}

/**
 * Возвращает высоту колонны на оси (максимум из соседних скатов)
 */
export function getColumnHeightAtAxis(axisIndex, roofSegments) {
  let h = 0;
  if (axisIndex > 0) {
    h = Math.max(h, roofSegments[axisIndex - 1].hEnd);
  }
  if (axisIndex < roofSegments.length) {
    h = Math.max(h, roofSegments[axisIndex].hStart);
  }
  return h;
}

/**
 * Вычисляет уникальные уровни высот для отметок
 */
export function getUniqueLevels(spans, roofSegments) {
  const levels = [0];
  roofSegments.forEach((s, i) => {
    levels.push(s.hStart);
    levels.push(s.hEnd);
    if (spans[i].skateCount === 2) {
      const rise = (spans[i].spanWidth / 2) * (spans[i].slope / 100);
      levels.push(spans[i].eaveHeight + rise);
    }
  });

  return levels
    .filter((v, i, a) => a.findIndex((t) => Math.abs(t - v) < 0.05) === i)
    .sort((a, b) => a - b);
}
