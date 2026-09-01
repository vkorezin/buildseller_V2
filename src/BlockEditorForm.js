import React, { useState } from "react";
import { computeSpanRoofHeights, slopePctToDegrees } from "./BlockEditorUtils";

export default function FormColumn({
  editMode,
  handleBakeGrid,
  handleDeleteSelected,
  onClearSelection,
  onSelectAll,
  onRestoreAll,
  onResetToWizard,
  selectedCount,
  allAxes,
  toolSettings,
  onToolChange,
  onToolApply,
  generalData,
  spanCount,
  spans,
  columnStep,
  frameType = "beam",
  handleFrameTypeChange,
  validation,
  styles,
  handleGeneralChange,
  handleSpanCountChange,
  handleSpanChange,
  handleColumnStepChange,
  availableCapacities,
  handleCraneAdd,
  handleCraneChange,
  handleCraneDelete,
}) {
  const isWizardLocked = editMode === "manual";
  const lockedInputStyle = {
    ...styles.input,
    backgroundColor: "#eee",
    color: "#777",
  };

  const [openSections, setOpenSections] = useState({
    grid: true,
    section: true,
    manual: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const accordionHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: "8px 12px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    marginBottom: "10px",
    userSelect: "none",
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "0.98em",
  };

  return (
    <div style={{ width: "100%" }}>
      {/* --- БЛОК 1: ГЕОМЕТРИЯ --- */}
      <div
        style={{
          opacity: isWizardLocked ? 0.6 : 1,
          pointerEvents: isWizardLocked ? "none" : "auto",
          marginBottom: "16px",
        }}
      >
        <div
          style={accordionHeaderStyle}
          onClick={() => toggleSection("grid")}
          title="Нажмите чтобы свернуть/развернуть раздел"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📐</span>
            <span>Этап 1.1: Геометрия Сетки</span>
            <span
              style={{
                fontSize: "0.78em",
                backgroundColor: "#e2e8f0",
                padding: "2px 6px",
                borderRadius: "10px",
                fontWeight: "normal",
                color: "#475569",
              }}
            >
              {generalData.blockWidth || 0}×{generalData.blockLength || 0}м ({spans.length} прол.)
            </span>
          </div>
          <span style={{ fontSize: "0.85em", color: "#64748b" }}>
            {openSections.grid ? "▲ Свернуть" : "▼ Развернуть"}
          </span>
        </div>

        {openSections.grid && (
          <div>
            <div style={styles.mainBlock}>
              <label style={styles.label}>Ширина блока, м (п. 1)</label>
              <input
                name="blockWidth"
                type="number"
                value={generalData.blockWidth}
                onChange={handleGeneralChange}
                style={isWizardLocked ? lockedInputStyle : styles.input}
                readOnly={isWizardLocked}
              />

              <label style={styles.label}>Длина блока, м (п. 2)</label>
              <input
                name="blockLength"
                type="number"
                value={generalData.blockLength}
                onChange={handleGeneralChange}
                style={isWizardLocked ? lockedInputStyle : styles.input}
                readOnly={isWizardLocked}
              />
            </div>

            {!validation.isWidthValid && (
              <div style={styles.errorBox}>
                Ошибка: Сумма ширин пролетов не совпадает с общей шириной!
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Кол-во свободных пролетов (п. 4)</label>
              <input
                name="spanCount"
                type="number"
                value={spanCount}
                onChange={handleSpanCountChange}
                style={isWizardLocked ? lockedInputStyle : styles.input}
                readOnly={isWizardLocked}
              />
            </div>

            {spans.map((span, index) => (
              <div
                key={`width-${span.id}`}
                style={{
                  ...styles.spanCard,
                  opacity: isWizardLocked ? 0.6 : 1,
                  pointerEvents: isWizardLocked ? "none" : "auto",
                }}
              >
                <h3 style={styles.h3}>Настройки сетки: Пролет {index + 1}</h3>
                <div style={styles.blockCardBody}>
                  <label style={styles.label}>Ширина пролета, м:</label>
                  <input
                    name="spanWidth"
                    type="number"
                    value={span.spanWidth}
                    onChange={(e) => handleSpanChange(index, e)}
                    style={isWizardLocked ? lockedInputStyle : styles.input}
                    readOnly={isWizardLocked}
                  />
                </div>
              </div>
            ))}

            <div style={styles.formGroup}>
              <label style={styles.label}>Шаг основных колонн, м (п. 13)</label>
              <input
                name="columnStep"
                type="number"
                value={columnStep}
                onChange={handleColumnStepChange}
                style={isWizardLocked ? lockedInputStyle : styles.input}
                readOnly={isWizardLocked}
              />
            </div>

            {validation.layoutInfo && (
              <div style={styles.infoBox}>
                <b>Раскладка: </b>
                {validation.layoutInfo.type === "even"
                  ? `Равномерная (${validation.layoutInfo.frameCount} x ${columnStep}м)`
                  : `Симметричная (Торцы: ${validation.layoutInfo.endStep.toFixed(
                      2
                    )}м, Центр: ${
                      validation.layoutInfo.middleFrameCount
                    } x ${columnStep}м)`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- БЛОК 2: РАЗРЕЗ --- */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={accordionHeaderStyle}
          onClick={() => toggleSection("section")}
          title="Нажмите чтобы свернуть/развернуть раздел"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🏗️</span>
            <span>Этап 1.2: Настройки Разреза</span>
            <span
              style={{
                fontSize: "0.78em",
                backgroundColor: "#e2e8f0",
                padding: "2px 6px",
                borderRadius: "10px",
                fontWeight: "normal",
                color: "#475569",
              }}
            >
              H={generalData.blockHeight}м • {frameType === "truss" ? "Ферма" : "Балка"}
            </span>
          </div>
          <span style={{ fontSize: "0.85em", color: "#64748b" }}>
            {openSections.section ? "▲ Свернуть" : "▼ Развернуть"}
          </span>
        </div>

        {openSections.section && (
          <div>
            <div style={styles.mainBlock}>
              <label style={styles.label}>Высота по умолчанию (H), м:</label>
              <input
                name="blockHeight"
                type="number"
                value={generalData.blockHeight}
                onChange={handleGeneralChange}
                style={styles.input}
              />

              <label style={{ ...styles.label, marginTop: "10px" }}>
                Тип несущей конструкции покрытия (по умолчанию):
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  name="frameType"
                  value={frameType || "beam"}
                  onChange={(e) =>
                    handleFrameTypeChange && handleFrameTypeChange(e.target.value)
                  }
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="beam">Балка переменного сечения</option>
                  <option value="truss">Ферма (ГСП / уголки)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const targetType = (frameType === "truss" ? "beam" : "truss");
                    handleFrameTypeChange && handleFrameTypeChange(targetType);
                  }}
                  style={{
                    padding: "6px 10px",
                    fontSize: "0.8em",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#334155",
                    whiteSpace: "nowrap",
                  }}
                  title="Переключить все пролёты"
                >
                  Все {frameType === "truss" ? "Балки" : "Фермы"}
                </button>
              </div>
            </div>

            {spans.map((span, index) => {
              const geo = computeSpanRoofHeights(span);
              const deg = slopePctToDegrees(geo.slope);
              const isGable = Number(span.skateCount) === 2;
              const lock = geo.lockParam; // "none" | "eave" | "ridge" | "slope"
              const spanFrameType = span.frameType || frameType || "beam";
              const isSpanTruss = String(spanFrameType) === "truss";
              const peakLabel = isGable
                ? "Высота конька (верх), м"
                : "Высота высокой части (верх), м";

              const toggleLock = (param) => {
                const nextLock = lock === param ? "none" : param;
                handleSpanChange(index, "lockParam", nextLock);
              };

              const lockBtnStyle = (isActive) => ({
                padding: "3px 8px",
                fontSize: "0.76em",
                borderRadius: "4px",
                border: isActive ? "1px solid #0969da" : "1px solid #d0d7de",
                backgroundColor: isActive ? "#ddf4ff" : "#f6f8fa",
                color: isActive ? "#0969da" : "#57606a",
                cursor: "pointer",
                fontWeight: isActive ? "700" : "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                transition: "all 0.15s ease",
              });

              return (
                <div key={`section-${span.id}`} style={styles.spanCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ ...styles.h3, margin: 0 }}>
                        Пролёт {index + 1} ({geo.W} м)
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          handleSpanChange(
                            index,
                            "frameType",
                            isSpanTruss ? "beam" : "truss"
                          )
                        }
                        style={{
                          fontSize: "0.75em",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          backgroundColor: isSpanTruss ? "#eff6ff" : "#f0fdf4",
                          color: isSpanTruss ? "#1d4ed8" : "#15803d",
                          border: `1px solid ${isSpanTruss ? "#93c5fd" : "#86efac"}`,
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Нажмите для быстрого переключения типа покрытия (Балка / Ферма)"
                      >
                        <span>{isSpanTruss ? "📐 Ферма" : "🏢 Балка"}</span>
                        <span style={{ fontSize: "0.85em", opacity: 0.7 }}>⇄</span>
                      </button>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75em",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        backgroundColor:
                          lock === "none" ? "#f1f5f9" : "#e0f2fe",
                        color: lock === "none" ? "#64748b" : "#0369a1",
                        fontWeight: "600",
                      }}
                    >
                      {lock === "eave" && "🔒 Зафиксирован карниз"}
                      {lock === "ridge" &&
                        `🔒 Зафиксирован ${isGable ? "конёк" : "верх"}`}
                      {lock === "slope" && "🔒 Зафиксирован уклон"}
                      {lock === "none" && "🔓 Авто (равномерно)"}
                    </span>
                  </div>

                  {/* Селектор типа несущей конструкции покрытия для пролёта */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      backgroundColor: "#f8fafc",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontSize: "0.82em", fontWeight: "600", color: "#334155" }}>
                      Конструкция покрытия:
                    </span>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "2px",
                        backgroundColor: "#e2e8f0",
                        padding: "2px",
                        borderRadius: "5px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSpanChange(index, "frameType", "beam")}
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.78em",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: !isSpanTruss ? "700" : "500",
                          backgroundColor: !isSpanTruss ? "#0969da" : "transparent",
                          color: !isSpanTruss ? "#ffffff" : "#475569",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        🏢 Балка
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpanChange(index, "frameType", "truss")}
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.78em",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: isSpanTruss ? "700" : "500",
                          backgroundColor: isSpanTruss ? "#0969da" : "transparent",
                          color: isSpanTruss ? "#ffffff" : "#475569",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        📐 Ферма
                      </button>
                    </div>
                  </div>

                  {/* Быстрый селектор фиксации параметров: равномерные 4 кнопки */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "4px",
                      marginBottom: "12px",
                      backgroundColor: "#f8fafc",
                      padding: "4px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSpanChange(index, "lockParam", "none")}
                      style={{
                        ...lockBtnStyle(lock === "none"),
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
                      title="Без фиксации: при изменении уклона высоты меняются равномерно"
                    >
                      🔓 Авто
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLock("eave")}
                      style={{
                        ...lockBtnStyle(lock === "eave"),
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
                      title="Зафиксировать высоту карниза"
                    >
                      {lock === "eave" ? "🔒" : "🔓"} Карниз
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLock("ridge")}
                      style={{
                        ...lockBtnStyle(lock === "ridge"),
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
                      title={`Зафиксировать высоту ${isGable ? "конька" : "высокой части"}`}
                    >
                      {lock === "ridge" ? "🔒" : "🔓"} {isGable ? "Конёк" : "Верх"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLock("slope")}
                      style={{
                        ...lockBtnStyle(lock === "slope"),
                        justifyContent: "center",
                        whiteSpace: "nowrap",
                      }}
                      title="Зафиксировать уклон кровли"
                    >
                      {lock === "slope" ? "🔒" : "🔓"} Уклон
                    </button>
                  </div>

                  {/* Равномерная 2-колоночная сетка для всех полей (50% / 50%) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "10px 12px",
                      alignItems: "start",
                    }}
                  >
                    {/* 1. Карниз (низ) */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          minHeight: "22px",
                        }}
                      >
                        <label
                          style={{
                            ...styles.label,
                            margin: 0,
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Высота карниза (низ), м:
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleLock("eave")}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "0.9em",
                            padding: "0 2px",
                            flexShrink: 0,
                          }}
                          title={
                            lock === "eave"
                              ? "Карниз зафиксирован (нажмите чтобы снять)"
                              : "Нажмите чтобы зафиксировать карниз"
                          }
                        >
                          {lock === "eave" ? "🔒" : "🔓"}
                        </button>
                      </div>
                      <input
                        name="eaveHeight"
                        type="number"
                        step="0.05"
                        value={span.eaveHeight !== undefined ? span.eaveHeight : geo.eaveH}
                        onChange={(e) => handleSpanChange(index, "eaveHeight", e.target.value)}
                        style={{
                          ...styles.input,
                          borderColor: lock === "eave" ? "#0969da" : undefined,
                          backgroundColor: lock === "eave" ? "#f0f8ff" : undefined,
                        }}
                      />
                      <div
                        style={{
                          fontSize: "0.74em",
                          color: "#64748b",
                          marginTop: "3px",
                          minHeight: "16px",
                        }}
                      >
                        Низ: {geo.eaveH.toFixed(2)} м
                      </div>
                    </div>

                    {/* 2. Конёк / Верхняя точка */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          minHeight: "22px",
                        }}
                      >
                        <label
                          style={{
                            ...styles.label,
                            margin: 0,
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {peakLabel}:
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleLock("ridge")}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "0.9em",
                            padding: "0 2px",
                            flexShrink: 0,
                          }}
                          title={
                            lock === "ridge"
                              ? `${isGable ? "Конёк" : "Верх"} зафиксирован`
                              : `Нажмите чтобы зафиксировать ${isGable ? "конёк" : "верх"}`
                          }
                        >
                          {lock === "ridge" ? "🔒" : "🔓"}
                        </button>
                      </div>
                      <input
                        name="ridgeHeight"
                        type="number"
                        step="0.05"
                        value={geo.peakH}
                        onChange={(e) => handleSpanChange(index, "ridgeHeight", e.target.value)}
                        style={{
                          ...styles.input,
                          borderColor: lock === "ridge" ? "#0969da" : undefined,
                          backgroundColor: lock === "ridge" ? "#f0f8ff" : undefined,
                        }}
                      />
                      <div
                        style={{
                          fontSize: "0.74em",
                          color: "#64748b",
                          marginTop: "3px",
                          display: "flex",
                          justifyContent: "space-between",
                          minHeight: "16px",
                        }}
                      >
                        <span>Подъем ΔH:</span>
                        <strong>+{geo.rise.toFixed(2)} м</strong>
                      </div>
                    </div>

                    {/* 3. Уклон кровли */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          minHeight: "22px",
                        }}
                      >
                        <label
                          style={{
                            ...styles.label,
                            margin: 0,
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Уклон кровли, %:
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: "0.72em",
                              color: "#0369a1",
                              backgroundColor: "#e0f2fe",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {deg}° (1:{geo.slope > 0 ? (100 / geo.slope).toFixed(1) : "—"})
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleLock("slope")}
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: "0.9em",
                              padding: "0 2px",
                            }}
                            title={
                              lock === "slope"
                                ? "Уклон зафиксирован"
                                : "Нажмите чтобы зафиксировать уклон"
                            }
                          >
                            {lock === "slope" ? "🔒" : "🔓"}
                          </button>
                        </div>
                      </div>
                      <input
                        name="slope"
                        type="number"
                        step="0.5"
                        value={span.slope}
                        onChange={(e) => handleSpanChange(index, "slope", e.target.value)}
                        style={{
                          ...styles.input,
                          borderColor: lock === "slope" ? "#0969da" : undefined,
                          backgroundColor: lock === "slope" ? "#f0f8ff" : undefined,
                        }}
                      />
                      <div
                        style={{
                          fontSize: "0.74em",
                          color: "#64748b",
                          marginTop: "3px",
                          minHeight: "16px",
                        }}
                      >
                        Уклон: {span.slope}% ({deg}°)
                      </div>
                    </div>

                    {/* 4. Отметка базы колонн */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          minHeight: "22px",
                        }}
                      >
                        <label
                          style={{
                            ...styles.label,
                            margin: 0,
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Отметка базы колонн, м:
                        </label>
                      </div>
                      <input
                        name="baseElevation"
                        type="number"
                        step="0.05"
                        value={
                          span.baseElevation !== undefined &&
                          span.baseElevation !== null
                            ? span.baseElevation
                            : 0
                        }
                        onChange={(e) => handleSpanChange(index, "baseElevation", e.target.value)}
                        style={styles.input}
                        placeholder="0.00"
                      />
                      <div
                        style={{
                          fontSize: "0.74em",
                          color: "#64748b",
                          marginTop: "3px",
                          minHeight: "16px",
                        }}
                      >
                        База колонн: {Number(span.baseElevation || 0).toFixed(2)} м
                      </div>
                    </div>

                    {/* 5. Скаты кровли */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "4px",
                          minHeight: "22px",
                        }}
                      >
                        <label
                          style={{
                            ...styles.label,
                            margin: 0,
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Кол-во скатов:
                        </label>
                      </div>
                      <select
                        name="skateCount"
                        value={span.skateCount}
                        onChange={(e) => handleSpanChange(index, "skateCount", e.target.value)}
                        style={styles.select}
                      >
                        <option value={1}>1 (Односкатная)</option>
                        <option value={2}>2 (Двускатная)</option>
                      </select>
                      <div
                        style={{
                          fontSize: "0.74em",
                          color: "#64748b",
                          marginTop: "3px",
                          minHeight: "16px",
                        }}
                      >
                        {isGable ? "Двускатная кровля" : "Односкатная кровля"}
                      </div>
                    </div>

                    {/* 6. Положение конька / Направление уклона */}
                    {span.skateCount === 1 ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                            minHeight: "22px",
                          }}
                        >
                          <label
                            style={{
                              ...styles.label,
                              margin: 0,
                              fontSize: "0.85em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Напр. уклона:
                          </label>
                        </div>
                        <select
                          name="slopeDirection"
                          value={span.slopeDirection || "right"}
                          onChange={(e) =>
                            handleSpanChange(index, "slopeDirection", e.target.value)
                          }
                          style={styles.select}
                        >
                          <option value="right">Вправо ( ↗ )</option>
                          <option value="left">Влево ( ↖ )</option>
                        </select>
                        <div
                          style={{
                            fontSize: "0.74em",
                            color: "#64748b",
                            marginTop: "3px",
                            minHeight: "16px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={
                            span.slopeDirection === "left"
                              ? `↖ Справа ${geo.eaveH.toFixed(2)}м → Слева ${geo.peakH.toFixed(2)}м`
                              : `↗ Слева ${geo.eaveH.toFixed(2)}м → Справа ${geo.peakH.toFixed(2)}м`
                          }
                        >
                          {span.slopeDirection === "left"
                            ? `↖ Справа ${geo.eaveH.toFixed(2)}м → Слева ${geo.peakH.toFixed(2)}м`
                            : `↗ Слева ${geo.eaveH.toFixed(2)}м → Справа ${geo.peakH.toFixed(2)}м`}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                            minHeight: "22px",
                          }}
                        >
                          <label
                            style={{
                              ...styles.label,
                              margin: 0,
                              fontSize: "0.85em",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Положение конька, м:
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleSpanChange(index, "skate1Length", geo.W / 2)
                            }
                            style={{
                              border: "none",
                              backgroundColor: "#f1f5f9",
                              fontSize: "0.72em",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              color: "#0969da",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                            title="Сделать конек строго по центру пролета"
                          >
                            Центр: {(geo.W / 2).toFixed(2)}м
                          </button>
                        </div>
                        <input
                          name="skate1Length"
                          type="number"
                          step="0.1"
                          value={
                            span.skate1Length !== undefined
                              ? span.skate1Length
                              : geo.W / 2
                          }
                          onChange={(e) =>
                            handleSpanChange(index, "skate1Length", e.target.value)
                          }
                          style={styles.input}
                        />
                        <div
                          style={{
                            fontSize: "0.74em",
                            color: "#64748b",
                            marginTop: "3px",
                            display: "flex",
                            justifyContent: "space-between",
                            minHeight: "16px",
                          }}
                        >
                          <span>Скат 1: {geo.Leff.toFixed(2)} м</span>
                          <span>Скат 2: {(geo.W - geo.Leff).toFixed(2)} м</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <h4 style={{ ...styles.h3, fontSize: "1em", marginTop: "15px" }}>
                    Кран-балки
                  </h4>
                  {span.cranes &&
                    span.cranes.map((c) => (
                      <div key={c.id} style={styles.subCard}>
                        <div style={styles.subCardHeader}>
                          <strong>
                            Кран {c.selectedCapacity || 0} т (
                            {c.type === "suspension" ? "Подвесной" : "Опорный"})
                          </strong>
                          <button
                            style={styles.subDeleteButton}
                            onClick={() => handleCraneDelete(index, c.id)}
                          >
                            Del
                          </button>
                        </div>
                        <div style={styles.subGrid}>
                          <label>Тип крана:</label>
                          <select
                            style={styles.select}
                            value={c.type || "support"}
                            onChange={(e) =>
                              handleCraneChange(index, c.id, "type", e.target.value)
                            }
                          >
                            <option value="support">Опорный</option>
                            <option value="suspension">Подвесной</option>
                          </select>

                          <label>Грузоподъемность:</label>
                          <select
                            style={styles.select}
                            value={c.selectedCapacity}
                            onChange={(e) =>
                              handleCraneChange(
                                index,
                                c.id,
                                "selectedCapacity",
                                e.target.value
                              )
                            }
                          >
                            {availableCapacities && availableCapacities.length > 0
                              ? availableCapacities.map((cap) => (
                                  <option key={cap} value={cap}>
                                    {cap} т
                                  </option>
                                ))
                              : [1, 2, 3.2, 5, 10, 12.5, 16, 20, 32].map(
                                  (cap) => (
                                    <option key={cap} value={cap}>
                                      {cap} т
                                    </option>
                                  )
                                )}
                          </select>
                        </div>
                      </div>
                    ))}
                  <button
                    style={styles.subAddButton}
                    onClick={() => handleCraneAdd(index)}
                  >
                    + Добавить кран
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- РУЧНАЯ ДОРАБОТКА --- */}
      {editMode === "wizard" && (
        <div style={styles.formGroup}>
          <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>
            Сетка будет сгенерирована автоматически по заданным шагам.
          </p>
          <button
            style={{ ...styles.button, width: "100%" }}
            onClick={handleBakeGrid}
          >
            ➡️ ЗАПЕЧЬ СЕТКУ (Ручной режим)
          </button>
        </div>
      )}

      {editMode === "manual" && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={accordionHeaderStyle}
            onClick={() => toggleSection("manual")}
            title="Нажмите чтобы свернуть/развернуть раздел"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🛠️</span>
              <span>Этап 1.3: Ручная доработка сетки</span>
              <span
                style={{
                  fontSize: "0.78em",
                  backgroundColor: "#fee2e2",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontWeight: "normal",
                  color: "#991b1b",
                }}
              >
                Выделено: {selectedCount}
              </span>
            </div>
            <span style={{ fontSize: "0.85em", color: "#64748b" }}>
              {openSections.manual ? "▲ Свернуть" : "▼ Развернуть"}
            </span>
          </div>

          {openSections.manual && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ручное выделение на чертеже плана:</label>
                <p style={{ margin: "0 0 10px 0", color: "#475569", fontSize: "0.9em" }}>
                  Выделено колонн: <b>{selectedCount}</b> (кликните по колонне на плане для выделения/восстановления)
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <button
                    type="button"
                    style={{ ...styles.deleteButton, flex: 1, minWidth: "160px" }}
                    onClick={handleDeleteSelected}
                    disabled={selectedCount === 0}
                  >
                    🗑️ Удалить выделенные ({selectedCount})
                  </button>
                  {selectedCount > 0 && onClearSelection && (
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}
                      onClick={onClearSelection}
                    >
                      Снять
                    </button>
                  )}
                  {onSelectAll && (
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1" }}
                      onClick={onSelectAll}
                    >
                      Выделить все
                    </button>
                  )}
                  {onRestoreAll && (
                    <button
                      type="button"
                      style={{ ...styles.button, backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}
                      onClick={onRestoreAll}
                    >
                      Восстановить все
                    </button>
                  )}
                </div>
                {onResetToWizard && (
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      fontSize: "0.82em",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                    onClick={onResetToWizard}
                  >
                    ↺ Сбросить в автоматический режим (Wizard)
                  </button>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Массовое редактирование:</label>
                <div style={styles.toolGrid}>
                  <select
                    name="mode"
                    value={toolSettings.mode}
                    onChange={onToolChange}
                    style={styles.select}
                  >
                    <option value="remove">Удалить</option>
                    <option value="add">Добавить</option>
                  </select>
                  <select
                    name="axis"
                    value={toolSettings.axis}
                    onChange={onToolChange}
                    style={styles.select}
                  >
                    <optgroup label="Оси X">
                      {allAxes.xAxis.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Оси Y">
                      {allAxes.yAxis.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div style={styles.toolGrid}>
                  <select
                    name="rule"
                    value={toolSettings.rule}
                    onChange={onToolChange}
                    style={styles.select}
                  >
                    <option value="every">Каждую N-ю</option>
                    <option value="list">Список</option>
                  </select>
                  {toolSettings.rule === "every" ? (
                    <input
                      name="everyN"
                      type="number"
                      value={toolSettings.everyN}
                      onChange={onToolChange}
                      style={styles.input}
                    />
                  ) : (
                    <input
                      name="list"
                      type="text"
                      value={toolSettings.list}
                      onChange={onToolChange}
                      style={styles.input}
                      placeholder="1, 3"
                    />
                  )}
                </div>
                <button
                  style={{ ...styles.button, width: "100%", marginTop: "10px" }}
                  onClick={onToolApply}
                >
                  Применить массовую операцию
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
