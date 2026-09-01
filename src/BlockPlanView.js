import React, { useRef, useState } from "react";
import { getAxisLabel } from "./BlockEditorUtils";

// --- КОМПОНЕНТ ПЛАНА ЗДАНИЯ (СЕТКА КОЛОНН) ---
export default function BuildingPlanView({
  editMode = "wizard",
  gridMatrix,
  selectedColumns = [],
  onColumnClick,
  onDeleteSelected,
  onClearSelection,
  onSelectAll,
  onRestoreAll,
  mezzanines = [],
  generalData,
  spans = [],
  columnLayout = [],
  zoom = 100,
  styles = {},
}) {
  // 1. Проверка входных данных
  if (
    !generalData ||
    Number(generalData.blockWidth) <= 0 ||
    Number(generalData.blockLength) <= 0
  ) {
    return (
      <div
        style={{
          width: "100%",
          height: "360px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          backgroundColor: "#f8fafc",
          border: "1px dashed #cbd5e1",
          borderRadius: "8px",
          fontSize: "0.95em",
        }}
      >
        📐 Введите корректную ширину и длину здания
      </div>
    );
  }

  const blockWidth = Number(generalData.blockWidth);
  const blockLength = Number(generalData.blockLength);

  const hasSpans = spans && spans.length > 0;
  const hasLayout = columnLayout && columnLayout.length > 0;

  // 2. Расчет осей X (буквенные: А, Б, В, Г...)
  const xColumns = [];
  if (hasSpans) {
    let currentX = 0;
    xColumns.push({ pos: currentX, label: getAxisLabel(0) });
    spans.forEach((span, index) => {
      currentX += Number(span.spanWidth) || 0;
      xColumns.push({ pos: currentX, label: getAxisLabel(index + 1) });
    });
  } else {
    xColumns.push({ pos: 0, label: "А" });
    xColumns.push({ pos: blockWidth, label: "Б" });
  }

  // 3. Расчет осей Y (цифровые: 1, 2, 3... N)
  const yColumns = [];
  if (hasLayout) {
    let currentY = 0;
    yColumns.push({ pos: currentY, label: "1" });
    columnLayout.forEach((item, index) => {
      currentY += Number(item.step) || 0;
      yColumns.push({ pos: currentY, label: (index + 2).toString() });
    });
  } else {
    yColumns.push({ pos: 0, label: "1" });
    yColumns.push({ pos: blockLength, label: "2" });
  }

  // 4. Геометрия холста и отступы под размерные цепочки и оси
  // СПДС порядок сверху: [Здание] -> [Размеры пролетов] -> [Общий габарит] -> [Осевые кружки]
  // СПДС порядок слева:  [Здание] -> [Шаги колонн]    -> [Общий габарит] -> [Осевые кружки]
  const PADDING_TOP = 80;
  const PADDING_LEFT = 85;
  const PADDING_RIGHT = 35;
  const PADDING_BOTTOM = 35;

  const SVG_BASE_SIZE = 640;
  const availWidth = SVG_BASE_SIZE - (PADDING_LEFT + PADDING_RIGHT);
  const availHeight = SVG_BASE_SIZE - (PADDING_TOP + PADDING_BOTTOM);

  // Масштаб с сохранением реальных пропорций здания
  const scale = Math.min(availWidth / blockWidth, availHeight / blockLength);
  const drawWidth = blockWidth * scale;
  const drawHeight = blockLength * scale;

  // Центрирование в рабочей области
  const baseX = PADDING_LEFT + (availWidth - drawWidth) / 2;
  const baseY = PADDING_TOP + (availHeight - drawHeight) / 2;

  // 5. Определение плотности осей для предотвращения наложений текста
  const avgYStepPx = yColumns.length > 1 ? drawHeight / (yColumns.length - 1) : 40;
  const avgXStepPx = xColumns.length > 1 ? drawWidth / (xColumns.length - 1) : 40;

  // Плотность цифровых осей Y: если шаг < 22px, применяем шахматное смещение (stagger) для кружков осей
  const isDenseY = avgYStepPx < 22;
  const isVeryDenseY = avgYStepPx < 14;

  const axisRadius = isVeryDenseY ? 6 : isDenseY ? 7 : 8.5;
  const axisFontSize = isVeryDenseY ? "8px" : isDenseY ? "9px" : "10px";

  // Смещение размерных линий
  const DIM_LEVEL_1 = 20; // Цепочка отдельных пролетов/шагов
  const DIM_LEVEL_2 = 44; // Общий габарит
  const AXIS_BUBBLE_DIST = 70; // Осевые кружки
  const TICK_LEN = 3.5; // Длина засечки (45 град)

  // Вспомогательный рендер архитектурной 45° засечки
  const renderTick = (x, y) => (
    <line
      x1={x - TICK_LEN}
      y1={y + TICK_LEN}
      x2={x + TICK_LEN}
      y2={y - TICK_LEN}
      stroke="#1e293b"
      strokeWidth={1.4}
      strokeLinecap="square"
    />
  );

  const zoomFactor = (Number(zoom) || 100) / 100;
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const isPointerDownRef = useRef(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("button, input, select, a, [data-interactive='true']")) return;
    isPointerDownRef.current = true;
    if (containerRef.current) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (!isDragging && Math.hypot(dx, dy) > 5) {
      setIsDragging(true);
    }
    if (isDragging) {
      e.preventDefault();
      containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    }
  };

  const handleMouseUpOrLeave = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflow: "auto",
        cursor: isDragging ? "grabbing" : zoomFactor > 1 ? "grab" : "default",
        userSelect: isDragging ? "none" : "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Верхняя компактная панель ручного управления сеткой над чертежом */}
      {editMode === "manual" && (
        <div
          data-interactive="true"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            padding: "6px 10px",
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "6px",
            flexWrap: "wrap",
            gap: "8px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85em", fontWeight: "700", color: "#9f1239" }}>
              🛠️ Ручной режим сетки:
            </span>
            <span style={{ fontSize: "0.82em", color: "#881337" }}>
              Выделено: <b>{selectedColumns.length}</b>
            </span>
            <span style={{ fontSize: "0.78em", color: "#64748b" }}>
              (кликните по колонне для выделения / восстановления)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {selectedColumns.length > 0 && onDeleteSelected && (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSelected();
                }}
                style={{
                  fontSize: "0.78em",
                  padding: "3px 9px",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "700",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                🗑️ Удалить выделенные ({selectedColumns.length})
              </button>
            )}
            {selectedColumns.length > 0 && onClearSelection && (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSelection();
                }}
                style={{
                  fontSize: "0.78em",
                  padding: "3px 8px",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Снять выделение
              </button>
            )}
            {onSelectAll && (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAll();
                }}
                style={{
                  fontSize: "0.78em",
                  padding: "3px 8px",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Выделить все
              </button>
            )}
            {onRestoreAll && (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestoreAll();
                }}
                style={{
                  fontSize: "0.78em",
                  padding: "3px 8px",
                  backgroundColor: "#ffffff",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Восстановить все
              </button>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          minWidth: zoomFactor > 1 ? `${zoomFactor * 100}%` : "100%",
          width: zoomFactor > 1 ? `${zoomFactor * 100}%` : "100%",
          display: "block",
          margin: "0 auto",
        }}
      >
        <svg
          style={{
            width: "100%",
            height: "auto",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
            display: "block",
            pointerEvents: "auto",
          }}
          viewBox={`0 0 ${SVG_BASE_SIZE} ${SVG_BASE_SIZE}`}
        >
        {/* ФОНОВАЯ СЕТКА ХОЛСТА (Едва заметная) */}
        <defs>
          <pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#plan-grid)" />

        {/* ======================================================== */}
        {/* 1. ГРУППА ЗДАНИЯ: КОНТУР, СЕТКА И КОЛОННЫ               */}
        {/* ======================================================== */}
        <g transform={`translate(${baseX}, ${baseY})`}>
          {/* Белый непрозрачный фон здания с четким темным контуром */}
          <rect
            x={0}
            y={0}
            width={drawWidth}
            height={drawHeight}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth={2}
          />

          {/* Продольные линии пролетов (оси X) */}
          {hasSpans &&
            xColumns.map(({ pos, label }) => (
              <line
                key={`x-grid-${label}`}
                x1={pos * scale}
                y1={0}
                x2={pos * scale}
                y2={drawHeight}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="5 3"
              />
            ))}

          {/* Поперечные линии рам (оси Y) */}
          {hasLayout &&
            yColumns.map(({ pos, label }) => (
              <line
                key={`y-grid-${label}`}
                x1={0}
                y1={pos * scale}
                x2={drawWidth}
                y2={pos * scale}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            ))}

          {/* Антресоли (Mezzanines) */}
          {mezzanines &&
            mezzanines.length > 0 &&
            mezzanines.map((mezz) => {
              const xPos1 = xColumns.find((c) => c.label === mezz.spanStartAxis)?.pos;
              const xPos2 = xColumns.find((c) => c.label === mezz.spanEndAxis)?.pos;
              const yPos1 = yColumns.find((c) => c.label === mezz.frameStartAxis)?.pos;
              const yPos2 = yColumns.find((c) => c.label === mezz.frameEndAxis)?.pos;

              if (
                xPos1 === undefined ||
                xPos2 === undefined ||
                yPos1 === undefined ||
                yPos2 === undefined
              ) {
                return null;
              }

              const x1 = xPos1 * scale;
              const x2 = xPos2 * scale;
              const y1 = yPos1 * scale;
              const y2 = yPos2 * scale;

              const rectX = Math.min(x1, x2);
              const rectY = Math.min(y1, y2);
              const rectW = Math.abs(x2 - x1);
              const rectH = Math.abs(y2 - y1);

              if (rectW <= 0 || rectH <= 0) return null;

              return (
                <g key={`mezz-${mezz.id}`}>
                  <rect
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#2563eb"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={rectX + rectW / 2}
                    y={rectY + rectH / 2}
                    fill="#1e40af"
                    fontSize="11px"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    Антресоль +{Number(mezz.elevation || 0).toFixed(2)}м
                  </text>
                </g>
              );
            })}

          {/* КОЛОННЫ: Режим Wizard (автоматический) */}
          {editMode === "wizard" &&
            hasSpans &&
            hasLayout &&
            xColumns.map(({ pos: x }) =>
              yColumns.map(({ pos: y }) => (
                <rect
                  key={`col-wiz-${x}-${y}`}
                  x={x * scale - Math.max(2, Math.min(4, scale * 0.25))}
                  y={y * scale - Math.max(2, Math.min(4, scale * 0.25))}
                  width={Math.max(4, Math.min(8, scale * 0.5))}
                  height={Math.max(4, Math.min(8, scale * 0.5))}
                  fill="#0f172a"
                />
              ))
            )}

          {/* КОЛОННЫ: Режим Manual (интерактивный клик/удаление) */}
          {editMode === "manual" &&
            gridMatrix &&
            hasSpans &&
            hasLayout &&
            xColumns.map(({ pos: xPos, label: xLabel }) =>
              yColumns.map(({ pos: yPos, label: yLabel }) => {
                const key = `${xLabel}-${yLabel}`;
                const exists = gridMatrix[key] ? gridMatrix[key].exists : true;
                const isSelected = selectedColumns.includes(key);

                const colSize = Math.max(7, Math.min(12, scale * 0.45));
                const halfSize = colSize / 2;
                const hitRadius = Math.max(14, scale * 0.4);

                return (
                  <g
                    key={`col-man-group-${key}`}
                    data-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onColumnClick) onColumnClick(key);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    style={{ cursor: "pointer", pointerEvents: "all" }}
                  >
                    {/* Невидимая расширенная зона клика */}
                    <circle
                      cx={xPos * scale}
                      cy={yPos * scale}
                      r={hitRadius}
                      fill="transparent"
                    />

                    {exists ? (
                      <>
                        {/* Ореол выделения */}
                        {isSelected && (
                          <rect
                            x={xPos * scale - halfSize - 3}
                            y={yPos * scale - halfSize - 3}
                            width={colSize + 6}
                            height={colSize + 6}
                            fill="rgba(239, 68, 68, 0.25)"
                            stroke="#ef4444"
                            strokeWidth={2}
                            rx={3}
                          />
                        )}

                        {/* Тело колонны */}
                        <rect
                          x={xPos * scale - halfSize}
                          y={yPos * scale - halfSize}
                          width={colSize}
                          height={colSize}
                          fill={isSelected ? "#dc2626" : "#0f172a"}
                          stroke={isSelected ? "#991b1b" : "#ffffff"}
                          strokeWidth={1}
                          rx={1.5}
                        />

                        {/* Крестик при выделении */}
                        {isSelected && (
                          <g stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round">
                            <line
                              x1={xPos * scale - halfSize + 2}
                              y1={yPos * scale - halfSize + 2}
                              x2={xPos * scale + halfSize - 2}
                              y2={yPos * scale + halfSize - 2}
                            />
                            <line
                              x1={xPos * scale + halfSize - 2}
                              y1={yPos * scale - halfSize + 2}
                              x2={xPos * scale - halfSize + 2}
                              y2={yPos * scale + halfSize - 2}
                            />
                          </g>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Удаленная колонна (контур восстановления) */}
                        <circle
                          cx={xPos * scale}
                          cy={yPos * scale}
                          r={Math.max(4, scale * 0.15)}
                          fill="#f8fafc"
                          stroke="#94a3b8"
                          strokeWidth={1.2}
                          strokeDasharray="2.5 2"
                        />
                        <line
                          x1={xPos * scale - 2.5}
                          y1={yPos * scale}
                          x2={xPos * scale + 2.5}
                          y2={yPos * scale}
                          stroke="#64748b"
                          strokeWidth={1}
                        />
                        <line
                          x1={xPos * scale}
                          y1={yPos * scale - 2.5}
                          x2={xPos * scale}
                          y2={yPos * scale + 2.5}
                          stroke="#64748b"
                          strokeWidth={1}
                        />
                      </>
                    )}
                  </g>
                );
              })
            )}
        </g>

        {/* ======================================================== */}
        {/* 2. МАРКЕРЫ ОСЕЙ (КРУЖКИ С БУКВАМИ И ЦИФРАМИ)             */}
        {/* ======================================================== */}

        {/* Буквенные оси X (А, Б, В, Г...) Сверху */}
        {hasSpans &&
          xColumns.map(({ pos, label }) => {
            const cx = baseX + pos * scale;
            const cy = baseY - AXIS_BUBBLE_DIST;
            return (
              <g key={`x-axis-marker-${label}`}>
                {/* Осевая выносная линия от здания к кружку */}
                <line
                  x1={cx}
                  y1={baseY}
                  x2={cx}
                  y2={cy + axisRadius}
                  stroke="#94a3b8"
                  strokeWidth={0.8}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={axisRadius}
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
                <text
                  x={cx}
                  y={cy}
                  fill="#0f172a"
                  fontSize={axisFontSize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {label}
                </text>
              </g>
            );
          })}

        {/* Цифровые оси Y (1, 2, 3... N) Слева */}
        {hasLayout &&
          yColumns.map(({ pos, label }, idx) => {
            // При очень плотных шагах колонок смещаем четные/нечетные кружки шахматным порядком
            const staggerOffset = isDenseY ? (idx % 2 === 0 ? 0 : 16) : 0;
            const cx = baseX - (AXIS_BUBBLE_DIST + staggerOffset);
            const cy = baseY + pos * scale;

            return (
              <g key={`y-axis-marker-${label}`}>
                {/* Осевая выносная линия от здания к кружку */}
                <line
                  x1={baseX}
                  y1={cy}
                  x2={cx + axisRadius}
                  y2={cy}
                  stroke="#cbd5e1"
                  strokeWidth={0.8}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={axisRadius}
                  fill="#ffffff"
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
                <text
                  x={cx}
                  y={cy}
                  fill="#0f172a"
                  fontSize={axisFontSize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {label}
                </text>
              </g>
            );
          })}

        {/* ======================================================== */}
        {/* 3. РАЗМЕРНЫЕ ЛИНИИ (СПДС)                                */}
        {/* ======================================================== */}
        <g transform={`translate(${baseX}, ${baseY})`}>
          {/* ----------------- ВЕРХНИЕ РАЗМЕРЫ X ----------------- */}

          {/* Уровень 1: Размеры отдельных пролетов (Ближе к зданию) */}
          {hasSpans && spans.length > 1 && (
            <g>
              <line
                x1={0}
                y1={-DIM_LEVEL_1}
                x2={drawWidth}
                y2={-DIM_LEVEL_1}
                stroke="#334155"
                strokeWidth={1}
              />
              {xColumns.map((item, index) => {
                const curX = item.pos * scale;
                const prev = index > 0 ? xColumns[index - 1] : null;
                const prevX = prev ? prev.pos * scale : 0;
                const spanW = prev ? item.pos - prev.pos : 0;

                return (
                  <g key={`x-dim-pt-${index}`}>
                    {/* Выносная засечка */}
                    {renderTick(curX, -DIM_LEVEL_1)}
                    {index > 0 && (
                      <text
                        x={(curX + prevX) / 2}
                        y={-DIM_LEVEL_1 - 7}
                        fill="#0f172a"
                        fontSize={avgXStepPx < 45 ? "9px" : "10.5px"}
                        fontFamily="Arial, sans-serif"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="auto"
                      >
                        {spanW.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Уровень 2: Общая ширина здания (Габаритный размер) */}
          <g>
            <line
              x1={0}
              y1={-DIM_LEVEL_2}
              x2={drawWidth}
              y2={-DIM_LEVEL_2}
              stroke="#0f172a"
              strokeWidth={1.2}
            />
            {/* Засечки по краям */}
            {renderTick(0, -DIM_LEVEL_2)}
            {renderTick(drawWidth, -DIM_LEVEL_2)}

            {/* Выносные линии от углов здания */}
            <line x1={0} y1={0} x2={0} y2={-DIM_LEVEL_2 - 4} stroke="#94a3b8" strokeWidth={0.8} />
            <line
              x1={drawWidth}
              y1={0}
              x2={drawWidth}
              y2={-DIM_LEVEL_2 - 4}
              stroke="#94a3b8"
              strokeWidth={0.8}
            />

            {/* Текст общего габарита */}
            <text
              x={drawWidth / 2}
              y={-DIM_LEVEL_2 - 8}
              fill="#0f172a"
              fontSize="12px"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {blockWidth} м
            </text>
          </g>

          {/* ----------------- ЛЕВЫЕ РАЗМЕРЫ Y ------------------ */}

          {/* Уровень 1: Размеры шагов колонн */}
          {hasLayout && columnLayout.length > 1 && (
            <g>
              <line
                x1={-DIM_LEVEL_1}
                y1={0}
                x2={-DIM_LEVEL_1}
                y2={drawHeight}
                stroke="#334155"
                strokeWidth={1}
              />
              {yColumns.map((item, index) => {
                const curY = item.pos * scale;
                const prev = index > 0 ? yColumns[index - 1] : null;
                const prevY = prev ? prev.pos * scale : 0;
                const stepLen = prev ? item.pos - prev.pos : 0;
                const midY = (curY + prevY) / 2;

                // Для очень плотных шагов (например, 20 шагов по 6м)
                // Если шаг < 22px, не выводим 20 накладывающихся строк, а показываем только первый, последний и середину, либо компактно
                const shouldShowStepText =
                  !isDenseY ||
                  index === 1 ||
                  index === yColumns.length - 1 ||
                  index % 3 === 0;

                return (
                  <g key={`y-dim-pt-${index}`}>
                    {renderTick(-DIM_LEVEL_1, curY)}
                    {index > 0 && shouldShowStepText && (
                      <text
                        x={-DIM_LEVEL_1 - 7}
                        y={midY}
                        fill="#334155"
                        fontSize={isDenseY ? "8.5px" : "9.5px"}
                        fontFamily="Arial, sans-serif"
                        fontWeight="600"
                        textAnchor="end"
                        dominantBaseline="central"
                      >
                        {stepLen.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Уровень 2: Общая длина здания (Габаритный размер) */}
          <g>
            <line
              x1={-DIM_LEVEL_2}
              y1={0}
              x2={-DIM_LEVEL_2}
              y2={drawHeight}
              stroke="#0f172a"
              strokeWidth={1.2}
            />
            {/* Засечки по краям */}
            {renderTick(-DIM_LEVEL_2, 0)}
            {renderTick(-DIM_LEVEL_2, drawHeight)}

            {/* Выносные линии от углов здания */}
            <line x1={0} y1={0} x2={-DIM_LEVEL_2 - 4} y2={0} stroke="#94a3b8" strokeWidth={0.8} />
            <line
              x1={0}
              y1={drawHeight}
              x2={-DIM_LEVEL_2 - 4}
              y2={drawHeight}
              stroke="#94a3b8"
              strokeWidth={0.8}
            />

            {/* Текст общей длины (повернут вертикально) */}
            <text
              transform={`translate(${-DIM_LEVEL_2 - 10}, ${drawHeight / 2}) rotate(-90)`}
              fill="#0f172a"
              fontSize="12px"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {blockLength} м
            </text>
          </g>
        </g>
      </svg>
      </div>
    </div>
  );
}
