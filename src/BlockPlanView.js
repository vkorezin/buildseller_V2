import React from "react";
import { getAxisLabel } from "./BlockEditorUtils";

// --- КОМПОНЕНТ ПЛАНА ---
export default function BuildingPlanView({
  // Новые props
  editMode,
  gridMatrix,
  selectedColumns,
  onColumnClick,
  // --- ИЗМЕНЕНИЕ (Задание 5) ---
  mezzanines,

  // Старые props
  generalData,
  spans,
  columnLayout,
  styles,
}) {
  // --- 1. ПРОВЕРКА ДАННЫХ ---
  if (
    !generalData ||
    generalData.blockWidth <= 0 ||
    generalData.blockLength <= 0
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
        Введите Ширину и Длину
      </div>
    );
  }

  const hasSpans = spans && spans.length > 0;
  const hasLayout = columnLayout && columnLayout.length > 0;

  const { blockWidth, blockLength } = generalData;
  const PADDING = 60;
  const SVG_SIZE = 500;
  const MARKER_RADIUS = 8;
  const DIM_OFFSET = 15;
  const WITNESS_EXT = 5;

  // --- 2. МАСШТАБИРОВАНИЕ И ЦЕНТРИРОВАНИЕ ---
  const viewWidth = SVG_SIZE - PADDING * 2;
  const viewHeight = SVG_SIZE - PADDING * 2;

  const scale = Math.min(viewWidth / blockWidth, viewHeight / blockLength);
  const drawWidth = blockWidth * scale;
  const drawHeight = blockLength * scale;

  const xOffset = (viewWidth - drawWidth) / 2;
  const yOffset = (viewHeight - drawHeight) / 2;

  const baseX = PADDING + xOffset;
  const baseY = PADDING + yOffset;

  // --- 3. РАСЧЕТ ОСЕЙ ---
  const xColumns = [];
  if (hasSpans) {
    let currentX = 0;
    xColumns.push({ pos: currentX, label: getAxisLabel(0) });
    spans.forEach((span, index) => {
      currentX += span.spanWidth;
      xColumns.push({ pos: currentX, label: getAxisLabel(index + 1) });
    });
  }

  const yColumns = [];
  if (hasLayout) {
    let currentY = 0;
    yColumns.push({ pos: currentY, label: "1" });
    columnLayout.forEach((item, index) => {
      currentY += item.step;
      yColumns.push({ pos: currentY, label: (index + 2).toString() });
    });
  }

  // --- ИЗМЕНЕНИЕ (Задание 5) ---
  // Локальные стили для антресолей, как требует ТЗ
  const mezzanineStyle = {
    outline: {
      fill: "rgba(0, 100, 255, 0.1)", // полупрозрачный
      stroke: "#007bff",
      strokeWidth: 2,
      strokeDasharray: "4 4", // пунктирный
    },
    text: {
      ...styles.svgAxisText, // Используем базовый стиль
      fill: "#005699",
      fontSize: "12px",
      textAnchor: "middle",
      dominantBaseline: "middle",
    },
  };
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  // --- 4. РИСОВАНИЕ ---
  return (
    <svg style={styles.svgCanvas} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
      {/* Группа 1: Чертеж (Контур и Осевые Линии) */}
      <g transform={`translate(${baseX}, ${baseY})`}>
        <rect
          style={styles.svgOutline}
          x={0}
          y={0}
          width={drawWidth}
          height={drawHeight}
        />

        {hasSpans &&
          xColumns.map(({ pos, label }) => (
            <line
              key={`x-line-${label}`}
              style={styles.svgSpanLine}
              x1={pos * scale}
              y1={0}
              x2={pos * scale}
              y2={drawHeight}
            />
          ))}
        {hasLayout &&
          yColumns.map(({ pos, label }) => (
            <line
              key={`y-line-${label}`}
              style={styles.svgColumnLine}
              x1={0}
              y1={pos * scale}
              x2={drawWidth}
              y2={pos * scale}
            />
          ))}

        {/* --- ЛОГИКА РИСОВАНИЯ КОЛОНН (ПУТЬ А) --- */}
        {/* ... (код не изменен) ... */}
        {editMode === "wizard" &&
          hasSpans &&
          hasLayout &&
          xColumns.map(({ pos: x }) =>
            yColumns.map(({ pos: y }) => (
              <circle
                key={`col-${x}-${y}`}
                style={styles.svgColumn}
                cx={x * scale}
                cy={y * scale}
                r={Math.max(2, scale * 0.2)}
              />
            ))
          )}

        {/* --- ЛОГИКА РИСОВАНИЯ КОЛОНН (ПУТЬ Б) --- */}
        {/* ... (код не изменен) ... */}
        {editMode === "manual" &&
          gridMatrix &&
          hasSpans &&
          hasLayout &&
          xColumns.map(({ pos: xPos, label: xLabel }) =>
            yColumns.map(({ pos: yPos, label: yLabel }) => {
              const key = `${xLabel}-${yLabel}`;

              if (gridMatrix[key] && gridMatrix[key].exists) {
                const isSelected = selectedColumns.includes(key);

                return (
                  <circle
                    key={`col-${key}`}
                    style={
                      isSelected ? styles.svgColumnSelected : styles.svgColumn
                    }
                    cx={xPos * scale}
                    cy={yPos * scale}
                    r={Math.max(3, scale * 0.3)}
                    onClick={() => onColumnClick(key)}
                  />
                );
              }
              return null;
            })
          )}

        {/* --- ИЗМЕНЕНИЕ (Задание 5) --- */}
        <g id="mezzanines-layer">
          {mezzanines &&
            hasSpans &&
            hasLayout &&
            mezzanines.map((mezz) => {
              // 1. Найти пиксельные координаты осей
              const xPos1 = xColumns.find(
                (c) => c.label === mezz.spanStartAxis
              )?.pos;
              const xPos2 = xColumns.find(
                (c) => c.label === mezz.spanEndAxis
              )?.pos;
              const yPos1 = yColumns.find(
                (c) => c.label === mezz.frameStartAxis
              )?.pos;
              const yPos2 = yColumns.find(
                (c) => c.label === mezz.frameEndAxis
              )?.pos;

              // Проверка, что все 4 оси найдены
              if (
                xPos1 === undefined ||
                xPos2 === undefined ||
                yPos1 === undefined ||
                yPos2 === undefined
              ) {
                return null;
              }

              // 2. Рассчитать геометрию
              const x1 = xPos1 * scale;
              const x2 = xPos2 * scale;
              const y1 = yPos1 * scale;
              const y2 = yPos2 * scale;

              const rectX = Math.min(x1, x2);
              const rectY = Math.min(y1, y2);
              const rectW = Math.abs(x2 - x1);
              const rectH = Math.abs(y2 - y1);

              if (rectW <= 0 || rectH <= 0) return null;

              // 3. Нарисовать
              return (
                <g key={mezz.id}>
                  <rect
                    style={mezzanineStyle.outline}
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                  />
                  <text
                    style={mezzanineStyle.text}
                    x={rectX + rectW / 2}
                    y={rectY + rectH / 2}
                  >
                    Антресоль +{mezz.elevation.toFixed(2)}м
                  </text>
                </g>
              );
            })}
        </g>
        {/* --- КОНЕЦ ИЗМЕНЕНИЯ --- */}
      </g>

      {/* Группа 2: Маркеры Осей (Кружочки) */}
      <g>
        {/* ... (код не изменен) ... */}
        {hasSpans &&
          xColumns.map(({ pos, label }) => (
            <g
              key={`x-axis-${label}`}
              transform={`translate(${baseX + pos * scale}, ${
                baseY - (MARKER_RADIUS + DIM_OFFSET * 2.5)
              })`}
            >
              <circle style={styles.svgAxisMarker} r={MARKER_RADIUS} />
              <text style={styles.svgAxisText}>{label}</text>
            </g>
          ))}
        {hasLayout &&
          yColumns.map(({ pos, label }) => (
            <g
              key={`y-axis-${label}`}
              transform={`translate(${
                baseX - (MARKER_RADIUS + DIM_OFFSET * 2.5)
              }, ${baseY + pos * scale})`}
            >
              <circle style={styles.svgAxisMarker} r={MARKER_RADIUS} />
              <text style={styles.svgAxisText}>{label}</text>
            </g>
          ))}
      </g>

      {/* Группа 3: Размерные Линии */}
      <g transform={`translate(${baseX}, ${baseY})`}>
        {/* --- X РАЗМЕРЫ (Сверху) --- */}
        {/* ... (код не изменен) ... */}
        <line
          style={styles.svgDimLine}
          x1={0}
          y1={-DIM_OFFSET * 2}
          x2={drawWidth}
          y2={-DIM_OFFSET * 2}
        />
        <line
          style={styles.svgDimLine}
          x1={0}
          y1={-DIM_OFFSET * 2 - WITNESS_EXT}
          x2={0}
          y2={-DIM_OFFSET * 2 + WITNESS_EXT}
        />
        <line
          style={styles.svgDimLine}
          x1={drawWidth}
          y1={-DIM_OFFSET * 2 - WITNESS_EXT}
          x2={drawWidth}
          y2={-DIM_OFFSET * 2 + WITNESS_EXT}
        />
        <text
          style={styles.svgDimText}
          x={drawWidth / 2}
          y={-DIM_OFFSET * 2 - 5}
        >
          {blockWidth} м
        </text>

        {hasSpans && (
          <>
            <line
              style={styles.svgDimLine}
              x1={0}
              y1={-DIM_OFFSET}
              x2={drawWidth}
              y2={-DIM_OFFSET}
            />
            {xColumns.map((item, index) => (
              <g key={`x-dim-${index}`}>
                <line
                  style={styles.svgDimLine}
                  x1={item.pos * scale}
                  y1={-DIM_OFFSET - WITNESS_EXT}
                  x2={item.pos * scale}
                  y2={-DIM_OFFSET + WITNESS_EXT}
                />
                {index > 0 && xColumns[index - 1] && (
                  <text
                    style={styles.svgDimText}
                    x={(item.pos * scale + xColumns[index - 1].pos * scale) / 2}
                    y={-DIM_OFFSET - 5}
                  >
                    {(item.pos - xColumns[index - 1].pos).toFixed(3)}
                  </text>
                )}
              </g>
            ))}
          </>
        )}

        {/* --- Y РАЗМЕРЫ (Слева) --- */}
        {/* ... (код не изменен) ... */}
        <line
          style={styles.svgDimLine}
          x1={-DIM_OFFSET * 2}
          y1={0}
          x2={-DIM_OFFSET * 2}
          y2={drawHeight}
        />
        <line
          style={styles.svgDimLine}
          x1={-DIM_OFFSET * 2 - WITNESS_EXT}
          y1={0}
          x2={-DIM_OFFSET * 2 + WITNESS_EXT}
          y2={0}
        />
        <line
          style={styles.svgDimLine}
          x1={-DIM_OFFSET * 2 - WITNESS_EXT}
          y1={drawHeight}
          x2={-DIM_OFFSET * 2 + WITNESS_EXT}
          y2={drawHeight}
        />
        <text
          style={{ ...styles.svgDimText, writingMode: "vertical-rl" }}
          x={-DIM_OFFSET * 2 - 5}
          y={drawHeight / 2}
        >
          {blockLength} м
        </text>

        {hasLayout && (
          <>
            <line
              style={styles.svgDimLine}
              x1={-DIM_OFFSET}
              y1={0}
              x2={-DIM_OFFSET}
              y2={drawHeight}
            />
            {yColumns.map((item, index) => (
              <g key={`y-dim-${index}`}>
                <line
                  style={styles.svgDimLine}
                  x1={-DIM_OFFSET - WITNESS_EXT}
                  y1={item.pos * scale}
                  x2={-DIM_OFFSET + WITNESS_EXT}
                  y2={item.pos * scale}
                />
                {index > 0 && yColumns[index - 1] && (
                  <text
                    style={{ ...styles.svgDimText, writingMode: "vertical-rl" }}
                    x={-DIM_OFFSET - 5}
                    y={(item.pos * scale + yColumns[index - 1].pos * scale) / 2}
                  >
                    {(item.pos - yColumns[index - 1].pos).toFixed(3)}
                  </text>
                )}
              </g>
            ))}
          </>
        )}
      </g>
    </svg>
  );
}
