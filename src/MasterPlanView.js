import React from "react";

export default function MasterPlanView({ blocks, collidingIds, styles }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div style={{ ...styles.svgCanvas, ...styles.centered }}>Нет данных</div>
    );
  }

  // 1. Габариты
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  blocks.forEach((block) => {
    minX = Math.min(minX, block.x);
    minY = Math.min(minY, block.y);
    maxX = Math.max(maxX, block.x + block.w);
    maxY = Math.max(maxY, block.y + block.l);
  });

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  // 2. Масштабирование
  const PADDING = 40;
  const SVG_SIZE = 500;
  const viewWidth = SVG_SIZE - PADDING * 2;
  const viewHeight = SVG_SIZE - PADDING * 2;
  const safeW = totalWidth || 1;
  const safeH = totalHeight || 1;
  const scale = Math.min(viewWidth / safeW, viewHeight / safeH);
  const xOffset = -minX * scale;
  const yOffset = -minY * scale;

  const labelStyle = {
    fontSize: "12px",
    fill: "#007bff",
    fontWeight: "bold",
    textAnchor: "middle",
    dominantBaseline: "middle",
  };

  return (
    <svg
      style={{ ...styles.svgCanvas, height: "auto" }}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
    >
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        {blocks.map((block) => {
          const isColliding = collidingIds.includes(block.id);
          const drawX = block.x * scale + xOffset;
          const drawY = block.y * scale + yOffset;
          const drawW = block.w * scale;
          const drawL = block.l * scale;
          const offset = 15;

          // --- СТАТИЧНЫЕ МЕТКИ (НЕ ЗАВИСЯТ ОТ ПОВОРОТА) ---
          // A - всегда Слева
          // B - всегда Справа
          // 1 - всегда Сверху (или наоборот, по вашей картинке 1 сверху)
          // 2 - всегда Снизу
          const labels = [
            { text: "A", x: drawX - offset, y: drawY + drawL / 2 },
            { text: "B", x: drawX + drawW + offset, y: drawY + drawL / 2 },
            { text: "1", x: drawX + drawW / 2, y: drawY - offset },
            { text: "2", x: drawX + drawW / 2, y: drawY + drawL + offset },
          ];

          return (
            <g key={block.id}>
              <rect
                x={drawX}
                y={drawY}
                width={drawW}
                height={drawL}
                style={isColliding ? styles.svgErrorOutline : styles.svgOutline}
              />
              <text
                style={{
                  ...styles.svgAxisText,
                  fontSize: "14px",
                  fill: isColliding ? "#d90000" : "#333",
                }}
                x={drawX + drawW / 2}
                y={drawY + drawL / 2}
              >
                {block.id}
              </text>
              {labels.map((lbl, i) => (
                <text key={i} x={lbl.x} y={lbl.y} style={labelStyle}>
                  {lbl.text}
                </text>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
