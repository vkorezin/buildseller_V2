import React from "react";
import { getValidFloorElevations } from "./floorStructureConstants";

const styles = {
  sectionTitle: {
    marginTop: "20px",
    marginBottom: "10px",
    fontSize: "1.1em",
    fontWeight: "bold",
    color: "#555",
    borderBottom: "1px solid #eee",
    paddingBottom: "5px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "0.85em",
    color: "#666",
  },
  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1em",
  },
  select: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1em",
    backgroundColor: "#fff",
  },
  craneBlock: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #dee2e6",
    fontSize: "0.9em",
  },
  warning: {
    gridColumn: "1 / -1",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffc107",
    padding: "10px 15px",
    borderRadius: "6px",
    color: "#856404",
    fontSize: "0.9em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
};

const AXIS_LABELS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "И", "К", "Л"];

export default function QuickEstimatorForm({
  spanWidth,
  setSpanWidth,
  length,
  setLength,
  height,
  setHeight,
  spansCount,
  setSpansCount,
  snowLoad,
  setSnowLoad,
  windLoad,
  setWindLoad,
  stories,
  setStories,
  roofShape,
  setRoofShape,
  slope,
  setSlope,
  frameType,
  setFrameType,
  cranes,
  updateCrane,
  currentDiscount,
  spanOrientations = [],
  updateSpanOrientation,
  setAllSpanOrientations,
  floorStructure = null,
  onOpenFloorModal = null,
  onUpdateFloorElevations = null,
}) {
  const H = Number(height) || 0;
  const showHeightWarning = H > 20;
  const numSpans = Math.max(1, Number(spansCount) || 1);
  const currentElevations = getValidFloorElevations(stories, height, floorStructure?.storyElevations);

  return (
    <>
      <div style={styles.sectionTitle}>1. Геометрия и нагрузки</div>
      <div style={styles.grid}>
        {showHeightWarning && (
          <div style={styles.warning}>
            <span style={{ fontSize: "1.5em" }}>⚠️</span>
            <span>
              <strong>Внимание!</strong> Высота {H.toFixed(1)}м превышает
              типовые значения (обычно до 20м). Рекомендуем проверить расчёт.
            </span>
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Пролёт 1 шт (м)</label>
          <input
            style={styles.input}
            type="number"
            value={spanWidth}
            onChange={(e) => setSpanWidth(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Длина (м)</label>
          <input
            style={styles.input}
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Высота (м)</label>
          <input
            style={styles.input}
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div
          style={{
            ...styles.field,
            backgroundColor: frameType === "truss" ? "#e8f5e9" : "#fff",
            padding: "5px",
            borderRadius: "4px",
          }}
        >
          <label style={styles.label}>Тип рамы</label>
          <select
            style={styles.select}
            value={frameType}
            onChange={(e) => setFrameType(e.target.value)}
          >
            <option value="beam">Балка</option>
            <option value="truss">Ферма</option>
          </select>
          {frameType === "truss" && (
            <div
              style={{ fontSize: "0.8em", color: "#28a745", marginTop: "3px" }}
            >
              Экономия: -{currentDiscount}%
            </div>
          )}
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Кол-во пролётов</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            max="10"
            value={spansCount}
            onChange={(e) => setSpansCount(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Снег (кг/м²)</label>
          <input
            style={styles.input}
            type="number"
            value={snowLoad}
            onChange={(e) => setSnowLoad(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Ветер (кг/м²)</label>
          <input
            style={styles.input}
            type="number"
            value={windLoad}
            onChange={(e) => setWindLoad(e.target.value)}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Этажей</label>
          <input
            style={styles.input}
            type="number"
            min="1"
            max="5"
            value={stories}
            onChange={(e) => setStories(Number(e.target.value))}
          />
          {onOpenFloorModal && (
            stories > 1 ? (
              <>
                <button
                  type="button"
                  onClick={onOpenFloorModal}
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    color: "#1d4ed8",
                    fontSize: "0.76em",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    textAlign: "center",
                  }}
                  title="Настроить конструкцию перекрытия, отметки этажей, полезную нагрузку"
                >
                  <span>⚙️</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {floorStructure?.shortName || "Ж/б по профлисту Н75"}{floorStructure?.thickness ? ` ${floorStructure.thickness}мм` : ""} ({floorStructure?.liveLoad || 400} кг/м²)
                  </span>
                </button>

                {/* Быстрый выбор отметок пола каждого этажа */}
                <div style={{ marginTop: "6px" }}>
                  <div
                    style={{
                      fontSize: "0.7em",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "3px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Отметки пола:</span>
                    <span style={{ color: "#059669" }}>низ балок: +{Number(height).toFixed(1)}м</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {currentElevations.map((elev, idx) => {
                      const floorNum = idx + 2;
                      const prevH = idx === 0 ? 0 : currentElevations[idx - 1];
                      const nextH =
                        idx === currentElevations.length - 1
                          ? Number(height)
                          : currentElevations[idx + 1];
                      const minAllowed = Math.round((prevH + 0.2) * 100) / 100;
                      const maxAllowed = Math.round(nextH * 100) / 100;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            backgroundColor: "#ffffff",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.72em",
                          }}
                          title={`Отметка пола ${floorNum} этажа (от +${minAllowed}м до +${maxAllowed}м)`}
                        >
                          <span style={{ color: "#1d4ed8", fontWeight: 700 }}>
                            {floorNum} эт: +
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            min={minAllowed}
                            max={maxAllowed}
                            value={elev}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && onUpdateFloorElevations) {
                                const updated = [...currentElevations];
                                const clamped = Math.max(
                                  minAllowed,
                                  Math.min(maxAllowed, Math.round(val * 100) / 100)
                                );
                                updated[idx] = clamped;
                                onUpdateFloorElevations(updated);
                              }
                            }}
                            style={{
                              width: "46px",
                              padding: "2px 2px",
                              borderRadius: "3px",
                              border: "1px solid #93c5fd",
                              fontSize: "0.9em",
                              fontWeight: 700,
                              textAlign: "center",
                              color: "#0f172a",
                            }}
                          />
                          <span style={{ color: "#64748b" }}>м</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenFloorModal}
                style={{
                  marginTop: "6px",
                  width: "100%",
                  padding: "5px 6px",
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "6px",
                  color: "#64748b",
                  fontSize: "0.72em",
                  cursor: "pointer",
                  textAlign: "center",
                }}
                title="Настроить конструкцию межэтажного перекрытия и нагрузки"
              >
                ⚙️ Состав перекрытия
              </button>
            )
          )}
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          {cranes.map((c, i) => (
            <div key={c.id} style={styles.craneBlock}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#007bff",
                }}
              >
                Пролёт {i + 1}
              </div>
              <select
                style={{
                  ...styles.select,
                  padding: "4px",
                  marginBottom: "5px",
                }}
                value={c.cap}
                onChange={(e) => updateCrane(i, "cap", e.target.value)}
              >
                <option value="0">Нет крана</option>
                <option value="5">ГП 5т</option>
                <option value="10">ГП 10т</option>
                <option value="20">ГП 20т</option>
              </select>
              {c.cap !== "0" && (
                <select
                  style={{ ...styles.select, padding: "4px" }}
                  value={c.type}
                  onChange={(e) => updateCrane(i, "type", e.target.value)}
                  disabled={c.cap === "10" || c.cap === "20"}
                >
                  <option value="support">Опорный</option>
                  {c.cap === "5" && (
                    <option value="suspension">Подвесной</option>
                  )}
                </select>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: "10px",
            borderTop: "1px solid #eee",
            paddingTop: "10px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
            }}
          >
            <div style={styles.field}>
              <label style={styles.label}>Форма крыши</label>
              <select
                style={styles.select}
                value={roofShape}
                onChange={(e) => setRoofShape(e.target.value)}
              >
                <option value="gable">Двускатная</option>
                <option value="single">Односкатная</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Уклон (%)</label>
              <input
                style={styles.input}
                type="number"
                value={slope}
                onChange={(e) => setSlope(e.target.value)}
              />
            </div>
          </div>

          {roofShape === "single" && (
            <div
              style={{
                marginTop: "15px",
                backgroundColor: "#f0f7ff",
                padding: "12px 15px",
                borderRadius: "8px",
                border: "1px solid #cce5ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#0056b3",
                    fontSize: "0.95em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📐 Ориентация уклона по пролётам:</span>
                </div>
                {numSpans > 1 && setAllSpanOrientations && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setAllSpanOrientations(Array(numSpans).fill("right"))}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.78em",
                        borderRadius: "4px",
                        border: "1px solid #b8daff",
                        backgroundColor: "#fff",
                        color: "#0056b3",
                        cursor: "pointer",
                      }}
                      title="Все пролеты с подъемом вправо"
                    >
                      ↗ ↗ Ступенька вправо
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllSpanOrientations(Array(numSpans).fill("left"))}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.78em",
                        borderRadius: "4px",
                        border: "1px solid #b8daff",
                        backgroundColor: "#fff",
                        color: "#0056b3",
                        cursor: "pointer",
                      }}
                      title="Все пролеты с подъемом влево"
                    >
                      ↖ ↖ Ступенька влево
                    </button>
                    {numSpans >= 2 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const arr = Array(numSpans).fill("right");
                            for (let idx = Math.floor(numSpans / 2); idx < numSpans; idx++) {
                              arr[idx] = "left";
                            }
                            setAllSpanOrientations(arr);
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.78em",
                            borderRadius: "4px",
                            border: "1px solid #b8daff",
                            backgroundColor: "#fff",
                            color: "#0056b3",
                            cursor: "pointer",
                          }}
                          title="Конёк по центру (горка вверх)"
                        >
                          /\ Горка вверх (↗ ↖)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const arr = Array(numSpans).fill("left");
                            for (let idx = Math.floor(numSpans / 2); idx < numSpans; idx++) {
                              arr[idx] = "right";
                            }
                            setAllSpanOrientations(arr);
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.78em",
                            borderRadius: "4px",
                            border: "1px solid #b8daff",
                            backgroundColor: "#fff",
                            color: "#0056b3",
                            cursor: "pointer",
                          }}
                          title="Ендова по центру (впадина вниз)"
                        >
                          \/ Впадина (↖ ↗)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                {Array.from({ length: numSpans }).map((_, i) => {
                  const ori = (spanOrientations && spanOrientations[i]) || "right";
                  return (
                    <div
                      key={`span-ori-${i}`}
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #d0e2ff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.83em",
                          fontWeight: "bold",
                          color: "#333",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Пролёт {i + 1}</span>
                        <span style={{ color: "#666", fontWeight: "normal" }}>
                          (оси {AXIS_LABELS[i] || i + 1}–{AXIS_LABELS[i + 1] || i + 2})
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => updateSpanOrientation && updateSpanOrientation(i, "right")}
                          style={{
                            flex: 1,
                            padding: "6px 2px",
                            fontSize: "0.82em",
                            borderRadius: "4px",
                            border: ori === "right" ? "2px solid #007bff" : "1px solid #ced4da",
                            backgroundColor: ori === "right" ? "#e7f1ff" : "#f8f9fa",
                            color: ori === "right" ? "#0056b3" : "#495057",
                            fontWeight: ori === "right" ? "bold" : "normal",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title="Низ слева, подъем вправо ↗"
                        >
                          ↗ Вправо
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSpanOrientation && updateSpanOrientation(i, "left")}
                          style={{
                            flex: 1,
                            padding: "6px 2px",
                            fontSize: "0.82em",
                            borderRadius: "4px",
                            border: ori === "left" ? "2px solid #007bff" : "1px solid #ced4da",
                            backgroundColor: ori === "left" ? "#e7f1ff" : "#f8f9fa",
                            color: ori === "left" ? "#0056b3" : "#495057",
                            fontWeight: ori === "left" ? "bold" : "normal",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title="Верх слева, спад вправо ↖"
                        >
                          ↖ Влево
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
