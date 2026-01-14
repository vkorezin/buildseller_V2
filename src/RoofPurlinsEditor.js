import React, { useState, useEffect } from "react";
import { generateRoofPurlins } from "./baseMatrixUtils";
import PinProtectedSection from "./PinProtectedSection";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "25px",
    maxWidth: "700px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "1.3em",
    color: "#333",
  },
  closeBtn: {
    padding: "8px 15px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  description: {
    backgroundColor: "#f8f9fa",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "0.9em",
    color: "#555",
  },
  saveBtn: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
    marginRight: "10px",
  },
  resetBtn: {
    padding: "10px 20px",
    backgroundColor: "#ffc107",
    color: "#333",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
    marginRight: "10px",
  },
  importBtn: {
    padding: "10px 20px",
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  importSection: {
    backgroundColor: "#e7f3ff",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "2px solid #17a2b8",
  },
  importTitle: {
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#17a2b8",
  },
  urlInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "0.9em",
    marginBottom: "10px",
  },
  importHint: {
    fontSize: "0.8em",
    color: "#666",
    marginTop: "5px",
  },
  addBtn: {
    padding: "8px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9em",
    marginBottom: "10px",
  },
  deleteBtn: {
    padding: "5px 10px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.8em",
    marginLeft: "10px",
  },
  row: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "5px",
  },
  rowInput: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "1em",
    flex: 1,
  },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "0.85em",
    color: "#333",
    display: "block",
  },
  baseRow: {
    backgroundColor: "#d4edda",
    border: "2px solid #28a745",
  },
};

export default function RoofPurlinsEditor({ isOpen, onClose, onSave }) {
  const [purlins, setPurlins] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requirePin, setRequirePin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("roofPurlins");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed === "object" && !Array.isArray(parsed)) {
            const converted = Object.keys(parsed).map((snow) => ({
              snow: Number(snow),
              weight: parsed[snow],
            }));
            setPurlins(converted);
          } else {
            setPurlins(parsed);
          }
        } catch {
          setPurlins(generateRoofPurlins());
        }
      } else {
        setPurlins(generateRoofPurlins());
      }
    }
  }, [isOpen]);

  const handleChange = (index, field, value) => {
    const newPurlins = [...purlins];
    newPurlins[index] = {
      ...newPurlins[index],
      [field]: parseFloat(value) || 0,
    };
    setPurlins(newPurlins);
  };

  const handleAdd = () => {
    const maxSnow = Math.max(...purlins.map((p) => p.snow));
    setPurlins([...purlins, { snow: maxSnow + 70, weight: 6.5 }]);
  };

  const handleDelete = (index) => {
    if (purlins.length <= 1) {
      alert("⚠️ Должна остаться хотя бы одна строка!");
      return;
    }
    setPurlins(purlins.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    localStorage.setItem("roofPurlins", JSON.stringify(purlins));
    onSave(purlins);
    alert("✅ Металлоемкость прогонов кровли сохранена!");
  };

  const handleReset = () => {
    if (window.confirm("Сбросить значения к умолчанию?")) {
      setPurlins(generateRoofPurlins());
    }
  };

  const handleImportClick = () => {
    setRequirePin(true);
  };

  const handlePinSuccess = () => {
    setShowImport(true);
  };

  const handlePinCancel = () => {
    setRequirePin(false);
    setShowImport(false);
  };

  const handleImportFromGoogle = async () => {
    if (!googleSheetUrl.trim()) {
      alert("⚠️ Введите URL Google Sheets");
      return;
    }

    setIsLoading(true);

    try {
      let csvUrl = googleSheetUrl;
      if (csvUrl.includes("/edit")) {
        csvUrl = csvUrl.replace("/edit#gid=", "/export?format=csv&gid=");
        csvUrl = csvUrl.replace("/edit?usp=sharing", "/export?format=csv");
        csvUrl = csvUrl.replace("/edit", "/export?format=csv");
      }

      const response = await fetch(csvUrl);
      const text = await response.text();

      console.log("Загруженный CSV:", text.substring(0, 500));

      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      console.log("Количество строк:", lines.length);

      // Функция для правильного парсинга CSV строки с кавычками
      const parseCsvLine = (line) => {
        const cells = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (
            (char === "," || char === "\t" || char === ";") &&
            !inQuotes
          ) {
            cells.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }

        if (current) {
          cells.push(current.trim());
        }

        return cells.map((cell) => {
          const cleaned = cell.replace(/["']/g, "").trim();
          if (/^\d+,\d+$/.test(cleaned)) {
            return cleaned.replace(",", ".");
          }
          return cleaned;
        });
      };

      const newPurlins = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = parseCsvLine(line);

        console.log(`Строка ${i}:`, cells);

        if (cells.length < 2) continue;

        const snow = parseFloat(cells[0]);
        const weight = parseFloat(cells[1]);

        console.log(`Парсинг: snow=${snow}, weight=${weight}`);

        if (!isNaN(snow) && !isNaN(weight)) {
          newPurlins.push({ snow, weight });
        }
      }

      console.log("Результат парсинга:", newPurlins);

      if (newPurlins.length === 0) {
        alert(
          "⚠️ Не удалось найти данные в таблице.\nПроверьте формат:\nПервый столбец - снег, второй - вес"
        );
        return;
      }

      setPurlins(newPurlins);
      alert(`✅ Загружено ${newPurlins.length} строк из Google Sheets!`);
      setShowImport(false);
      setRequirePin(false);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      alert("❌ Ошибка загрузки данных: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !purlins) return null;

  const renderContent = () => (
    <>
      <div style={styles.header}>
        <h2 style={styles.title}>🏗️ Прогоны кровли</h2>
        <button style={styles.closeBtn} onClick={onClose}>
          Закрыть
        </button>
      </div>

      <div style={styles.description}>
        <strong>Металлоемкость прогонов кровли</strong> для каждого снегового
        района.
        <br />
        Значения в <strong>кг/м²</strong> площади кровли.
        <br />
        Не включает рамы, связи и стеновые прогоны.
      </div>

      {showImport ? (
        <div style={styles.importSection}>
          <div style={styles.importTitle}>📥 Импорт из Google Sheets</div>
          <input
            type="text"
            placeholder="Вставьте ссылку на Google Sheets"
            style={styles.urlInput}
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
          />
          <button
            style={styles.importBtn}
            onClick={handleImportFromGoogle}
            disabled={isLoading}
          >
            {isLoading ? "⏳ Загрузка..." : "📥 Загрузить"}
          </button>
          <div style={styles.importHint}>
            💡 Формат: первый столбец — снег (70, 140, 210...), второй — вес в
            кг/м² (4.5, 5.5, 6.5...)
          </div>
        </div>
      ) : (
        <>
          <button style={styles.addBtn} onClick={handleAdd}>
            ➕ Добавить строку
          </button>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {purlins.map((item, index) => {
              const isBase = item.snow === 210;
              return (
                <div
                  key={index}
                  style={{
                    ...styles.row,
                    ...(isBase ? styles.baseRow : {}),
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>
                      Снег (кг/м²) {isBase && "⭐"}
                    </label>
                    <input
                      type="number"
                      style={styles.rowInput}
                      value={item.snow}
                      onChange={(e) =>
                        handleChange(index, "snow", e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Вес (кг/м²)</label>
                    <input
                      type="number"
                      step="0.1"
                      style={styles.rowInput}
                      value={item.weight}
                      onChange={(e) =>
                        handleChange(index, "weight", e.target.value)
                      }
                    />
                  </div>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(index)}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          <div style={styles.buttonGroup}>
            <button style={styles.saveBtn} onClick={handleSave}>
              💾 Сохранить
            </button>
            <button style={styles.resetBtn} onClick={handleReset}>
              🔄 Сбросить к умолчанию
            </button>
            <button style={styles.importBtn} onClick={handleImportClick}>
              🔒 Импорт из Google Sheets
            </button>
          </div>
        </>
      )}
    </>
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      {requirePin ? (
        <PinProtectedSection
          onCancel={handlePinCancel}
          onSuccess={handlePinSuccess}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {renderContent()}
          </div>
        </PinProtectedSection>
      ) : (
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
