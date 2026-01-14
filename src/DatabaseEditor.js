import React, { useState } from "react";

// --- СТИЛИ ДЛЯ РЕДАКТОРА ---
const styles = {
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
  colNorms: { flex: 1 },
  colLocations: { flex: 2 },
  colEditor: { flex: 3 },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    maxHeight: "400px",
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
    gridTemplateColumns: "150px 1fr",
    gap: "10px",
    padding: "10px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "0.9em",
    // --- ИЗМЕНЕНИЕ: Позволяем HTML-вставку ---
    display: "flex",
    alignItems: "center",
  },
  input: {
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
};

// --- КОМПОНЕНТ РЕДАКТОРА БАЗЫ ---
export default function DatabaseEditor({ onBack, currentDb, onSaveDb }) {
  const [localDb, setLocalDb] = useState(currentDb);
  const [selectedNormId, setSelectedNormId] = useState(
    Object.keys(currentDb)[0]
  );
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // --- ОБРАБОТЧИКИ ВЫБОРА ---
  const handleSelectNorm = (normId) => {
    setSelectedNormId(normId);
    setSelectedLocationId(null);
  };

  const handleSelectLocation = (locId) => {
    setSelectedLocationId(locId);
  };

  // --- ОБРАБОТЧИК ИЗМЕНЕНИЯ ДАННЫХ В ФОРМЕ ---
  const handleEditorChange = (e) => {
    const { name, value } = e.target;

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      const location = newDb[selectedNormId].locations.find(
        (l) => l.id === selectedLocationId
      );

      location[name] =
        name === "name" || name === "id" ? value : parseFloat(value) || 0;

      return newDb;
    });
  };

  // --- ДОБАВИТЬ ГОРОД ---
  const handleAddLocation = () => {
    if (!selectedNormId) return;

    const newLocId = `loc_${Date.now()}`;
    const newLocation = {
      id: newLocId,
      name: "Новый Город",
      snow: 0,
      wind: 0,
      seismic: 0,
      gamma_s: 1.4,
      gamma_w: 1.4,
    };

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      newDb[selectedNormId].locations.push(newLocation);
      return newDb;
    });

    setSelectedLocationId(newLocId);
  };

  // --- УДАЛИТЬ ГОРОД ---
  const handleDeleteLocation = (e, locId) => {
    e.stopPropagation();

    if (!window.confirm("Вы уверены, что хотите удалить этот город?")) return;

    setLocalDb((prevDb) => {
      const newDb = JSON.parse(JSON.stringify(prevDb));
      newDb[selectedNormId].locations = newDb[selectedNormId].locations.filter(
        (loc) => loc.id !== locId
      );
      return newDb;
    });

    if (selectedLocationId === locId) {
      setSelectedLocationId(null);
    }
  };

  // --- СОХРАНЕНИЕ / ЭКСПОРТ / ИМПОРТ ---
  const handleSaveToLocalStorage = () => {
    onSaveDb(localDb);
    alert("База данных сохранена в localStorage!");
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(localDb, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "norms_database.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedDb = JSON.parse(e.target.result);
          setLocalDb(importedDb);
          setSelectedNormId(Object.keys(importedDb)[0]);
          setSelectedLocationId(null);
          alert("База успешно импортирована. Не забудьте сохранить.");
        } catch (err) {
          alert("Ошибка! Не удалось прочитать JSON файл.");
        }
      };
      reader.readAsText(file);
    }
  };

  // --- ДАННЫЕ ДЛЯ РЕНДЕРА ---
  const selectedNorm = localDb[selectedNormId];
  const selectedLocation = selectedNorm?.locations.find(
    (l) => l.id === selectedLocationId
  );

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
        <h1>Редактор Базы Нагрузок</h1>
        <div>
          <input
            type="file"
            id="import-file"
            style={{ display: "none" }}
            accept=".json"
            onChange={handleImport}
          />
          <label htmlFor="import-file" style={styles.buttonSecondary}>
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

      <p>Выберите норму, затем локацию для редактирования.</p>

      <div style={styles.mainLayout}>
        {/* --- Уровень 1: НОРМЫ --- */}
        <div style={{ ...styles.col, ...styles.colNorms }}>
          <h4>1. Нормы</h4>
          <ul style={styles.list}>
            {Object.entries(localDb).map(([normId, data]) => (
              <li
                key={normId}
                style={
                  normId === selectedNormId
                    ? styles.listItemSelected
                    : styles.listItem
                }
                onClick={() => handleSelectNorm(normId)}
              >
                <span>{data.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Уровень 2: ЛОКАЦИИ --- */}
        <div style={{ ...styles.col, ...styles.colLocations }}>
          <h4>2. Локации</h4>
          {selectedNorm ? (
            <>
              <ul style={styles.list}>
                {selectedNorm.locations.map((loc) => (
                  <li
                    key={loc.id}
                    style={
                      loc.id === selectedLocationId
                        ? styles.listItemSelected
                        : styles.listItem
                    }
                    onClick={() => handleSelectLocation(loc.id)}
                  >
                    <span>{loc.name}</span>
                    <button
                      style={styles.deleteButton}
                      onClick={(e) => handleDeleteLocation(e, loc.id)}
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
              <button style={styles.buttonAdd} onClick={handleAddLocation}>
                + Добавить Город
              </button>
            </>
          ) : (
            <p style={{ padding: "10px", color: "#777" }}>
              Сначала выберите Нормы
            </p>
          )}
        </div>

        {/* --- Уровень 3: РЕДАКТОР --- */}
        <div style={{ ...styles.col, ...styles.colEditor }}>
          <h4>3. Редактор Локации</h4>

          {selectedLocation ? (
            <div style={styles.editorForm}>
              <label style={styles.label}>ID (нельзя менять)</label>
              <input
                style={{ ...styles.input, backgroundColor: "#eee" }}
                type="text"
                value={selectedLocation.id}
                readOnly
              />

              <label style={styles.label}>Название (name)</label>
              <input
                style={styles.input}
                type="text"
                name="name"
                value={selectedLocation.name}
                onChange={handleEditorChange}
              />

              <hr style={{ gridColumn: "1 / -1" }} />

              <label style={styles.label}>Снег (snow)</label>
              <input
                style={styles.input}
                type="number"
                name="snow"
                value={selectedLocation.snow}
                onChange={handleEditorChange}
              />

              <label style={styles.label}>Ветер (wind)</label>
              <input
                style={styles.input}
                type="number"
                name="wind"
                value={selectedLocation.wind}
                onChange={handleEditorChange}
              />

              <label style={styles.label}>Сейсмика (seismic)</label>
              <input
                style={styles.input}
                type="number"
                name="seismic"
                value={selectedLocation.seismic}
                onChange={handleEditorChange}
              />

              <hr style={{ gridColumn: "1 / -1" }} />

              {/* --- ИСПРАВЛЕНИЕ ЗДЕСЬ --- */}
              <label style={styles.label}>
                &gamma;<sub>s</sub> (gamma_s)
              </label>
              <input
                style={styles.input}
                type="number"
                name="gamma_s"
                value={selectedLocation.gamma_s}
                onChange={handleEditorChange}
              />

              <label style={styles.label}>
                &gamma;<sub>w</sub> (gamma_w)
              </label>
              <input
                style={styles.input}
                type="number"
                name="gamma_w"
                value={selectedLocation.gamma_w}
                onChange={handleEditorChange}
              />
            </div>
          ) : (
            <p style={{ padding: "10px", color: "#777" }}>
              Выберите локацию слева для редактирования
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
