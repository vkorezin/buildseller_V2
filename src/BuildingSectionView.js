import React, { useRef, useState } from "react";
import { getAxisLabel, computeSpanRoofHeights } from "./BlockEditorUtils";

export default function BuildingSectionView({
  generalData,
  spans,
  mezzanines = [],
  craneDb = null,
  frameType = "beam",
  onToggleFrameType = null,
  onToggleSpanFrameType = null,
  onAddSpanLeft = null,
  onAddSpanRight = null,
  onDeleteSpan = null,
  zoom = 100,
  showHeader = false,
  styles = {},
}) {
  if (
    !generalData ||
    !spans ||
    spans.length === 0 ||
    generalData.blockWidth <= 0
  ) {
    return (
      <div
        style={{
          width: "100%",
          padding: "30px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          border: "1px dashed #ced4da",
          borderRadius: "8px",
          color: "#6c757d",
        }}
      >
        📐 Задайте параметры пролётов для отображения поперечного разреза
      </div>
    );
  }

  const N_spans = spans.length;
  const isGlobalTruss = String(frameType) === "truss";

  // Суммарная ширина по пролётам
  const totalBuildingWidth = spans.reduce(
    (acc, s) => acc + (Number(s.spanWidth) || 0),
    0
  );
  const H_default = Number(generalData.blockHeight) || 6;

  // 1. Определение параметров каждого пролёта
  const spanConfigs = spans.map((span, idx) => {
    const W = Number(span.spanWidth) || 18;
    const eaveH = Number(span.eaveHeight) > 0 ? Number(span.eaveHeight) : H_default;
    const S = Number(span.slope) > 0 ? Number(span.slope) : 10;
    const isGable = span.skateCount === 2;
    const slopeDir = span.slopeDirection || "right";
    const baseElev = isNaN(Number(span.baseElevation)) ? 0 : Number(span.baseElevation);
    const spanFrameType = span.frameType || frameType || "beam";
    const isSpanTruss = String(spanFrameType) === "truss";

    let hBeamEave = 0.35;
    let hBeamMid = 0.35;

    if (isSpanTruss) {
      let supportH = 0.35;
      if (W > 18 && W < 33) {
        supportH = 0.35 + ((W - 18) * (0.75 - 0.35)) / (33 - 18);
      } else if (W >= 33) {
        supportH = 0.75;
      }
      const trussAdd = S <= 21 ? 0.65 + (10 - S) * 0.0597 : 0;
      hBeamEave = supportH + trussAdd;
      hBeamMid = hBeamEave;
    } else {
      if (W <= 12.0) {
        if (W <= 6.0) hBeamEave = 0.232;
        else if (W <= 8.0) hBeamEave = 0.268;
        else if (W <= 9.0) hBeamEave = 0.317;
        else if (W <= 10.0) hBeamEave = 0.391;
        else if (W <= 11.0) hBeamEave = 0.443;
        else if (W <= 11.5) hBeamEave = 0.515;
        else hBeamEave = 0.613;
        hBeamMid = hBeamEave;
      } else {
        if (W > 18 && W < 33) {
          hBeamEave = 0.35 + ((W - 18) * (0.75 - 0.35)) / (33 - 18);
        } else if (W >= 33) {
          hBeamEave = 0.75;
        } else {
          hBeamEave = 0.35;
        }
        hBeamMid = Math.min(1.5, 2.0 * hBeamEave);
      }
    }

    const skate1Len = isGable
      ? span.skate1Length ?? W / 2
      : W;
    const spanRise = isGable
      ? skate1Len * (S / 100)
      : W * (S / 100);

    const hPurlin = 0.2;
    const eaveTopH = eaveH + hBeamEave;
    const maxRoofH = eaveTopH + spanRise + hPurlin;

    return {
      index: idx,
      W,
      eaveH,
      S,
      isGable,
      slopeDir,
      baseElev,
      skate1Len,
      spanRise,
      hBeamEave,
      hBeamMid,
      hPurlin,
      eaveTopH,
      maxRoofH,
      frameType: spanFrameType,
      isTruss: isSpanTruss,
      cranes: span.cranes || [],
    };
  });

  // 2. Определение границ высот (отметка 0.000 всегда включена в диапазон)
  let minElev = 0; // отметка 0.000 всегда в диапазоне
  let maxElev = 0;

  spanConfigs.forEach((sc) => {
    if (sc.maxRoofH > maxElev) maxElev = sc.maxRoofH;
    if (sc.eaveH > maxElev) maxElev = sc.eaveH;
    if (sc.baseElev < minElev) minElev = sc.baseElev;
  });

  if (mezzanines && mezzanines.length > 0) {
    mezzanines.forEach((m) => {
      const elev = Number(m.elevation) || 0;
      if (elev + 0.5 > maxElev) maxElev = elev + 0.5;
      if (elev < minElev) minElev = elev;
    });
  }

  if (maxElev <= 0) maxElev = 8;
  const totalVerticalSpan = (maxElev - minElev) + 1.2;

  // Динамические пропорции и размеры SVG холста
  const aspect = Math.max(1.2, Math.min(5.0, totalBuildingWidth / Math.max(1, totalVerticalSpan)));
  const svgWidth = 950;
  const svgHeight = Math.max(300, Math.min(650, Math.round(svgWidth / aspect) + 60));

  const padLeft = 70;
  const padRight = 55;
  const padBottom = N_spans > 1 ? 75 : 60;
  const padTop = 45;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const scale = Math.min(
    drawAreaW / Math.max(1, totalBuildingWidth),
    drawAreaH / totalVerticalSpan
  );

  const realDrawW = totalBuildingWidth * scale;
  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;

  // Отметка нуля (0.000) строго фиксирована на холсте
  // При отрицательных minElev уровень нуля поднимается вверх, давая место для заглубленных баз
  const bottomAvailY = svgHeight - padBottom;
  const yZero = bottomAvailY + minElev * scale;

  // Функция перевода высотной отметки в Y координату SVG
  const yElevation = (elevMeters) => yZero - (Number(elevMeters) || 0) * scale;

  // Расчет абсолютных X координат осей
  const colXList = [offsetX];
  let curAccX = offsetX;
  spanConfigs.forEach((sc) => {
    curAccX += sc.W * scale;
    colXList.push(curAccX);
  });

  // Функция расчета координаты верха кровли в точке x для пролёта spanIdx
  const getSpanRoofTopY = (spanIdx, x) => {
    const sc = spanConfigs[spanIdx];
    if (!sc) return yElevation(H_default);

    const spanX1 = colXList[spanIdx];
    const spanX2 = colXList[spanIdx + 1];
    const yEaveTop = yElevation(sc.eaveTopH);
    const spanRiseScaled = sc.spanRise * scale;

    if (sc.isGable) {
      const spanPeakX = spanX1 + (sc.skate1Len / sc.W) * (spanX2 - spanX1);
      const ridgeY = yEaveTop - spanRiseScaled;
      if (x <= spanPeakX) {
        const prog = spanPeakX > spanX1 ? (x - spanX1) / (spanPeakX - spanX1) : 0;
        return yEaveTop - prog * (yEaveTop - ridgeY);
      } else {
        const prog = spanX2 > spanPeakX ? (x - spanPeakX) / (spanX2 - spanPeakX) : 1;
        return ridgeY + prog * (yEaveTop - ridgeY);
      }
    } else {
      const prog = Math.max(0, Math.min(1, (x - spanX1) / (spanX2 - spanX1)));
      if (sc.slopeDir === "left") {
        return yEaveTop - spanRiseScaled + prog * spanRiseScaled;
      } else {
        return yEaveTop - prog * spanRiseScaled;
      }
    }
  };

  // Вычисление отметок низа баз и верха для каждой колонны
  // Каждая колонна идет от своей отметки базы (baseElev) до низа балки/фермы (eaveH)
  const columnData = colXList.map((x, i) => {
    const axisLabel = getAxisLabel(i);

    const leftSpanIdx = i > 0 ? i - 1 : null;
    const rightSpanIdx = i < N_spans ? i : null;

    const leftSc = leftSpanIdx !== null ? spanConfigs[leftSpanIdx] : null;
    const rightSc = rightSpanIdx !== null ? spanConfigs[rightSpanIdx] : null;

    const leftTop = leftSpanIdx !== null ? getSpanRoofTopY(leftSpanIdx, x) : null;
    const rightTop = rightSpanIdx !== null ? getSpanRoofTopY(rightSpanIdx, x) : null;

    // Отметка низа базы колонны
    let baseElev = 0;
    if (i === 0) {
      baseElev = spanConfigs[0].baseElev;
    } else if (i === N_spans) {
      baseElev = spanConfigs[N_spans - 1].baseElev;
    } else {
      // Промежуточная колонна между пролетами i-1 и i
      baseElev = Math.min(spanConfigs[i - 1].baseElev, spanConfigs[i].baseElev);
    }

    // Отметка низа балки / фермы (низ несущей конструкции)
    let eaveElev = H_default;
    if (leftSc !== null && rightSc !== null) {
      eaveElev = Math.min(leftSc.eaveH, rightSc.eaveH);
    } else if (leftSc !== null) {
      eaveElev = leftSc.eaveH;
    } else if (rightSc !== null) {
      eaveElev = rightSc.eaveH;
    }

    const colBaseY = yElevation(baseElev);
    const colHeadY = yElevation(eaveElev);

    const colTopY = Math.min(
      leftTop !== null ? leftTop : Infinity,
      rightTop !== null ? rightTop : Infinity
    );

    // Реальная высота колонны от базы до низа балки/фермы
    const columnLengthM = eaveElev - baseElev;

    return {
      x,
      axisLabel,
      baseElev,
      eaveElev,
      colBaseY,
      colHeadY,
      colTopY,
      columnLengthM,
    };
  });

  // Список уникальных отметок баз колонн для выносок высот
  const distinctBaseElevs = Array.from(
    new Set(columnData.map((c) => c.baseElev))
  ).sort((a, b) => a - b);

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
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      {/* Верхняя компактная панель переключения типа покрытия прямо над чертежом */}
      <div
        data-interactive="true"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          padding: "6px 10px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          flexWrap: "wrap",
          gap: "8px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85em", fontWeight: "700", color: "#334155" }}>
            Конструкция покрытия:
          </span>
          <div style={{ display: "inline-flex", gap: "5px", flexWrap: "wrap" }}>
            {spanConfigs.map((sc, sIdx) => (
              <button
                key={`section-bar-span-${sIdx}`}
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSpanFrameType) onToggleSpanFrameType(sIdx);
                }}
                style={{
                  fontSize: "0.82em",
                  padding: "3px 9px",
                  backgroundColor: sc.isTruss ? "#eff6ff" : "#f0fdf4",
                  color: sc.isTruss ? "#1d4ed8" : "#15803d",
                  border: `1.5px solid ${sc.isTruss ? "#3b82f6" : "#22c55e"}`,
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease",
                }}
                title={`Нажмите, чтобы переключить покрытие Пролёта ${sIdx + 1} (${sc.isTruss ? "Ферма ➔ Балка" : "Балка ➔ Ферма"})`}
              >
                <span>Пр.{sIdx + 1}:</span>
                <span>{sc.isTruss ? "📐 Ферма" : "🏢 Балка"}</span>
                <span style={{ fontSize: "0.95em", opacity: 0.7 }}>⇄</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {onAddSpanLeft && (
            <button
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onAddSpanLeft();
              }}
              style={{
                fontSize: "0.78em",
                padding: "4px 8px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#15803d",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              title="Добавить дополнительный пролёт слева"
            >
              ⬅️ + Пролёт слева
            </button>
          )}

          {onAddSpanRight && (
            <button
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onAddSpanRight();
              }}
              style={{
                fontSize: "0.78em",
                padding: "4px 8px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#15803d",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              title="Добавить дополнительный пролёт справа"
            >
              + Пролёт справа ➡️
            </button>
          )}

          {onToggleFrameType && (
            <button
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFrameType();
              }}
              style={{
                fontSize: "0.78em",
                padding: "4px 10px",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                color: "#475569",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              title="Переключить тип несущей конструкции для всех пролётов"
            >
              Все {isGlobalTruss ? "Балки" : "Фермы"}
            </button>
          )}
        </div>
      </div>

      {/* Опциональная внутренняя расширенная шапка разреза (если showHeader=true) */}
      {showHeader && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            borderBottom: "1px solid #e1e4e8",
            paddingBottom: "8px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.05em", fontWeight: "bold", color: "#1f2328" }}>
              📐 Поперечный разрез здания
            </span>
            <span
              style={{
                backgroundColor: "#e8f4fd",
                color: "#0969da",
                fontSize: "0.82em",
                padding: "3px 10px",
                borderRadius: "12px",
                fontWeight: "600",
              }}
            >
              {N_spans === 1
                ? `1 пролёт (${spanConfigs[0].W} м)`
                : `${N_spans} прол. (общ. ${totalBuildingWidth.toFixed(1)} м)`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.85em", color: "#57606a" }}>
              Покрытие:{" "}
              <span style={{ fontWeight: "bold", color: "#0969da" }}>
                {spanConfigs.every((sc) => sc.isTruss)
                  ? "Ферма"
                  : spanConfigs.every((sc) => !sc.isTruss)
                  ? "Балка переменного сечения"
                  : "Комбинированное (Балка / Ферма)"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG холст: Адаптивный, масштабируемый под размеры родительского окна с поддержкой скролла и панорамирования (Pan/Drag) */}
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
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
          padding: "8px 0",
          cursor: isDragging ? "grabbing" : zoomFactor > 1 ? "grab" : "default",
          userSelect: isDragging ? "none" : "auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            minWidth: zoomFactor > 1 ? `${zoomFactor * 100}%` : "100%",
            width: zoomFactor > 1 ? `${zoomFactor * 100}%` : "100%",
            display: "block",
            margin: "0 auto",
          }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              pointerEvents: "auto",
            }}
          >
          {/* Фоновая сетка холста */}
          <defs>
            <pattern id="section-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f8fafc" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#section-grid)" />
          {/* 1. Постоянный уровень чистого пола / земли 0.000 */}
          <line
            x1={colXList[0] - 35}
            y1={yZero}
            x2={colXList[N_spans] + 35}
            y2={yZero}
            stroke="#24292f"
            strokeWidth={1.6}
          />
          {/* Штриховка основания пола */}
          <line
            x1={colXList[0] - 35}
            y1={yZero + 3.5}
            x2={colXList[N_spans] + 35}
            y2={yZero + 3.5}
            stroke="#8c959f"
            strokeWidth={0.8}
            strokeDasharray="5 3"
          />

          {/* 2. Колонны, фундаменты и координационные оси */}
          {columnData.map((col, i) => {
            const { x, axisLabel, colBaseY, colHeadY, colTopY } = col;

            // Самая нижняя точка оси для размещения марки и цепочки размеров
            const maxAxisBottomY = Math.max(colBaseY, yZero);

            return (
              <g key={`col-axis-${i}`}>
                {/* Осевая штрихпунктирная линия по ГОСТ */}
                <line
                  x1={x}
                  y1={colTopY - 16}
                  x2={x}
                  y2={maxAxisBottomY + 24}
                  stroke="#cf222e"
                  strokeWidth={0.8}
                  strokeDasharray="7 3 2 3"
                  opacity={0.8}
                />

                {/* Фундаментный блок / подколонник на отметке базы */}
                <rect
                  x={x - 9}
                  y={colBaseY}
                  width={18}
                  height={6.5}
                  fill="#6e7781"
                  stroke="#24292f"
                  strokeWidth={0.8}
                />

                {/* Несущий ствол колонны (от отметки базы до низа балки/фермы) */}
                <line
                  x1={x}
                  y1={colBaseY}
                  x2={x}
                  y2={colHeadY}
                  stroke="#0969da"
                  strokeWidth={i === 0 || i === N_spans ? 4.2 : 3.4}
                />

                {/* Опорный оголовок колонны (узел стыковки с балкой/фермой) */}
                <line
                  x1={x - 5}
                  y1={colHeadY}
                  x2={x + 5}
                  y2={colHeadY}
                  stroke="#0969da"
                  strokeWidth={2}
                />

                {/* Стойка продолжения до верха пояса */}
                <line
                  x1={x}
                  y1={colHeadY}
                  x2={x}
                  y2={colTopY}
                  stroke="#0969da"
                  strokeWidth={1.5}
                  opacity={0.85}
                />

                {/* Марка оси в кружке */}
                <circle
                  cx={x}
                  cy={maxAxisBottomY + 30}
                  r={9}
                  fill="#ffffff"
                  stroke="#24292f"
                  strokeWidth={1.1}
                />
                <text
                  x={x}
                  y={maxAxisBottomY + 34}
                  fontSize={10.5}
                  fontWeight="bold"
                  fill="#24292f"
                  textAnchor="middle"
                >
                  {axisLabel}
                </text>

                {/* Попролётная цепочка размеров между смежными осями */}
                {i < N_spans && (
                  <g key={`dim-span-${i}`}>
                    <line
                      x1={x}
                      y1={maxAxisBottomY + 14}
                      x2={colXList[i + 1]}
                      y2={maxAxisBottomY + 14}
                      stroke="#24292f"
                      strokeWidth={0.85}
                    />
                    {/* Засечки размера */}
                    <line
                      x1={x - 3}
                      y1={maxAxisBottomY + 17}
                      x2={x + 3}
                      y2={maxAxisBottomY + 11}
                      stroke="#24292f"
                      strokeWidth={1.3}
                    />
                    <line
                      x1={colXList[i + 1] - 3}
                      y1={maxAxisBottomY + 17}
                      x2={colXList[i + 1] + 3}
                      y2={maxAxisBottomY + 11}
                      stroke="#24292f"
                      strokeWidth={1.3}
                    />
                    <text
                      x={(x + colXList[i + 1]) / 2}
                      y={maxAxisBottomY + 10}
                      fontSize={9.5}
                      fontWeight="bold"
                      fill="#24292f"
                      textAnchor="middle"
                    >
                      {`${spanConfigs[i].W.toFixed(1)} м`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Общий габаритный размер при числе пролётов > 1 */}
          {N_spans > 1 && (() => {
            const maxOverallY = Math.max(
              ...columnData.map((c) => Math.max(c.colBaseY, yZero))
            );
            return (
              <g key="overall-dim-block">
                <line
                  x1={colXList[0]}
                  y1={maxOverallY + 48}
                  x2={colXList[N_spans]}
                  y2={maxOverallY + 48}
                  stroke="#57606a"
                  strokeWidth={0.9}
                />
                <line
                  x1={colXList[0] - 3.5}
                  y1={maxOverallY + 51.5}
                  x2={colXList[0] + 3.5}
                  y2={maxOverallY + 44.5}
                  stroke="#57606a"
                  strokeWidth={1.3}
                />
                <line
                  x1={colXList[N_spans] - 3.5}
                  y1={maxOverallY + 51.5}
                  x2={colXList[N_spans] + 3.5}
                  y2={maxOverallY + 44.5}
                  stroke="#57606a"
                  strokeWidth={1.3}
                />
                <text
                  x={(colXList[0] + colXList[N_spans]) / 2}
                  y={maxOverallY + 45}
                  fontSize={9.5}
                  fontWeight="bold"
                  fill="#57606a"
                  textAnchor="middle"
                >
                  {`Общая ширина: ${totalBuildingWidth.toFixed(1)} м (${N_spans} прол.)`}
                </text>
              </g>
            );
          })()}

          {/* 3. Междуэтажные перекрытия / Антресоли */}
          {mezzanines &&
            mezzanines.map((mezz) => {
              const elev = Number(mezz.elevation) || 0;
              const yMezz = yElevation(elev);
              const xStart = colXList[0];
              const xEnd = colXList[N_spans];

              return (
                <g key={`mezzanine-level-${mezz.id}`}>
                  {/* Несущая балка перекрытия */}
                  <line
                    x1={xStart}
                    y1={yMezz}
                    x2={xEnd}
                    y2={yMezz}
                    stroke="#0056b3"
                    strokeWidth={3}
                  />
                  {/* Плита перекрытия / настил */}
                  <rect
                    x={xStart}
                    y={yMezz - 3.5}
                    width={xEnd - xStart}
                    height={3.5}
                    fill="#d0e2ff"
                    stroke="#0056b3"
                    strokeWidth={0.6}
                  />
                </g>
              );
            })}

          {/* 4. Несущие конструкции покрытия по каждому пролету */}
          {spanConfigs.map((sc, i) => {
            const x1 = colXList[i];
            const x2 = colXList[i + 1];
            const xMid = sc.isGable
              ? x1 + (sc.skate1Len / sc.W) * (x2 - x1)
              : (x1 + x2) / 2;

            const yTop1 = getSpanRoofTopY(i, x1);
            const yTop2 = getSpanRoofTopY(i, x2);
            const yTopMid = getSpanRoofTopY(i, xMid);

            const yClear = yElevation(sc.eaveH);
            const yBot1 = sc.isGable ? yClear : yTop1 + sc.hBeamEave * scale;
            const yBot2 = sc.isGable ? yClear : yTop2 + sc.hBeamEave * scale;
            const yBotMid = yTopMid + sc.hBeamMid * scale;

            const panelCount = Math.max(4, Math.round(sc.W / 3));
            const spanNodes = [];
            for (let p = 0; p <= panelCount; p++) {
              const px = x1 + (p / panelCount) * (x2 - x1);
              const pyTop = getSpanRoofTopY(i, px);
              spanNodes.push({ x: px, yTop: pyTop, yBot: yClear });
            }

            return (
              <g key={`span-construct-${i}`}>
                {sc.isTruss ? (
                  /* Ферма */
                  <g>
                    {/* Нижний пояс */}
                    <line
                      x1={x1}
                      y1={yClear}
                      x2={x2}
                      y2={yClear}
                      stroke="#0969da"
                      strokeWidth={2.2}
                    />
                    {/* Верхний пояс */}
                    {sc.isGable ? (
                      <g>
                        <line
                          x1={x1}
                          y1={yTop1}
                          x2={xMid}
                          y2={yTopMid}
                          stroke="#0969da"
                          strokeWidth={2.6}
                        />
                        <line
                          x1={xMid}
                          y1={yTopMid}
                          x2={x2}
                          y2={yTop2}
                          stroke="#0969da"
                          strokeWidth={2.6}
                        />
                      </g>
                    ) : (
                      <line
                        x1={x1}
                        y1={yTop1}
                        x2={x2}
                        y2={yTop2}
                        stroke="#0969da"
                        strokeWidth={2.6}
                      />
                    )}

                    {/* Решетка фермы (стойки и раскосы) */}
                    {spanNodes.map((node, nIdx) => {
                      let diagY1 = yClear;
                      let diagY2 = spanNodes[nIdx + 1]?.yTop || yClear;

                      if (sc.isGable) {
                        const midIndex = Math.floor(panelCount / 2);
                        diagY1 = nIdx >= midIndex ? node.yTop : yClear;
                        diagY2 = nIdx >= midIndex ? yClear : spanNodes[nIdx + 1]?.yTop;
                      } else {
                        if (sc.slopeDir === "left") {
                          diagY1 = nIdx % 2 === 0 ? node.yTop : yClear;
                          diagY2 = nIdx % 2 === 0 ? yClear : spanNodes[nIdx + 1]?.yTop;
                        } else {
                          diagY1 = nIdx % 2 === 0 ? yClear : node.yTop;
                          diagY2 = nIdx % 2 === 0 ? spanNodes[nIdx + 1]?.yTop : yClear;
                        }
                      }

                      return (
                        <g key={`truss-web-${i}-${nIdx}`}>
                          <line
                            x1={node.x}
                            y1={yClear}
                            x2={node.x}
                            y2={node.yTop}
                            stroke="#0969da"
                            strokeWidth={1.1}
                          />
                          {nIdx < panelCount && (
                            <line
                              x1={node.x}
                              y1={diagY1}
                              x2={spanNodes[nIdx + 1].x}
                              y2={diagY2}
                              stroke="#0969da"
                              strokeWidth={0.85}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                ) : (
                  /* Балка переменного сечения */
                  <g>
                    {sc.isGable ? (
                      <g>
                        <polygon
                          points={`${x1},${yClear} ${x1},${yTop1} ${xMid},${yTopMid} ${x2},${yTop2} ${x2},${yClear} ${xMid},${yBotMid}`}
                          fill="#ddf4ff"
                          stroke="#0969da"
                          strokeWidth={2.2}
                        />
                        <line
                          x1={xMid}
                          y1={yBotMid}
                          x2={xMid}
                          y2={yTopMid}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                        <line
                          x1={x1}
                          y1={yClear}
                          x2={x1}
                          y2={yTop1}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                        <line
                          x1={x2}
                          y1={yClear}
                          x2={x2}
                          y2={yTop2}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                      </g>
                    ) : (
                      <g>
                        <polygon
                          points={`${x1},${yBot1} ${x1},${yTop1} ${x2},${yTop2} ${x2},${yBot2} ${xMid},${yBotMid}`}
                          fill="#ddf4ff"
                          stroke="#0969da"
                          strokeWidth={2.2}
                        />
                        <line
                          x1={xMid}
                          y1={yBotMid}
                          x2={xMid}
                          y2={yTopMid}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                        <line
                          x1={x1}
                          y1={yBot1}
                          x2={x1}
                          y2={yTop1}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                        <line
                          x1={x2}
                          y1={yBot2}
                          x2={x2}
                          y2={yTop2}
                          stroke="#0056b3"
                          strokeWidth={1.8}
                        />
                      </g>
                    )}
                  </g>
                )}

                {/* Интерактивный бейдж типа покрытия пролёта */}
                <g
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onToggleSpanFrameType) onToggleSpanFrameType(i);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    cursor: onToggleSpanFrameType ? "pointer" : "default",
                    pointerEvents: "all",
                  }}
                >
                  <rect
                    x={xMid - 38}
                    y={yClear + 4}
                    width={76}
                    height={16}
                    rx={4}
                    fill={sc.isTruss ? "#eff6ff" : "#f0fdf4"}
                    stroke={sc.isTruss ? "#3b82f6" : "#22c55e"}
                    strokeWidth={1.2}
                    opacity={0.96}
                  />
                  <text
                    x={xMid}
                    y={yClear + 15}
                    fontSize={8.5}
                    fontWeight="bold"
                    fill={sc.isTruss ? "#1d4ed8" : "#15803d"}
                    textAnchor="middle"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {sc.isTruss ? "📐 Ферма ⇄" : "🏢 Балка ⇄"}
                  </text>
                </g>

                {/* Прогоны покрытия */}
                {spanNodes.map((node, pIdx) => (
                  <rect
                    key={`purlin-${i}-${pIdx}`}
                    x={node.x - 1.5}
                    y={node.yTop - sc.hPurlin * scale}
                    width={3}
                    height={sc.hPurlin * scale}
                    fill="#1a7f37"
                    stroke="#116329"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Кровля (профиль / сэндвич) */}
                {sc.isGable ? (
                  <g>
                    <line
                      x1={x1 - (i === 0 ? 3 : 0)}
                      y1={yTop1 - sc.hPurlin * scale}
                      x2={xMid}
                      y2={yTopMid - sc.hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2.2}
                    />
                    <line
                      x1={xMid}
                      y1={yTopMid - sc.hPurlin * scale}
                      x2={x2 + (i === N_spans - 1 ? 3 : 0)}
                      y2={yTop2 - sc.hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2.2}
                    />
                  </g>
                ) : (
                  <g>
                    <line
                      x1={x1 - (i === 0 ? 3 : 0)}
                      y1={yTop1 - sc.hPurlin * scale}
                      x2={x2 + (i === N_spans - 1 ? 3 : 0)}
                      y2={yTop2 - sc.hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2.2}
                    />
                    {/* Ступенька между смежными пролетами */}
                    {i < N_spans - 1 && (() => {
                      const nextYTop1 = getSpanRoofTopY(i + 1, x2);
                      if (Math.abs(yTop2 - nextYTop1) > 0.5) {
                        return (
                          <line
                            x1={x2}
                            y1={yTop2 - sc.hPurlin * scale}
                            x2={x2}
                            y2={nextYTop1 - sc.hPurlin * scale}
                            stroke="#1a7f37"
                            strokeWidth={2.2}
                          />
                        );
                      }
                      return null;
                    })()}
                  </g>
                )}

                {/* Крановое оборудование пролёта */}
                {sc.cranes &&
                  sc.cranes.map((cr, cIdx) => {
                    const cap = Number(cr.selectedCapacity || cr.cap) || 0;
                    if (cap <= 0) return null;

                    const isSupport = !cr.type || cr.type !== "suspension";
                    const colH = sc.eaveH - sc.baseElev;
                    const craneBaseH = sc.baseElev + colH * 0.72;
                    const yBracket = yElevation(craneBaseH);

                    return (
                      <g key={`crane-${i}-${cIdx}`}>
                        {isSupport ? (
                          /* Опорный кран */
                          <g>
                            {/* Консоли на колоннах */}
                            <line
                              x1={x1}
                              y1={yBracket}
                              x2={x1 + 6}
                              y2={yBracket}
                              stroke="#bc4c00"
                              strokeWidth={2.2}
                            />
                            <line
                              x1={x2}
                              y1={yBracket}
                              x2={x2 - 6}
                              y2={yBracket}
                              stroke="#bc4c00"
                              strokeWidth={2.2}
                            />
                            {/* Подкрановые балки */}
                            <rect
                              x={x1 + 3}
                              y={yBracket - 4.5}
                              width={4.5}
                              height={4.5}
                              fill="#bc4c00"
                            />
                            <rect
                              x={x2 - 7.5}
                              y={yBracket - 4.5}
                              width={4.5}
                              height={4.5}
                              fill="#bc4c00"
                            />
                            {/* Мост крана */}
                            <line
                              x1={x1 + 6}
                              y1={yBracket - 5.5}
                              x2={x2 - 6}
                              y2={yBracket - 5.5}
                              stroke="#d48200"
                              strokeWidth={2.8}
                            />
                            {/* Тележка крана */}
                            <rect
                              x={(x1 + x2) / 2 - 6}
                              y={yBracket - 10}
                              width={12}
                              height={6}
                              fill="#ffdf5d"
                              stroke="#bc4c00"
                              strokeWidth={0.9}
                            />
                            {/* Крюк */}
                            <line
                              x1={(x1 + x2) / 2}
                              y1={yBracket - 4}
                              x2={(x1 + x2) / 2}
                              y2={yBracket + 12}
                              stroke="#bc4c00"
                              strokeWidth={1.2}
                            />
                            <text
                              x={(x1 + x2) / 2}
                              y={yBracket - 12}
                              fontSize={8.5}
                              fontWeight="bold"
                              fill="#9a3412"
                              textAnchor="middle"
                            >
                              {`Кран ${cap} т`}
                            </text>
                          </g>
                        ) : (
                          /* Подвесной кран */
                          <g>
                            <line
                              x1={x1 + 15}
                              y1={yClear}
                              x2={x1 + 15}
                              y2={yClear + 9}
                              stroke="#bc4c00"
                              strokeWidth={1.6}
                            />
                            <line
                              x1={x2 - 15}
                              y1={yClear}
                              x2={x2 - 15}
                              y2={yClear + 9}
                              stroke="#bc4c00"
                              strokeWidth={1.6}
                            />
                            <line
                              x1={x1 + 11}
                              y1={yClear + 9}
                              x2={x2 - 11}
                              y2={yClear + 9}
                              stroke="#d48200"
                              strokeWidth={2.4}
                            />
                            {/* Тележка */}
                            <rect
                              x={(x1 + x2) / 2 - 5}
                              y={yClear + 7}
                              width={10}
                              height={5}
                              fill="#ffdf5d"
                              stroke="#bc4c00"
                              strokeWidth={0.8}
                            />
                            <line
                              x1={(x1 + x2) / 2}
                              y1={yClear + 12}
                              x2={(x1 + x2) / 2}
                              y2={yClear + 22}
                              stroke="#bc4c00"
                              strokeWidth={1.2}
                            />
                            <text
                              x={(x1 + x2) / 2}
                              y={yClear + 32}
                              fontSize={8.5}
                              fontWeight="bold"
                              fill="#9a3412"
                              textAnchor="middle"
                            >
                              {`Подвесной кран ${cap} т`}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
              </g>
            );
          })}

          {/* 5. Высотные отметки */}
          {/* Постоянная отметка 0.000 */}
          <g key="elev-zero-mark">
            <line
              x1={colXList[0] - 6}
              y1={yZero}
              x2={colXList[0] - 22}
              y2={yZero}
              stroke="#24292f"
              strokeWidth={0.9}
            />
            <polygon
              points={`${colXList[0] - 6},${yZero} ${colXList[0] - 12},${yZero - 4} ${colXList[0] - 12},${yZero + 4}`}
              fill="#24292f"
            />
            <text
              x={colXList[0] - 25}
              y={yZero + 3.5}
              fontSize={9}
              fontWeight="bold"
              fill="#24292f"
              textAnchor="end"
            >
              0.000
            </text>
          </g>

          {/* Отметки низа баз колонн (если отличаются от 0.000) */}
          {distinctBaseElevs
            .filter((elev) => Math.abs(elev) > 0.001)
            .map((elev, idx) => {
              const yBase = yElevation(elev);
              const signStr = elev > 0 ? `+${elev.toFixed(2)}` : elev.toFixed(2);
              return (
                <g key={`elev-base-${idx}`}>
                  <line
                    x1={colXList[0] - 6}
                    y1={yBase}
                    x2={colXList[0] - 22}
                    y2={yBase}
                    stroke="#57606a"
                    strokeWidth={0.9}
                  />
                  <polygon
                    points={`${colXList[0] - 6},${yBase} ${colXList[0] - 12},${yBase - 4} ${colXList[0] - 12},${yBase + 4}`}
                    fill="#57606a"
                  />
                  <text
                    x={colXList[0] - 25}
                    y={yBase + 3.5}
                    fontSize={8.5}
                    fontWeight="bold"
                    fill="#57606a"
                    textAnchor="end"
                  >
                    {signStr}
                  </text>
                </g>
              );
            })}

          {/* Отметки перекрытий / антресолей */}
          {mezzanines &&
            mezzanines.map((m) => {
              const elev = Number(m.elevation) || 0;
              const yM = yElevation(elev);
              return (
                <g key={`elev-mezz-${m.id}`}>
                  <line
                    x1={colXList[0] - 6}
                    y1={yM}
                    x2={colXList[0] - 22}
                    y2={yM}
                    stroke="#0056b3"
                    strokeWidth={0.9}
                  />
                  <polygon
                    points={`${colXList[0] - 6},${yM} ${colXList[0] - 12},${yM - 4} ${colXList[0] - 12},${yM + 4}`}
                    fill="#0056b3"
                  />
                  <text
                    x={colXList[0] - 25}
                    y={yM + 3.5}
                    fontSize={8.5}
                    fontWeight="bold"
                    fill="#0056b3"
                    textAnchor="end"
                  >
                    {`+${elev.toFixed(2)}`}
                  </text>
                </g>
              );
            })}

          {/* Отметка низа несущих конструкций (пролёт 1) */}
          {(() => {
            const sc0 = spanConfigs[0];
            const yClear0 = yElevation(sc0.eaveH);
            return (
              <g key="elev-clear-0">
                <line
                  x1={colXList[0] - 6}
                  y1={yClear0}
                  x2={colXList[0] - 22}
                  y2={yClear0}
                  stroke="#0969da"
                  strokeWidth={0.9}
                />
                <polygon
                  points={`${colXList[0] - 6},${yClear0} ${colXList[0] - 12},${yClear0 - 4} ${colXList[0] - 12},${yClear0 + 4}`}
                  fill="#0969da"
                />
                <text
                  x={colXList[0] - 25}
                  y={yClear0 + 3.5}
                  fontSize={9}
                  fontWeight="bold"
                  fill="#0969da"
                  textAnchor="end"
                >
                  {`+${sc0.eaveH.toFixed(2)}`}
                </text>
              </g>
            );
          })()}

          {/* Отметки коньков / высших точек кровли (привязаны к фактической отметке верха конструкций пролёта) */}
          {spanConfigs.map((sc, i) => {
            const rawSpan = (spans && spans[i]) || {};
            const geo = computeSpanRoofHeights(rawSpan, frameType);
            const peakH =
              typeof geo.peakH === "number" && !isNaN(geo.peakH)
                ? geo.peakH
                : Number(sc.eaveTopH || 0) + Number(sc.spanRise || 0) + Number(sc.hPurlin || 0);

            const x1 = colXList[i];
            const x2 = colXList[i + 1];
            const xMid = sc.isGable
              ? x1 + (sc.skate1Len / sc.W) * (x2 - x1)
              : sc.slopeDir === "left"
              ? x1
              : x2;

            const ridgeY = getSpanRoofTopY(i, xMid) - sc.hPurlin * scale;
            const signStr = peakH >= 0 ? `+${peakH.toFixed(2)}` : `${peakH.toFixed(2)}`;

            return (
              <g key={`ridge-elev-${i}`}>
                <line
                  x1={xMid - 7}
                  y1={ridgeY}
                  x2={xMid + 7}
                  y2={ridgeY}
                  stroke="#1a7f37"
                  strokeWidth={0.9}
                />
                <polygon
                  points={`${xMid},${ridgeY} ${xMid - 3.5},${ridgeY - 6} ${xMid + 3.5},${ridgeY - 6}`}
                  fill="#1a7f37"
                />
                <text
                  x={xMid}
                  y={ridgeY - 8}
                  fontSize={9}
                  fontWeight="bold"
                  fill="#1a7f37"
                  textAnchor="middle"
                >
                  {signStr}
                </text>
              </g>
            );
          })}
        </svg>
        </div>
      </div>
    </div>
  );
}
