import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import FormColumn from "./BlockEditorForm";
import BuildingPlanView from "./BlockPlanView";
import BuildingSectionView from "./BuildingSectionView";
import { getAxisLabel, updateSpanRoofGeometry, computeSpanRoofHeights } from "./BlockEditorUtils";

// --- СТИЛИ (Оптимизированы под full-width экраны) ---
const styles = {
  backButton: {
    marginBottom: "0px",
    padding: "8px 14px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9em",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    padding: "10px 16px",
    background: "#fff",
    borderBottom: "1px solid #e1e4e8",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    borderRadius: "6px",
    flexWrap: "wrap",
    gap: "10px",
  },
  h2: { borderBottom: "2px solid #007bff", paddingBottom: "5px" },
  formGroup: {
    marginBottom: "12px",
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
  },
  label: { display: "block", fontWeight: "bold", marginBottom: "5px", fontSize: "0.9em" },
  input: { width: "100%", padding: "7px 10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #cbd5e1" },
  select: {
    width: "100%",
    padding: "7px 10px",
    boxSizing: "border-box",
    fontSize: "0.95em",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
  },
  mainBlock: {
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid #fdba74",
    borderRadius: "6px",
    backgroundColor: "#fff7ed",
  },
  spanCard: {
    margin: "12px 0",
    padding: "12px",
    border: "1px dashed #cbd5e1",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
  },
  h3: { margin: "0 0 8px 0", color: "#1e293b", fontSize: "1em" },
  errorBox: {
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: "6px",
    marginTop: "8px",
    fontWeight: "bold",
    fontSize: "0.85em",
  },
  infoBox: {
    padding: "8px 12px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "6px",
    marginTop: "8px",
    fontSize: "0.85em",
  },
  deleteButton: {
    padding: "8px 12px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
  },
  toolGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "10px",
  },
  toolButton: {
    padding: "8px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer",
  },
  subCard: {
    padding: "10px",
    margin: "8px 0",
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "5px",
  },
  subCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  subDeleteButton: {
    padding: "3px 8px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.78em",
  },
  subAddButton: {
    width: "100%",
    padding: "6px 10px",
    border: "1px dashed #0969da",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "#f0f7ff",
    color: "#0969da",
    fontWeight: "bold",
    fontSize: "0.85em",
    marginTop: "8px",
  },
  subGrid: {
    display: "grid",
    gridTemplateColumns: "130px 1fr",
    gap: "6px",
    alignItems: "center",
    fontSize: "0.88em",
  },
  button: {
    padding: "8px 14px",
    backgroundColor: "#0969da",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
  },
  blockCardBody: {
    display: "grid",
    gridTemplateColumns: "130px 1fr",
    gap: "6px",
    alignItems: "center",
  },
  mezzanineButton: {
    padding: "6px 12px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85em",
    marginLeft: "10px",
  },
  svgCanvas: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
  },
  svgOutline: {
    fill: "#ffffff",
    stroke: "#1e293b",
    strokeWidth: 2,
  },
  svgErrorOutline: {
    fill: "rgba(239, 68, 68, 0.15)",
    stroke: "#dc2626",
    strokeWidth: 2,
  },
  svgSpanLine: {
    stroke: "#94a3b8",
    strokeWidth: 1,
    strokeDasharray: "4 3",
  },
  svgColumnLine: {
    stroke: "#e2e8f0",
    strokeWidth: 1,
  },
  svgColumn: {
    fill: "#1e293b",
    stroke: "#0f172a",
    strokeWidth: 1,
    cursor: "pointer",
  },
  svgColumnSelected: {
    fill: "#ef4444",
    stroke: "#b91c1c",
    strokeWidth: 2,
    cursor: "pointer",
  },
  svgAxisMarker: {
    fill: "#ffffff",
    stroke: "#334155",
    strokeWidth: 1.5,
  },
  svgAxisText: {
    fontSize: "10px",
    fill: "#0f172a",
    fontFamily: "Arial, sans-serif",
    textAnchor: "middle",
    dominantBaseline: "central",
    fontWeight: "bold",
  },
  svgDimLine: {
    stroke: "#475569",
    strokeWidth: 1,
  },
  svgDimText: {
    fontSize: "10px",
    fill: "#1e293b",
    fontFamily: "Arial, sans-serif",
    textAnchor: "middle",
    dominantBaseline: "central",
    fontWeight: "600",
  },
};

export default function BlockEditor({
  initialData,
  onSaveAndBack,
  onNextStep,
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
  const [frameType, setFrameType] = useState(initialData.frameType || "beam");
  const [massEditTools, setMassEditTools] = useState({
    axis: "A",
    mode: "remove",
    rule: "every",
    everyN: "2",
    list: "1, 3, 5",
  });

  // --- СОСТОЯНИЯ УПРАВЛЕНИЯ ОКНАМИ И РАЗМЕРАМИ ---
  // Режим раскладки: 'standard' (2 колонки: форма | чертежи стек), '3col' (3 колонки рядом), 'stacked' (друг под другом)
  const [layoutMode, setLayoutMode] = useState("standard");

  // Свернутые окна: { form: false, plan: false, section: false }
  const [collapsed, setCollapsed] = useState({
    form: false,
    plan: false,
    section: false,
  });

  // Окно на весь экран (null или 'form' | 'plan' | 'section')
  const [maximizedWindow, setMaximizedWindow] = useState(null);

  // Пропорции окон для стандартного режима (2 колонки)
  const [formWidth, setFormWidth] = useState(38); // % ширины формы
  const [planHeight, setPlanHeight] = useState(52); // % высоты плана внутри блока чертежей

  // Масштабы чертежей (зум в %)
  const [planZoom, setPlanZoom] = useState(100);
  const [sectionZoom, setSectionZoom] = useState(100);

  const changePlanZoom = (delta) => {
    setPlanZoom((prev) => Math.max(50, Math.min(250, prev + delta)));
  };

  const changeSectionZoom = (delta) => {
    setSectionZoom((prev) => Math.max(50, Math.min(250, prev + delta)));
  };

  // Пропорции для 3-колоночного режима
  const [col3Widths, setCol3Widths] = useState({
    form: 33,
    plan: 33,
    section: 34,
  });

  const spanCount = spans.length;
  const containerRef = useRef(null);
  const draggingRef = useRef(null);

  // --- ХЭНДЛЕРЫ РАЗМЕРОВ С АВТОМАТИЧЕСКИМ ПЕРЕСЧЕТОМ ДРУГИХ ОКОН ---
  const adjustFormWidth = (delta) => {
    setFormWidth((prev) => {
      const next = Math.max(20, Math.min(80, Math.round(prev + delta)));
      return next;
    });
  };

  const adjustPlanHeight = (delta) => {
    setPlanHeight((prev) => {
      const next = Math.max(20, Math.min(80, Math.round(prev + delta)));
      return next;
    });
  };

  const adjustCol3Width = (key, delta) => {
    setCol3Widths((prev) => {
      const current = prev[key];
      const target = Math.max(15, Math.min(70, current + delta));
      const diff = target - current;
      if (diff === 0) return prev;

      // Автоматически распределяем разницу по двум другим колонкам
      const otherKeys = ["form", "plan", "section"].filter((k) => k !== key);
      const otherSum = prev[otherKeys[0]] + prev[otherKeys[1]];
      if (otherSum <= 0) return prev;

      const p0 = prev[otherKeys[0]] - diff * (prev[otherKeys[0]] / otherSum);
      const p1 = prev[otherKeys[1]] - diff * (prev[otherKeys[1]] / otherSum);

      return {
        ...prev,
        [key]: target,
        [otherKeys[0]]: Math.max(15, Math.round(p0 * 10) / 10),
        [otherKeys[1]]: Math.max(15, Math.round(p1 * 10) / 10),
      };
    });
  };

  const toggleCollapse = (windowKey) => {
    setCollapsed((prev) => ({
      ...prev,
      [windowKey]: !prev[windowKey],
    }));
  };

  const toggleMaximize = (windowKey) => {
    setMaximizedWindow((prev) => (prev === windowKey ? null : windowKey));
  };

  const resetLayout = () => {
    setFormWidth(38);
    setPlanHeight(52);
    setCol3Widths({ form: 33, plan: 33, section: 34 });
    setCollapsed({ form: false, plan: false, section: false });
    setMaximizedWindow(null);
    setPlanZoom(100);
    setSectionZoom(100);
  };

  const collapseAll = () => {
    setCollapsed({ form: true, plan: true, section: true });
  };

  const expandAll = () => {
    setCollapsed({ form: false, plan: false, section: false });
  };

  // --- ИНТЕРАКТИВНЫЙ DRAG SPLITTER (РАЗДЕЛИТЕЛИ ОКОН) ---
  const handleSplitterMouseDown = (type, e) => {
    e.preventDefault();
    draggingRef.current = { type, startX: e.clientX, startY: e.clientY };

    const onMouseMove = (moveEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (draggingRef.current.type === "horizontal-main") {
        const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.max(20, Math.min(80, Math.round(percent)));
        setFormWidth(clamped);
      } else if (draggingRef.current.type === "vertical-visual") {
        const visualArea = document.getElementById("visual-drawings-container");
        if (!visualArea) return;
        const vRect = visualArea.getBoundingClientRect();
        const percent = ((moveEvent.clientY - vRect.top) / vRect.height) * 100;
        const clamped = Math.max(20, Math.min(80, Math.round(percent)));
        setPlanHeight(clamped);
      } else if (draggingRef.current.type === "3col-1") {
        const percent1 = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const wForm = Math.max(15, Math.min(60, Math.round(percent1)));
        setCol3Widths((prev) => {
          const remain = 100 - wForm;
          const ratio = prev.plan / (prev.plan + prev.section || 1);
          return {
            form: wForm,
            plan: Math.max(15, Math.round(remain * ratio)),
            section: Math.max(15, Math.round(remain * (1 - ratio))),
          };
        });
      } else if (draggingRef.current.type === "3col-2") {
        const percent2 = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        setCol3Widths((prev) => {
          const wSection = Math.max(15, Math.min(60, Math.round(100 - percent2)));
          const remain = 100 - wSection;
          const ratio = prev.form / (prev.form + prev.plan || 1);
          return {
            form: Math.max(15, Math.round(remain * ratio)),
            plan: Math.max(15, Math.round(remain * (1 - ratio))),
            section: wSection,
          };
        });
      }
    };

    const onMouseUp = () => {
      draggingRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor =
      type.includes("vertical") ? "row-resize" : "col-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // --- HANDLERS (Геометрия) ---
  // Автоматический расчет ширины блока по сумме ширин пролётов
  const totalSpansWidth = useMemo(() => {
    return (
      Math.round(
        (spans || []).reduce(
          (sum, span) => sum + (Number(span.spanWidth) || 0),
          0
        ) * 1000
      ) / 1000
    );
  }, [spans]);

  // Синхронизация ширины блока в generalData
  useEffect(() => {
    if (generalData.blockWidth !== totalSpansWidth) {
      setGeneralData((prev) => ({
        ...prev,
        blockWidth: totalSpansWidth,
      }));
    }
  }, [totalSpansWidth, generalData.blockWidth]);

  const handleGeneralChange = (e) =>
    setGeneralData({
      ...generalData,
      [e.target.name]: parseFloat(e.target.value) || 0,
    });

  const createDefaultSpan = (referenceSpan = null, fallbackWidth = 18) => {
    const ref = referenceSpan || (spans.length > 0 ? spans[0] : null);
    const w = ref ? Number(ref.spanWidth) || fallbackWidth : fallbackWidth;
    const h = ref
      ? Number(ref.eaveHeight) || generalData.blockHeight || 6
      : generalData.blockHeight || 6;
    const s = ref ? Number(ref.slope) || 10 : 10;
    const isGable = ref ? Number(ref.skateCount) === 2 : false;
    const fType = ref ? ref.frameType || frameType || "beam" : frameType || "beam";
    const sDir = ref ? ref.slopeDirection || "right" : "right";

    return {
      id: "sp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      spanWidth: w,
      eaveHeight: h,
      slope: s,
      skateCount: isGable ? 2 : 1,
      baseElevation: ref ? Number(ref.baseElevation) || 0.0 : 0.0,
      slopeDirection: sDir,
      skate1Length: isGable ? w / 2 : w,
      lockParam: "none",
      frameType: fType,
      cranes: [],
    };
  };

  const handleAddSpanLeft = () => {
    setSpans((prevSpans) => {
      const refSpan = prevSpans[0];
      const newSpan = createDefaultSpan(refSpan);
      return [newSpan, ...prevSpans];
    });
  };

  const handleAddSpanRight = () => {
    setSpans((prevSpans) => {
      const refSpan = prevSpans[prevSpans.length - 1];
      const newSpan = createDefaultSpan(refSpan);
      return [...prevSpans, newSpan];
    });
  };

  const handleAddSpanAt = (index, position = "after") => {
    setSpans((prevSpans) => {
      const targetIdx = position === "before" ? index : index + 1;
      const refSpan = prevSpans[index];
      const newSpan = createDefaultSpan(refSpan);
      const next = [...prevSpans];
      next.splice(targetIdx, 0, newSpan);
      return next;
    });
  };

  const handleDeleteSpan = (index) => {
    if (spans.length <= 1) {
      alert("В здании должен оставаться как минимум один пролёт.");
      return;
    }
    setSpans((prevSpans) => prevSpans.filter((_, i) => i !== index));
  };

  const handleSpanCountChange = (e) => {
    let count = parseInt(e.target.value, 10);
    if (isNaN(count)) return;
    count = Math.max(1, Math.min(count, 15));

    setSpans((prevSpans) => {
      const curCount = prevSpans.length;
      if (count === curCount) return prevSpans;
      if (count > curCount) {
        const added = [];
        for (let i = curCount; i < count; i++) {
          const ref = prevSpans[curCount - 1];
          added.push(createDefaultSpan(ref));
        }
        return [...prevSpans, ...added];
      } else {
        return prevSpans.slice(0, count);
      }
    });
  };

  const handleSpanChange = (idx, eOrField, directValue) => {
    let name, value;
    if (typeof eOrField === "string") {
      name = eOrField;
      value = directValue;
    } else if (eOrField && eOrField.target) {
      name = eOrField.target.name;
      value = eOrField.target.value;
    } else {
      return;
    }

    setSpans((prevSpans) =>
      prevSpans.map((span, i) => {
        if (i !== idx) return span;
        return updateSpanRoofGeometry(span, name, value, frameType);
      })
    );
  };

  const handleToggleSpanFrameType = (idx) => {
    setSpans((prevSpans) =>
      prevSpans.map((span, i) => {
        if (i !== idx) return span;
        const currentType = span.frameType || frameType || "beam";
        const nextType = currentType === "truss" ? "beam" : "truss";
        return {
          ...span,
          frameType: nextType,
        };
      })
    );
  };

  const handleFrameTypeChange = (newType) => {
    setFrameType(newType);
    setSpans((prevSpans) =>
      prevSpans.map((span) => ({
        ...span,
        frameType: newType,
      }))
    );
  };

  const handleToggleGlobalFrameType = () => {
    const nextType = frameType === "truss" ? "beam" : "truss";
    handleFrameTypeChange(nextType);
  };

  const handleColumnStepChange = (e) =>
    setColumnStep(parseFloat(e.target.value));

  // --- ИММУТАБЕЛЬНЫЕ ХЭНДЛЕРЫ КРАНОВ ---
  const handleCraneAdd = (idx) => {
    setSpans((prevSpans) =>
      prevSpans.map((span, i) => {
        if (i !== idx) return span;
        return {
          ...span,
          cranes: [
            ...(span.cranes || []),
            {
              id:
                "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
              selectedCapacity: 5,
              type: "support",
            },
          ],
        };
      })
    );
  };

  const handleCraneChange = (idx, cid, fieldOrVal, valIfField) => {
    setSpans((prevSpans) =>
      prevSpans.map((span, i) => {
        if (i !== idx) return span;
        return {
          ...span,
          cranes: (span.cranes || []).map((crane) => {
            if (crane.id !== cid) return crane;
            if (valIfField !== undefined) {
              return {
                ...crane,
                [fieldOrVal]:
                  fieldOrVal === "selectedCapacity"
                    ? parseFloat(valIfField) || 0
                    : valIfField,
              };
            }
            return {
              ...crane,
              selectedCapacity: parseFloat(fieldOrVal) || 0,
            };
          }),
        };
      })
    );
  };

  const handleCraneDelete = (idx, cid) => {
    setSpans((prevSpans) =>
      prevSpans.map((span, i) => {
        if (i !== idx) return span;
        return {
          ...span,
          cranes: (span.cranes || []).filter((crane) => crane.id !== cid),
        };
      })
    );
  };

  const availableCapacities = useMemo(() => {
    if (!craneDb || !craneDb.capacities) return null;
    return craneDb.capacities;
  }, [craneDb]);

  // --- ВАЛИДАЦИЯ ---
  const validation = useMemo(() => {
    // Ширина блока всегда равна сумме ширин пролётов (автоматический расчет)
    const isWidthValid = true;

    let layoutInfo = null;
    if (columnStep > 0 && generalData.blockLength > 0) {
      const L = generalData.blockLength;
      const S = columnStep;
      if (L % S === 0) {
        layoutInfo = { type: "even", frameCount: L / S, step: S };
      } else {
        const numMiddleFrames = Math.floor(L / S) - 1;
        const middleLength = numMiddleFrames * S;
        const endStep = (L - middleLength) / 2;
        layoutInfo = {
          type: "sym",
          middleFrameCount: numMiddleFrames,
          middleStep: S,
          endStep: endStep,
        };
      }
    }
    return { isWidthValid, layoutInfo };
  }, [generalData.blockLength, columnStep]);

  // --- РАСЧЕТ РАСКЛАДКИ КОЛОНН ---
  const derivedColumnLayout = useMemo(() => {
    const { layoutInfo } = validation;
    if (!layoutInfo) return [];
    const layout = [];
    if (layoutInfo.type === "even") {
      for (let i = 0; i < layoutInfo.frameCount; i++) {
        layout.push({ id: i + 1, step: layoutInfo.step });
      }
    } else {
      layout.push({ id: 1, step: layoutInfo.endStep });
      for (let i = 0; i < layoutInfo.middleFrameCount; i++) {
        layout.push({ id: i + 2, step: layoutInfo.middleStep });
      }
      layout.push({
        id: layoutInfo.middleFrameCount + 2,
        step: layoutInfo.endStep,
      });
    }
    return layout;
  }, [validation]);

  // --- ОСИ ДЛЯ РУЧНОГО РЕЖИМА ---
  const { xAxis, yAxis } = useMemo(() => {
    const x = [];
    const y = [];
    for (let i = 0; i <= spans.length; i++) {
      x.push(getAxisLabel(i));
    }
    for (let i = 0; i <= derivedColumnLayout.length; i++) {
      y.push((i + 1).toString());
    }
    return { xAxis: x, yAxis: y };
  }, [spans, derivedColumnLayout]);

  // --- ПЕРЕХОД В РУЧНОЙ РЕЖИМ ---
  const handleBakeGrid = () => {
    const matrix = {};
    xAxis.forEach((x) => {
      yAxis.forEach((y) => {
        matrix[`${x}-${y}`] = { exists: true };
      });
    });
    setGridMatrix(matrix);
    setEditMode("manual");
  };

  // --- ХЭНДЛЕРЫ ВЫДЕЛЕНИЯ И УДАЛЕНИЯ ---
  const handleColumnClick = (colKey) => {
    if (editMode !== "manual") return;
    const colExists = gridMatrix && gridMatrix[colKey] ? gridMatrix[colKey].exists : true;
    if (!colExists) {
      // Клик по удаленной колонне восстанавливает её
      setGridMatrix((prevMatrix) => ({
        ...prevMatrix,
        [colKey]: { exists: true },
      }));
      return;
    }
    setSelectedColumns((prev) =>
      prev.includes(colKey)
        ? prev.filter((k) => k !== colKey)
        : [...prev, colKey]
    );
  };

  const handleSelectAllColumns = () => {
    if (editMode !== "manual" || !gridMatrix) return;
    const allKeys = Object.keys(gridMatrix).filter(
      (k) => gridMatrix[k] && gridMatrix[k].exists
    );
    setSelectedColumns(allKeys);
  };

  const handleClearSelection = () => {
    setSelectedColumns([]);
  };

  const handleRestoreAllColumns = () => {
    if (!gridMatrix) return;
    setGridMatrix((prevMatrix) => {
      const newMatrix = { ...prevMatrix };
      Object.keys(newMatrix).forEach((key) => {
        newMatrix[key] = { exists: true };
      });
      return newMatrix;
    });
    setSelectedColumns([]);
  };

  const handleResetToWizard = () => {
    setGridMatrix(null);
    setSelectedColumns([]);
    setEditMode("wizard");
  };

  const handleDeleteSelected = () => {
    if (selectedColumns.length === 0) return;
    setGridMatrix((prevMatrix) => {
      const newMatrix = { ...prevMatrix };
      selectedColumns.forEach((key) => {
        if (newMatrix[key]) newMatrix[key].exists = false;
      });
      return newMatrix;
    });
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

  // --- СБОР ДАННЫХ ДЛЯ ВЫХОДА ---
  const collectData = () => ({
    generalData: {
      ...generalData,
      blockWidth: totalSpansWidth,
    },
    spans,
    columnStep,
    gridMatrix: editMode === "manual" ? gridMatrix : null,
    mezzanines,
    frameType,
  });

  const handleManageMezzanines = () => {
    onOpenMezzanineEditor(collectData());
  };

  // Вычисление динамической ширины для стандартного режима с учетом свернутости
  const isFormCollapsed = collapsed.form;
  const isPlanCollapsed = collapsed.plan;
  const isSectionCollapsed = collapsed.section;
  const areAllVisualCollapsed = isPlanCollapsed && isSectionCollapsed;

  let effectiveFormWidth = formWidth;
  let effectiveVisualWidth = 100 - formWidth;

  if (isFormCollapsed && !areAllVisualCollapsed) {
    effectiveFormWidth = 0;
    effectiveVisualWidth = 100;
  } else if (!isFormCollapsed && areAllVisualCollapsed) {
    effectiveFormWidth = 100;
    effectiveVisualWidth = 0;
  }

  // Общий стиль карточек окон
  const windowCardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "all 0.2s ease-in-out",
  };

  const windowHeaderStyle = {
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
    gap: "8px",
    flexWrap: "nowrap",
  };

  const headerBtnStyle = {
    padding: "3px 7px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.8em",
    fontWeight: "600",
    color: "#334155",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ width: "100%", fontFamily: "Arial, sans-serif" }}>
      {/* 1. Верхняя панель управления шагом и переходами */}
      <div style={styles.topBar}>
        <button
          onClick={() => onSaveAndBack(null)}
          style={{ ...styles.backButton, backgroundColor: "#64748b" }}
        >
          Отмена
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: "bold", fontSize: "1.15em", color: "#1e293b" }}>
            Шаг 1: Геометрия ЕВРОАНГАР
          </span>
          <span
            style={{
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              fontSize: "0.82em",
              padding: "3px 8px",
              borderRadius: "12px",
              fontWeight: "600",
            }}
          >
            {generalData.blockWidth || 0}×{generalData.blockLength || 0} м ({spanCount} прол.)
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onSaveAndBack(collectData())}
            style={{ ...styles.backButton, backgroundColor: "#16a34a" }}
          >
            💾 Сохранить
          </button>
          <button
            onClick={() => onNextStep(collectData())}
            style={{ ...styles.backButton, backgroundColor: "#0284c7" }}
          >
            Далее &rarr;
          </button>
        </div>
      </div>

      {/* 2. Панель пресетов раскладки и управления окнами */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f1f5f9",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          padding: "6px 12px",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82em", fontWeight: "bold", color: "#475569" }}>
            🎛️ Раскладка:
          </span>

          <button
            onClick={() => {
              setLayoutMode("standard");
              setMaximizedWindow(null);
            }}
            style={{
              ...headerBtnStyle,
              backgroundColor: layoutMode === "standard" && !maximizedWindow ? "#0284c7" : "#fff",
              color: layoutMode === "standard" && !maximizedWindow ? "#fff" : "#334155",
            }}
            title="Форма слева, План и Разрез справа в стек"
          >
            🔲 Стандарт (2 колонки)
          </button>

          <button
            onClick={() => {
              setLayoutMode("3col");
              setMaximizedWindow(null);
            }}
            style={{
              ...headerBtnStyle,
              backgroundColor: layoutMode === "3col" && !maximizedWindow ? "#0284c7" : "#fff",
              color: layoutMode === "3col" && !maximizedWindow ? "#fff" : "#334155",
            }}
            title="Форма | План | Разрез в 3 колонки"
          >
            ⏸️ 3 Колонки
          </button>

          <button
            onClick={() => {
              setLayoutMode("stacked");
              setMaximizedWindow(null);
            }}
            style={{
              ...headerBtnStyle,
              backgroundColor: layoutMode === "stacked" && !maximizedWindow ? "#0284c7" : "#fff",
              color: layoutMode === "stacked" && !maximizedWindow ? "#fff" : "#334155",
            }}
            title="Все 3 окна друг под другом в полную ширину"
          >
            ☰ Полосы (Стек)
          </button>

          <button
            onClick={resetLayout}
            style={{ ...headerBtnStyle, color: "#64748b" }}
            title="Сбросить размеры окон к значениям по умолчанию"
          >
            🔄 Сброс размеров
          </button>
        </div>

        {/* Быстрые переключатели видимости / разворачивания */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.82em", color: "#64748b" }}>Окна:</span>

          <button
            onClick={() => toggleCollapse("form")}
            style={{
              ...headerBtnStyle,
              backgroundColor: !collapsed.form ? "#e0f2fe" : "#fff",
              borderColor: !collapsed.form ? "#38bdf8" : "#cbd5e1",
              color: !collapsed.form ? "#0369a1" : "#64748b",
            }}
          >
            📋 Форма {!collapsed.form ? "✓" : "—"}
          </button>

          <button
            onClick={() => toggleCollapse("plan")}
            style={{
              ...headerBtnStyle,
              backgroundColor: !collapsed.plan ? "#e0f2fe" : "#fff",
              borderColor: !collapsed.plan ? "#38bdf8" : "#cbd5e1",
              color: !collapsed.plan ? "#0369a1" : "#64748b",
            }}
          >
            📐 План {!collapsed.plan ? "✓" : "—"}
          </button>

          <button
            onClick={() => toggleCollapse("section")}
            style={{
              ...headerBtnStyle,
              backgroundColor: !collapsed.section ? "#e0f2fe" : "#fff",
              borderColor: !collapsed.section ? "#38bdf8" : "#cbd5e1",
              color: !collapsed.section ? "#0369a1" : "#64748b",
            }}
          >
            🏗️ Разрез {!collapsed.section ? "✓" : "—"}
          </button>

          <span style={{ color: "#cbd5e1" }}>|</span>

          <button
            onClick={expandAll}
            style={{ ...headerBtnStyle, fontSize: "0.78em" }}
            title="Развернуть все окна"
          >
            ➕ Развернуть все
          </button>
          <button
            onClick={collapseAll}
            style={{ ...headerBtnStyle, fontSize: "0.78em" }}
            title="Свернуть все окна"
          >
            ➖ Свернуть все
          </button>
        </div>
      </div>

      {/* Баннер режима Maximized (если развернуто одно окно) */}
      {maximizedWindow && (
        <div
          style={{
            backgroundColor: "#e0f2fe",
            border: "1px solid #7dd3fc",
            borderRadius: "6px",
            padding: "8px 14px",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.88em", color: "#0369a1", fontWeight: "bold" }}>
            🔍 Окно «
            {maximizedWindow === "form"
              ? "Параметры и пролёты"
              : maximizedWindow === "plan"
              ? "План здания"
              : "Поперечный разрез"}
            » развернуто на всю ширину
          </span>
          <button
            onClick={() => setMaximizedWindow(null)}
            style={{ ...headerBtnStyle, backgroundColor: "#0284c7", color: "#fff" }}
          >
            🗗 Восстановить общую раскладку
          </button>
        </div>
      )}

      {/* 3. Основной контейнер окон */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "1800px",
          margin: "0 auto",
          display: "flex",
          flexDirection: layoutMode === "stacked" ? "column" : "row",
          gap: "12px",
          alignItems: "stretch",
          position: "relative",
        }}
      >
        {/* ======================================================== */}
        {/* ОКНО 1: ПАРАМЕТРЫ И ПРОЛЁТЫ (ФОРМА ВВОДА)                */}
        {/* ======================================================== */}
        {(maximizedWindow === null || maximizedWindow === "form") && (
          <div
            style={{
              ...windowCardStyle,
              width:
                maximizedWindow === "form"
                  ? "100%"
                  : layoutMode === "stacked"
                  ? "100%"
                  : layoutMode === "3col"
                  ? `${collapsed.form ? 42 : col3Widths.form}%`
                  : `${isFormCollapsed ? 42 : effectiveFormWidth}%`,
              minWidth:
                isFormCollapsed || (layoutMode === "3col" && collapsed.form)
                  ? "42px"
                  : "260px",
              flexShrink: 0,
            }}
          >
            {/* Заголовок окна 1 */}
            <div style={windowHeaderStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "1.1em" }}>📋</span>
                <strong style={{ fontSize: "0.95em", color: "#1e293b" }}>
                  Параметры и пролёты
                </strong>
                <span
                  style={{
                    fontSize: "0.76em",
                    backgroundColor: "#e2e8f0",
                    color: "#475569",
                    padding: "2px 6px",
                    borderRadius: "8px",
                  }}
                >
                  {layoutMode === "3col"
                    ? `${Math.round(col3Widths.form)}%`
                    : `${Math.round(formWidth)}%`}
                </span>
              </div>

              {/* Кнопки управления размером и сворачиванием */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {layoutMode === "standard" && !isFormCollapsed && (
                  <>
                    <button
                      onClick={() => adjustFormWidth(-5)}
                      style={headerBtnStyle}
                      title="Уменьшить ширину формы на 5% (чертежи увеличатся)"
                    >
                      ◀ -5%
                    </button>
                    <button
                      onClick={() => adjustFormWidth(5)}
                      style={headerBtnStyle}
                      title="Увеличить ширину формы на 5% (чертежи уменьшатся)"
                    >
                      +5% ▶
                    </button>
                  </>
                )}

                {layoutMode === "3col" && !collapsed.form && (
                  <>
                    <button
                      onClick={() => adjustCol3Width("form", -5)}
                      style={headerBtnStyle}
                      title="Уменьшить ширину формы"
                    >
                      ◀ -5%
                    </button>
                    <button
                      onClick={() => adjustCol3Width("form", 5)}
                      style={headerBtnStyle}
                      title="Увеличить ширину формы"
                    >
                      +5% ▶
                    </button>
                  </>
                )}

                <button
                  onClick={() => toggleMaximize("form")}
                  style={headerBtnStyle}
                  title={
                    maximizedWindow === "form"
                      ? "Восстановить размер"
                      : "Развернуть на весь экран"
                  }
                >
                  {maximizedWindow === "form" ? "🗗" : "⛶"}
                </button>

                <button
                  onClick={() => toggleCollapse("form")}
                  style={headerBtnStyle}
                  title={collapsed.form ? "Развернуть окно" : "Свернуть окно"}
                >
                  {collapsed.form ? "➕" : "▲"}
                </button>
              </div>
            </div>

            {/* Содержимое окна 1 */}
            {!collapsed.form && (
              <div style={{ padding: "12px", overflowY: "auto", maxHeight: "82vh" }}>
                <FormColumn
                  editMode={editMode}
                  handleBakeGrid={handleBakeGrid}
                  generalData={generalData}
                  spanCount={spans.length}
                  spans={spans}
                  columnStep={columnStep}
                  frameType={frameType}
                  handleFrameTypeChange={handleFrameTypeChange}
                  validation={validation}
                  styles={styles}
                  handleGeneralChange={handleGeneralChange}
                  handleSpanCountChange={handleSpanCountChange}
                  handleSpanChange={handleSpanChange}
                  handleColumnStepChange={handleColumnStepChange}
                  onAddSpanLeft={handleAddSpanLeft}
                  onAddSpanRight={handleAddSpanRight}
                  onAddSpanAt={handleAddSpanAt}
                  onDeleteSpan={handleDeleteSpan}
                  totalSpansWidth={totalSpansWidth}
                  availableCapacities={availableCapacities}
                  handleCraneAdd={handleCraneAdd}
                  handleCraneChange={handleCraneChange}
                  handleCraneDelete={handleCraneDelete}
                  handleDeleteSelected={handleDeleteSelected}
                  onClearSelection={handleClearSelection}
                  onSelectAll={handleSelectAllColumns}
                  onRestoreAll={handleRestoreAllColumns}
                  onResetToWizard={handleResetToWizard}
                  selectedCount={selectedColumns.length}
                  allAxes={{ xAxis, yAxis }}
                  toolSettings={massEditTools}
                  onToolChange={handleToolChange}
                  onToolApply={handleMassEditApply}
                  mezzanines={mezzanines}
                  handleMezzanineAdd={handleManageMezzanines}
                />
              </div>
            )}

            {collapsed.form && (
              <div
                onClick={() => toggleCollapse("form")}
                style={{
                  padding: "16px 8px",
                  writingMode: "vertical-rl",
                  textAlign: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: "0.88em",
                  letterSpacing: "1px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  height: "100%",
                }}
                title="Нажмите, чтобы развернуть панель параметров"
              >
                <span>📋 Параметры и пролёты (свернуто)</span>
              </div>
            )}
          </div>
        )}

        {/* Разделитель между формой и чертежами (для standard и 3col) */}
        {!maximizedWindow && layoutMode === "standard" && !isFormCollapsed && !areAllVisualCollapsed && (
          <div
            onMouseDown={(e) => handleSplitterMouseDown("horizontal-main", e)}
            style={{
              width: "8px",
              cursor: "col-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              userSelect: "none",
              margin: "0 -4px",
              zIndex: 10,
            }}
            title="Перетащите для изменения ширины окон"
          >
            <div
              style={{
                width: "4px",
                height: "50px",
                backgroundColor: "#cbd5e1",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0284c7")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#cbd5e1")}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* ОБЛАСТЬ ЧЕРТЕЖЕЙ (ПЛАН И РАЗРЕЗ)                         */}
        {/* ======================================================== */}

        {/* ВАРИАНТ А: СТАНДАРТНЫЙ РЕЖИМ (2 КОЛОНКИ СО СТЕКОМ СПРАВА) */}
        {layoutMode === "standard" && maximizedWindow === null && !areAllVisualCollapsed && (
          <div
            id="visual-drawings-container"
            style={{
              width: `${effectiveVisualWidth}%`,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              minWidth: "300px",
              flex: 1,
            }}
          >
            {/* ОКНО 2: ПЛАН ЗДАНИЯ */}
            {!isPlanCollapsed && (
              <div
                style={{
                  ...windowCardStyle,
                  height: isSectionCollapsed ? "auto" : `${planHeight}%`,
                  minHeight: isSectionCollapsed ? "auto" : "280px",
                }}
              >
                {/* Заголовок окна 2 */}
                <div style={windowHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "1.1em" }}>📐</span>
                    <strong style={{ fontSize: "0.95em", color: "#1e293b" }}>
                      План здания (Сетка колонн)
                    </strong>
                    <span
                      style={{
                        fontSize: "0.76em",
                        backgroundColor: "#e2e8f0",
                        color: "#475569",
                        padding: "2px 6px",
                        borderRadius: "8px",
                      }}
                    >
                      {generalData.blockLength || 0}м (шаг {columnStep}м)
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {/* Регулятор масштаба плана (Zoom) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        padding: "1px 4px",
                        borderRadius: "4px",
                      }}
                    >
                      <button
                        onClick={() => changePlanZoom(-15)}
                        style={{ ...headerBtnStyle, padding: "1px 5px", fontSize: "0.8em" }}
                        title="Уменьшить масштаб плана"
                      >
                        🔍 -
                      </button>
                      <span
                        onClick={() => setPlanZoom(100)}
                        style={{
                          fontSize: "0.72em",
                          fontWeight: "600",
                          color: "#475569",
                          cursor: "pointer",
                          minWidth: "34px",
                          textAlign: "center",
                        }}
                        title="Сбросить масштаб 100%"
                      >
                        {planZoom}%
                      </span>
                      <button
                        onClick={() => changePlanZoom(15)}
                        style={{ ...headerBtnStyle, padding: "1px 5px", fontSize: "0.8em" }}
                        title="Увеличить масштаб плана"
                      >
                        🔍 +
                      </button>
                    </div>

                    {!isSectionCollapsed && (
                      <>
                        <button
                          onClick={() => adjustPlanHeight(-5)}
                          style={headerBtnStyle}
                          title="Уменьшить высоту плана на 5% (разрез увеличится)"
                        >
                          ▲ -5%
                        </button>
                        <button
                          onClick={() => adjustPlanHeight(5)}
                          style={headerBtnStyle}
                          title="Увеличить высоту плана на 5% (разрез уменьшится)"
                        >
                          ▼ +5%
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleMaximize("plan")}
                      style={headerBtnStyle}
                      title="Развернуть план на весь экран"
                    >
                      ⛶
                    </button>

                    <button
                      onClick={() => toggleCollapse("plan")}
                      style={headerBtnStyle}
                      title="Свернуть план здания"
                    >
                      ▲
                    </button>
                  </div>
                </div>

                {/* Содержимое окна 2 */}
                <div
                  style={{
                    padding: "10px",
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <BuildingPlanView
                    generalData={generalData}
                    spans={spans}
                    columnLayout={derivedColumnLayout}
                    mezzanines={mezzanines}
                    zoom={planZoom}
                    styles={styles}
                    editMode={editMode}
                    gridMatrix={gridMatrix}
                    selectedColumns={selectedColumns}
                    onColumnClick={handleColumnClick}
                    onDeleteSelected={handleDeleteSelected}
                    onClearSelection={handleClearSelection}
                    onSelectAll={handleSelectAllColumns}
                    onRestoreAll={handleRestoreAllColumns}
                  />

                  {/* Панель антресолей */}
                  <div
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      padding: "8px 12px",
                      border: "1px dashed #818cf8",
                      borderRadius: "6px",
                      backgroundColor: "#f5f3ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.88em",
                    }}
                  >
                    <span>
                      🏢 <strong>Антресоли:</strong> {mezzanines.length} шт.
                    </span>
                    <button
                      style={styles.mezzanineButton}
                      onClick={handleManageMezzanines}
                    >
                      🛠 Редактор Антресолей
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Свернутый заголовок плана */}
            {isPlanCollapsed && (
              <div
                style={{
                  ...windowCardStyle,
                  cursor: "pointer",
                }}
                onClick={() => toggleCollapse("plan")}
              >
                <div style={windowHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📐</span>
                    <strong>План здания (Сетка колонн)</strong>
                    <span style={{ fontSize: "0.76em", color: "#64748b" }}>(свернуто)</span>
                  </div>
                  <button style={headerBtnStyle}>➕ Развернуть</button>
                </div>
              </div>
            )}

            {/* Вертикальный разделитель между планом и разрезом */}
            {!isPlanCollapsed && !isSectionCollapsed && (
              <div
                onMouseDown={(e) => handleSplitterMouseDown("vertical-visual", e)}
                style={{
                  height: "8px",
                  cursor: "row-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  userSelect: "none",
                  margin: "-4px 0",
                  zIndex: 10,
                }}
                title="Перетащите для изменения высоты плана и разреза"
              >
                <div
                  style={{
                    height: "4px",
                    width: "60px",
                    backgroundColor: "#cbd5e1",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0284c7")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#cbd5e1")}
                />
              </div>
            )}

            {/* ОКНО 3: ПОПЕРЕЧНЫЙ РАЗРЕЗ ЗДАНИЯ */}
            {!isSectionCollapsed && (
              <div
                style={{
                  ...windowCardStyle,
                  height: isPlanCollapsed ? "auto" : `${100 - planHeight}%`,
                  minHeight: isPlanCollapsed ? "auto" : "280px",
                }}
              >
                {/* Заголовок окна 3 */}
                <div style={windowHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.1em" }}>🏗️</span>
                    <strong style={{ fontSize: "0.95em", color: "#1e293b" }}>
                      Поперечный разрез здания
                    </strong>
                    <div style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
                      {spans && spans.length > 0 ? (
                        spans.map((sp, sIdx) => {
                          const isTruss = (sp.frameType || frameType || "beam") === "truss";
                          return (
                            <button
                              key={`main-hdr-span-${sIdx}`}
                              type="button"
                              onClick={() => handleToggleSpanFrameType(sIdx)}
                              style={{
                                fontSize: "0.74em",
                                backgroundColor: isTruss ? "#eff6ff" : "#f0fdf4",
                                color: isTruss ? "#1d4ed8" : "#15803d",
                                border: `1px solid ${isTruss ? "#93c5fd" : "#86efac"}`,
                                padding: "2px 6px",
                                borderRadius: "5px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                              title={`Нажмите для смены покрытия Пролёта ${sIdx + 1}`}
                            >
                              <span>{spans.length > 1 ? `Пр.${sIdx + 1}: ` : ""}</span>
                              <span>{isTruss ? "📐 Ферма" : "🏢 Балка"}</span>
                            </button>
                          );
                        })
                      ) : (
                        <button
                          type="button"
                          onClick={handleToggleGlobalFrameType}
                          style={{
                            fontSize: "0.74em",
                            backgroundColor: frameType === "truss" ? "#eff6ff" : "#f0fdf4",
                            color: frameType === "truss" ? "#1d4ed8" : "#15803d",
                            border: `1px solid ${frameType === "truss" ? "#93c5fd" : "#86efac"}`,
                            padding: "2px 6px",
                            borderRadius: "5px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          {frameType === "truss" ? "📐 Ферма" : "🏢 Балка"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {/* Регулятор масштаба разреза (Zoom) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        padding: "1px 4px",
                        borderRadius: "4px",
                      }}
                    >
                      <button
                        onClick={() => changeSectionZoom(-15)}
                        style={{ ...headerBtnStyle, padding: "1px 5px", fontSize: "0.8em" }}
                        title="Уменьшить масштаб разреза"
                      >
                        🔍 -
                      </button>
                      <span
                        onClick={() => setSectionZoom(100)}
                        style={{
                          fontSize: "0.72em",
                          fontWeight: "600",
                          color: "#475569",
                          cursor: "pointer",
                          minWidth: "34px",
                          textAlign: "center",
                        }}
                        title="Сбросить масштаб 100%"
                      >
                        {sectionZoom}%
                      </span>
                      <button
                        onClick={() => changeSectionZoom(15)}
                        style={{ ...headerBtnStyle, padding: "1px 5px", fontSize: "0.8em" }}
                        title="Увеличить масштаб разреза"
                      >
                        🔍 +
                      </button>
                    </div>

                    {!isPlanCollapsed && (
                      <>
                        <button
                          onClick={() => adjustPlanHeight(5)}
                          style={headerBtnStyle}
                          title="Уменьшить высоту разреза на 5%"
                        >
                          ▼ -5%
                        </button>
                        <button
                          onClick={() => adjustPlanHeight(-5)}
                          style={headerBtnStyle}
                          title="Увеличить высоту разреза на 5%"
                        >
                          ▲ +5%
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleMaximize("section")}
                      style={headerBtnStyle}
                      title="Развернуть разрез на весь экран"
                    >
                      ⛶
                    </button>

                    <button
                      onClick={() => toggleCollapse("section")}
                      style={headerBtnStyle}
                      title="Свернуть поперечный разрез"
                    >
                      ▲
                    </button>
                  </div>
                </div>

                {/* Содержимое окна 3 */}
                <div style={{ padding: "10px", overflow: "auto" }}>
                  <BuildingSectionView
                    generalData={generalData}
                    spans={spans}
                    mezzanines={mezzanines}
                    craneDb={craneDb}
                    frameType={frameType}
                    zoom={sectionZoom}
                    onToggleFrameType={handleToggleGlobalFrameType}
                    onToggleSpanFrameType={handleToggleSpanFrameType}
                    onAddSpanLeft={handleAddSpanLeft}
                    onAddSpanRight={handleAddSpanRight}
                    onDeleteSpan={handleDeleteSpan}
                    styles={styles}
                  />
                </div>
              </div>
            )}

            {/* Свернутый заголовок разреза */}
            {isSectionCollapsed && (
              <div
                style={{
                  ...windowCardStyle,
                  cursor: "pointer",
                }}
                onClick={() => toggleCollapse("section")}
              >
                <div style={windowHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🏗️</span>
                    <strong>Поперечный разрез здания</strong>
                    <span style={{ fontSize: "0.76em", color: "#64748b" }}>(свернуто)</span>
                  </div>
                  <button style={headerBtnStyle}>➕ Развернуть</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ВАРИАНТ Б: 3-КОЛОНОЧНЫЙ РЕЖИМ (ФОРМА | ПЛАН | РАЗРЕЗ) */}
        {layoutMode === "3col" && maximizedWindow === null && (
          <>
            {/* ОКНО 2 В 3-КОЛОНОЧНОМ РЕЖИМЕ (ПЛАН) */}
            <div
              style={{
                ...windowCardStyle,
                width: `${collapsed.plan ? 42 : col3Widths.plan}%`,
                minWidth: collapsed.plan ? "42px" : "240px",
                flexShrink: 0,
              }}
            >
              <div style={windowHeaderStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>📐</span>
                  <strong style={{ fontSize: "0.95em", color: "#1e293b" }}>План здания</strong>
                  <span
                    style={{
                      fontSize: "0.76em",
                      backgroundColor: "#e2e8f0",
                      padding: "2px 6px",
                      borderRadius: "8px",
                    }}
                  >
                    {Math.round(col3Widths.plan)}%
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {/* Zoom плана в 3col */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      padding: "1px 3px",
                      borderRadius: "4px",
                    }}
                  >
                    <button
                      onClick={() => changePlanZoom(-15)}
                      style={{ ...headerBtnStyle, padding: "1px 4px", fontSize: "0.76em" }}
                      title="Уменьшить масштаб"
                    >
                      🔍 -
                    </button>
                    <span
                      onClick={() => setPlanZoom(100)}
                      style={{
                        fontSize: "0.7em",
                        fontWeight: "600",
                        color: "#475569",
                        cursor: "pointer",
                        minWidth: "30px",
                        textAlign: "center",
                      }}
                      title="Сбросить масштаб 100%"
                    >
                      {planZoom}%
                    </span>
                    <button
                      onClick={() => changePlanZoom(15)}
                      style={{ ...headerBtnStyle, padding: "1px 4px", fontSize: "0.76em" }}
                      title="Увеличить масштаб"
                    >
                      🔍 +
                    </button>
                  </div>

                  {!collapsed.plan && (
                    <>
                      <button
                        onClick={() => adjustCol3Width("plan", -5)}
                        style={headerBtnStyle}
                        title="Уменьшить ширину плана"
                      >
                        ◀ -5%
                      </button>
                      <button
                        onClick={() => adjustCol3Width("plan", 5)}
                        style={headerBtnStyle}
                        title="Увеличить ширину плана"
                      >
                        +5% ▶
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleMaximize("plan")}
                    style={headerBtnStyle}
                    title="Развернуть план"
                  >
                    ⛶
                  </button>

                  <button
                    onClick={() => toggleCollapse("plan")}
                    style={headerBtnStyle}
                    title="Свернуть план"
                  >
                    {collapsed.plan ? "➕" : "▲"}
                  </button>
                </div>
              </div>

              {!collapsed.plan && (
                <div style={{ padding: "10px", overflow: "auto" }}>
                  <BuildingPlanView
                    generalData={generalData}
                    spans={spans}
                    columnLayout={derivedColumnLayout}
                    mezzanines={mezzanines}
                    zoom={planZoom}
                    styles={styles}
                    editMode={editMode}
                    gridMatrix={gridMatrix}
                    selectedColumns={selectedColumns}
                    onColumnClick={handleColumnClick}
                    onDeleteSelected={handleDeleteSelected}
                    onClearSelection={handleClearSelection}
                    onSelectAll={handleSelectAllColumns}
                    onRestoreAll={handleRestoreAllColumns}
                  />

                  <div
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      padding: "8px 12px",
                      border: "1px dashed #818cf8",
                      borderRadius: "6px",
                      backgroundColor: "#f5f3ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.85em",
                    }}
                  >
                    <span>Антресоли: {mezzanines.length} шт.</span>
                    <button
                      style={styles.mezzanineButton}
                      onClick={handleManageMezzanines}
                    >
                      🛠 Редактор
                    </button>
                  </div>
                </div>
              )}

              {collapsed.plan && (
                <div
                  onClick={() => toggleCollapse("plan")}
                  style={{
                    padding: "16px 8px",
                    writingMode: "vertical-rl",
                    textAlign: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "0.88em",
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    height: "100%",
                  }}
                  title="Нажмите чтобы развернуть план"
                >
                  <span>📐 План здания (свернуто)</span>
                </div>
              )}
            </div>

            {/* Разделитель между Планом и Разрезом */}
            {!collapsed.plan && !collapsed.section && (
              <div
                onMouseDown={(e) => handleSplitterMouseDown("3col-2", e)}
                style={{
                  width: "8px",
                  cursor: "col-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  userSelect: "none",
                  margin: "0 -4px",
                  zIndex: 10,
                }}
                title="Перетащите для изменения ширины"
              >
                <div
                  style={{
                    width: "4px",
                    height: "50px",
                    backgroundColor: "#cbd5e1",
                    borderRadius: "4px",
                  }}
                />
              </div>
            )}

            {/* ОКНО 3 В 3-КОЛОНОЧНОМ РЕЖИМЕ (РАЗРЕЗ) */}
            <div
              style={{
                ...windowCardStyle,
                width: `${collapsed.section ? 42 : col3Widths.section}%`,
                minWidth: collapsed.section ? "42px" : "240px",
                flexShrink: 0,
              }}
            >
              <div style={windowHeaderStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>🏗️</span>
                  <strong style={{ fontSize: "0.95em", color: "#1e293b" }}>Поперечный разрез</strong>
                  <span
                    style={{
                      fontSize: "0.76em",
                      backgroundColor: "#e2e8f0",
                      padding: "2px 6px",
                      borderRadius: "8px",
                    }}
                  >
                    {Math.round(col3Widths.section)}%
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {/* Zoom разреза в 3col */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      padding: "1px 3px",
                      borderRadius: "4px",
                    }}
                  >
                    <button
                      onClick={() => changeSectionZoom(-15)}
                      style={{ ...headerBtnStyle, padding: "1px 4px", fontSize: "0.76em" }}
                      title="Уменьшить масштаб"
                    >
                      🔍 -
                    </button>
                    <span
                      onClick={() => setSectionZoom(100)}
                      style={{
                        fontSize: "0.7em",
                        fontWeight: "600",
                        color: "#475569",
                        cursor: "pointer",
                        minWidth: "30px",
                        textAlign: "center",
                      }}
                      title="Сбросить масштаб 100%"
                    >
                      {sectionZoom}%
                    </span>
                    <button
                      onClick={() => changeSectionZoom(15)}
                      style={{ ...headerBtnStyle, padding: "1px 4px", fontSize: "0.76em" }}
                      title="Увеличить масштаб"
                    >
                      🔍 +
                    </button>
                  </div>

                  {!collapsed.section && (
                    <>
                      <button
                        onClick={() => adjustCol3Width("section", -5)}
                        style={headerBtnStyle}
                        title="Уменьшить ширину разреза"
                      >
                        ◀ -5%
                      </button>
                      <button
                        onClick={() => adjustCol3Width("section", 5)}
                        style={headerBtnStyle}
                        title="Увеличить ширину разреза"
                      >
                        +5% ▶
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleMaximize("section")}
                    style={headerBtnStyle}
                    title="Развернуть разрез"
                  >
                    ⛶
                  </button>

                  <button
                    onClick={() => toggleCollapse("section")}
                    style={headerBtnStyle}
                    title="Свернуть разрез"
                  >
                    {collapsed.section ? "➕" : "▲"}
                  </button>
                </div>
              </div>

              {!collapsed.section && (
                <div style={{ padding: "10px", overflow: "auto" }}>
                  <BuildingSectionView
                    generalData={generalData}
                    spans={spans}
                    mezzanines={mezzanines}
                    craneDb={craneDb}
                    frameType={frameType}
                    zoom={sectionZoom}
                    onToggleFrameType={handleToggleGlobalFrameType}
                    onToggleSpanFrameType={handleToggleSpanFrameType}
                    onAddSpanLeft={handleAddSpanLeft}
                    onAddSpanRight={handleAddSpanRight}
                    onDeleteSpan={handleDeleteSpan}
                    styles={styles}
                  />
                </div>
              )}

              {collapsed.section && (
                <div
                  onClick={() => toggleCollapse("section")}
                  style={{
                    padding: "16px 8px",
                    writingMode: "vertical-rl",
                    textAlign: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    fontWeight: "bold",
                    fontSize: "0.88em",
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    height: "100%",
                  }}
                  title="Нажмите чтобы развернуть разрез"
                >
                  <span>🏗️ Поперечный разрез (свернуто)</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ВАРИАНТ В: СТЕКОВЫЙ РЕЖИМ (ОДИН ПОД ДРУГИМ НА ВСЮ ШИРИНУ) */}
        {layoutMode === "stacked" && maximizedWindow === null && (
          <>
            {/* ОКНО 2 В СТЕКЕ (ПЛАН) */}
            <div style={{ ...windowCardStyle, width: "100%" }}>
              <div style={windowHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📐</span>
                  <strong>План здания (Сетка колонн)</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      padding: "1px 4px",
                      borderRadius: "4px",
                    }}
                  >
                    <button
                      onClick={() => changePlanZoom(-15)}
                      style={{ ...headerBtnStyle, padding: "1px 5px" }}
                      title="Уменьшить масштаб"
                    >
                      🔍 -
                    </button>
                    <span
                      onClick={() => setPlanZoom(100)}
                      style={{ fontSize: "0.72em", fontWeight: "600", color: "#475569", cursor: "pointer", minWidth: "32px", textAlign: "center" }}
                    >
                      {planZoom}%
                    </span>
                    <button
                      onClick={() => changePlanZoom(15)}
                      style={{ ...headerBtnStyle, padding: "1px 5px" }}
                      title="Увеличить масштаб"
                    >
                      🔍 +
                    </button>
                  </div>
                  <button onClick={() => toggleMaximize("plan")} style={headerBtnStyle}>
                    ⛶
                  </button>
                  <button onClick={() => toggleCollapse("plan")} style={headerBtnStyle}>
                    {collapsed.plan ? "➕ Развернуть" : "▲ Свернуть"}
                  </button>
                </div>
              </div>
              {!collapsed.plan && (
                <div style={{ padding: "12px", overflow: "auto" }}>
                  <BuildingPlanView
                    generalData={generalData}
                    spans={spans}
                    columnLayout={derivedColumnLayout}
                    mezzanines={mezzanines}
                    zoom={planZoom}
                    styles={styles}
                    editMode={editMode}
                    gridMatrix={gridMatrix}
                    selectedColumns={selectedColumns}
                    onColumnClick={handleColumnClick}
                    onDeleteSelected={handleDeleteSelected}
                    onClearSelection={handleClearSelection}
                    onSelectAll={handleSelectAllColumns}
                    onRestoreAll={handleRestoreAllColumns}
                  />
                </div>
              )}
            </div>

            {/* ОКНО 3 В СТЕКЕ (РАЗРЕЗ) */}
            <div style={{ ...windowCardStyle, width: "100%" }}>
              <div style={windowHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span>🏗️</span>
                  <strong>Поперечный разрез здания</strong>
                  <div style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
                    {spans && spans.length > 0 &&
                      spans.map((sp, sIdx) => {
                        const isTruss = (sp.frameType || frameType || "beam") === "truss";
                        return (
                          <button
                            key={`stack-hdr-span-${sIdx}`}
                            type="button"
                            onClick={() => handleToggleSpanFrameType(sIdx)}
                            style={{
                              fontSize: "0.74em",
                              backgroundColor: isTruss ? "#eff6ff" : "#f0fdf4",
                              color: isTruss ? "#1d4ed8" : "#15803d",
                              border: `1px solid ${isTruss ? "#93c5fd" : "#86efac"}`,
                              padding: "2px 6px",
                              borderRadius: "5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                            title={`Нажмите для смены покрытия Пролёта ${sIdx + 1}`}
                          >
                            <span>{spans.length > 1 ? `Пр.${sIdx + 1}: ` : ""}</span>
                            <span>{isTruss ? "📐 Ферма" : "🏢 Балка"}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      padding: "1px 4px",
                      borderRadius: "4px",
                    }}
                  >
                    <button
                      onClick={() => changeSectionZoom(-15)}
                      style={{ ...headerBtnStyle, padding: "1px 5px" }}
                      title="Уменьшить масштаб"
                    >
                      🔍 -
                    </button>
                    <span
                      onClick={() => setSectionZoom(100)}
                      style={{ fontSize: "0.72em", fontWeight: "600", color: "#475569", cursor: "pointer", minWidth: "32px", textAlign: "center" }}
                    >
                      {sectionZoom}%
                    </span>
                    <button
                      onClick={() => changeSectionZoom(15)}
                      style={{ ...headerBtnStyle, padding: "1px 5px" }}
                      title="Увеличить масштаб"
                    >
                      🔍 +
                    </button>
                  </div>
                  <button onClick={() => toggleMaximize("section")} style={headerBtnStyle}>
                    ⛶
                  </button>
                  <button onClick={() => toggleCollapse("section")} style={headerBtnStyle}>
                    {collapsed.section ? "➕ Развернуть" : "▲ Свернуть"}
                  </button>
                </div>
              </div>
              {!collapsed.section && (
                <div style={{ padding: "12px", overflow: "auto" }}>
                  <BuildingSectionView
                    generalData={generalData}
                    spans={spans}
                    mezzanines={mezzanines}
                    craneDb={craneDb}
                    frameType={frameType}
                    zoom={sectionZoom}
                    onToggleFrameType={handleToggleGlobalFrameType}
                    onToggleSpanFrameType={handleToggleSpanFrameType}
                    onAddSpanLeft={handleAddSpanLeft}
                    onAddSpanRight={handleAddSpanRight}
                    onDeleteSpan={handleDeleteSpan}
                    styles={styles}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ВАРИАНТ Г: РАЗВЕРНУТЫЙ ПЛАН ИЛИ РАЗРЕЗ НА ВЕСЬ ЭКРАН */}
        {maximizedWindow === "plan" && (
          <div style={{ ...windowCardStyle, width: "100%" }}>
            <div style={windowHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📐</span>
                <strong style={{ fontSize: "1em" }}>План здания (Сетка колонн)</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "1px 4px",
                    borderRadius: "4px",
                  }}
                >
                  <button
                    onClick={() => changePlanZoom(-15)}
                    style={{ ...headerBtnStyle, padding: "1px 5px" }}
                    title="Уменьшить масштаб"
                  >
                    🔍 -
                  </button>
                  <span
                    onClick={() => setPlanZoom(100)}
                    style={{ fontSize: "0.72em", fontWeight: "600", color: "#475569", cursor: "pointer", minWidth: "32px", textAlign: "center" }}
                  >
                    {planZoom}%
                  </span>
                  <button
                    onClick={() => changePlanZoom(15)}
                    style={{ ...headerBtnStyle, padding: "1px 5px" }}
                    title="Увеличить масштаб"
                  >
                    🔍 +
                  </button>
                </div>
                <button
                  onClick={() => setMaximizedWindow(null)}
                  style={{ ...headerBtnStyle, backgroundColor: "#0284c7", color: "#fff" }}
                >
                  🗗 Восстановить размер
                </button>
              </div>
            </div>
            <div style={{ padding: "16px", overflow: "auto" }}>
              <BuildingPlanView
                generalData={generalData}
                spans={spans}
                columnLayout={derivedColumnLayout}
                mezzanines={mezzanines}
                zoom={planZoom}
                styles={styles}
                editMode={editMode}
                gridMatrix={gridMatrix}
                selectedColumns={selectedColumns}
                onColumnClick={handleColumnClick}
                onDeleteSelected={handleDeleteSelected}
                onClearSelection={handleClearSelection}
                onSelectAll={handleSelectAllColumns}
                onRestoreAll={handleRestoreAllColumns}
              />
            </div>
          </div>
        )}

        {maximizedWindow === "section" && (
          <div style={{ ...windowCardStyle, width: "100%" }}>
            <div style={windowHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span>🏗️</span>
                <strong style={{ fontSize: "1em" }}>Поперечный разрез здания</strong>
                <div style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
                  {spans && spans.length > 0 &&
                    spans.map((sp, sIdx) => {
                      const isTruss = (sp.frameType || frameType || "beam") === "truss";
                      return (
                        <button
                          key={`max-hdr-span-${sIdx}`}
                          type="button"
                          onClick={() => handleToggleSpanFrameType(sIdx)}
                          style={{
                            fontSize: "0.76em",
                            backgroundColor: isTruss ? "#eff6ff" : "#f0fdf4",
                            color: isTruss ? "#1d4ed8" : "#15803d",
                            border: `1px solid ${isTruss ? "#93c5fd" : "#86efac"}`,
                            padding: "2px 7px",
                            borderRadius: "5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                          title={`Нажмите для смены покрытия Пролёта ${sIdx + 1}`}
                        >
                          <span>{spans.length > 1 ? `Пр.${sIdx + 1}: ` : ""}</span>
                          <span>{isTruss ? "📐 Ферма" : "🏢 Балка"}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "1px 4px",
                    borderRadius: "4px",
                  }}
                >
                  <button
                    onClick={() => changeSectionZoom(-15)}
                    style={{ ...headerBtnStyle, padding: "1px 5px" }}
                    title="Уменьшить масштаб"
                  >
                    🔍 -
                  </button>
                  <span
                    onClick={() => setSectionZoom(100)}
                    style={{ fontSize: "0.72em", fontWeight: "600", color: "#475569", cursor: "pointer", minWidth: "32px", textAlign: "center" }}
                  >
                    {sectionZoom}%
                  </span>
                  <button
                    onClick={() => changeSectionZoom(15)}
                    style={{ ...headerBtnStyle, padding: "1px 5px" }}
                    title="Увеличить масштаб"
                  >
                    🔍 +
                  </button>
                </div>
                <button
                  onClick={() => setMaximizedWindow(null)}
                  style={{ ...headerBtnStyle, backgroundColor: "#0284c7", color: "#fff" }}
                >
                  🗗 Восстановить размер
                </button>
              </div>
            </div>
            <div style={{ padding: "16px", overflow: "auto" }}>
              <BuildingSectionView
                generalData={generalData}
                spans={spans}
                mezzanines={mezzanines}
                craneDb={craneDb}
                frameType={frameType}
                zoom={sectionZoom}
                onToggleFrameType={handleToggleGlobalFrameType}
                onToggleSpanFrameType={handleToggleSpanFrameType}
                onAddSpanLeft={handleAddSpanLeft}
                onAddSpanRight={handleAddSpanRight}
                onDeleteSpan={handleDeleteSpan}
                styles={styles}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
