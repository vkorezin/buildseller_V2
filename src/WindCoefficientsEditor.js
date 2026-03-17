import React, { useState, useEffect } from "react";
import { generateWindCoefficients } from "./baseMatrixUtils";
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
  },
  row: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    gap: "15px",
    backgroundColor: "#f8f9fa",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #eee",
  },
  input: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "120px",
    textAlign: "center",
  },
  deleteBtn: {
    padding: "8px 12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  addBtn: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  buttonGroup: { marginTop: "20px", display: "flex", gap: "10px" },
};

export default function WindCoefficientsEditor({ isOpen, onClose, onSave }) {
  const [data, setData] = useState(null);
  const [requirePin, setRequirePin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("windCoefficients");
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {
          setData(generateWindCoefficients());
        }
      } else {
        setData(generateWindCoefficients());
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    const sorted = [...data].sort((a, b) => a.wind - b.wind);
    localStorage.setItem("windCoefficients", JSON.stringify(sorted));
    onSave(sorted);
    alert("✅ Ветровые коэффициенты сохранены!");
  };

  const handleReset = () => {
    if (window.confirm("Сбросить к значениям по умолчанию?")) {
      setData(generateWindCoefficients());
    }
  };

  const handleChange = (index, field, value) => {
    const newData = [...data];
    newData[index][field] = parseFloat(value) || 0;
    setData(newData);
  };

  const handleAdd = () => setData([...data, { wind: 0, coefficient: 1.0 }]);
  const handleDelete = (index) => setData(data.filter((_, i) => i !== index));

  if (!isOpen || !data) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>💨 Ветровые коэффициенты</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            Закрыть
          </button>
        </div>
        <p style={{ color: "#666", fontSize: "0.9em", marginBottom: "15px" }}>
          Укажите повышающий/понижающий коэффициент для рам и связей в
          зависимости от ветрового давления. <b>Эталон: 38 кг/м² = 1.0</b>.
        </p>
        <button style={styles.addBtn} onClick={handleAdd}>
          + Добавить значение
        </button>

        <div>
          <div
            style={{
              display: "flex",
              fontWeight: "bold",
              padding: "0 10px 10px 10px",
              color: "#555",
            }}
          >
            <div style={{ flex: 1 }}>Ветер (кг/м²)</div>
            <div style={{ flex: 1 }}>Коэффициент</div>
            <div style={{ width: "40px" }}></div>
          </div>
          {data.map((item, index) => (
            <div key={index} style={styles.row}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  step="1"
                  style={styles.input}
                  value={item.wind}
                  onChange={(e) => handleChange(index, "wind", e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  step="0.01"
                  style={styles.input}
                  value={item.coefficient}
                  onChange={(e) =>
                    handleChange(index, "coefficient", e.target.value)
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
          ))}
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.saveBtn} onClick={handleSave}>
            💾 Сохранить
          </button>
          <button style={styles.resetBtn} onClick={handleReset}>
            🔄 Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}
