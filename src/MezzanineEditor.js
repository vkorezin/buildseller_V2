import React, { useState, useMemo, memo } from "react";

// --- СТИЛИ (Оптимизированы под full-width экраны ЕВРОАНГАР) ---
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    margin: "20px auto",
    width: "100%",
    maxWidth: "1600px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  header: {
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layout: { 
    display: "flex", 
    gap: "20px",
    alignItems: "flex-start" 
  },
  colList: {
    width: "250px",
    minWidth: "220px",
    borderRight: "1px solid #eee",
    paddingRight: "15px",
  },
  colForm: {
    flex: 1,
    maxWidth: "550px",
    maxHeight: "750px",
    overflowY: "auto",
    paddingRight: "10px",
  },
  colVisual: {
    flex: 1.5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  listItem: {
    padding: "10px",
    border: "1px solid #eee",
    borderRadius: "5px",
    marginBottom: "8px",
    cursor: "pointer",
    backgroundColor: "#f9f9f9",
  },
  listItemSelected: {
    padding: "10px",
    border: "2px solid #007bff",
    borderRadius: "5px",
    marginBottom: "8px",
    cursor: "pointer",
    backgroundColor: "#f0f7ff",
  },
  section: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #eee",
  },
  h3: {
    marginTop: 0,
    fontSize: "1.1em",
    color: "#333",
    borderBottom: "1px solid #ddd",
    paddingBottom: "5px",
    marginBottom: "10px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginBottom: "10px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    fontSize: "0.85em",
    marginBottom: "3px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  buttonAdd: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  buttonDelete: {
    float: "right",
    color: "red",
    cursor: "pointer",
    fontWeight: "bold",
    border: "none",
    background: "none",
  },
  buttonBack: {
    padding: "8px 15px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  svgContainer: {
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    padding: "15px",
    boxSizing: "border-box",
  },
};

// --- ВИЗУАЛИЗАТОР (Мемоизирован) ---
const MezzanineVisualizer = memo(({ buildingW, buildingL, mezzanine }) => {
  if (!mezzanine)
    return <div style={{ padding: 20, color: "#999" }}>Выберите антресоль</div>;

  const bW = parseFloat(buildingW) || 1;
  const bL = parseFloat(buildingL) || 1;
  const mW_raw = parseFloat(mezzanine.width) || 0;
  const mL_raw = parseFloat(mezzanine.length) || 0;
  const offX = parseFloat(mezzanine.offsetX) || 0;
  const offY = parseFloat(mezzanine.offsetY) || 0;

  const PADDING = 40;
  const W_PX = 400;
  const H_PX = 400;

  const scale = Math.min(
    (W_PX - PADDING * 2) / bW,
    (H_PX - PADDING * 2) / bL
  );

  const bDrawW = bW * scale;
  const bDrawL = bL * scale;
  const startX = (W_PX - bDrawW) / 2;
  const startY = (H_PX - bDrawL) / 2;

  const mX = startX + offX * scale;
  const mY = startY + offY * scale;
  const mW = mW_raw * scale;
  const mL = mL_raw * scale;

  // Жесткая защита: для чертежа шаг считается корректно, если рядов >= 2
  const nx = Math.max(2, parseInt(mezzanine.colsX, 10) || 2);
  const ny = Math.max(2, parseInt(mezzanine.colsY, 10) || 2);

  const stepX = mW_raw / (nx - 1);
  const stepY = mL_raw / (ny - 1);

  const cols = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const lx = i * stepX;
      const ly = j * stepY;

      cols.push(
        <circle
          key={`${i}-${j}`}
          cx={mX + lx * scale}
          cy={mY + ly * scale}
          r={3}
          fill="#d90000"
        />
      );
    }
  }

  return (
    <div style={styles.svgContainer}>
      <svg
        viewBox={`0 0 ${W_PX} ${H_PX}`}
        style={{ width: "100%", height: "auto" }}
      >
        {/* Сетка здания */}
        <rect
          x={startX}
          y={startY}
          width={bDrawW}
          height={bDrawL}
          fill="#f9f9f9"
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x={startX + bDrawW / 2}
          y={startY - 10}
          textAnchor="middle"
          fontSize="12"
        >
          Ширина {bW}м
        </text>
        <text
          x={startX - 10}
          y={startY + bDrawL / 2}
          textAnchor="middle"
          writingMode="vertical-rl"
          fontSize="12"
        >
          Длина {bL}м
        </text>

        {/* --- ЗОНА ВАЛИДАЦИИ ГАБАРИТОВ --- */}
        {/* Если антресоль физически вылетает за контур здания, подсвечиваем ее красным алармом */}
        <rect
          x={mX}
          y={mY}
          width={mW}
          height={mL}
          fill={(offX + mW_raw > bW || offY + mL_raw > bL || offX < 0 || offY < 0) 
            ? "rgba(217, 0, 0, 0.15)" 
            : "rgba(0, 123, 255, 0.2)"
          }
          stroke={(offX + mW_raw > bW || offY + mL_raw > bL || offX < 0 || offY < 0) ? "#d90000" : "#007bff"}
          strokeWidth="2"
        />

        {/* Колонны */}
        {cols}

        {/* Размеры антресоли */}
        <text
          x={mX + mW / 2}
          y={mY + mL + 15}
          textAnchor="middle"
          fontSize="10"
          fill="#007bff"
        >
          {mW_raw}м
        </text>
        <text
          x={mX + mW + 15}
          y={mY + mL / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#007bff"
          writingMode="vertical-rl"
        >
          {mL_raw}м
        </text>
      </svg>
      <div style={{ textAlign: "center", fontSize: "0.9em", marginTop: "5px", color: "#666" }}>
        Шаг колонн: {stepX.toFixed(2)}м x {stepY.toFixed(2)}м
      </div>
    </div>
  );
});

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function MezzanineEditor({
  blockData,
  initialMezzanines,
  onBack,
}) {
  const [mezzanines, setMezzanines] = useState(initialMezzanines || []);
  const [selectedId, setSelectedId] = useState(
    mezzanines.length > 0 ? mezzanines[0].id : null
  );

  const buildingW = blockData.generalData.blockWidth || 0;
  const buildingL = blockData.generalData.blockLength || 0;

  const handleAdd = () => {
    const newId = "mz_" + Date.now();
    const newMz = {
      id: newId,
      name: `Антресоль ${mezzanines.length + 1}`,
      elevation: "3.0",
      width: "6.0",
      length: "6.0",
      offsetX: "0.0",
      offsetY: "0.0",
      thickness: "120",
      loadLive: "200",
      loadPartitions: "50",
      loadDead: "150",
      safetyFactor: "1.2",
      colsX: "2",
      colsY: "2",
    };
    setMezzanines([...mezzanines, newMz]);
    setSelectedId(newId);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const filtered = mezzanines.filter((m) => m.id !== id);
    setMezzanines(filtered);
    if (selectedId === id)
      setSelectedId(filtered.length > 0 ? filtered[0].id : null);
  };

  const handleChange = (field, value) => {
    setMezzanines((prev) =>
      prev.map((m) => {
        if (m.id !== selectedId) return m;
        return { ...m, [field]: value };
      })
    );
  };

  const selectedMezzanine = useMemo(() => {
    return mezzanines.find((m) => m.id === selectedId) || null;
  }, [mezzanines, selectedId]);

  // Экспорт наверх: Парсим строки в float и жестко гарантируем минимум 2 ряда опор
  const handleBackWithData = () => {
    const formattedMezzanines = mezzanines.map(m => ({
      ...m,
      elevation: parseFloat(m.elevation) || 0,
      width: parseFloat(m.width) || 0,
      length: parseFloat(m.length) || 0,
      offsetX: parseFloat(m.offsetX) || 0,
      offsetY: parseFloat(m.offsetY) || 0,
      thickness: parseInt(m.thickness, 10) || 0,
      loadLive: parseFloat(m.loadLive) || 0,
      loadPartitions: parseFloat(m.loadPartitions) || 0,
      loadDead: parseFloat(m.loadDead) || 0,
      safetyFactor: parseFloat(m.safetyFactor) || 1.0,
      // ИСПРАВЛЕНО: Защита от 1 пролета. Минимум 2 ряда колонн для стабильности других чертежей калькулятора!
      colsX: Math.max(2, parseInt(m.colsX, 10) || 2),
      colsY: Math.max(2, parseInt(m.colsY, 10) || 2),
    }));
    onBack(formattedMezzanines);
  };

  const totalDesignLoad = useMemo(() => {
    if (!selectedMezzanine) return 0;
    const p = parseFloat(selectedMezzanine.loadLive) || 0;
    const g = parseFloat(selectedMezzanine.loadPartitions) || 0;
    const d = parseFloat(selectedMezzanine.loadDead) || 0;
    const f = parseFloat(selectedMezzanine.safetyFactor) || 1.0;
    return Math.round((p + g + d) * f);
  }, [selectedMezzanine]);

  // Валидация выхода антресоли за контуры основного здания
  const isOutOfBounds = useMemo(() => {
    if (!selectedMezzanine) return false;
    const w = parseFloat(selectedMezzanine.width) || 0;
    const l = parseFloat(selectedMezzanine.length) || 0;
    const x = parseFloat(selectedMezzanine.offsetX) || 0;
    const y = parseFloat(selectedMezzanine.offsetY) || 0;
    return (x + w > buildingW || y + l > buildingL || x < 0 || y < 0);
  }, [selectedMezzanine, buildingW, buildingL]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Редактор Антресолей ({blockData.name || "Блок"})</h2>
        <button style={styles.buttonBack} onClick={handleBackWithData}>
          &larr; Сохранить и Назад
        </button>
      </div>

      <div style={styles.layout}>
        {/* 1. СПИСОК АНТРЕСОЛЕЙ */}
        <div style={styles.colList}>
          <button style={styles.buttonAdd} onClick={handleAdd}>
            + Добавить
          </button>
          {mezzanines.map((m) => (
            <div
              key={m.id}
              style={m.id === selectedId ? styles.listItemSelected : styles.listItem}
              onClick={() => setSelectedId(m.id)}
            >
              <strong>{m.name}</strong>
              <button
                style={styles.buttonDelete}
                onClick={(e) => handleDelete(e, m.id)}
              >
                x
              </button>
              <div style={{ fontSize: "0.8em", color: "#666" }}>
                Отм. +{m.elevation}м
              </div>
            </div>
          ))}
        </div>

        {/* 2. ФОРМА РЕДАКТИРОВАНИЯ */}
        {selectedMezzanine ? (
          <div style={styles.colForm}>
            {isOutOfBounds && (
              <div style={{
                padding: "10px", 
                backgroundColor: "#ffebe6", 
                border: "1px solid #ffc0b0", 
                color: "#d90000", 
                borderRadius: "6px", 
                marginBottom: "15px",
                fontWeight: "bold",
                fontSize: "0.9em"
              }}>
                ⚠️ Внимание: Контур антресоли выходит за габариты здания ({buildingW}х{buildingL}м)! Проверьте смещения или размеры.
              </div>
            )}

            {/* ГЕОМЕТРИЯ */}
            <div style={styles.section}>
              <h3 style={styles.h3}>1. Геометрия и Положение</h3>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Отметка пола (м):</label>
                  <input
                    type="number"
                    step="0.01"
                    style={styles.input}
                    value={selectedMezzanine.elevation}
                    onChange={(e) => handleChange("elevation", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>Толщина плиты (мм):</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={selectedMezzanine.thickness}
                    onChange={(e) => handleChange("thickness", e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Ширина (X), м:</label>
                  <input
                    type="number"
                    step="0.1"
                    style={styles.input}
                    value={selectedMezzanine.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>Длина (Y), м:</label>
                  <input
                    type="number"
                    step="0.1"
                    style={styles.input}
                    value={selectedMezzanine.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Смещение по X (м):</label>
                  <input
                    type="number"
                    step="0.1"
                    style={styles.input}
                    value={selectedMezzanine.offsetX}
                    onChange={(e) => handleChange("offsetX", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>Смещение по Y (м):</label>
                  <input
                    type="number"
                    step="0.1"
                    style={styles.input}
                    value={selectedMezzanine.offsetY}
                    onChange={(e) => handleChange("offsetY", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* КОНСТРУКЦИЯ */}
            <div style={styles.section}>
              <h3 style={styles.h3}>2. Сетка колонн</h3>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Кол-во рядов по X:</label>
                  <input
                    type="number"
                    min="2"
                    style={styles.input}
                    value={selectedMezzanine.colsX}
                    onChange={(e) => handleChange("colsX", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>Кол-во рядов по Y:</label>
                  <input
                    type="number"
                    min="2"
                    style={styles.input}
                    value={selectedMezzanine.colsY}
                    onChange={(e) => handleChange("colsY", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* НАГРУЗКИ */}
            <div style={styles.section}>
              <h3 style={styles.h3}>3. Нагрузки (кг/м²)</h3>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Полезная (нормативная):</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={selectedMezzanine.loadLive}
                    onChange={(e) => handleChange("loadLive", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>От перегородок:</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={selectedMezzanine.loadPartitions}
                    onChange={(e) => handleChange("loadPartitions", e.target.value)}
                  />
                </div>
              </div>
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Постоянная (пол, состав):</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={selectedMezzanine.loadDead}
                    onChange={(e) => handleChange("loadDead", e.target.value)}
                  />
                </div>
                <div>
                  <label style={styles.label}>Коэф. надежности (γf):</label>
                  <input
                    type="number"
                    step="0.05"
                    style={styles.input}
                    value={selectedMezzanine.safetyFactor}
                    onChange={(e) => handleChange("safetyFactor", e.target.value)}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.85em",
                  color: "#005699",
                  marginTop: "8px",
                  fontWeight: "bold",
                  backgroundColor: "#e6f7ff",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #b0e0ff"
                }}
              >
                Полная расчетная нагрузка = {totalDesignLoad} кг/м²
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              ...styles.colForm,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            Добавьте антресоль для редактирования
          </div>
        )}

        {/* 3. ВИЗУАЛИЗАЦИЯ */}
        <div style={styles.colVisual}>
          <h4 style={{ marginTop: 0 }}>План расположения антресоли</h4>
          <MezzanineVisualizer
            buildingW={buildingW}
            buildingL={buildingL}
            mezzanine={selectedMezzanine}
          />
        </div>
      </div>
    </div>
  );
}
