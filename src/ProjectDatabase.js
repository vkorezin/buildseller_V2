import React from "react";
import { parseProjectFile } from "./ProjectDatabaseUtils";

const styles = {
  container: { padding: "20px", fontFamily: "Arial, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderBottom: "2px solid #007bff",
    paddingBottom: "10px",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85em" },
  th: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: { border: "1px solid #ddd", padding: "6px" },
  input: {
    width: "100%",
    padding: "4px",
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: "3px",
  },
  button: {
    padding: "8px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    padding: "4px 8px",
    color: "white",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
  },
  fileInput: { display: "none" },
  smallText: { fontSize: "0.85em", color: "#555" },
  badge: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.8em",
    fontWeight: "bold",
    color: "#fff",
    marginRight: "5px",
  },
  iconCell: { fontSize: "1.2em", textAlign: "center", cursor: "pointer" },
};

export default function ProjectDatabase({ projects, setProjects, onBack }) {
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const newProject = parseProjectFile(text, file.name);
        if (newProject) {
          setProjects((prev) => [...prev, newProject]);
        }
      };
      // Пробуем читать с кодировкой (или авто, если UTF-8)
      try {
        reader.readAsText(file, "cp1251");
      } catch {
        reader.readAsText(file);
      }
    });
  };

  const updateProject = (id, field, value) => {
    setProjects(
      projects.map((p) => {
        if (p.id !== id) return p;
        const isNum = [
          "width",
          "length",
          "height",
          "mass",
          "slope",
          "snowRegion",
          "wallThick",
          "craneCapacity",
          "stories",
        ].includes(field);
        const isBool = ["hasCrane", "hasMezzanine"].includes(field);

        let updated = { ...p };
        if (isBool) updated[field] = value;
        else updated[field] = isNum ? parseFloat(value) : value;

        if (updated.width && updated.length && updated.mass) {
          updated.specificWeight =
            (updated.mass * 1000) / (updated.width * updated.length);
        } else {
          updated.specificWeight = 0;
        }
        return updated;
      })
    );
  };

  const deleteProject = (id) => {
    if (window.confirm("Удалить проект из базы?")) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const getWallBadge = (type, thick, ins) => {
    if (!type || type === "Не определено")
      return <span style={{ color: "#ccc" }}>-</span>;
    const color = type === "Сэндвич" ? "#28a745" : "#17a2b8";
    const letter = type === "Сэндвич" ? "S" : "P";
    return (
      <span title={`${type} ${thick}mm ${ins}`}>
        <span style={{ ...styles.badge, backgroundColor: color }}>
          {letter}
          {thick}
        </span>
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>📚 База Проектов (Expert)</h2>
        <button
          style={{ ...styles.button, backgroundColor: "#6c757d" }}
          onClick={onBack}
        >
          Назад
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={styles.button}>
          📥 Импорт CSV (TDSheet)
          <input
            type="file"
            multiple
            accept=".csv,.txt"
            onChange={handleFileUpload}
            style={styles.fileInput}
          />
        </label>
        <span style={{ marginLeft: "10px", color: "#666", fontSize: "0.9em" }}>
          Всего: {projects.length}
        </span>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Файл / Дата</th>
            <th style={styles.th} width="40" title="Кран">
              Кр
            </th>
            <th style={styles.th} width="40" title="Этажей">
              Эт
            </th>
            <th style={styles.th} width="50">
              Шир.
            </th>
            <th style={styles.th} width="50">
              Дл.
            </th>
            <th style={styles.th} width="40">
              Выс.
            </th>
            <th style={styles.th} width="100">
              Стены
            </th>
            <th style={styles.th}>Адрес</th>
            <th style={styles.th} width="60">
              Масса
            </th>
            <th style={styles.th} width="60" title="Удельный вес">
              кг/м²
            </th>
            <th style={styles.th} width="30"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td style={styles.td} title={p.name}>
                <div style={{ fontWeight: "bold" }}>
                  {p.name.substring(0, 10)}..
                </div>
                <div style={styles.smallText}>{p.date}</div>
              </td>

              <td style={styles.iconCell}>
                <input
                  type="checkbox"
                  checked={p.hasCrane}
                  onChange={(e) =>
                    updateProject(p.id, "hasCrane", e.target.checked)
                  }
                  title={
                    p.craneCapacity > 0 ? `ГПМ: ${p.craneCapacity}т` : "Кран"
                  }
                />
              </td>

              <td style={styles.td}>
                <input
                  type="number"
                  value={p.stories}
                  onChange={(e) =>
                    updateProject(p.id, "stories", e.target.value)
                  }
                  style={{
                    ...styles.input,
                    width: "40px",
                    textAlign: "center",
                  }}
                />
              </td>

              <td style={styles.td}>
                <input
                  type="number"
                  value={p.width}
                  onChange={(e) => updateProject(p.id, "width", e.target.value)}
                  style={styles.input}
                />
              </td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={p.length}
                  onChange={(e) =>
                    updateProject(p.id, "length", e.target.value)
                  }
                  style={styles.input}
                />
              </td>
              <td style={styles.td}>
                <input
                  type="number"
                  value={p.height}
                  onChange={(e) =>
                    updateProject(p.id, "height", e.target.value)
                  }
                  style={styles.input}
                />
              </td>

              <td style={styles.td}>
                {getWallBadge(p.wallType, p.wallThick, p.wallInsulation)}
              </td>

              <td style={styles.td}>
                <div
                  style={{
                    ...styles.smallText,
                    maxWidth: "120px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                  title={p.address}
                >
                  {p.address || "-"}
                </div>
              </td>

              <td style={styles.td}>
                <div
                  title={`Сварка: ${p.massWelded}т\nПрокат: ${p.massRolled}т\nПрофиль: ${p.massProfiles}т\nТруба: ${p.massPipe}т`}
                >
                  <input
                    type="number"
                    value={p.mass}
                    onChange={(e) =>
                      updateProject(p.id, "mass", e.target.value)
                    }
                    style={{ ...styles.input, fontWeight: "bold" }}
                  />
                </div>
              </td>

              <td
                style={{
                  ...styles.td,
                  backgroundColor: "#e8f5e9",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {p.specificWeight ? p.specificWeight.toFixed(1) : "-"}
              </td>

              <td style={{ ...styles.td, textAlign: "center" }}>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteProject(p.id)}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
