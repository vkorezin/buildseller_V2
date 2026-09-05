import React, { useState, useEffect, useRef } from "react";
import {
  getValidFloorElevations,
  getEffectiveMezzanineDimensions,
} from "./floorStructureConstants";

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
  length = 36,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const isPointerDownRef = useRef(false);

  // Обработка клавиши Escape и стрелок для сдвига в полноэкранном режиме
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      } else if (isFullscreen && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        if (containerRef.current) {
          e.preventDefault();
          const step = e.key === "ArrowRight" ? 200 : -200;
          containerRef.current.scrollBy({ left: step, behavior: "smooth" });
        }
      }
    };
    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      setZoom(1);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Глобальное отслеживание перетаскивания (drag-to-pan) мышью
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isPointerDownRef.current = false;
      setIsDragging(false);
    };
    const handleGlobalMouseMove = (e) => {
      if (!isFullscreen || !isPointerDownRef.current || !containerRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (!isDragging && Math.hypot(dx, dy) > 3) {
        setIsDragging(true);
      }
      if (isDragging || Math.hypot(dx, dy) > 3) {
        e.preventDefault();
        containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
        containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
      }
    };
    if (isFullscreen) {
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("mousemove", handleGlobalMouseMove);
    }
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [isFullscreen, isDragging]);

  const handleMouseDown = (e) => {
    if (!isFullscreen) return;
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

  const bL = Number(length) || 36;
  const mezzDims = getEffectiveMezzanineDimensions(
    floorStructure,
    totalBuildingWidth,
    bL
  );
  const effectiveMezzWidth = mezzDims.width;
  const isPartialWidth = mezzDims.isCustomWidth;
  const mezzStartX = colXList[0];
  const mezzEndX = mezzStartX + effectiveMezzWidth * scale;
  const hitsMainCol = colXList.some((cx) => Math.abs(cx - mezzEndX) < 3);

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
    <>
      {isFullscreen && (
        <div
          style={{
            height: "320px",
            marginBottom: "20px",
            backgroundColor: "#f6f8fa",
            borderRadius: "8px",
            border: "1px dashed #d0d7de",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#57606a",
            fontSize: "0.9em",
            userSelect: "none",
          }}
        >
          📐 Разрез развернут на весь экран
        </div>
      )}

      <div
        style={
          isFullscreen
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(15, 23, 42, 0.88)",
                backdropFilter: "blur(6px)",
                zIndex: 999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                boxSizing: "border-box",
              }
            : {
                backgroundColor: "#ffffff",
                border: "1px solid #d0d7de",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }
        }
        onClick={(e) => {
          if (isFullscreen && e.target === e.currentTarget) {
            setIsFullscreen(false);
          }
        }}
      >
        <div
          style={
            isFullscreen
              ? {
                  backgroundColor: "#ffffff",
                  width: "98vw",
                  height: "94vh",
                  maxWidth: "1800px",
                  borderRadius: "12px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                }
              : { width: "100%" }
          }
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: isFullscreen ? 0 : "10px",
              padding: isFullscreen ? "12px 18px" : "0 0 8px 0",
              backgroundColor: isFullscreen ? "#f8fafc" : "transparent",
              borderBottom: "1px solid #e1e4e8",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: isFullscreen ? "1.15em" : "1.1em", fontWeight: "bold", color: "#24292f" }}>
                📐 {isFullscreen ? "Поперечный разрез здания" : "Эскиз поперечного разреза здания"}
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
              {isFullscreen && (
                <>
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      fontSize: "0.8em",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    Низ несущих: <strong>+{H_clear} м</strong>
                  </span>
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      fontSize: "0.8em",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    Этажей: <strong>{numStories}</strong>
                  </span>
                  <span
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      fontSize: "0.8em",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {isGable ? "Двускатная" : "Односкатная"} ({S}%)
                  </span>
                </>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {!isFullscreen && (
                <div style={{ fontSize: "0.82em", color: "#57606a" }}>
                  Конструкция: <b>{isTruss ? "Ферма" : "Балка переменного сечения"}</b> | Кровля:{" "}
                  <b>{isGable ? "Двускатная" : "Односкатная"} ({S}%)</b>
                </div>
              )}
              {setFrameType && (
                <button
                  type="button"
                  onClick={() => setFrameType(isTruss ? "beam" : "truss")}
                  style={{
                    fontSize: "0.78em",
                    padding: isFullscreen ? "4px 10px" : "2px 8px",
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

              {/* Fullscreen controls or open button */}
              {isFullscreen ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
                      disabled={zoom <= 0.6}
                      style={{
                        padding: "3px 9px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: zoom <= 0.6 ? "not-allowed" : "pointer",
                        fontSize: "0.88em",
                        fontWeight: "bold",
                        color: "#475569",
                      }}
                      title="Уменьшить масштаб"
                    >
                      −
                    </button>
                    <span
                      style={{
                        padding: "3px 7px",
                        fontSize: "0.78em",
                        fontWeight: 600,
                        color: "#1e293b",
                        minWidth: "42px",
                        textAlign: "center",
                        borderLeft: "1px solid #e2e8f0",
                        borderRight: "1px solid #e2e8f0",
                      }}
                    >
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.2) * 10) / 10))}
                      disabled={zoom >= 3}
                      style={{
                        padding: "3px 9px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: zoom >= 3 ? "not-allowed" : "pointer",
                        fontSize: "0.88em",
                        fontWeight: "bold",
                        color: "#475569",
                      }}
                      title="Увеличить масштаб"
                    >
                      +
                    </button>
                    {zoom !== 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          if (containerRef.current) {
                            containerRef.current.scrollLeft = 0;
                            containerRef.current.scrollTop = 0;
                          }
                        }}
                        style={{
                          padding: "3px 7px",
                          border: "none",
                          borderLeft: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          cursor: "pointer",
                          fontSize: "0.72em",
                          color: "#0284c7",
                          fontWeight: 600,
                        }}
                        title="Сбросить масштаб к 100%"
                      >
                        100%
                      </button>
                    )}
                  </div>

                  {/* Кнопки сдвига влево / вправо при увеличении или в полноэкранном режиме */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (containerRef.current) {
                          containerRef.current.scrollBy({ left: -220, behavior: "smooth" });
                        }
                      }}
                      style={{
                        padding: "3px 8px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        fontSize: "0.8em",
                        fontWeight: 600,
                        color: "#334155",
                        borderRight: "1px solid #e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                      title="Сдвинуть чертеж влево (или перетаскивайте мышью)"
                    >
                      ◀ Влево
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (containerRef.current) {
                          containerRef.current.scrollBy({ left: 220, behavior: "smooth" });
                        }
                      }}
                      style={{
                        padding: "3px 8px",
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        fontSize: "0.8em",
                        fontWeight: 600,
                        color: "#334155",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                      title="Сдвинуть чертеж вправо (или перетаскивайте мышью)"
                    >
                      Вправо ▶
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "0.82em",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Свернуть разрез (Esc)"
                  >
                    <span>✕</span>
                    <span>Свернуть (Esc)</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  style={{
                    fontSize: "0.78em",
                    padding: "3px 10px",
                    backgroundColor: "#0969da",
                    color: "#ffffff",
                    border: "1px solid #0969da",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "700",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}
                  title="Развернуть разрез на весь экран"
                >
                  <span>⛶</span>
                  <span>На весь экран</span>
                </button>
              )}
            </div>
          </div>

          {/* SVG Container: скроллируемый контейнер с поддержкой перетаскивания (pan/drag) */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onClick={!isFullscreen ? () => setIsFullscreen(true) : undefined}
            title={!isFullscreen ? "Нажмите на разрез, чтобы развернуть на весь экран" : undefined}
            style={
              isFullscreen
                ? {
                    flex: 1,
                    width: "100%",
                    overflow: "auto",
                    backgroundColor: "#f8fafc",
                    padding: "16px",
                    boxSizing: "border-box",
                    position: "relative",
                    cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
                    userSelect: isDragging ? "none" : "auto",
                  }
                : {
                    width: "100%",
                    overflowX: "auto",
                    display: "flex",
                    justifyContent: "center",
                    cursor: "zoom-in",
                    position: "relative",
                  }
            }
          >
            <div
              style={
                isFullscreen
                  ? {
                      minWidth: zoom <= 1 ? "100%" : `${Math.round(zoom * 100)}%`,
                      width: zoom <= 1 ? "100%" : `${Math.round(zoom * 100)}%`,
                      minHeight: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxSizing: "border-box",
                    }
                  : {
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }
              }
            >
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{
                  width: "100%",
                  maxWidth: isFullscreen ? (zoom <= 1 ? "100%" : "none") : "800px",
                  height: "auto",
                  maxHeight: isFullscreen ? (zoom <= 1.05 ? "calc(92vh - 160px)" : "none") : "none",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #eaeef2",
                  display: "block",
                  boxShadow: isFullscreen ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
                  pointerEvents: isDragging ? "none" : "auto",
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
                    {/* Плита перекрытия (с учетом фактической ширины антресоли) */}
                    <rect
                      x={mezzStartX}
                      y={fl.yLevel - 4}
                      width={mezzEndX - mezzStartX}
                      height={4}
                      fill={slabFill}
                      stroke={slabStroke}
                      strokeWidth={0.8}
                    />
                    {/* Несущая балка перекрытия */}
                    <line
                      x1={mezzStartX}
                      y1={fl.yLevel}
                      x2={mezzEndX}
                      y2={fl.yLevel}
                      stroke="#0056b3"
                      strokeWidth={2.8}
                    />
                  </g>
                );
              })}

              {/* Опорная стойка края антресоли (если перекрытие не доходит до основной колонны) */}
              {isPartialWidth && !hitsMainCol && (
                <g key="mezzanine-edge-column">
                  {/* Осевая штрихпунктирная линия */}
                  <line
                    x1={mezzEndX}
                    y1={baseGroundY + 6}
                    x2={mezzEndX}
                    y2={topMezzanineY - 4}
                    stroke="#d97706"
                    strokeWidth={0.8}
                    strokeDasharray="4 2"
                  />
                  {/* Ствол крайней опорной стойки */}
                  <rect
                    x={mezzEndX - 2.5}
                    y={topMezzanineY}
                    width={5}
                    height={baseGroundY - topMezzanineY}
                    fill="#f59e0b"
                    stroke="#b45309"
                    strokeWidth={0.8}
                    rx={0.5}
                  />
                  {/* Опорная база стойки */}
                  <rect
                    x={mezzEndX - 6}
                    y={baseGroundY - 3}
                    width={12}
                    height={3}
                    fill="#1e293b"
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    rx={0.5}
                  />
                  <rect
                    x={mezzEndX - 8}
                    y={baseGroundY}
                    width={16}
                    height={4}
                    fill="#cbd5e1"
                    stroke="#94a3b8"
                    strokeWidth={0.5}
                  />
                  {/* Оголовки стойки на уровнях этажей */}
                  {floorLevels.map((fl) => (
                    <rect
                      key={`edge-cap-${fl.index}`}
                      x={mezzEndX - 5}
                      y={fl.yLevel - 1.5}
                      width={10}
                      height={3}
                      fill="#b45309"
                      stroke="#78350f"
                      strokeWidth={0.5}
                      rx={0.5}
                    />
                  ))}
                  {/* Подпись стойки */}
                  <text
                    x={mezzEndX}
                    y={baseGroundY - 6}
                    fontSize={6.5}
                    fontFamily="Roboto, sans-serif"
                    fill="#b45309"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    стойка края
                  </text>
                </g>
              )}

              {/* Защитное ограждение на открытом краю антресоли */}
              {isPartialWidth && (
                <g key="mezzanine-safety-railing">
                  {floorLevels.map((fl) => (
                    <g key={`railing-${fl.index}`}>
                      {/* Стойка ограждения h=1.0м */}
                      <line
                        x1={mezzEndX}
                        y1={fl.yLevel - 4}
                        x2={mezzEndX}
                        y2={fl.yLevel - 14}
                        stroke="#d97706"
                        strokeWidth={1.6}
                      />
                      {/* Поручень ограждения */}
                      <line
                        x1={mezzEndX - 8}
                        y1={fl.yLevel - 14}
                        x2={mezzEndX}
                        y2={fl.yLevel - 14}
                        stroke="#d97706"
                        strokeWidth={2}
                      />
                      {/* Средний леер */}
                      <line
                        x1={mezzEndX - 8}
                        y1={fl.yLevel - 9}
                        x2={mezzEndX}
                        y2={fl.yLevel - 9}
                        stroke="#f59e0b"
                        strokeWidth={1}
                      />
                      {/* Бортик (toe board) */}
                      <rect
                        x={mezzEndX - 8}
                        y={fl.yLevel - 6}
                        width={8}
                        height={2}
                        fill="#fde68a"
                        stroke="#d97706"
                        strokeWidth={0.5}
                      />
                      <text
                        x={mezzEndX + 3}
                        y={fl.yLevel - 10}
                        fontSize={6}
                        fontFamily="Roboto, sans-serif"
                        fill="#b45309"
                        fontWeight="bold"
                      >
                        ограждение
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Размерная цепочка ширины антресоли при неполном пролете */}
              {isPartialWidth && (
                <g key="mezzanine-width-dimension-chain">
                  {/* Размерная линия ширины антресоли */}
                  <line
                    x1={mezzStartX}
                    y1={topMezzanineY - 14}
                    x2={mezzEndX}
                    y2={topMezzanineY - 14}
                    stroke="#0284c7"
                    strokeWidth={1}
                  />
                  {/* Засечки */}
                  <line
                    x1={mezzStartX - 3}
                    y1={topMezzanineY - 11}
                    x2={mezzStartX + 3}
                    y2={topMezzanineY - 17}
                    stroke="#0284c7"
                    strokeWidth={1.2}
                  />
                  <line
                    x1={mezzEndX - 3}
                    y1={topMezzanineY - 11}
                    x2={mezzEndX + 3}
                    y2={topMezzanineY - 17}
                    stroke="#0284c7"
                    strokeWidth={1.2}
                  />
                  {/* Выносные линии */}
                  <line
                    x1={mezzStartX}
                    y1={topMezzanineY - 4}
                    x2={mezzStartX}
                    y2={topMezzanineY - 18}
                    stroke="#0284c7"
                    strokeWidth={0.6}
                    strokeDasharray="2 1"
                  />
                  <line
                    x1={mezzEndX}
                    y1={topMezzanineY - 4}
                    x2={mezzEndX}
                    y2={topMezzanineY - 18}
                    stroke="#0284c7"
                    strokeWidth={0.6}
                    strokeDasharray="2 1"
                  />
                  <text
                    x={(mezzStartX + mezzEndX) / 2}
                    y={topMezzanineY - 16}
                    fontSize={7.5}
                    fontFamily="Roboto, sans-serif"
                    fill="#0284c7"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {`Антресоль B = ${effectiveMezzWidth.toFixed(1)} м`}
                  </text>

                  {/* Оставшийся свободный пролет здания */}
                  {colXList[N_spans] - mezzEndX > 15 && (
                    <g key="mezzanine-remaining-free-span">
                      <line
                        x1={mezzEndX}
                        y1={topMezzanineY - 14}
                        x2={colXList[N_spans]}
                        y2={topMezzanineY - 14}
                        stroke="#94a3b8"
                        strokeWidth={0.8}
                      />
                      <line
                        x1={colXList[N_spans] - 3}
                        y1={topMezzanineY - 11}
                        x2={colXList[N_spans] + 3}
                        y2={topMezzanineY - 17}
                        stroke="#94a3b8"
                        strokeWidth={1.2}
                      />
                      <line
                        x1={colXList[N_spans]}
                        y1={topMezzanineY - 4}
                        x2={colXList[N_spans]}
                        y2={topMezzanineY - 18}
                        stroke="#94a3b8"
                        strokeWidth={0.6}
                        strokeDasharray="2 1"
                      />
                      <text
                        x={(mezzEndX + colXList[N_spans]) / 2}
                        y={topMezzanineY - 16}
                        fontSize={7}
                        fontFamily="Roboto, sans-serif"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {`Свободно ${(totalBuildingWidth - effectiveMezzWidth).toFixed(1)} м`}
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Промежуточные колонны 1-го этажа (только в зоне перекрытия антресоли) */}
              {intermediateColsData.length > 0 &&
                Array.from({ length: N_spans }).map((_, i) => {
                  const x1 = colXList[i];
                  const x2 = colXList[i + 1];

                  return (
                    <g key={`inter-cols-group-span-${i}`}>
                      {intermediateColsData.map((colItem, cIdx) => {
                        const cx = x1 + colItem.ratio * (x2 - x1);
                        if (cx > mezzEndX - 3) return null;
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
            x1={colXList[0] - 4}
            y1={baseGroundY}
            x2={colXList[0] - 24}
            y2={baseGroundY}
            stroke="#24292f"
            strokeWidth={0.8}
          />
          <polygon
            points={`${colXList[0] - 4},${baseGroundY} ${colXList[0] - 10},${baseGroundY - 3} ${colXList[0] - 10},${baseGroundY + 3}`}
            fill="#24292f"
          />
          <text
            x={colXList[0] - 26}
            y={baseGroundY + 3}
            fontSize={8.5}
            fontWeight="bold"
            fontFamily="Roboto, sans-serif"
            fill="#24292f"
            textAnchor="end"
          >
            0.000
          </text>

          {/* Отметки междуэтажных перекрытий */}
          {floorLevels.map((fl) => (
            <g key={`floor-level-mark-${fl.index}`}>
              <line
                x1={colXList[0] - 4}
                y1={fl.yLevel}
                x2={colXList[0] - 24}
                y2={fl.yLevel}
                stroke="#0056b3"
                strokeWidth={0.9}
              />
              <polygon
                points={`${colXList[0] - 4},${fl.yLevel} ${colXList[0] - 10},${fl.yLevel - 3} ${colXList[0] - 10},${fl.yLevel + 3}`}
                fill="#0056b3"
              />
              <text
                x={colXList[0] - 26}
                y={fl.yLevel + 3}
                fontSize={8.5}
                fontWeight="bold"
                fontFamily="Roboto, sans-serif"
                fill="#0056b3"
                textAnchor="end"
              >
                {`+${fl.hLevel.toFixed(2)}`}
              </text>
            </g>
          ))}

          {/* Отметка низа несущих конструкций */}
          <line
            x1={colXList[0] - 4}
            y1={yClear}
            x2={colXList[0] - 24}
            y2={yClear}
            stroke="#0969da"
            strokeWidth={0.8}
          />
          <polygon
            points={`${colXList[0] - 4},${yClear} ${colXList[0] - 10},${yClear - 3} ${colXList[0] - 10},${yClear + 3}`}
            fill="#0969da"
          />
          <text
            x={colXList[0] - 26}
            y={yClear + 3}
            fontSize={8.5}
            fontWeight="bold"
            fontFamily="Roboto, sans-serif"
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

        {/* Hover hint badge when inline */}
        {!isFullscreen && (
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              right: "12px",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              color: "#ffffff",
              fontSize: "0.74em",
              fontWeight: 600,
              padding: "4px 9px",
              borderRadius: "5px",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            }}
          >
            <span>🔍</span>
            <span>Нажмите для разворота на весь экран</span>
          </div>
        )}
      </div>

      {numStories > 1 && (
        <div
          style={{
            marginTop: isFullscreen ? 0 : "10px",
            padding: isFullscreen ? "10px 18px" : "8px 14px",
            backgroundColor: isFullscreen ? "#f8fafc" : "#f0f7ff",
            border: isFullscreen ? "none" : "1px solid #bfdbfe",
            borderTop: isFullscreen ? "1px solid #e2e8f0" : "none",
            borderRadius: isFullscreen ? 0 : "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "0.82em",
            color: isFullscreen ? "#334155" : "#1e3a8a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.1em" }}>🏢</span>
            <span>
              <strong>Межэтажное перекрытие:</strong> {floorStructure?.typeName || "Монолитный ж/б по несъемной опалубке из профлиста"} (t={floorStructure?.thickness || 120} мм)
            </span>
            <span
              style={{
                backgroundColor: isPartialWidth || mezzDims.isCustomLength ? "#fef3c7" : "#dbeafe",
                color: isPartialWidth || mezzDims.isCustomLength ? "#92400e" : "#1e40af",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
                fontSize: "0.92em",
              }}
            >
              Антресоль: {effectiveMezzWidth.toFixed(1)} м (ширина) × {mezzDims.length.toFixed(1)} м (длина) = {mezzDims.area} м²
              {isPartialWidth ? " [частичная ширина]" : ""}
              {mezzDims.isCustomLength ? " [часть длины]" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: isFullscreen ? "#475569" : "#1e40af" }}>
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
          {isFullscreen && (
            <div style={{ fontSize: "0.78em", color: "#64748b", display: "flex", gap: "12px", alignItems: "center" }}>
              <span>✋ Перетаскивайте чертеж зажатой мышью или клавишами ◀ ▶</span>
              <span>•</span>
              <span>💡 <strong>Esc</strong> для возврата</span>
            </div>
          )}
        </div>
      )}

      {isFullscreen && numStories === 1 && (
        <div
          style={{
            padding: "10px 18px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.78em",
            color: "#64748b",
          }}
        >
          <span>✋ Зажмите левую кнопку мыши и перетаскивайте разрез влево/вправо, либо используйте стрелки ◀ ▶ на клавиатуре</span>
          <span>💡 Клавиша <strong>Esc</strong> или клик вне окна для возврата</span>
        </div>
      )}
    </div>
  </div>
</>
);
}
