import React from "react";

export default function FormColumn({
  editMode,
  handleBakeGrid,
  handleDeleteSelected,
  selectedCount,
  allAxes,
  toolSettings,
  onToolChange,
  onToolApply,
  generalData,
  spanCount,
  spans,
  columnStep,
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

  return (
    <div style={styles.formContainer}>
      {/* --- БЛОК 1: ГЕОМЕТРИЯ --- */}
      <div
        style={{
          opacity: isWizardLocked ? 0.6 : 1,
          pointerEvents: isWizardLocked ? "none" : "auto",
        }}
      >
        <h2 style={styles.h2}>Этап 1.1: Геометрия Сетки</h2>

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

      {/* --- БЛОК 2: РАЗРЕЗ --- */}
      <div>
        <h2 style={styles.h2}>Этап 1.2: Настройки Разреза</h2>
        <div style={styles.mainBlock}>
          <label style={styles.label}>Высота по умолчанию (H), м:</label>
          <input
            name="blockHeight"
            type="number"
            value={generalData.blockHeight}
            onChange={handleGeneralChange}
            style={styles.input}
          />
        </div>

        {spans.map((span, index) => (
          <div key={`section-${span.id}`} style={styles.spanCard}>
            <h3 style={styles.h3}>Настройки разреза: Пролет {index + 1}</h3>
            <div style={styles.blockCardBody}>
              <label style={styles.label}>Высота карниза, м:</label>
              <input
                name="eaveHeight"
                type="number"
                value={span.eaveHeight}
                onChange={(e) => handleSpanChange(index, e)}
                style={styles.input}
              />

              <label style={styles.label}>Уклон кровли, %:</label>
              <input
                name="slope"
                type="number"
                value={span.slope}
                onChange={(e) => handleSpanChange(index, e)}
                style={styles.input}
              />

              <label style={styles.label}>Отметка базы, м:</label>
              <input
                name="baseElevation"
                type="number"
                value={span.baseElevation}
                onChange={(e) => handleSpanChange(index, e)}
                style={styles.input}
              />

              <label style={styles.label}>Кол-во скатов:</label>
              <select
                name="skateCount"
                value={span.skateCount}
                onChange={(e) => handleSpanChange(index, e)}
                style={styles.select}
              >
                <option value={1}>1 (Односкатная)</option>
                <option value={2}>2 (Двускатная)</option>
              </select>

              {span.skateCount === 1 && (
                <>
                  <label style={styles.label}>Напр. уклона:</label>
                  <select
                    name="slopeDirection"
                    value={span.slopeDirection || "right"}
                    onChange={(e) => handleSpanChange(index, e)}
                    style={styles.select}
                  >
                    <option value="right">Вправо ( ↗ )</option>
                    <option value="left">Влево ( ↖ )</option>
                  </select>
                </>
              )}
              {span.skateCount === 2 && (
                <>
                  <label style={styles.label}>Длина ската 1, м:</label>
                  <input
                    name="skate1Length"
                    type="number"
                    value={span.skate1Length}
                    onChange={(e) => handleSpanChange(index, e)}
                    style={styles.input}
                  />
                </>
              )}
            </div>

            <h4 style={{ ...styles.h3, fontSize: "1em", marginTop: "15px" }}>
              Кран-балки
            </h4>
            {span.cranes &&
              span.cranes.map((c) => (
                <div key={c.id} style={styles.subCard}>
                  <div style={styles.subCardHeader}>
                    <strong>Кран</strong>
                    <button
                      style={styles.subDeleteButton}
                      onClick={() => handleCraneDelete(index, c.id)}
                    >
                      Del
                    </button>
                  </div>
                  <div style={styles.subGrid}>
                    <label>Грузоподъемность:</label>
                    <select
                      style={styles.select}
                      value={c.selectedCapacity}
                      onChange={(e) =>
                        handleCraneChange(index, c.id, e.target.value)
                      }
                    >
                      {availableCapacities.map((cap) => (
                        <option key={cap} value={cap}>
                          {cap} т
                        </option>
                      ))}
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
        ))}
      </div>

      {/* --- РУЧНАЯ ДОРАБОТКА --- */}
      {editMode === "wizard" && (
        <div style={styles.formGroup}>
          <p>Сетка будет сгенерирована автоматически...</p>
          <button
            style={{ ...styles.button, width: "100%" }}
            onClick={handleBakeGrid}
          >
            ➡️ ЗАПЕЧЬ СЕТКУ (Ручной режим)
          </button>
        </div>
      )}

      {editMode === "manual" && (
        <div>
          <h2 style={styles.h2}>Этап 1.3: Ручная доработка</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Ручное выделение:</label>
            <p style={{ margin: "0 0 10px 0" }}>Выделено: {selectedCount}</p>
            <button
              style={styles.deleteButton}
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0}
            >
              Удалить выделенное
            </button>
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
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
