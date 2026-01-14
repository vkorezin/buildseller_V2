import React, { useState, useMemo } from "react";
import { getAxisLabel } from "./BlockEditorUtils";
import {
  getMaxHeight,
  buildAxisPoints,
  buildRoofSegments,
  getInterpolatedHeightInSpan,
  getColumnHeightAtAxis,
  getUniqueLevels,
} from "./gableUtils";

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gableCard: {
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "20px",
    backgroundColor: "#f8f9fa",
  },
  h3: {
    marginTop: 0,
    color: "#333",
    borderBottom: "1px solid #eee",
    paddingBottom: "5px",
  },
  h4: { margin: "0 0 5px 0", fontSize: "0.95em", color: "#007bff" },
  row: {
    display: "flex",
    gap: "20px",
    marginBottom: "10px",
    alignItems: "flex-start",
  },
  colForm: {
    flex: 1,
    maxHeight: "500px",
    overflowY: "auto",
    paddingRight: "10px",
  },
  colVisual: {
    flex: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    border: "1px solid #eee",
    borderRadius: "5px",
    padding: "10px",
    minHeight: "350px",
    position: "sticky",
    top: "0",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "3px",
    fontSize: "0.85em",
  },
  select: {
    width: "100%",
    padding: "6px",
    marginBottom: "5px",
    fontSize: "0.9em",
  },
  input: { width: "80px", padding: "5px", fontSize: "0.9em" },
  spanControlCard: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "10px",
  },
  spanControlRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "5px",
  },
  buttonPrimary: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1.2em",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "20px",
  },
  buttonBack: {
    padding: "10px 15px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  svg: { width: "100%", height: "auto", maxHeight: "400px" },
  svgRoof: { fill: "none", stroke: "#333", strokeWidth: 2 },
  svgColumnMain: { stroke: "#333", strokeWidth: 3, strokeLinecap: "round" },
  svgColumnMulti: { stroke: "#333", strokeWidth: 3, strokeLinecap: "round" },
  svgColumnFachwerk: {
    stroke: "#007bff",
    strokeWidth: 1.5,
    strokeDasharray: "5 3",
  },
  svgDimLine: { stroke: "#666", strokeWidth: 1 },
  svgDimText: {
    fontSize: "11px",
    fill: "#333",
    fontFamily: "Arial",
    textAnchor: "middle",
    fontWeight: "bold",
  },
  svgAxisMarker: { fill: "#fff", stroke: "#333", strokeWidth: 1 },
  svgAxisText: {
    fontSize: "10px",
    fill: "#333",
    fontFamily: "Arial",
    textAnchor: "middle",
    dominantBaseline: "middle",
    fontWeight: "bold",
  },
  svgLevelText: {
    fontSize: "10px",
    fill: "#007bff",
    fontFamily: "Arial",
    textAnchor: "end",
  },
};

const GableVisualizer = ({ geometry, settings }) => {
  if (!geometry || !geometry.spans) return null;

  const spans = geometry.spans;
  const totalWidth = geometry.generalData.blockWidth;

  const PADDING_LEFT = 50;
  const PADDING_BOTTOM = 60;
  const maxHeight = getMaxHeight(spans);
  const DRAW_H = maxHeight + 2;
  const DRAW_W = totalWidth;
  const viewW = 800;
  const viewH = 450;
  const scaleX = (viewW - PADDING_LEFT - 20) / DRAW_W;
  const scaleY = (viewH - PADDING_BOTTOM - 20) / DRAW_H;
  const scale = Math.min(scaleX, scaleY);
  const groundY = viewH - PADDING_BOTTOM;
  const startX = PADDING_LEFT;

  const axisPoints = buildAxisPoints(spans, getAxisLabel);
  const { roofSegments, roofPath } = buildRoofSegments(
    spans,
    startX,
    groundY,
    scale
  );

  const columnsElement = [];
  const dimensionElements = [];

  // Основные колонны
  axisPoints.forEach((pt, i) => {
    const svgX = startX + pt.x * scale;
    const h = getColumnHeightAtAxis(i, roofSegments);
    const svgYTop = groundY - h * scale;
    columnsElement.push(
      <line
        key={`main-col-${i}`}
        x1={svgX}
        y1={groundY}
        x2={svgX}
        y2={svgYTop}
        style={styles.svgColumnMain}
      />
    );
  });

  // Промежуточные колонны и размеры
  let spanOffsetX = 0;
  settings.spans.forEach((spanSetting, index) => {
    const geomSpan = spans[index];
    if (!geomSpan) return;

    const dimPointsX = [0];
    if (spanSetting.type !== "clear") {
      const count = parseInt(spanSetting.count) || 0;
      if (count > 0) {
        const step = geomSpan.spanWidth / (count + 1);
        for (let i = 1; i <= count; i++) {
          const xLocal = i * step;
          dimPointsX.push(xLocal);

          const xGlobal = spanOffsetX + xLocal;
          const seg = roofSegments[index];
          const h = getInterpolatedHeightInSpan(xLocal, geomSpan, seg);
          const svgX = startX + xGlobal * scale;
          const svgYTop = groundY - h * scale;
          const style =
            spanSetting.type === "multi"
              ? styles.svgColumnMulti
              : styles.svgColumnFachwerk;
          columnsElement.push(
            <line
              key={`sub-col-${index}-${i}`}
              x1={svgX}
              y1={groundY}
              x2={svgX}
              y2={svgYTop}
              style={style}
            />
          );
        }
      }
    }
    dimPointsX.push(geomSpan.spanWidth);

    // Размеры
    const dimY = groundY + 20;
    for (let k = 0; k < dimPointsX.length - 1; k++) {
      const x1 = dimPointsX[k];
      const x2 = dimPointsX[k + 1];
      const dist = x2 - x1;
      const svgX1 = startX + (spanOffsetX + x1) * scale;
      const svgX2 = startX + (spanOffsetX + x2) * scale;
      const svgXC = (svgX1 + svgX2) / 2;
      dimensionElements.push(
        <g key={`dim-${index}-${k}`}>
          <line
            x1={svgX1}
            y1={dimY}
            x2={svgX2}
            y2={dimY}
            style={styles.svgDimLine}
          />
          <line
            x1={svgX1}
            y1={dimY - 3}
            x2={svgX1}
            y2={dimY + 3}
            style={styles.svgDimLine}
          />
          <line
            x1={svgX2}
            y1={dimY - 3}
            x2={svgX2}
            y2={dimY + 3}
            style={styles.svgDimLine}
          />
          <text x={svgXC} y={dimY - 4} style={styles.svgDimText}>
            {dist.toFixed(1)}
          </text>
        </g>
      );
    }

    spanOffsetX += geomSpan.spanWidth;
  });

  // Оси
  const axisElements = axisPoints.map((pt, i) => (
    <g
      key={`axis-${i}`}
      transform={`translate(${startX + pt.x * scale}, ${groundY + 45})`}
    >
      <circle r="8" style={styles.svgAxisMarker} />
      <text style={styles.svgAxisText}>{pt.label}</text>
    </g>
  ));

  // Уровни
  const uniqueLevels = getUniqueLevels(spans, roofSegments);
  const levelElements = uniqueLevels.map((lvl, i) => {
    const y = groundY - lvl * scale;
    return (
      <g key={`lvl-${i}`}>
        <line
          x1={startX - 5}
          y1={y}
          x2={startX + totalWidth * scale}
          y2={y}
          stroke="#eee"
          strokeDasharray="2 2"
        />
        <text x={startX - 8} y={y + 3} style={styles.svgLevelText}>
          {lvl === 0 ? "0.000" : lvl.toFixed(2)}
        </text>
      </g>
    );
  });

  return (
    <svg style={styles.svg} viewBox={`0 0 ${viewW} ${viewH}`}>
      {levelElements}
      <path d={roofPath.join(" ")} style={styles.svgRoof} />
      {columnsElement}
      {dimensionElements}
      <line
        x1={startX - 20}
        y1={groundY}
        x2={startX + totalWidth * scale + 20}
        y2={groundY}
        stroke="#000"
        strokeWidth="1"
      />
      {axisElements}
    </svg>
  );
};

export default function GableEditor({
  blockName,
  geometryData,
  initialGables,
  onBack,
  onCalculate,
}) {
  const [gables, setGables] = useState(() => {
    if (initialGables) return initialGables;
    const spansInitStart = geometryData.spans.map((s) => ({
      id: s.id,
      type: "fachwerk",
      count: 2,
    }));
    const spansInitEnd = geometryData.spans.map((s) => ({
      id: s.id,
      type: "fachwerk",
      count: 2,
    }));
    return {
      start: { spans: JSON.parse(JSON.stringify(spansInitStart)) },
      end: { spans: JSON.parse(JSON.stringify(spansInitEnd)) },
    };
  });

  const handleSpanChange = (side, spanIndex, field, value) => {
    setGables((prev) => {
      const newSide = { ...prev[side] };
      const newSpans = [...newSide.spans];
      newSpans[spanIndex] = {
        ...newSpans[spanIndex],
        [field]: field === "count" ? parseInt(value) || 0 : value,
      };
      newSide.spans = newSpans;
      return { ...prev, [side]: newSide };
    });
  };

  const renderSpanControls = (side) => {
    return geometryData.spans.map((span, idx) => {
      const spanSettings = gables[side].spans[idx];
      if (!spanSettings) return null;
      return (
        <div key={idx} style={styles.spanControlCard}>
          <h4 style={styles.h4}>
            Пролёт {idx + 1} ({span.spanWidth} м)
          </h4>
          <label style={styles.label}>Тип</label>
          <select
            style={styles.select}
            value={spanSettings.type}
            onChange={(e) =>
              handleSpanChange(side, idx, "type", e.target.value)
            }
          >
            <option value="clear">Нет колонн</option>
            <option value="fachwerk">Фахверк</option>
            <option value="multi">Сборн. колонны</option>
          </select>
          {spanSettings.type !== "clear" && (
            <div style={styles.spanControlRow}>
              <div>
                <label style={styles.label}>Кол-во колонн</label>
                <input
                  type="number"
                  style={styles.input}
                  value={spanSettings.count}
                  onChange={(e) =>
                    handleSpanChange(side, idx, "count", e.target.value)
                  }
                  min="0"
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8em", color: "#666" }}>Шаг:</div>
                <div>
                  <strong style={{ color: "#333" }}>
                    {(span.spanWidth / (spanSettings.count + 1)).toFixed(2)} м
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Шаг 3: Фронтоны ({blockName})</h2>
        <button style={styles.buttonBack} onClick={() => onBack(gables)}>
          &larr; Назад
        </button>
      </div>

      <div style={styles.gableCard}>
        <h3 style={styles.h3}>Торец 1 (Start)</h3>
        <div style={styles.row}>
          <div style={styles.colForm}>{renderSpanControls("start")}</div>
          <div style={styles.colVisual}>
            <GableVisualizer geometry={geometryData} settings={gables.start} />
          </div>
        </div>
      </div>

      <div style={styles.gableCard}>
        <h3 style={styles.h3}>Торец End</h3>
        <div style={styles.row}>
          <div style={styles.colForm}>{renderSpanControls("end")}</div>
          <div style={styles.colVisual}>
            <GableVisualizer geometry={geometryData} settings={gables.end} />
          </div>
        </div>
      </div>

      <button style={styles.buttonPrimary} onClick={() => onCalculate(gables)}>
        🚀 Запустить расчёт
      </button>
    </div>
  );
}
