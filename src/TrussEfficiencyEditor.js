import React, { useState, useEffect } from "react";

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
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "95%",
    maxWidth: "1200px",
    height: "90%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  content: {
    flex: 1,
    overflow: "auto",
    border: "1px solid #ccc",
    position: "relative",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "0.85em",
    textAlign: "center",
  },
  th: {
    position: "sticky",
    top: 0,
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #ddd",
    borderRight: "1px solid #ddd",
    padding: "8px",
    zIndex: 2,
    minWidth: "50px",
  },
  thRow: {
    position: "sticky",
    left: 0,
    backgroundColor: "#f8f9fa",
    borderRight: "2px solid #ddd",
    borderBottom: "1px solid #ddd",
    padding: "5px",
    zIndex: 3,
    minWidth: "60px",
  },
  td: {
    borderRight: "1px solid #ddd",
    borderBottom: "1px solid #ddd",
    padding: "0",
  },
  input: {
    width: "100%",
    height: "100%",
    border: "none",
    textAlign: "center",
    padding: "8px 0",
    fontSize: "1em",
    outline: "none",
    minWidth: "50px",
  },
  pinInput: {
    padding: "10px",
    fontSize: "1.5em",
    textAlign: "center",
    letterSpacing: "8px",
    width: "200px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  btn: {
    padding: "8px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "10px",
    fontWeight: "bold",
    fontSize: "0.9em",
  },
  urlInput: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "300px",
    marginRight: "10px",
  },
  fileInput: { display: "none" },
  closeBtn: { backgroundColor: "#6c757d" },
  label: {
    fontSize: "0.9em",
    color: "#666",
    display: "block",
    marginTop: "5px",
  },
  cloudBlock: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: "5px 10px",
    borderRadius: "4px",
    marginRight: "10px",
  },
};

// --- ВАША ССЫЛКА ПО УМОЛЧАНИЮ ---
const DEFAULT_GOOGLE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTTvsGGDud_8rn1Hso5yNewZzhw-iGRBhjWdyx27rSI9nTdfdaq5IgdLFGJjqYnWbKlQi7yhC6DpldH/pub?gid=0&single=true&output=csv";

const parseRawCsv = (text) => {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Файл слишком короткий или пустой");

  const separator = lines[0].includes(";") ? ";" : ",";

  const headerParts = lines[0]
    .split(separator)
    .map((s) => s.trim().replace(/^"|"$/g, ""));
  const spans = [];

  for (let i = 1; i < headerParts.length; i++) {
    const val = parseFloat(headerParts[i].replace(",", "."));
    if (!isNaN(val)) spans.push(val);
  }
  if (spans.length === 0)
    throw new Error("Не найдены пролеты (заголовки столбцов)");

  const heights = [];
  const data = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]
      .split(separator)
      .map((s) => s.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;

    const h = parseFloat(parts[0].replace(",", "."));
    if (isNaN(h)) continue;

    heights.push(h);
    data[h] = {};

    spans.forEach((span, idx) => {
      const valStr = parts[idx + 1];
      let val = 0;
      if (valStr) val = parseFloat(valStr.replace(",", "."));
      data[h][span] = isNaN(val) ? 0 : val;
    });
  }

  if (heights.length === 0) throw new Error("Не найдены строки с высотами");

  heights.sort((a, b) => a - b);
  spans.sort((a, b) => a - b);

  return { heights, spans, data };
};

export const generateDefaultTable = () => {
  const heights = [];
  for (let h = 2.0; h <= 15.05; h += 0.5)
    heights.push(parseFloat(h.toFixed(1)));
  const spans = [];
  for (let s = 3; s <= 45; s += 3) spans.push(s);

  const data = {};
  heights.forEach((h) => {
    data[h] = {};
    spans.forEach((s) => {
      let val = 18 + (h - 2) * 0.8 + (s - 3) * 0.5;
      if (val > 50) val = 50;
      data[h][s] = parseFloat(val.toFixed(2));
    });
  });
  return { heights, spans, data };
};

export default function TrussEfficiencyEditor({ isOpen, onClose, onSave }) {
  const [pin, setPin] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [tableData, setTableData] = useState(null);

  // Инициализируем стейт вашей ссылкой
  const [googleUrl, setGoogleUrl] = useState(DEFAULT_GOOGLE_CSV_URL);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setIsAuth(false);
      const savedTable = localStorage.getItem("trussEfficiencyTable");
      if (savedTable) {
        try {
          setTableData(JSON.parse(savedTable));
        } catch {
          setTableData(generateDefaultTable());
        }
      } else {
        setTableData(generateDefaultTable());
      }

      // Если есть сохраненная ссылка (пользователь менял), берем её,
      // иначе оставляем дефолтную константу
      const savedUrl = localStorage.getItem("trussGoogleUrl");
      if (savedUrl) setGoogleUrl(savedUrl);
    }
  }, [isOpen]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === "2159") setIsAuth(true);
    else {
      alert("Неверный PIN");
      setPin("");
    }
  };

  const handleCellChange = (h, s, val) => {
    const newData = { ...tableData };
    newData.data[h][s] = parseFloat(val);
    setTableData(newData);
  };

  const handleSave = () => {
    localStorage.setItem("trussEfficiencyTable", JSON.stringify(tableData));
    // Сохраняем URL, даже если это дефолтный
    localStorage.setItem("trussGoogleUrl", googleUrl);
    onSave(tableData);
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseRawCsv(evt.target.result);
        setTableData(parsed);
        alert(
          `Файл загружен: ${parsed.heights.length} строк, ${parsed.spans.length} столбцов.`
        );
      } catch (err) {
        alert("Ошибка CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleCloudDownload = async () => {
    if (!googleUrl) {
      alert("Нет ссылки на Google CSV");
      return;
    }
    try {
      const res = await fetch(googleUrl);
      if (!res.ok) throw new Error("Ошибка сети");
      const text = await res.text();

      const parsed = parseRawCsv(text);
      setTableData(parsed);
      localStorage.setItem("trussGoogleUrl", googleUrl);
      alert(
        `Успешно обновлено из облака! \nРазмер: ${parsed.heights.length}x${parsed.spans.length}`
      );
    } catch (err) {
      alert("Не удалось загрузить таблицу. \nОшибка: " + err.message);
    }
  };

  if (!isOpen) return null;

  if (!isAuth) {
    return (
      <div style={styles.overlay}>
        <div
          style={{
            ...styles.modal,
            width: "350px",
            height: "auto",
            alignItems: "center",
          }}
        >
          <h3 style={{ marginBottom: "20px" }}>🔒 Вход в настройки</h3>
          <form onSubmit={handlePinSubmit} style={{ textAlign: "center" }}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.pinInput}
              autoFocus
              placeholder="PIN"
            />
            <div style={{ marginTop: "20px" }}>
              <button type="submit" style={styles.btn}>
                Войти
              </button>
              <button
                type="button"
                style={{ ...styles.btn, ...styles.closeBtn }}
                onClick={onClose}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h3 style={{ margin: 0 }}>⚙️ Матрица Ферм (Google Sheets)</h3>
            <span style={styles.label}>
              Значение = % экономии (на сколько Ферма легче Балки)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={styles.cloudBlock}>
              <span style={{ marginRight: "5px" }}>☁️</span>
              <input
                type="text"
                placeholder="Ссылка на Google CSV..."
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                style={styles.urlInput}
              />
              <button
                style={{ ...styles.btn, marginLeft: 0 }}
                onClick={handleCloudDownload}
              >
                Обновить
              </button>
            </div>

            <label
              style={{
                ...styles.btn,
                backgroundColor: "#17a2b8",
                display: "inline-block",
              }}
            >
              📂 Файл
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={styles.fileInput}
              />
            </label>

            <button
              style={{ ...styles.btn, backgroundColor: "#28a745" }}
              onClick={handleSave}
            >
              Сохранить
            </button>
            <button
              style={{ ...styles.btn, ...styles.closeBtn }}
              onClick={onClose}
            >
              X
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thRow, zIndex: 4 }}>
                  H \ L
                </th>
                {tableData.spans.map((s) => (
                  <th key={s} style={styles.th}>
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.heights.map((h) => (
                <tr key={h}>
                  <th style={styles.thRow}>{h}</th>
                  {tableData.spans.map((s) => (
                    <td key={s} style={styles.td}>
                      <input
                        type="number"
                        step="0.1"
                        value={tableData.data[h][s]}
                        onChange={(e) => handleCellChange(h, s, e.target.value)}
                        style={styles.input}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
