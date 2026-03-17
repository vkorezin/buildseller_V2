import React, { useState, useEffect } from "react";
import { generateBase210Matrix } from "./baseMatrixUtils";
import PinProtectedSection from "./PinProtectedSection";

// Жестко заданная ссылка на актуальную базу ЕВРОАНГАР
const DEFAULT_GOOGLE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8wDX5_uyk3mIEeUidIAJsirnE4itmiCcJX6RxyTnLguLc1Gqs65yBs3m9pKAYIC_D3YMsCWfHzKlj/pub?output=csv";

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
  title: { margin: 0, fontSize: "1.3em", color: "#333" },
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
  table: { borderCollapse: "collapse", fontSize: "0.85em", marginTop: "15px" },
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
  td: { padding: "4px", border: "1px solid #ddd", textAlign: "center" },
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
  buttonGroup: { marginTop: "15px", display: "flex", gap: "10px" },
  importSection: {
    backgroundColor: "#e7f3ff",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "2px solid #17a2b8",
  },
  importTitle: { fontWeight: "bold", marginBottom: "10px", color: "#17a2b8" },
  urlInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "0.9em",
    marginBottom: "10px",
  },
  importHint: { fontSize: "0.8em", color: "#666", marginTop: "5px" },
};

export default function BaseMatrix210Editor({ isOpen, onClose, onSave }) {
  const [matrix, setMatrix] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(DEFAULT_GOOGLE_CSV_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [requirePin, setRequirePin] = useState(false);

  // Вынесенная функция парсинга CSV
  const fetchAndParseCsv = async (url) => {
    let csvUrl = url;
    if (csvUrl.includes("/edit")) {
      csvUrl = csvUrl.replace("/edit#gid=", "/export?format=csv&gid=");
      csvUrl = csvUrl.replace("/edit?usp=sharing", "/export?format=csv");
      csvUrl = csvUrl.replace("/edit", "/export?format=csv");
    }

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Ошибка сети при скачивании файла");

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("Таблица пустая или содержит только заголовок");
    }

    const parseCsvLine = (line) => {
      const cells = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if ((char === "," || char === "\t" || char === ";") && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      if (current) cells.push(current.trim());
      return cells.map((cell) => {
        const cleaned = cell.replace(/["']/g, "").trim();
        if (/^\d+,\d+$/.test(cleaned)) return cleaned.replace(",", ".");
        return cleaned;
      });
    };

    const headerCells = parseCsvLine(lines[0]);
    const spans = headerCells
      .slice(1)
      .map((s) => parseFloat(s))
      .filter((s) => !isNaN(s));

    const heights = [];
    const data = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = parseCsvLine(line);
      if (cells.length < 2) continue;

      const h = parseFloat(cells[0]);
      if (isNaN(h)) continue;

      heights.push(h);
      data[h] = {};

      for (let j = 1; j < cells.length && j - 1 < spans.length; j++) {
        const w = spans[j - 1];
        const value = parseFloat(cells[j]);
        data[h][w] = isNaN(value) ? 0 : value;
      }
    }

    if (heights.length === 0 || spans.length === 0) {
      throw new Error("Не удалось найти данные. Проверьте формат таблицы.");
    }

    return { heights, spans, data };
  };

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Жесткая синхронизация: всегда качаем свежую версию
          const cloudData = await fetchAndParseCsv(DEFAULT_GOOGLE_CSV_URL);
          setMatrix(cloudData);

          // Сразу обновляем локальное хранилище для остальных компонентов
          localStorage.setItem("baseMatrix210", JSON.stringify(cloudData));
          localStorage.setItem("baseMatrixGoogleUrl", DEFAULT_GOOGLE_CSV_URL);
        } catch (error) {
          console.error(
            "Авто-загрузка из Google не удалась, используем кэш:",
            error
          );

          // Fallback: берем из кэша, если нет связи с облаком
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
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [isOpen]);

  const handleCellChange = (h, w, value) => {
    const newMatrix = { ...matrix };
    newMatrix.data[h][w] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const handleSave = () => {
    localStorage.setItem("baseMatrix210", JSON.stringify(matrix));
    localStorage.setItem("baseMatrixGoogleUrl", googleSheetUrl);
    onSave(matrix);
    alert("✅ Базовая матрица ЕВРОАНГАР сохранена в локальный кэш!");
  };

  const handleReset = () => {
    if (window.confirm("Сбросить матрицу к значениям по умолчанию?")) {
      const defaultMatrix = generateBase210Matrix();
      setMatrix(defaultMatrix);
    }
  };

  const handleImportClick = () => setRequirePin(true);
  const handlePinSuccess = () => setShowImport(true);
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
      const parsedData = await fetchAndParseCsv(googleSheetUrl);
      setMatrix(parsedData);
      localStorage.setItem("baseMatrix210", JSON.stringify(parsedData));
      alert(
        `✅ Загружено ${parsedData.heights.length} высот и ${parsedData.spans.length} пролётов из Google Sheets!`
      );
      setShowImport(false);
      setRequirePin(false);
    } catch (error) {
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
          📊 Базовая матрица ЕВРОАНГАР (Снег 210 кг/м²)
        </h2>
        <button style={styles.closeBtn} onClick={onClose}>
          Закрыть
        </button>
      </div>

      <div style={styles.description}>
        <strong>Эталонная таблица веса каркаса</strong> для III снегового района
        (210 кг/м²).
        <br />
        При открытии автоматически подгружается свежая версия из Google Таблиц.
      </div>

      {showImport ? (
        <div style={styles.importSection}>
          <div style={styles.importTitle}>
            📥 Ручной импорт по другой ссылке
          </div>
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
            💡 Формат: первая строка — пролёты, первый столбец — высоты
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div style={{ color: "#007bff", marginBottom: "10px" }}>
              <strong>Синхронизация с облаком...</strong>
            </div>
          )}
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
              💾 Сохранить ручные правки
            </button>
            <button style={styles.importBtn} onClick={handleImportClick}>
              🔗 Сменить Google-ссылку
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
