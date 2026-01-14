import React, { useState, useEffect } from "react";
import { generateBase210Matrix } from "./baseMatrixUtils";
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
    maxWidth: "95vw",
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
  table: {
    borderCollapse: "collapse",
    fontSize: "0.85em",
    marginTop: "15px",
  },
  th: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "8px 6px",
    border: "1px solid #ddd",
    position: "sticky",
    top: 0,
    zIndex: 10,
    minWidth: "55px",
  },
  thRow: {
    backgroundColor: "#0056b3",
    color: "white",
    padding: "8px 6px",
    border: "1px solid #ddd",
    position: "sticky",
    left: 0,
    zIndex: 5,
    fontWeight: "bold",
  },
  td: {
    padding: "4px",
    border: "1px solid #ddd",
    textAlign: "center",
  },
  input: {
    width: "50px",
    padding: "4px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    textAlign: "center",
    fontSize: "0.9em",
  },
  description: {
    backgroundColor: "#f8f9fa",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "0.9em",
    color: "#555",
  },
  buttonGroup: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
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
};

export default function BaseMatrix210Editor({ isOpen, onClose, onSave }) {
  const [matrix, setMatrix] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requirePin, setRequirePin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("baseMatrix210");
      if (saved) {
        try {
          setMatrix(JSON.parse(saved));
        } catch {
          setMatrix(generateBase210Matrix());
        }
      } else {
        setMatrix(generateBase210Matrix());
      }
    }
  }, [isOpen]);

  const handleCellChange = (h, w, value) => {
    const newMatrix = { ...matrix };
    newMatrix.data[h][w] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const handleSave = () => {
    localStorage.setItem("baseMatrix210", JSON.stringify(matrix));
    onSave(matrix);
    alert("✅ Базовая матрица 210 сохранена!");
  };

  const handleReset = () => {
    if (window.confirm("Сбросить матрицу к значениям по умолчанию?")) {
      const defaultMatrix = generateBase210Matrix();
      setMatrix(defaultMatrix);
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

      if (lines.length < 2) {
        alert("⚠️ Таблица пустая или содержит только заголовок");
        return;
      }

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

        // Очищаем от кавычек и заменяем запятые на точки в числах
        return cells.map((cell) => {
          const cleaned = cell.replace(/["']/g, "").trim();
          // Если это число с запятой, заменяем на точку
          if (/^\d+,\d+$/.test(cleaned)) {
            return cleaned.replace(",", ".");
          }
          return cleaned;
        });
      };

      // Парсим первую строку (пролёты)
      const headerCells = parseCsvLine(lines[0]);
      console.log("Заголовок:", headerCells);

      const spans = headerCells
        .slice(1)
        .map((s) => parseFloat(s))
        .filter((s) => !isNaN(s));

      console.log("Пролёты:", spans);

      const heights = [];
      const data = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = parseCsvLine(line);

        console.log(`Строка ${i}:`, cells);

        if (cells.length < 2) continue;

        const h = parseFloat(cells[0]);

        if (isNaN(h)) {
          console.log(
            `Пропускаем строку ${i}: не удалось распарсить высоту "${cells[0]}"`
          );
          continue;
        }

        heights.push(h);
        data[h] = {};

        for (let j = 1; j < cells.length && j - 1 < spans.length; j++) {
          const w = spans[j - 1];
          const value = parseFloat(cells[j]);
          data[h][w] = isNaN(value) ? 0 : value;
        }
      }

      console.log("Результат парсинга:", { heights, spans, data });

      if (heights.length === 0 || spans.length === 0) {
        alert(
          "⚠️ Не удалось найти данные в таблице.\nПроверьте формат:\nПервая строка - пролёты, первый столбец - высоты"
        );
        return;
      }

      setMatrix({ heights, spans, data });
      alert(
        `✅ Загружено ${heights.length} высот и ${spans.length} пролётов из Google Sheets!`
      );
      setShowImport(false);
      setRequirePin(false);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      alert("❌ Ошибка загрузки данных: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !matrix) return null;

  const renderContent = () => (
    <>
      <div style={styles.header}>
        <h2 style={styles.title}>
          📊 Базовая матрица каркаса (Снег 210 кг/м²)
        </h2>
        <button style={styles.closeBtn} onClick={onClose}>
          Закрыть
        </button>
      </div>

      <div style={styles.description}>
        <strong>Эталонная таблица веса каркаса</strong> для III снегового района
        (210 кг/м²).
        <br />
        Строки — высота здания (2.0-15.0 м), столбцы — пролёт (3-45 м).
        <br />
        Значения в <strong>кг/м²</strong> площади здания (без прогонов и
        связей).
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
            💡 Формат: первая строка — пролёты (3, 6, 9...), первый столбец —
            высоты (2.0, 2.5, 3.0...)
          </div>
        </div>
      ) : (
        <>
          <div
            style={{ overflowX: "auto", overflowY: "auto", maxHeight: "60vh" }}
          >
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.thRow }}>H↓ \ W→</th>
                  {matrix.spans.map((w) => (
                    <th key={w} style={styles.th}>
                      {w}м
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.heights.map((h) => (
                  <tr key={h}>
                    <td style={styles.thRow}>{h.toFixed(1)}м</td>
                    {matrix.spans.map((w) => (
                      <td key={w} style={styles.td}>
                        <input
                          type="number"
                          step="0.1"
                          style={styles.input}
                          value={matrix.data[h][w]}
                          onChange={(e) =>
                            handleCellChange(h, w, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
