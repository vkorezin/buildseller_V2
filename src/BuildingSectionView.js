import React from "react";
import { getAxisLabel } from "./BlockEditorUtils";

// --- КОМПОНЕНТ ПОПЕРЕЧНОГО РАЗРЕЗА ---
export default function BuildingSectionView({
  generalData,
  spans,
  styles,
  // --- ИЗМЕНЕНИЕ (Задание 5) ---
  mezzanines,
  craneDb,
}) {
  // --- ПРОВЕРКА ---
  if (
    !generalData ||
    !spans ||
    spans.length === 0 ||
    generalData.blockWidth <= 0
  ) {
    return (
      <div
        style={{
          ...styles.svgCanvas,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
        }}
      >
        Введите данные для разреза
      </div>
    );
  }

  const { blockWidth } = generalData;
  const PADDING = 60;
  const SVG_SIZE = 500;
  const MARKER_RADIUS = 8;
  const DIM_OFFSET = 15;
  const WITNESS_EXT = 5;

  // --- 1. Найти общие габариты ---
  let maxPeakHeight = -Infinity;
  let minBase = Infinity;

  spans.forEach((span) => {
    // ... (код не изменен)
    const eaveHeight = span.eaveHeight || generalData.blockHeight;

    if (span.baseElevation < minBase) minBase = span.baseElevation;
    if (eaveHeight > maxPeakHeight) maxPeakHeight = eaveHeight;

    const slopeAmount = span.slope / 100;
    let rise = 0;
    if (span.skateCount === 1) {
      rise = span.spanWidth * slopeAmount;
    } else {
      const skate1Len = span.skate1Length ?? span.spanWidth / 2;
      rise = skate1Len * slopeAmount;
    }

    const peakHeight = eaveHeight + rise;
    if (peakHeight > maxPeakHeight) {
      maxPeakHeight = peakHeight;
    }
  });

  // --- ИЗМЕНЕНИЕ (Задание 5): Учитываем антресоли в габаритах ---
  if (mezzanines) {
    mezzanines.forEach((mezz) => {
      if (mezz.elevation > maxPeakHeight) maxPeakHeight = mezz.elevation;
      if (mezz.elevation < minBase) minBase = mezz.elevation; // (маловероятно, но для полноты)
    });
  }
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  if (minBase === Infinity) minBase = 0;
  if (maxPeakHeight === -Infinity) maxPeakHeight = 10;

  const totalDrawingHeight = maxPeakHeight - minBase;

  // --- 2. Масштабирование ---
  const viewWidth = SVG_SIZE - PADDING * 2;
  const viewHeight = SVG_SIZE - PADDING * 2;

  if (totalDrawingHeight <= 0 || blockWidth <= 0) return null;

  const scale = Math.min(
    viewWidth / blockWidth,
    viewHeight / totalDrawingHeight
  );

  if (scale <= 0) return null;

  const drawWidth = blockWidth * scale;
  // const drawHeight = totalDrawingHeight * scale; // (не используется)

  const xOffset = (viewWidth - drawWidth) / 2;
  const yOffset = (viewHeight - totalDrawingHeight * scale) / 2; // (исправлено для центровки по Y)

  const baseX = PADDING + xOffset;
  // --- ИЗМЕНЕНИЕ: baseY теперь зависит от minBase ---
  const baseY = PADDING + yOffset + (maxPeakHeight - minBase) * scale;
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  // --- 3. Считаем геометрию крыши и колонн ---
  const roofLines = [];
  const columnNodes = [];
  // --- ИЗМЕНЕНИЕ (Задание 5): Добавляем слои для кранов и антресолей ---
  const mezzanineLines = [];
  const craneElements = [];
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  let currentX = 0;
  let lowestY_bot = -Infinity;

  spans.forEach((span, index) => {
    // --- ВЫЧИСЛЯЕМ ЛОКАЛЬНЫЕ Y ---
    const localEaveY = baseY - (span.eaveHeight - minBase) * scale;
    const y_bot = baseY - (span.baseElevation - minBase) * scale;
    if (y_bot > lowestY_bot) lowestY_bot = y_bot;

    const currentAxisLabel = getAxisLabel(index);
    columnNodes.push({
      x: currentX * scale,
      y_bot: y_bot,
      label: currentAxisLabel,
    });

    const x1 = currentX * scale;
    const x2 = (currentX + span.spanWidth) * scale;
    const slopeAmount = span.slope / 100;

    if (span.skateCount === 1) {
      // ... (код не изменен)
      const rise = span.spanWidth * scale * slopeAmount;
      if (span.slopeDirection === "left") {
        roofLines.push({
          x1: x1,
          y1: localEaveY - rise,
          x2: x2,
          y2: localEaveY,
        });
      } else {
        roofLines.push({
          x1: x1,
          y1: localEaveY,
          x2: x2,
          y2: localEaveY - rise,
        });
      }
    } else {
      // ... (код не изменен)
      // 2 ската
      const skate1Len = span.skate1Length ?? span.spanWidth / 2;
      const skate1LenScaled = skate1Len * scale;
      const xPeak = x1 + skate1LenScaled;
      const rise = skate1Len * slopeAmount * scale;
      const yPeak = localEaveY - rise;

      roofLines.push({ x1: x1, y1: localEaveY, x2: xPeak, y2: yPeak });
      roofLines.push({ x1: xPeak, y1: yPeak, x2: x2, y2: localEaveY });
    }

    // --- ИЗМЕНЕНИЕ (Задание 5): Логика Антресолей ---
    if (mezzanines) {
      mezzanines.forEach((mezz) => {
        // Проверяем, пересекает ли антресоль этот пролет
        // (Пролет 'A' [index 0] находится между осью 'A' и 'B')
        if (
          mezz.spanStartAxis <= currentAxisLabel &&
          currentAxisLabel < mezz.spanEndAxis
        ) {
          const y_mezz = baseY - (mezz.elevation - minBase) * scale;
          mezzanineLines.push({
            id: mezz.id + "-" + index,
            x1: x1,
            y1: y_mezz,
            x2: x2,
            y2: y_mezz,
          });
        }
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    // --- ИЗМЕНЕНИЕ (Задание 5): Логика Кранов (Best-Fit) ---
    if (span.cranes && craneDb) {
      span.cranes.forEach((crane) => {
        const targetWidth = span.spanWidth;
        const targetCapacity = crane.selectedCapacity;
        const allCranes = craneDb;
        let match = null;

        // Попытка 1 (Идеальный пролет)
        let candidates = allCranes.filter(
          (c) =>
            c.capacity >= targetCapacity &&
            targetWidth >= c.minBuildingSpan &&
            targetWidth <= c.maxBuildingSpan
        );
        candidates.sort((a, b) => a.capacity - b.capacity);
        match = candidates[0] || null;

        // Попытка 2 (Следующий пролет)
        if (!match) {
          candidates = allCranes.filter(
            (c) =>
              c.capacity >= targetCapacity && c.minBuildingSpan > targetWidth
          );
          candidates.sort(
            (a, b) =>
              a.capacity - b.capacity || // Сначала по ГП
              a.minBuildingSpan - b.minBuildingSpan // Затем по пролету
          );
          match = candidates[0] || null;
        }

        // Рендеринг
        if (!match) {
          craneElements.push({
            type: "error",
            id: crane.id,
            x: (x1 + x2) / 2,
            y: localEaveY - 20, // Примерное положение
            text: `Кран ${targetCapacity}т (пролет ${targetWidth}м) не найден в БД!`,
          });
        } else {
          const y_rail = baseY - (match.supportHeight - minBase) * scale;
          const y_hook_bottom =
            baseY - (match.supportHeight - match.hookHeight - minBase) * scale;
          craneElements.push({
            type: "crane",
            id: crane.id,
            x1: x1,
            x2: x2,
            y_rail: y_rail,
            y_hook_bottom: y_hook_bottom,
            match: match,
          });
        }
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    currentX += span.spanWidth;
  });

  // (Последняя колонна)
  const lastSpan = spans.length > 0 ? spans[spans.length - 1] : spans[0];
  const last_y_bot = baseY - (lastSpan.baseElevation - minBase) * scale;
  if (last_y_bot > lowestY_bot) lowestY_bot = last_y_bot;

  columnNodes.push({
    x: currentX * scale,
    y_bot: last_y_bot,
    label: getAxisLabel(spans.length),
  });

  // --- 4. Локальные стили для SVG ---
  const mezzanineStyle = {
    ...styles.svgColumnLine,
    stroke: "#007bff",
    strokeDasharray: "5 5",
    strokeWidth: 1.5,
  };
  const craneRailStyle = {
    ...styles.svgOutline,
    stroke: "#a63a00", // "Ржавый" цвет
    strokeWidth: 2.5,
  };
  const craneHookPathStyle = {
    ...styles.svgColumnLine,
    stroke: "#a63a00",
    strokeDasharray: "4 2",
    strokeWidth: 1,
  };
  const errorTextStyle = {
    ...styles.svgDimText,
    fill: "#d90000",
    textAnchor: "middle",
    fontSize: "10px",
  };

  // --- 5. Рисуем ---
  return (
    <svg style={styles.svgCanvas} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
      {/* Группа 1: Чертеж (смещенный) */}
      <g transform={`translate(${baseX}, 0)`}>
        {/* Отметка 0.00 (пунктир) */}
        <line
          style={{ ...styles.svgColumnLine, strokeDasharray: "2 2" }}
          x1={-WITNESS_EXT * 5}
          y1={baseY - -minBase * scale} // y_pos для 0.00
          x2={drawWidth + WITNESS_EXT * 5}
          y2={baseY - -minBase * scale}
        />
        <text
          style={{ ...styles.svgDimText, textAnchor: "start" }}
          x={drawWidth + WITNESS_EXT * 5 + 5}
          y={baseY - -minBase * scale + 3}
        >
          0.00
        </text>

        {/* Крыша */}
        {roofLines.map((line, i) => (
          <line
            key={`roof-${i}`}
            style={styles.svgOutline}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}

        {/* Колонны (с фиксом бага) */}
        {columnNodes.map(({ x, y_bot, label }) => {
          let y_top_start = Infinity;
          let y_top_end = Infinity;

          // ... (логика поиска y_top не изменена)
          const roofLineStart = roofLines.find(
            (line) => Math.abs(line.x1 - x) < 1e-6
          );
          if (roofLineStart) y_top_start = roofLineStart.y1;
          const roofLineEnd = roofLines.find(
            (line) => Math.abs(line.x2 - x) < 1e-6
          );
          if (roofLineEnd) y_top_end = roofLineEnd.y2;
          const y_top = Math.min(y_top_start, y_top_end);

          let final_y_top = y_top;
          if (y_top === Infinity) {
            const matchingSpan = spans.find(
              (s, i) => getAxisLabel(i) === label
            );
            if (matchingSpan) {
              final_y_top = baseY - (matchingSpan.eaveHeight - minBase) * scale;
            } else {
              const lastSpan = spans[spans.length - 1];
              if (lastSpan)
                final_y_top = baseY - (lastSpan.eaveHeight - minBase) * scale;
            }
          }

          return (
            <line
              key={`col-${label}`}
              style={styles.svgOutline}
              x1={x}
              y1={final_y_top}
              x2={x}
              y2={y_bot}
            />
          );
        })}

        {/* --- ИЗМЕНЕНИЕ (Задание 5): Рендер Антресолей --- */}
        {mezzanineLines.map((line) => (
          <line
            key={line.id}
            style={mezzanineStyle}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}

        {/* --- ИЗМЕНЕНИЕ (Задание 5): Рендер Кранов --- */}
        {craneElements.map((el) => {
          if (el.type === "error") {
            return (
              <text key={el.id} style={errorTextStyle} x={el.x} y={el.y}>
                {el.text}
              </text>
            );
          }
          if (el.type === "crane") {
            return (
              <g key={el.id}>
                {/* 1. Рельс крана */}
                <line
                  style={craneRailStyle}
                  x1={el.x1}
                  y1={el.y_rail}
                  x2={el.x2}
                  y2={el.y_rail}
                />
                {/* 2. Путь крюка (вертикальный) */}
                <line
                  style={craneHookPathStyle}
                  x1={(el.x1 + el.x2) / 2}
                  y1={el.y_rail}
                  x2={(el.x1 + el.x2) / 2}
                  y2={el.y_hook_bottom}
                />
                {/* 3. Отметка низа крюка (горизонтальная) */}
                <line
                  style={craneHookPathStyle}
                  x1={(el.x1 + el.x2) / 2 - 5}
                  y1={el.y_hook_bottom}
                  x2={(el.x1 + el.x2) / 2 + 5}
                  y2={el.y_hook_bottom}
                />
              </g>
            );
          }
          return null;
        })}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </g>

      {/* Группа 2: Маркеры осей (Буквенные) */}
      <g>
        {/* ... (код не изменен) ... */}
        {columnNodes.map(({ x, label }) => (
          <g
            key={`x-axis-${label}`}
            transform={`translate(${baseX + x}, ${
              lowestY_bot + (MARKER_RADIUS + DIM_OFFSET * 2.5)
            })`}
          >
            <circle style={styles.svgAxisMarker} r={MARKER_RADIUS} />
            <text style={styles.svgAxisText}>{label}</text>
          </g>
        ))}
      </g>

      {/* Группа 3: Размеры */}
      <g transform={`translate(${baseX}, 0)`}>
        {/* --- X РАЗМЕРЫ (Снизу) --- */}
        {/* ... (код не изменен) ... */}
        <line
          style={styles.svgDimLine}
          x1={0}
          y1={lowestY_bot + DIM_OFFSET * 2}
          x2={drawWidth}
          y2={lowestY_bot + DIM_OFFSET * 2}
        />
        {columnNodes.map((point, index) => (
          <g key={`x-dim-${index}`}>
            <line
              style={styles.svgDimLine}
              x1={point.x}
              y1={lowestY_bot + DIM_OFFSET * 2 - WITNESS_EXT}
              x2={point.x}
              y2={lowestY_bot + DIM_OFFSET * 2 + WITNESS_EXT}
            />
            {index > 0 && columnNodes[index - 1] && (
              <text
                style={styles.svgDimText}
                x={(point.x + columnNodes[index - 1].x) / 2}
                y={lowestY_bot + DIM_OFFSET * 2 - 5}
              >
                {((point.x - columnNodes[index - 1].x) / scale).toFixed(3)}
              </text>
            )}
          </g>
        ))}

        {/* --- Y РАЗМЕР (Слева) --- */}
        <text
          style={{ ...styles.svgDimText, textAnchor: "end" }}
          x={-DIM_OFFSET}
          y={baseY - -minBase * scale + 3} // Отметка 0.00
        >
          0.00
        </text>
        <line
          style={styles.svgDimLine}
          x1={-DIM_OFFSET - WITNESS_EXT}
          y1={baseY - -minBase * scale} // Отметка 0.00
          x2={0}
          y2={baseY - -minBase * scale}
        />

        {/* --- ИЗМЕНЕНИЕ: Отметки высот (карнизы) --- */}
        {spans.map((span, index) => {
          const eaveY = baseY - (span.eaveHeight - minBase) * scale;
          const xPos = columnNodes[index].x; // Позиция левой колонны
          return (
            <g key={`y-dim-${index}`}>
              <text
                style={{ ...styles.svgDimText, textAnchor: "end" }}
                x={-DIM_OFFSET}
                y={eaveY + 3}
              >
                +{span.eaveHeight.toFixed(2)}
              </text>
              <line
                style={styles.svgDimLine}
                x1={-DIM_OFFSET - WITNESS_EXT}
                y1={eaveY}
                x2={xPos}
                y2={eaveY}
              />
            </g>
          );
        })}

        {/* --- ИЗМЕНЕНИЕ (Задание 5): Отметки высот (Антресоли) --- */}
        {mezzanines &&
          mezzanines.map((mezz) => (
            <g key={`y-dim-${mezz.id}`}>
              <text
                style={{
                  ...styles.svgDimText,
                  textAnchor: "end",
                  fill: "#007bff",
                }}
                x={-DIM_OFFSET}
                y={baseY - (mezz.elevation - minBase) * scale + 3}
              >
                +{mezz.elevation.toFixed(2)}
              </text>
              <line
                style={{ ...styles.svgDimLine, stroke: "#007bff" }}
                x1={-DIM_OFFSET - WITNESS_EXT}
                y1={baseY - (mezz.elevation - minBase) * scale}
                x2={0} // (Не тянем до колонны, чтобы не мешать)
                y2={baseY - (mezz.elevation - minBase) * scale}
              />
            </g>
          ))}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </g>
    </svg>
  );
}
