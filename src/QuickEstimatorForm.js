import React from "react";

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
  gatesArea,
  setGatesArea,
  windowsArea,
  setWindowsArea,
}) {
  const H = Number(height) || 0;
  const showHeightWarning = H > 20;

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
            <div style={styles.field}>
              <label style={styles.label}>Площадь ворот (м²)</label>
              <input
                style={styles.input}
                type="number"
                step="0.1"
                value={gatesArea}
                onChange={(e) => setGatesArea(e.target.value)}
                placeholder="0"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Площадь окон (м²)</label>
              <input
                style={styles.input}
                type="number"
                step="0.1"
                value={windowsArea}
                onChange={(e) => setWindowsArea(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
