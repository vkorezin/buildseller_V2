import React from "react";
import { getValidFloorElevations } from "./floorStructureConstants";

const AXIS_LABELS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "И", "К", "Л"];

export default function QuickEstimatorSectionView({
  spanWidth = 18,
  spansCount = 2,
  height = 6,
  stories = 1,
  roofShape = "gable",
  slope = 10,
  frameType = "beam",
  setFrameType = null,
  cranes = [],
  spanOrientations = [],
  floorStructure = null,
}) {
  const W_span = Number(spanWidth) > 0 ? Number(spanWidth) : 18;
  const numStories = Math.max(1, Math.min(4, Number(stories) || 1));

  let N_spans = Number(spansCount) || 1;
  if (Array.isArray(cranes) && cranes.length > N_spans) {
    N_spans = cranes.length;
  }
  N_spans = Math.max(1, Math.min(N_spans, 10));

  const H_clear = Number(height) > 0 ? Number(height) : 6;
  const S = Number(slope) > 0 ? Number(slope) : 10;
  const isGable = String(roofShape) !== "single";
  const isTruss = String(frameType) === "truss";

  // 1. Определение высот балки / фермы
  let hBeamEave = 0.35;
  let hBeamMid = 0.35;

  if (isTruss) {
    let supportH = 0.35;
    if (W_span > 18 && W_span < 33) {
      supportH = 0.35 + ((W_span - 18) * (0.75 - 0.35)) / (33 - 18);
    } else if (W_span >= 33) {
      supportH = 0.75;
    }
    const trussAdd = S <= 21 ? 0.65 + (10 - S) * 0.0597 : 0;
    hBeamEave = supportH + trussAdd;
    hBeamMid = hBeamEave;
  } else {
    // Балка
    if (W_span <= 12.0) {
      if (W_span <= 6.0) hBeamEave = 0.232;
      else if (W_span <= 8.0) hBeamEave = 0.268;
      else if (W_span <= 9.0) hBeamEave = 0.317;
      else if (W_span <= 10.0) hBeamEave = 0.391;
      else if (W_span <= 11.0) hBeamEave = 0.443;
      else if (W_span <= 11.5) hBeamEave = 0.515;
      else hBeamEave = 0.613;
      hBeamMid = hBeamEave;
    } else {
      if (W_span > 18 && W_span < 33) {
        hBeamEave = 0.35 + ((W_span - 18) * (0.75 - 0.35)) / (33 - 18);
      } else if (W_span >= 33) {
        hBeamEave = 0.75;
      } else {
        hBeamEave = 0.35;
      }
      hBeamMid = Math.min(1.5, 2.0 * hBeamEave);
    }
  }

  const hPurlin = 0.2;
  const totalBuildingWidth = W_span * N_spans;
  const spanRise = isGable
    ? (W_span / 2) * (S / 100)
    : W_span * (S / 100);

  const H_eave_top = H_clear + hBeamEave;
  const H_max_roof = H_eave_top + spanRise + hPurlin;

  const svgWidth = 800;
  const svgHeight = 260;

  const padLeft = 65;
  const padRight = 50;
  const padBottom = 45;
  const padTop = 35;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const scale = Math.min(
    drawAreaW / totalBuildingWidth,
    drawAreaH / (H_max_roof * 1.18)
  );
  const realDrawW = totalBuildingWidth * scale;

  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;
  const baseGroundY = svgHeight - padBottom;

  const yClear = baseGroundY - H_clear * scale;
  const yEaveTop = baseGroundY - H_eave_top * scale;

  const colXList = [];
  for (let i = 0; i <= N_spans; i++) {
    colXList.push(offsetX + i * (W_span * scale));
  }

  const floorHeight = H_clear / numStories;
  const floorLevels = [];
  const validElevs = getValidFloorElevations(numStories, H_clear, floorStructure?.storyElevations);
  for (let f = 1; f < numStories; f++) {
    const hLevel = validElevs[f - 1] !== undefined ? validElevs[f - 1] : ((f * H_clear) / numStories);
    const yLevel = baseGroundY - hLevel * scale;
    floorLevels.push({ index: f, hLevel, yLevel });
  }
  const topMezzanineY =
    floorLevels.length > 0
      ? floorLevels[floorLevels.length - 1].yLevel
      : baseGroundY;

  // Логика промежуточных колонн:
  // Если заданы ручные пролеты в floorStructure (columnSpansMode === "manual"),
  // иначе по нормативному правилу: при W_span >= 9м делим пополам и каждые следующие 9м
  const intermediateColsData = [];
  let subBaysCount = 1;
  if (numStories > 1) {
    if (
      floorStructure?.columnSpansMode === "manual" &&
      Array.isArray(floorStructure?.columnSpans) &&
      floorStructure.columnSpans.length > 0
    ) {
      const rawSpans = floorStructure.columnSpans
        .map((v) => Number(v) || 0)
        .filter((v) => v > 0);
      subBaysCount = rawSpans.length;
      if (rawSpans.length > 1) {
        const totalS = rawSpans.reduce((a, b) => a + b, 0) || W_span;
        let accum = 0;
        for (let s = 0; s < rawSpans.length - 1; s++) {
          accum += rawSpans[s];
          intermediateColsData.push({
            ratio: accum / totalS,
            label: `${rawSpans[s].toFixed(1)}м`,
          });
        }
      }
    } else {
      const kSub = W_span >= 9 ? Math.floor(W_span / 9) + 1 : 1;
      subBaysCount = kSub;
      if (kSub > 1) {
        const subBayMeters = W_span / kSub;
        for (let s = 1; s < kSub; s++) {
          intermediateColsData.push({
            ratio: s / kSub,
            label: `${subBayMeters.toFixed(1)}м`,
          });
        }
      }
    }
  }

  // Функция расчета координаты верха кровли в точке x внутри конкретного пролёта spanIndex
  const getSpanRoofTopY = (spanIdx, x) => {
    const spanX1 = colXList[spanIdx];
    const spanX2 = colXList[spanIdx + 1];
    if (isGable) {
      const spanMid = (spanX1 + spanX2) / 2;
      const ridgeY = yEaveTop - spanRise * scale;
      if (x <= spanMid) {
        return (
          yEaveTop - ((x - spanX1) / (spanMid - spanX1)) * (yEaveTop - ridgeY)
        );
      } else {
        return (
          ridgeY + ((x - spanMid) / (spanX2 - spanMid)) * (yEaveTop - ridgeY)
        );
      }
    } else {
      const ori = (spanOrientations && spanOrientations[spanIdx]) || "right";
      const prog = Math.max(0, Math.min(1, (x - spanX1) / (spanX2 - spanX1)));
      if (ori === "left") {
        return (yEaveTop - spanRise * scale) + prog * (spanRise * scale);
      } else {
        return yEaveTop - prog * (spanRise * scale);
      }
    }
  };

  const getRoofTopY = (x) => {
    const relX = x - offsetX;
    const spanIndex = Math.min(
      N_spans - 1,
      Math.max(0, Math.floor(relX / (W_span * scale)))
    );
    return getSpanRoofTopY(spanIndex, x);
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
          borderBottom: "1px solid #e1e4e8",
          paddingBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.1em", fontWeight: "bold", color: "#24292f" }}>
            📐 Эскиз поперечного разреза здания
          </span>
          <span
            style={{
              backgroundColor: "#e8f4fd",
              color: "#007bff",
              fontSize: "0.8em",
              padding: "2px 8px",
              borderRadius: "12px",
              fontWeight: "600",
            }}
          >
            {N_spans === 1
              ? `1 пролёт (${W_span} м)`
              : `${N_spans} пролёта по ${W_span} м (общ. ${totalBuildingWidth} м)`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.82em", color: "#57606a" }}>
            Конструкция: <b>{isTruss ? "Ферма" : "Балка переменного сечения"}</b> | Кровля:{" "}
            <b>{isGable ? "Двускатная" : "Односкатная"} ({S}%)</b>
          </div>
          {setFrameType && (
            <button
              type="button"
              onClick={() => setFrameType(isTruss ? "beam" : "truss")}
              style={{
                fontSize: "0.78em",
                padding: "2px 8px",
                backgroundColor: isTruss ? "#eff6ff" : "#f0fdf4",
                color: isTruss ? "#1d4ed8" : "#15803d",
                border: `1px solid ${isTruss ? "#93c5fd" : "#86efac"}`,
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Нажмите, чтобы переключить тип несущей конструкции (Балка / Ферма)"
            >
              <span>{isTruss ? "📐 Ферма" : "🏢 Балка"}</span>
              <span style={{ opacity: 0.7 }}>⇄</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ width: "100%", overflowX: "auto", display: "flex", justifyContent: "center" }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: "100%",
            maxWidth: "800px",
            height: "auto",
            backgroundColor: "#fbfcfd",
            borderRadius: "6px",
            border: "1px solid #eaeef2",
          }}
        >
          {/* 1. Уровень земли / пола 0.000 */}
          <line
            x1={colXList[0] - 25}
            y1={baseGroundY}
            x2={colXList[N_spans] + 25}
            y2={baseGroundY}
            stroke="#24292f"
            strokeWidth={1.5}
          />
          {/* Штриховка пола */}
          <line
            x1={colXList[0] - 25}
            y1={baseGroundY + 3}
            x2={colXList[N_spans] + 25}
            y2={baseGroundY + 3}
            stroke="#8c959f"
            strokeWidth={0.7}
            strokeDasharray="4 3"
          />

          {/* 2. Колонны и координационные оси */}
          {colXList.map((x, i) => {
            const axisLabel = AXIS_LABELS[i] || `${i + 1}`;
            
            const leftSpanIdx = i > 0 ? i - 1 : null;
            const rightSpanIdx = i < N_spans ? i : null;

            const leftTop = leftSpanIdx !== null ? getSpanRoofTopY(leftSpanIdx, x) : null;
            const rightTop = rightSpanIdx !== null ? getSpanRoofTopY(rightSpanIdx, x) : null;

            const leftBot = leftTop !== null ? (isGable || isTruss ? yClear : leftTop + hBeamEave * scale) : null;
            const rightBot = rightTop !== null ? (isGable || isTruss ? yClear : rightTop + hBeamEave * scale) : null;

            const colTopY = Math.min(
              leftTop !== null ? leftTop : Infinity,
              rightTop !== null ? rightTop : Infinity
            );
            const colHeadY = Math.min(
              leftBot !== null ? leftBot : Infinity,
              rightBot !== null ? rightBot : Infinity
            );

            return (
              <g key={`col-axis-${i}`}>
                {/* Осевая линия */}
                <line
                  x1={x}
                  y1={colTopY - 14}
                  x2={x}
                  y2={baseGroundY + 22}
                  stroke="#cf222e"
                  strokeWidth={0.8}
                  strokeDasharray="6 3 2 3"
                  opacity={0.75}
                />

                {/* Фундамент под колонну */}
                <rect
                  x={x - 6}
                  y={baseGroundY}
                  width={12}
                  height={5}
                  fill="#6e7781"
                  stroke="#24292f"
                  strokeWidth={0.8}
                />

                {/* Колонна */}
                <line
                  x1={x}
                  y1={baseGroundY}
                  x2={x}
                  y2={colHeadY}
                  stroke="#0969da"
                  strokeWidth={i === 0 || i === N_spans ? 4 : 3}
                />

                {/* Оголовок колонны */}
                <line
                  x1={x - 4}
                  y1={colHeadY}
                  x2={x + 4}
                  y2={colHeadY}
                  stroke="#0969da"
                  strokeWidth={2}
                />

                {/* Опорное ребро / стойка до верха фермы/балки */}
                <line
                  x1={x}
                  y1={colHeadY}
                  x2={x}
                  y2={colTopY}
                  stroke="#0969da"
                  strokeWidth={1.5}
                  opacity={0.8}
                />

                {/* Марка оси в кружке */}
                <circle
                  cx={x}
                  cy={baseGroundY + 28}
                  r={8}
                  fill="#ffffff"
                  stroke="#24292f"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={baseGroundY + 32}
                  fontSize={10}
                  fontWeight="bold"
                  fill="#24292f"
                  textAnchor="middle"
                >
                  {axisLabel}
                </text>

                {/* Размер между смежными осями */}
                {i < N_spans && (
                  <g key={`dim-span-${i}`}>
                    <line
                      x1={x}
                      y1={baseGroundY + 12}
                      x2={colXList[i + 1]}
                      y2={baseGroundY + 12}
                      stroke="#24292f"
                      strokeWidth={0.8}
                    />
                    {/* Засечки */}
                    <line
                      x1={x - 3}
                      y1={baseGroundY + 15}
                      x2={x + 3}
                      y2={baseGroundY + 9}
                      stroke="#24292f"
                      strokeWidth={1.2}
                    />
                    <line
                      x1={colXList[i + 1] - 3}
                      y1={baseGroundY + 15}
                      x2={colXList[i + 1] + 3}
                      y2={baseGroundY + 9}
                      stroke="#24292f"
                      strokeWidth={1.2}
                    />
                    <text
                      x={(x + colXList[i + 1]) / 2}
                      y={baseGroundY + 9}
                      fontSize={9}
                      fontWeight="bold"
                      fill="#24292f"
                      textAnchor="middle"
                    >
                      {`${W_span.toFixed(1)} м`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Общий габаритный размер при N_spans > 1 */}
          {N_spans > 1 && (
            <g key="overall-dim">
              <line
                x1={colXList[0]}
                y1={baseGroundY + 42}
                x2={colXList[N_spans]}
                y2={baseGroundY + 42}
                stroke="#57606a"
                strokeWidth={0.8}
              />
              <line
                x1={colXList[0] - 3}
                y1={baseGroundY + 45}
                x2={colXList[0] + 3}
                y2={baseGroundY + 39}
                stroke="#57606a"
                strokeWidth={1.2}
              />
              <line
                x1={colXList[N_spans] - 3}
                y1={baseGroundY + 45}
                x2={colXList[N_spans] + 3}
                y2={baseGroundY + 39}
                stroke="#57606a"
                strokeWidth={1.2}
              />
              <text
                x={(colXList[0] + colXList[N_spans]) / 2}
                y={baseGroundY + 40}
                fontSize={9}
                fontWeight="bold"
                fill="#57606a"
                textAnchor="middle"
              >
                {`Общая ширина: ${totalBuildingWidth.toFixed(1)} м (${N_spans} × ${W_span.toFixed(1)} м)`}
              </text>
            </g>
          )}

          {/* 3. Междуэтажные перекрытия и промежуточные колонны 1-го этажа */}
          {numStories > 1 && (
            <g>
              {floorLevels.map((fl) => {
                // Стиль плиты в зависимости от выбранного типа перекрытия
                let slabFill = "#c6d8ef";
                let slabStroke = "#0056b3";
                const flType = floorStructure?.type || "monolithic_deck";
                if (flType === "precast_hollow_core") {
                  slabFill = "#d0d7de";
                  slabStroke = "#475569";
                } else if (flType === "monolithic_slab") {
                  slabFill = "#94a3b8";
                  slabStroke = "#334155";
                } else if (flType === "timber_deck") {
                  slabFill = "#fde68a";
                  slabStroke = "#b45309";
                } else if (flType === "steel_grating") {
                  slabFill = "#94a3b8";
                  slabStroke = "#059669";
                } else if (flType === "knauf_dry_floor") {
                  slabFill = "#e9d5ff";
                  slabStroke = "#7c3aed";
                } else if (flType === "precast_block_composite") {
                  slabFill = "#fed7aa";
                  slabStroke = "#c2410c";
                }

                return (
                  <g key={`floor-level-beam-${fl.index}`}>
                    {/* Плита перекрытия */}
                    <rect
                      x={colXList[0]}
                      y={fl.yLevel - 4}
                      width={colXList[N_spans] - colXList[0]}
                      height={4}
                      fill={slabFill}
                      stroke={slabStroke}
                      strokeWidth={0.8}
                    />
                    {/* Несущая балка перекрытия */}
                    <line
                      x1={colXList[0]}
                      y1={fl.yLevel}
                      x2={colXList[N_spans]}
                      y2={fl.yLevel}
                      stroke="#0056b3"
                      strokeWidth={2.8}
                    />
                    {/* Текстовая отметка уровня этажа */}
                    <text
                      x={colXList[0] - 6}
                      y={fl.yLevel + 3}
                      fontSize={8}
                      fontFamily="Roboto, sans-serif"
                      fill="#0056b3"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      {`+${fl.hLevel.toFixed(2)} м`}
                    </text>
                  </g>
                );
              })}

              {/* Промежуточные колонны 1-го этажа */}
              {intermediateColsData.length > 0 &&
                Array.from({ length: N_spans }).map((_, i) => {
                  const x1 = colXList[i];
                  const x2 = colXList[i + 1];

                  return (
                    <g key={`inter-cols-group-span-${i}`}>
                      {intermediateColsData.map((colItem, cIdx) => {
                        const cx = x1 + colItem.ratio * (x2 - x1);
                        return (
                          <g key={`inter-col-${i}-${cIdx}`}>
                            {/* Осевая штрихпунктирная линия */}
                            <line
                              x1={cx}
                              y1={baseGroundY + 6}
                              x2={cx}
                              y2={topMezzanineY - 4}
                              stroke="#94a3b8"
                              strokeWidth={0.7}
                              strokeDasharray="4 2"
                            />

                            {/* Ствол промежуточной колонны */}
                            <rect
                              x={cx - 2}
                              y={topMezzanineY}
                              width={4}
                              height={baseGroundY - topMezzanineY}
                              fill="#0284c7"
                              stroke="#0369a1"
                              strokeWidth={0.6}
                              rx={0.5}
                            />

                            {/* Опорная база на отметке пола */}
                            <rect
                              x={cx - 5}
                              y={baseGroundY - 3}
                              width={10}
                              height={3}
                              fill="#1e293b"
                              stroke="#0f172a"
                              strokeWidth={0.5}
                              rx={0.5}
                            />
                            <rect
                              x={cx - 7}
                              y={baseGroundY}
                              width={14}
                              height={4}
                              fill="#cbd5e1"
                              stroke="#94a3b8"
                              strokeWidth={0.5}
                            />

                            {/* Оголовки колонны в местах опирания балок перекрытий */}
                            {floorLevels.map((fl) => (
                              <rect
                                key={`inter-cap-${i}-${cIdx}-${fl.index}`}
                                x={cx - 4.5}
                                y={fl.yLevel - 1.5}
                                width={9}
                                height={3}
                                fill="#0369a1"
                                stroke="#075985"
                                strokeWidth={0.5}
                                rx={0.5}
                              />
                            ))}

                            {/* Подпись шага/стойки */}
                            <text
                              x={cx}
                              y={baseGroundY - 6}
                              fontSize={6.5}
                              fontFamily="Roboto, sans-serif"
                              fill="#0369a1"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              {`стойка ${colItem.label}`}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
            </g>
          )}

          {/* 4. Несущие конструкции покрытия по каждому пролету */}
          {Array.from({ length: N_spans }).map((_, i) => {
            const x1 = colXList[i];
            const x2 = colXList[i + 1];
            const xMid = (x1 + x2) / 2;

            const yTop1 = getSpanRoofTopY(i, x1);
            const yTop2 = getSpanRoofTopY(i, x2);
            const yTopMid = getSpanRoofTopY(i, xMid);

            const yBot1 = isGable ? yClear : yTop1 + hBeamEave * scale;
            const yBot2 = isGable ? yClear : yTop2 + hBeamEave * scale;
            const yBotMid = yTopMid + hBeamMid * scale;

            const crane = Array.isArray(cranes) && cranes[i] ? cranes[i] : null;
            const hasCrane = Number(crane?.cap) > 0;
            const craneCap = crane?.cap || 0;
            const isSupport = !crane || crane.type !== "suspension";

            const craneBaseY = numStories > 1 ? topMezzanineY : baseGroundY;
            const craneAvailableH =
              numStories > 1 ? floorHeight * scale : H_clear * scale;
            const yBracket = craneBaseY - craneAvailableH * 0.7;

            const panelCount = Math.max(4, Math.round(W_span / 3));
            const spanNodes = [];
            for (let p = 0; p <= panelCount; p++) {
              const px = x1 + (p / panelCount) * (x2 - x1);
              const pyTop = getSpanRoofTopY(i, px);
              spanNodes.push({ x: px, yTop: pyTop, yBot: yClear });
            }

            return (
              <g key={`span-construct-${i}`}>
                {isTruss ? (
                  /* Ферма */
                  <g>
                    {/* Нижний пояс */}
                    <line
                      x1={x1}
                      y1={yClear}
                      x2={x2}
                      y2={yClear}
                      stroke="#0969da"
                      strokeWidth={2}
                    />
                    {/* Верхний пояс */}
                    {isGable ? (
                      <g>
                        <line
                          x1={x1}
                          y1={yTop1}
                          x2={xMid}
                          y2={yTopMid}
                          stroke="#0969da"
                          strokeWidth={2.5}
                        />
                        <line
                          x1={xMid}
                          y1={yTopMid}
                          x2={x2}
                          y2={yTop2}
                          stroke="#0969da"
                          strokeWidth={2.5}
                        />
                      </g>
                    ) : (
                      <line
                        x1={x1}
                        y1={yTop1}
                        x2={x2}
                        y2={yTop2}
                        stroke="#0969da"
                        strokeWidth={2.5}
                      />
                    )}

                    {/* Решетка фермы (раскосы и стойки) */}
                    {spanNodes.map((node, nIdx) => {
                      const ori = (spanOrientations && spanOrientations[i]) || "right";
                      let diagY1 = yClear;
                      let diagY2 = spanNodes[nIdx + 1]?.yTop || yClear;

                      if (isGable) {
                        diagY1 = nIdx >= panelCount / 2 ? node.yTop : yClear;
                        diagY2 = nIdx >= panelCount / 2 ? yClear : spanNodes[nIdx + 1]?.yTop;
                      } else {
                        if (ori === "left") {
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
                            strokeWidth={1}
                          />
                          {nIdx < panelCount && (
                            <line
                              x1={node.x}
                              y1={diagY1}
                              x2={spanNodes[nIdx + 1].x}
                              y2={diagY2}
                              stroke="#0969da"
                              strokeWidth={0.8}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                ) : (
                  /* Балка переменного сечения */
                  <g>
                    {isGable ? (
                      <g>
                        <polygon
                          points={`${x1},${yClear} ${x1},${yTop1} ${xMid},${yTopMid} ${x2},${yTop2} ${x2},${yClear} ${xMid},${yBotMid}`}
                          fill="#ddf4ff"
                          stroke="#0969da"
                          strokeWidth={2}
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
                        {/* Односкатная балка переменного сечения («рыбье пузо») */}
                        <polygon
                          points={`${x1},${yBot1} ${x1},${yTop1} ${x2},${yTop2} ${x2},${yBot2} ${xMid},${yBotMid}`}
                          fill="#ddf4ff"
                          stroke="#0969da"
                          strokeWidth={2}
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

                {/* Интерактивный бейдж типа покрытия */}
                {setFrameType && (
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      setFrameType(isTruss ? "beam" : "truss");
                    }}
                    style={{
                      cursor: "pointer",
                      pointerEvents: "all",
                    }}
                  >
                    <rect
                      x={xMid - 38}
                      y={yClear + 4}
                      width={76}
                      height={16}
                      rx={4}
                      fill={isTruss ? "#eff6ff" : "#f0fdf4"}
                      stroke={isTruss ? "#3b82f6" : "#22c55e"}
                      strokeWidth={1.2}
                      opacity={0.96}
                    />
                    <text
                      x={xMid}
                      y={yClear + 15}
                      fontSize={8.5}
                      fontWeight="bold"
                      fill={isTruss ? "#1d4ed8" : "#15803d"}
                      textAnchor="middle"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {isTruss ? "📐 Ферма ⇄" : "🏢 Балка ⇄"}
                    </text>
                  </g>
                )}

                {/* Прогоны покрытия */}
                {spanNodes.map((node, pIdx) => (
                  <rect
                    key={`purlin-${i}-${pIdx}`}
                    x={node.x - 1.5}
                    y={node.yTop - hPurlin * scale}
                    width={3}
                    height={hPurlin * scale}
                    fill="#1a7f37"
                    stroke="#116329"
                    strokeWidth={0.5}
                  />
                ))}

                {/* Кровля (профиль / сэндвич) */}
                {isGable ? (
                  <g>
                    <line
                      x1={x1 - 3}
                      y1={yTop1 - hPurlin * scale}
                      x2={xMid}
                      y2={yTopMid - hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2}
                    />
                    <line
                      x1={xMid}
                      y1={yTopMid - hPurlin * scale}
                      x2={x2 + 3}
                      y2={yTop2 - hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2}
                    />
                  </g>
                ) : (
                  <g>
                    {/* Наклонный скат пролёта */}
                    <line
                      x1={x1 - (i === 0 ? 3 : 0)}
                      y1={yTop1 - hPurlin * scale}
                      x2={x2 + (i === N_spans - 1 ? 3 : 0)}
                      y2={yTop2 - hPurlin * scale}
                      stroke="#1a7f37"
                      strokeWidth={2}
                    />
                    {/* Вертикальный перепад (ступенька) между смежными пролетами */}
                    {i < N_spans - 1 && (() => {
                      const nextYTop1 = getSpanRoofTopY(i + 1, x2);
                      if (Math.abs(yTop2 - nextYTop1) > 0.5) {
                        return (
                          <line
                            x1={x2}
                            y1={yTop2 - hPurlin * scale}
                            x2={x2}
                            y2={nextYTop1 - hPurlin * scale}
                            stroke="#1a7f37"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    })()}
                    {/* Торцевые свесы/стены */}
                    {i === 0 && (
                      <line
                        x1={x1 - 3}
                        y1={yTop1 - hPurlin * scale}
                        x2={x1 - 3}
                        y2={yBot1}
                        stroke="#1a7f37"
                        strokeWidth={1.5}
                      />
                    )}
                    {i === N_spans - 1 && (
                      <line
                        x1={x2 + 3}
                        y1={yTop2 - hPurlin * scale}
                        x2={x2 + 3}
                        y2={yBot2}
                        stroke="#1a7f37"
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                )}

                {/* Крановое оборудование */}
                {hasCrane && (
                  <g key={`crane-span-${i}`}>
                    {isSupport ? (
                      <g>
                        {/* Консоли на колоннах */}
                        <line
                          x1={x1}
                          y1={yBracket}
                          x2={x1 + 6}
                          y2={yBracket}
                          stroke="#bc4c00"
                          strokeWidth={2}
                        />
                        <line
                          x1={x2}
                          y1={yBracket}
                          x2={x2 - 6}
                          y2={yBracket}
                          stroke="#bc4c00"
                          strokeWidth={2}
                        />
                        {/* Подкрановые балки */}
                        <rect
                          x={x1 + 3}
                          y={yBracket - 4}
                          width={4}
                          height={4}
                          fill="#bc4c00"
                        />
                        <rect
                          x={x2 - 7}
                          y={yBracket - 4}
                          width={4}
                          height={4}
                          fill="#bc4c00"
                        />
                        {/* Мост крана */}
                        <line
                          x1={x1 + 6}
                          y1={yBracket - 5}
                          x2={x2 - 6}
                          y2={yBracket - 5}
                          stroke="#d48200"
                          strokeWidth={2.5}
                        />
                        {/* Тележка крана */}
                        <rect
                          x={(x1 + x2) / 2 - 6}
                          y={yBracket - 9}
                          width={12}
                          height={6}
                          fill="#ffdf5d"
                          stroke="#bc4c00"
                          strokeWidth={0.8}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={yBracket - 11}
                          fontSize={8}
                          fontWeight="bold"
                          fill="#9a3412"
                          textAnchor="middle"
                        >
                          {`Кран ${craneCap} т`}
                        </text>
                      </g>
                    ) : (
                      <g>
                        {/* Подвесной кран */}
                        <line
                          x1={x1 + 14}
                          y1={yClear}
                          x2={x1 + 14}
                          y2={yClear + 8}
                          stroke="#bc4c00"
                          strokeWidth={1.5}
                        />
                        <line
                          x1={x2 - 14}
                          y1={yClear}
                          x2={x2 - 14}
                          y2={yClear + 8}
                          stroke="#bc4c00"
                          strokeWidth={1.5}
                        />
                        <line
                          x1={x1 + 10}
                          y1={yClear + 8}
                          x2={x2 - 10}
                          y2={yClear + 8}
                          stroke="#d48200"
                          strokeWidth={2}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={yClear + 18}
                          fontSize={8}
                          fontWeight="bold"
                          fill="#9a3412"
                          textAnchor="middle"
                        >
                          {`Подвесной кран ${craneCap} т`}
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* 5. Высотные отметки */}
          {/* Отметка 0.000 */}
          <line
            x1={colXList[0] - 6}
            y1={baseGroundY}
            x2={colXList[0] - 20}
            y2={baseGroundY}
            stroke="#24292f"
            strokeWidth={0.8}
          />
          <text
            x={colXList[0] - 22}
            y={baseGroundY + 3}
            fontSize={8.5}
            fontWeight="bold"
            fill="#24292f"
            textAnchor="end"
          >
            0.000
          </text>

          {/* Отметки междуэтажных перекрытий */}
          {floorLevels.map((fl) => (
            <g key={`floor-level-mark-${fl.index}`}>
              <line
                x1={colXList[0] - 6}
                y1={fl.yLevel}
                x2={colXList[0] - 20}
                y2={fl.yLevel}
                stroke="#0056b3"
                strokeWidth={0.8}
              />
              <text
                x={colXList[0] - 22}
                y={fl.yLevel + 3}
                fontSize={8}
                fontWeight="bold"
                fill="#0056b3"
                textAnchor="end"
              >
                {`+${fl.hLevel.toFixed(2)}`}
              </text>
            </g>
          ))}

          {/* Отметка низа несущих конструкций */}
          <line
            x1={colXList[0] - 6}
            y1={yClear}
            x2={colXList[0] - 20}
            y2={yClear}
            stroke="#0969da"
            strokeWidth={0.8}
          />
          <text
            x={colXList[0] - 22}
            y={yClear + 3}
            fontSize={8.5}
            fontWeight="bold"
            fill="#0969da"
            textAnchor="end"
          >
            {`+${H_clear.toFixed(2)}`}
          </text>

          {/* Отметки конька / пиков скатов */}
          {isGable ? (
            colXList.slice(0, N_spans).map((x, i) => {
              const midX = (x + colXList[i + 1]) / 2;
              const ridgeY = getSpanRoofTopY(i, midX) - hPurlin * scale;
              const hRidgeVal = (
                H_eave_top +
                (W_span / 2) * (S / 100) +
                hPurlin
              ).toFixed(2);
              return (
                <g key={`ridge-level-${i}`}>
                  <line
                    x1={midX - 6}
                    y1={ridgeY}
                    x2={midX + 6}
                    y2={ridgeY}
                    stroke="#1a7f37"
                    strokeWidth={0.8}
                  />
                  <polygon
                    points={`${midX},${ridgeY} ${midX - 3},${ridgeY - 5} ${midX + 3},${ridgeY - 5}`}
                    fill="#1a7f37"
                  />
                  <text
                    x={midX}
                    y={ridgeY - 7}
                    fontSize={8.5}
                    fontWeight="bold"
                    fill="#1a7f37"
                    textAnchor="middle"
                  >
                    {`+${hRidgeVal}`}
                  </text>
                </g>
              );
            })
          ) : (() => {
            const highPoints = [];
            for (let i = 0; i < N_spans; i++) {
              const ori = (spanOrientations && spanOrientations[i]) || "right";
              const peakX = ori === "left" ? colXList[i] : colXList[i + 1];
              const peakY = yEaveTop - spanRise * scale - hPurlin * scale;
              const hPeakVal = (H_eave_top + spanRise + hPurlin).toFixed(2);
              if (!highPoints.some((p) => Math.abs(p.x - peakX) < 2)) {
                highPoints.push({ x: peakX, y: peakY, hVal: hPeakVal, keyIdx: i });
              }
            }
            return highPoints.map((pt) => (
              <g key={`single-peak-level-${pt.keyIdx}-${pt.x}`}>
                <line
                  x1={pt.x - 6}
                  y1={pt.y}
                  x2={pt.x + 6}
                  y2={pt.y}
                  stroke="#1a7f37"
                  strokeWidth={0.8}
                />
                <polygon
                  points={`${pt.x},${pt.y} ${pt.x - 3},${pt.y - 5} ${pt.x + 3},${pt.y - 5}`}
                  fill="#1a7f37"
                />
                <text
                  x={pt.x}
                  y={pt.y - 7}
                  fontSize={8.5}
                  fontWeight="bold"
                  fill="#1a7f37"
                  textAnchor="middle"
                >
                  {`+${pt.hVal}`}
                </text>
              </g>
            ));
          })()}
        </svg>
      </div>

      {numStories > 1 && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px 14px",
            backgroundColor: "#f0f7ff",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "0.82em",
            color: "#1e3a8a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.1em" }}>🏢</span>
            <span>
              <strong>Межэтажное перекрытие:</strong> {floorStructure?.typeName || "Монолитный ж/б по несъемной опалубке из профлиста"} (t={floorStructure?.thickness || 120} мм)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#1e40af" }}>
            <span>Полезная нагрузка: <strong>{floorStructure?.liveLoad || 400} кг/м²</strong></span>
            <span>Коэф. запаса: <strong>γf={floorStructure?.safetyFactor || 1.2}</strong></span>
            <span>Расчетная q: <strong>{floorStructure?.designLoadKg || Math.round(((floorStructure?.deadLoad || 280) * 1.1 + (floorStructure?.liveLoad || 400) * (floorStructure?.safetyFactor || 1.2)))} кг/м²</strong></span>
            {subBaysCount > 1 && (
              <span style={{ backgroundColor: "#dbeafe", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                {floorStructure?.columnSpansMode === "manual" && Array.isArray(floorStructure?.columnSpans)
                  ? `Промежуточные стойки: ${floorStructure.columnSpans.join(" + ")} м`
                  : `Промежуточные стойки 1-го этажа шагом ${(W_span / subBaysCount).toFixed(1)} м`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
