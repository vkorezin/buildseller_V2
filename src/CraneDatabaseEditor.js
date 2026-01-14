import React, { useState } from "react";

// --- СТИЛИ ДЛЯ РЕДАКТОРА ---
const styles = {
  // ... (стили не изменены)
  page: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  backButton: {
    marginBottom: "20px",
    padding: "10px 15px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
  },
  mainLayout: {
    display: "flex",
    gap: "20px",
  },
  col: {
    border: "1px solid #eee",
    borderRadius: "5px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
  },
  colList: { flex: 2 },
  colEditor: { flex: 3 },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    maxHeight: "600px",
    overflowY: "auto",
    flex: 1,
  },
  listItem: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemSelected: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#d90000",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "3px 8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  editorForm: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: "10px",
    padding: "10px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "0.9em",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "5px",
    boxSizing: "border-box",
  },
  button: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    marginRight: "10px",
  },
  buttonSecondary: {
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#eee",
    marginRight: "10px",
  },
  buttonAdd: {
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
  hr: {
    gridColumn: "1 / -1",
    border: 0,
    borderTop: "1px solid #eee",
    margin: "5px 0",
  },
};

// --- КОМПОНЕНТ РЕДАКТОРА БАЗЫ КРАНОВ ---
export default function CraneDatabaseEditor({ onBack, currentDb, onSaveDb }) {
  const [localDb, setLocalDb] = useState(currentDb);
  const [selectedCraneId, setSelectedCraneId] = useState(null);

  // --- ОБРАБОТЧИКИ ВЫБОРА ---
  const handleSelectCrane = (craneId) => {
    // ... (код не изменен)
    setSelectedCraneId(craneId);
  };

  // --- ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАННЫХ В ФОРМЕ ---
  const handleEditorChange = (e) => {
    // ... (код не изменен)
    const { name, value } = e.target;

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      const crane = newDb.find((c) => c.id === selectedCraneId);

      crane[name] =
        name === "name" || name === "id" || name === "type"
          ? value
          : parseFloat(value) || 0;

      return newDb;
    });
  };

  // --- ДОБАВИТЬ КРАН ---
  const handleAddCrane = () => {
    // ... (код не изменен)
    const newCraneId = `crane_${Date.now()}`;
    const newCrane = {
      id: newCraneId,
      name: "Новый кран",
      type: "top-running",
      capacity: 5,
      minBuildingSpan: 16.0,
      maxBuildingSpan: 18.0,
      craneSpan: 17.5,
      supportHeight: 8.0,
      hookHeight: 6.0,
      wheelLoad: 10.0,
      trolleyMass: 1.0,
      wheelCount: 4,
      supportCount: 2,
    };

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      newDb.push(newCrane);
      return newDb;
    });

    setSelectedCraneId(newCraneId);
  };

  // --- УДАЛИТЬ КРАН ---
  const handleDeleteCrane = (e, craneId) => {
    // ... (код не изменен)
    e.stopPropagation();

    if (!window.confirm("Вы уверены, что хотите удалить этот кран?")) return;

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      return newDb.filter((crane) => crane.id !== craneId);
    });

    if (selectedCraneId === craneId) {
      setSelectedCraneId(null);
    }
  };

  // --- СОХРАНЕНИЕ / ЭКСПОРТ / ИМПОРТ ---
  const handleSaveToLocalStorage = () => {
    // ... (код не изменен)
    onSaveDb(localDb);
    alert("База данных кранов сохранена в localStorage!");
  };

  const handleExport = () => {
    // ... (код не изменен)
    const jsonString = JSON.stringify(localDb, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cranes_database.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    // ... (код не изменен)
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedDb = JSON.parse(e.target.result);
          // (Добавить валидацию, если нужно)
          setLocalDb(importedDb);
          setSelectedCraneId(null);
          alert("База кранов успешно импортирована. Не забудьте сохранить.");
        } catch (err) {
          alert("Ошибка! Не удалось прочитать JSON файл.");
        }
      };
      reader.readAsText(file);
    }
  };

  // --- ДАННЫЕ ДЛЯ РЕНДЕРА ---
  const selectedCrane = Array.isArray(localDb)
    ? localDb.find((c) => c.id === selectedCraneId)
    : null;

  return (
    <div style={styles.page}>
      <button onClick={onBack} style={styles.backButton}>
        &larr; Назад к Менеджеру
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* ... (код не изменен) ... */}
        <h1>Редактор Базы Кранов</h1>
        <div>
          <input
            type="file"
            id="import-file-crane"
            style={{ display: "none" }}
            accept=".json"
            onChange={handleImport}
          />
          <label htmlFor="import-file-crane" style={styles.buttonSecondary}>
            Импорт из .json...
          </label>
          <button style={styles.buttonSecondary} onClick={handleExport}>
            Экспорт в .json
          </button>
          <button style={styles.button} onClick={handleSaveToLocalStorage}>
            💾 Сохранить (в localStorage)
          </button>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* --- Уровень 1: СПИСОК КРАНОВ --- */}
        <div style={{ ...styles.col, ...styles.colList }}>
          <h4>1. Каталог Кранов</h4>
          <ul style={styles.list}>
            {/* ... (код не изменен) ... */}
            {Array.isArray(localDb) &&
              localDb.map((crane) => (
                <li
                  key={crane.id}
                  style={
                    crane.id === selectedCraneId
                      ? styles.listItemSelected
                      : styles.listItem
                  }
                  onClick={() => handleSelectCrane(crane.id)}
                >
                  <span>
                    {crane.name} (ГП: {crane.capacity}т)
                  </span>
                  <button
                    style={styles.deleteButton}
                    onClick={(e) => handleDeleteCrane(e, crane.id)}
                  >
                    X
                  </button>
                </li>
              ))}
          </ul>
          <button style={styles.buttonAdd} onClick={handleAddCrane}>
            + Добавить Кран
          </button>
        </div>

        {/* --- Уровень 2: РЕДАКТОР --- */}
        <div style={{ ...styles.col, ...styles.colEditor }}>
          <h4>2. Редактор Крана</h4>

          {selectedCrane ? (
            <div style={styles.editorForm}>
              {/* ... (код не изменен) ... */}
              <label style={styles.label}>ID (нельзя менять)</label>
              <input
                style={{ ...styles.input, backgroundColor: "#eee" }}
                type="text"
                value={selectedCrane.id}
                readOnly
              />

              <label style={styles.label}>Имя (name)</label>
              <input
                style={styles.input}
                type="text"
                name="name"
                value={selectedCrane.name}
                onChange={handleEditorChange}
              />

              <hr style={styles.hr} />
              <label style={styles.label}>Тип (type)</label>
              <select
                style={styles.select}
                name="type"
                value={selectedCrane.type}
                onChange={handleEditorChange}
              >
                <option value="top-running">Опорный (top-running)</option>
                <option value="underhung">Подвесной (underhung)</option>
              </select>

              <label style={styles.label}>Грузоподъемность (capacity), т</label>
              <input
                style={styles.input}
                type="number"
                name="capacity"
                value={selectedCrane.capacity}
                onChange={handleEditorChange}
              />

              <hr style={styles.hr} />
              <h5 style={{ ...styles.hr, margin: 0 }}>Ключи для подбора</h5>

              <label style={styles.label}>
                Пролет здания ОТ (minBuildingSpan)
              </label>
              <input
                style={styles.input}
                type="number"
                name="minBuildingSpan"
                value={selectedCrane.minBuildingSpan}
                onChange={handleEditorChange}
              />

              <label style={styles.label}>
                Пролет здания ДО (maxBuildingSpan)
              </label>
              <input
                style={styles.input}
                type="number"
                name="maxBuildingSpan"
                value={selectedCrane.maxBuildingSpan}
                onChange={handleEditorChange}
              />

              <hr style={styles.hr} />
              <h5 style={{ ...styles.hr, margin: 0 }}>Технические данные</h5>

              <label style={styles.label}>Пролет крана (craneSpan), м</label>
              <input
                style={styles.input}
                type="number"
                name="craneSpan"
                value={selectedCrane.craneSpan}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>Отм. балки (supportHeight), м</label>
              <input
                style={styles.input}
                type="number"
                name="supportHeight"
                value={selectedCrane.supportHeight}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>Высота крюка (hookHeight), м</label>
              <input
                style={styles.input}
                type="number"
                name="hookHeight"
                value={selectedCrane.hookHeight}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>
                Нагрузка на колесо (wheelLoad), т
              </label>
              <input
                style={styles.input}
                type="number"
                name="wheelLoad"
                value={selectedCrane.wheelLoad}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>Масса тележки (trolleyMass), т</label>
              <input
                style={styles.input}
                type="number"
                name="trolleyMass"
                value={selectedCrane.trolleyMass}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>Кол-во колес (wheelCount)</label>
              <input
                style={styles.input}
                type="number"
                name="wheelCount"
                value={selectedCrane.wheelCount}
                onChange={handleEditorChange}
              />
              <label style={styles.label}>Кол-во опор (supportCount)</label>

              <input
                style={styles.input}
                type="number"
                name="supportCount"
                value={selectedCrane.supportCount}
                onChange={handleEditorChange}
              />
            </div>
          ) : (
            <p style={{ padding: "10px", color: "#777" }}>
              Выберите кран слева для редактирования
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
