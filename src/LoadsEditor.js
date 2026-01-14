import React, { useState, useEffect } from "react";

const styles = {
  container: {
    maxWidth: "800px",
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
  section: {
    marginBottom: "25px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
    border: "1px solid #eee",
  },
  h3: { marginTop: 0, color: "#333" },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "15px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "0.9em",
  },
  input: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  select: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  disabledInput: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    border: "1px solid #eee",
    borderRadius: "4px",
    backgroundColor: "#eee",
    color: "#999",
  },
  buttonPrimary: {
    padding: "12px 24px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "1.1em",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonBack: {
    padding: "10px 15px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  hint: { fontSize: "0.8em", color: "#666", marginTop: "4px" },
};

// Опции материалов
const MATERIALS = [
  { id: "sandwich", name: "Сэндвич-панель (PIR/Минвата)" },
  { id: "sheet", name: "Профилированный лист (Профлист)" },
  { id: "custom", name: "Свой материал / Другое" },
  { id: "none", name: "Не обшивается (Открыто)" },
];

export default function LoadsEditor({
  blockName,
  initialLoads,
  onBack,
  onNext,
}) {
  // Инициализация состояния с безопасными дефолтами
  const [loads, setLoads] = useState({
    // СТЕНЫ
    wallType: initialLoads?.wallType || "sandwich",
    wallThickness: initialLoads?.wallThickness || 100,
    wallModularWidth: initialLoads?.wallModularWidth || 1000,
    wallLoad: initialLoads?.wallLoad || 25,

    // КРОВЛЯ
    roofType: initialLoads?.roofType || "sandwich",
    roofThickness: initialLoads?.roofThickness || 120,
    roofModularWidth: initialLoads?.roofModularWidth || 1000,
    roofLoad: initialLoads?.roofLoad || 30,

    // ТЕХНОЛОГИЯ
    techLoad: initialLoads?.techLoad || 20,
  });

  // Универсальный обработчик изменений
  const handleChange = (field, value) => {
    setLoads((prev) => ({ ...prev, [field]: value }));
  };

  // Логика изменения ТИПА материала (сброс толщины и авто-подсчет веса)
  const handleTypeChange = (structure, type) => {
    let defaultThickness = 0;
    let estimatedLoad = 0;

    if (type === "sandwich") {
      defaultThickness = structure === "wall" ? 100 : 120;
      estimatedLoad = structure === "wall" ? 25 : 30;
    } else if (type === "sheet") {
      defaultThickness = 0.7;
      estimatedLoad = 7;
    } else if (type === "none") {
      defaultThickness = 0;
      estimatedLoad = 0;
    } else {
      // Custom
      defaultThickness = 0;
      estimatedLoad = 0;
    }

    setLoads((prev) => ({
      ...prev,
      [`${structure}Type`]: type,
      [`${structure}Thickness`]: defaultThickness,
      [`${structure}Load`]: estimatedLoad,
    }));
  };

  // Логика изменения ТОЛЩИНЫ (авто-подсчет веса)
  const handleThicknessChange = (structure, val) => {
    const thickness = parseFloat(val) || 0;
    const type = loads[`${structure}Type`];
    let newLoad = loads[`${structure}Load`];

    // Простая формула авто-подсчета (можно отключить, если пользователь ввел вручную)
    if (type === "sandwich") {
      // Примерно: вес панелей ~ толщина * плотность + обшивка
      // Упрощенно: 100мм -> 25кг, 150мм -> 35кг (0.2 * t + 5)
      newLoad = thickness * 0.2 + 5;
    } else if (type === "sheet") {
      // Профлист: грубо 10 * t
      newLoad = thickness * 10;
    }

    setLoads((prev) => ({
      ...prev,
      [`${structure}Thickness`]: thickness,
      [`${structure}Load`]: Math.round(newLoad * 10) / 10, // Округление
    }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Шаг 2: Обшивка и Нагрузки ({blockName})</h2>
          <small style={{ color: "#666" }}>
            Задайте материалы ограждающих конструкций
          </small>
        </div>
        {/* Передаем текущее состояние loads обратно */}
        <button style={styles.buttonBack} onClick={() => onBack(loads)}>
          &larr; Назад к Геометрии
        </button>
      </div>

      {/* --- 1. СТЕНЫ --- */}
      <div style={styles.section}>
        <h3 style={styles.h3}>1. Стеновое ограждение</h3>
        <div style={styles.row}>
          <div>
            <label style={styles.label}>Тип материала:</label>
            <select
              style={styles.select}
              value={loads.wallType}
              onChange={(e) => handleTypeChange("wall", e.target.value)}
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Толщина (мм):</label>
            <input
              type="number"
              style={
                loads.wallType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.wallThickness}
              disabled={loads.wallType === "none"}
              onChange={(e) => handleThicknessChange("wall", e.target.value)}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div>
            <label style={styles.label}>Модульная ширина панели (мм):</label>
            <input
              type="number"
              style={
                loads.wallType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.wallModularWidth}
              disabled={loads.wallType === "none"}
              onChange={(e) =>
                handleChange("wallModularWidth", parseFloat(e.target.value))
              }
              placeholder="Например: 1000 или 1190"
            />
          </div>
          <div>
            <label style={styles.label}>Вес конструкции (кг/м²):</label>
            <input
              type="number"
              style={
                loads.wallType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.wallLoad}
              disabled={loads.wallType === "none"}
              onChange={(e) =>
                handleChange("wallLoad", parseFloat(e.target.value))
              }
            />
            {loads.wallType !== "none" && (
              <div style={styles.hint}>*Включая фасонные элементы и крепеж</div>
            )}
          </div>
        </div>
      </div>

      {/* --- 2. КРОВЛЯ --- */}
      <div style={styles.section}>
        <h3 style={styles.h3}>2. Кровельное покрытие</h3>
        <div style={styles.row}>
          <div>
            <label style={styles.label}>Тип материала:</label>
            <select
              style={styles.select}
              value={loads.roofType}
              onChange={(e) => handleTypeChange("roof", e.target.value)}
            >
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Толщина (мм):</label>
            <input
              type="number"
              style={
                loads.roofType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.roofThickness}
              disabled={loads.roofType === "none"}
              onChange={(e) => handleThicknessChange("roof", e.target.value)}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div>
            <label style={styles.label}>Модульная ширина панели (мм):</label>
            <input
              type="number"
              style={
                loads.roofType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.roofModularWidth}
              disabled={loads.roofType === "none"}
              onChange={(e) =>
                handleChange("roofModularWidth", parseFloat(e.target.value))
              }
              placeholder="Например: 1000"
            />
          </div>
          <div>
            <label style={styles.label}>Вес пирога (кг/м²):</label>
            <input
              type="number"
              style={
                loads.roofType === "none" ? styles.disabledInput : styles.input
              }
              value={loads.roofLoad}
              disabled={loads.roofType === "none"}
              onChange={(e) =>
                handleChange("roofLoad", parseFloat(e.target.value))
              }
            />
            {loads.roofType !== "none" && (
              <div style={styles.hint}>*Панели + прогоны + крепеж</div>
            )}
          </div>
        </div>
      </div>

      {/* --- 3. ТЕХНОЛОГИЯ --- */}
      <div style={styles.section}>
        <h3 style={styles.h3}>3. Дополнительные нагрузки</h3>
        <div style={styles.row}>
          <div>
            <label style={styles.label}>
              Технологическая нагрузка на фермы (кг/м²):
            </label>
            <input
              style={styles.input}
              type="number"
              value={loads.techLoad}
              onChange={(e) =>
                handleChange("techLoad", parseFloat(e.target.value))
              }
              placeholder="Освещение, вентиляция, спринклеры..."
            />
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ fontSize: "0.9em", color: "#666", fontStyle: "italic" }}
            >
              Эта нагрузка будет приложена равномерно ко всей площади покрытия
              (нижний пояс ферм).
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button style={styles.buttonPrimary} onClick={() => onNext(loads)}>
          Далее: Конструктив торцов &rarr;
        </button>
      </div>
    </div>
  );
}
