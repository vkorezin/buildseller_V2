import React, { useState, useMemo, useEffect } from "react";
import FormColumn from "./BlockEditorForm";
import BuildingPlanView from "./BlockPlanView";
import BuildingSectionView from "./BuildingSectionView";
import { getAxisLabel } from "./BlockEditorUtils";

// --- СТИЛИ ---
const styles = {
  backButton: {
    marginBottom: "0px",
    padding: "10px 15px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  container: {
    fontFamily: "Arial, sans-serif",
    margin: "20px",
    maxWidth: "1000px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  h2: { borderBottom: "2px solid #007bff", paddingBottom: "5px" },
  formContainer: { width: "48%" },
  visualContainer: {
    width: "48%",
    position: "sticky",
    top: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  svgCanvas: {
    width: "100%",
    border: "1px solid #eee",
    borderRadius: "4px",
    backgroundColor: "#f9f9f9",
    aspectRatio: "1 / 1",
  },
  svgOutline: { fill: "none", stroke: "#333", strokeWidth: 2 },
  svgSpanLine: {
    fill: "none",
    stroke: "#007bff",
    strokeWidth: 1,
    strokeDasharray: "5 5",
  },
  svgColumnLine: { fill: "none", stroke: "#999", strokeWidth: 0.5 },
  svgColumn: {
    fill: "#d90000",
    stroke: "#333",
    strokeWidth: 1,
    cursor: "pointer",
    transition: "fill 0.2s",
  },
  svgColumnSelected: {
    fill: "#007bff",
    stroke: "#000",
    strokeWidth: 2,
    cursor: "pointer",
    transition: "fill 0.2s",
  },
  svgAxisMarker: { fill: "#fff", stroke: "#333", strokeWidth: 1 },
  svgAxisText: {
    fontSize: "8px",
    fill: "#333",
    fontFamily: "Arial",
    textAnchor: "middle",
    dominantBaseline: "middle",
    fontWeight: "bold",
  },
  svgDimLine: { fill: "none", stroke: "#000", strokeWidth: 0.5 },
  svgDimText: {
    fontSize: "9px",
    fill: "#000",
    fontFamily: "Arial",
    textAnchor: "middle",
  },
  formGroup: {
    marginBottom: "15px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  label: { display: "block", fontWeight: "bold", marginBottom: "5px" },
  input: { width: "100%", padding: "8px", boxSizing: "border-box" },
  select: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    fontSize: "1em",
  },
  mainBlock: {
    marginBottom: "15px",
    padding: "10px",
    border: "2px solid #ff9800",
    borderRadius: "5px",
    backgroundColor: "#fff3e0",
  },
  spanCard: {
    margin: "20px 0",
    padding: "15px",
    border: "2px dashed #9e9e9e",
    borderRadius: "8px",
    backgroundColor: "#f5f5f5",
  },
  h3: { margin: "0 0 10px 0", color: "#333" },
  errorBox: {
    padding: "10px",
    backgroundColor: "#ffebe6",
    border: "1px solid #ffc0b0",
    color: "#d90000",
    borderRadius: "5px",
    marginTop: "10px",
    fontWeight: "bold",
  },
  infoBox: {
    padding: "10px",
    backgroundColor: "#e6f7ff",
    border: "1px solid #b0e0ff",
    color: "#005699",
    borderRadius: "5px",
    marginTop: "10px",
  },
  inputError: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "2px solid #d90000",
    backgroundColor: "#ffebe6",
  },
  deleteButton: {
    padding: "10px 15px",
    backgroundColor: "#d90000",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
  },
  toolGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "15px",
  },
  toolButton: {
    padding: "10px",
    backgroundColor: "#eee",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
  },
  subCard: {
    padding: "10px",
    margin: "10px 0",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  subCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  subDeleteButton: {
    padding: "5px 10px",
    backgroundColor: "#d90000",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  subAddButton: {
    width: "100%",
    padding: "8px 12px",
    border: "1px dashed #007bff",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#f4faff",
    color: "#007bff",
    fontWeight: "bold",
    marginTop: "10px",
  },
  subGrid: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "8px",
    alignItems: "center",
  },
  subGrid4: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px",
    marginTop: "10px",
  },
  button: {
    padding: "10px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  blockCardBody: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: "8px",
  },
  mezzanineButton: {
    width: "100%",
    padding: "15px",
    backgroundColor: "#6610f2",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1em",
    marginTop: "20px",
  },
};

export default function BlockEditor({
  initialData,
  onSaveAndBack,
  onNextStep,
  projectLoadData,
  craneDb,
  onOpenMezzanineEditor,
}) {
  const [generalData, setGeneralData] = useState(initialData.generalData);
  const [spans, setSpans] = useState(initialData.spans);
  const [columnStep, setColumnStep] = useState(initialData.columnStep);
  const [editMode, setEditMode] = useState(
    initialData.gridMatrix ? "manual" : "wizard"
  );
  const [gridMatrix, setGridMatrix] = useState(initialData.gridMatrix || null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [mezzanines, setMezzanines] = useState(initialData.mezzanines || []);
  const [massEditTools, setMassEditTools] = useState({
    axis: "A",
    mode: "remove",
    rule: "every",
    everyN: "2",
    list: "1, 3, 5",
  });

  const spanCount = spans.length;

  // --- HANDLERS ---
  const handleGeneralChange = (e) =>
    setGeneralData({
      ...generalData,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });
  const handleSpanCountChange = (e) => {
    let count = parseInt(e.target.value, 10) || 0;
    count = Math.max(0, Math.min(count, 10));
    const newDefaultWidth = count > 0 ? generalData.blockWidth / count : 0;
    const newSpans = [];
    for (let i = 0; i < count; i++) {
      newSpans.push(
        spans[i] || {
          id: i + 1,
          spanWidth: newDefaultWidth,
          eaveHeight: generalData.blockHeight,
          slope: 10,
          skateCount: 1,
          baseElevation: 0.0,
          slopeDirection: "right",
          skate1Length: newDefaultWidth / 2,
          cranes: [],
        }
      );
    }
    setSpans(newSpans);
  };
  const handleSpanChange = (idx, e) => {
    const { name, value } = e.target;
    const updated = [...spans];
    const s = { ...updated[idx] };
    if (name === "skateCount") {
      s.skateCount = parseInt(value);
      if (s.skateCount === 2) s.skate1Length = s.spanWidth / 2;
    } else if (name === "skate1Length") {
      let v = parseFloat(value) || 0;
      if (v > s.spanWidth) v = s.spanWidth;
      if (v < 0) v = 0;
      s.skate1Length = v;
    } else if (name === "spanWidth") {
      s.spanWidth = parseFloat(value) || 0;
      s.skate1Length = s.spanWidth / 2;
    } else {
      s[name] = name === "slopeDirection" ? value : parseFloat(value) || 0;
    }
    updated[idx] = s;
    setSpans(updated);
  };
  const handleColumnStepChange = (e) =>
    setColumnStep(parseFloat(e.target.value));
  const handleCraneAdd = (idx) => {
    const u = [...spans];
    u[idx].cranes.push({ id: "c_" + Date.now(), selectedCapacity: 5 });
    setSpans(u);
  };
  const handleCraneChange = (idx, cid, val) => {
    const u = [...spans];
    u[idx].cranes.find((c) => c.id === cid).selectedCapacity = parseFloat(val);
    setSpans(u);
  };
  const handleCraneDelete = (idx, cid) => {
    const u = [...spans];
    u[idx].cranes = u[idx].cranes.filter((c) => c.id !== cid);
    setSpans(u);
  };

  // --- РАСЧЕТ ШАГА РАМ (ИСПРАВЛЕНО) ---
  const derivedColumnLayout = useMemo(() => {
    const L = generalData.blockLength;
    const S = columnStep;
    if (S <= 0 || L <= 0) return [];

    // Если делится нацело (с допуском)
    if (Math.abs(L % S) < 0.01) {
      const count = Math.round(L / S);
      const layout = [];
      for (let i = 0; i < count; i++) layout.push({ id: i, step: S });
      return layout;
    }

    // Иначе: (Остаток + Шаг) / 2 = Крайний пролет
    const rawCount = Math.floor(L / S);
    // Если здание короче одного шага
    if (rawCount < 1) return [{ id: 0, step: L }];

    const remainder = L - rawCount * S;
    const endStep = (remainder + S) / 2;
    const middleCount = rawCount - 1;

    const layout = [];
    layout.push({ id: "start", step: endStep });
    for (let i = 0; i < middleCount; i++) {
      layout.push({ id: i, step: S });
    }
    layout.push({ id: "end", step: endStep });

    return layout;
  }, [generalData.blockLength, columnStep]);

  // --- ВАЛИДАЦИЯ (ОБНОВЛЕНА) ---
  const validation = useMemo(() => {
    const totalSpansWidth = spans.reduce(
      (sum, currentSpan) => sum + (currentSpan.spanWidth || 0),
      0
    );
    const isWidthValid =
      Math.abs(totalSpansWidth - generalData.blockWidth) < 1e-6;

    let info = {};
    // Определяем тип раскладки для отображения пользователю
    const layout = derivedColumnLayout; // Используем уже рассчитанную раскладку
    if (layout.length > 0) {
      const first = layout[0].step;
      const last = layout[layout.length - 1].step;
      const isEven =
        Math.abs(first - columnStep) < 0.01 &&
        Math.abs(last - columnStep) < 0.01;

      if (isEven) {
        info.type = "even";
        info.frameCount = layout.length;
      } else {
        info.type = "symmetric";
        info.endStep = first;
        info.middleFrameCount = layout.length - 2;
      }
    }

    return {
      totalSpansWidth,
      isWidthValid,
      widthDifference: generalData.blockWidth - totalSpansWidth,
      layoutInfo: info,
    };
  }, [spans, generalData.blockWidth, derivedColumnLayout, columnStep]);

  // --- ОСИ (ЗАВИСЯТ ОТ РАСКЛАДКИ) ---
  const { xAxis, yAxis } = useMemo(() => {
    const x = [];
    spans.forEach((s, i) => x.push(getAxisLabel(i)));
    x.push(getAxisLabel(spans.length));

    // Оси Y генерируются по количеству пролетов + 1
    const y = [];
    const count = derivedColumnLayout.length;
    for (let i = 0; i <= count; i++) y.push((i + 1).toString());

    return { xAxis: x, yAxis: y };
  }, [spans, derivedColumnLayout]);

  const availableCapacities = useMemo(
    () =>
      craneDb
        ? [...new Set(craneDb.map((c) => c.capacity))].sort((a, b) => a - b)
        : [],
    [craneDb]
  );

  const handleBakeGrid = () => {
    const m = {};
    xAxis.forEach((x) =>
      yAxis.forEach((y) => (m[`${x}-${y}`] = { exists: true }))
    );
    setGridMatrix(m);
    setEditMode("manual");
    setMassEditTools((p) => ({ ...p, axis: xAxis[0] }));
  };

  // --- TOOLS LOGIC ---
  const handleColumnClick = (columnId) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedColumns.length === 0) return;
    const newMatrix = { ...gridMatrix };
    selectedColumns.forEach((id) => {
      if (newMatrix[id]) newMatrix[id].exists = false;
    });
    setGridMatrix(newMatrix);
    setSelectedColumns([]);
  };

  const handleToolChange = (e) => {
    const { name, value } = e.target;
    setMassEditTools((prev) => ({ ...prev, [name]: value }));
  };

  const handleMassEditApply = () => {
    const { axis, mode, rule, everyN, list } = massEditTools;
    const isAdding = mode === "add";
    const isXAxis = xAxis.includes(axis);
    const targetAxes = isXAxis ? yAxis : xAxis;
    let affectedAxes = [];
    if (rule === "every") {
      const n = parseInt(everyN, 10) || 2;
      affectedAxes = targetAxes.filter((a, index) => (index + 1) % n === 0);
    } else {
      affectedAxes = list.split(",").map((s) => s.trim());
    }
    setGridMatrix((prevMatrix) => {
      const newMatrix = { ...prevMatrix };
      affectedAxes.forEach((targetAxis) => {
        const key = isXAxis ? `${axis}-${targetAxis}` : `${targetAxis}-${axis}`;
        if (newMatrix[key]) newMatrix[key].exists = isAdding;
      });
      return newMatrix;
    });
  };

  // --- NAVIGATION ---
  const collectData = () => ({
    generalData,
    spans,
    columnStep,
    gridMatrix: editMode === "manual" ? gridMatrix : null,
    mezzanines,
  });

  const handleManageMezzanines = () => {
    onOpenMezzanineEditor(collectData());
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          padding: "10px",
          background: "#fff",
          borderBottom: "1px solid #eee",
        }}
      >
        <button
          onClick={() => onSaveAndBack(null)}
          style={{ ...styles.backButton, backgroundColor: "#6c757d" }}
        >
          Отмена
        </button>
        <div
          style={{ fontWeight: "bold", fontSize: "1.2em", alignSelf: "center" }}
        >
          Шаг 1: Геометрия
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* КНОПКА ОБНОВЛЕНА */}
          <button
            onClick={() => onSaveAndBack(collectData())}
            style={{ ...styles.backButton, backgroundColor: "#28a745" }}
          >
            💾 Сохранить и вернуться
          </button>
          <button
            onClick={() => onNextStep(collectData())}
            style={{ ...styles.backButton, backgroundColor: "#007bff" }}
          >
            Далее &rarr;
          </button>
        </div>
      </div>

      <div style={styles.container}>
        <FormColumn
          editMode={editMode}
          handleBakeGrid={handleBakeGrid}
          generalData={generalData}
          spanCount={spanCount}
          spans={spans}
          columnStep={columnStep}
          validation={validation}
          styles={styles}
          handleGeneralChange={handleGeneralChange}
          handleSpanCountChange={handleSpanCountChange}
          handleSpanChange={handleSpanChange}
          handleColumnStepChange={handleColumnStepChange}
          availableCapacities={availableCapacities}
          handleCraneAdd={handleCraneAdd}
          handleCraneChange={handleCraneChange}
          handleCraneDelete={handleCraneDelete}
          handleDeleteSelected={handleDeleteSelected}
          selectedCount={selectedColumns.length}
          allAxes={{ xAxis, yAxis }}
          toolSettings={massEditTools}
          onToolChange={handleToolChange}
          onToolApply={handleMassEditApply}
          mezzanines={[]}
          handleMezzanineAdd={() => {}}
          handleMezzanineChange={() => {}}
          handleMezzanineDelete={() => {}}
        />

        <div style={styles.visualContainer}>
          <BuildingPlanView
            generalData={generalData}
            spans={spans}
            columnLayout={derivedColumnLayout}
            mezzanines={mezzanines}
            styles={styles}
            editMode={editMode}
            gridMatrix={gridMatrix}
            selectedColumns={selectedColumns}
            onColumnClick={handleColumnClick}
          />

          <div
            style={{
              width: "100%",
              marginTop: "15px",
              padding: "10px",
              border: "2px dashed #6610f2",
              borderRadius: "8px",
              backgroundColor: "#f3eaff",
              textAlign: "center",
            }}
          >
            <strong>Антресоли: {mezzanines.length} шт.</strong>
            <button
              style={styles.mezzanineButton}
              onClick={handleManageMezzanines}
            >
              🛠 Редактор Антресолей
            </button>
          </div>

          <h3 style={{ marginTop: "20px" }}>Поперечный разрез</h3>
          <BuildingSectionView
            generalData={generalData}
            spans={spans}
            mezzanines={mezzanines}
            craneDb={craneDb}
            styles={styles}
          />
        </div>
      </div>
    </div>
  );
}
