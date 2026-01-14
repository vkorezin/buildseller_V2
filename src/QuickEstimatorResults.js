import React from "react";

const styles = {
  resultsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginTop: "20px",
  },
  resultCard: {
    flex: "1 1 300px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: "8px",
    padding: "15px",
  },
  resultCardTotal: {
    flex: "1 1 100%",
    backgroundColor: "#e8f5e9",
    border: "1px solid #c8e6c9",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "0.95em",
    borderBottom: "1px dashed #ddd",
    paddingBottom: "3px",
  },
  resRowDetail: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
    fontSize: "0.85em",
    paddingLeft: "15px",
    color: "#666",
  },
  subHeader: {
    fontSize: "1em",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "10px",
    marginTop: "5px",
  },
  subPrice: {
    fontSize: "1.2em",
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    marginTop: "5px",
  },
  savings: {
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    color: "#155724",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9em",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default function QuickEstimatorResults({
  estimation,
  useSandwich,
  frameType,
}) {
  const showSavings =
    frameType === "truss" && Number(estimation.currentDiscount) > 0;

  return (
    <div style={styles.resultsContainer}>
      <div style={styles.resultCard}>
        <div style={styles.subHeader}>📊 Металлоконструкции</div>

        {/* Детализация металла */}
        <div style={styles.resRow}>
          <span>Рамы и колонны</span>
          <span>
            <b>{estimation.framesWeight} т</b>
          </span>
        </div>
        <div style={styles.resRowDetail}>
          <span>→ {estimation.framesRate} кг/м²</span>
          <span>{estimation.framesCost.toLocaleString()} ₽</span>
        </div>

        <div style={styles.resRow}>
          <span>Прогоны</span>
          <span>
            <b>{estimation.purlinsWeight} т</b>
          </span>
        </div>
        <div style={styles.resRowDetail}>
          <span>→ {estimation.purlinsRate} кг/м²</span>
          <span>{estimation.purlinsCost.toLocaleString()} ₽</span>
        </div>

        <div style={styles.resRow}>
          <span>Связи (~15%)</span>
          <span>
            <b>{estimation.tiesWeight} т</b>
          </span>
        </div>
        <div style={styles.resRowDetail}>
          <span>→ {estimation.tiesRate} кг/м²</span>
          <span>{estimation.tiesCost.toLocaleString()} ₽</span>
        </div>

        {estimation.craneSystemWeight && (
          <>
            <div style={styles.resRow}>
              <span>Крановая система</span>
              <span>
                <b>{estimation.craneSystemWeight} т</b>
              </span>
            </div>
            <div style={styles.resRowDetail}>
              <span>→ {estimation.craneInfo}</span>
              <span>{estimation.craneSystemCost.toLocaleString()} ₽</span>
            </div>
          </>
        )}

        <div
          style={{
            ...styles.resRow,
            borderTop: "2px solid #007bff",
            paddingTop: "8px",
            marginTop: "8px",
            fontSize: "1em",
          }}
        >
          <span>
            <strong>ИТОГО металл</strong>
          </span>
          <span>
            <b>{estimation.metalWeight} т</b>
          </span>
        </div>
        <div style={styles.resRowDetail}>
          <span>
            <strong>→ {estimation.metalRate} кг/м²</strong>
          </span>
          <span>
            <strong>
              {Math.round(estimation.metalCost).toLocaleString()} ₽
            </strong>
          </span>
        </div>

        {showSavings && (
          <div style={styles.savings}>
            <span style={{ fontSize: "1.2em" }}>💰</span>
            <span>
              <strong>Экономия по ферме:</strong> {estimation.currentDiscount}%
              ≈ {estimation.savingsAmount.toLocaleString()} ₽
            </span>
          </div>
        )}
      </div>

      {/* Фундаменты */}
      <div style={styles.resultCard}>
        <div style={styles.subHeader}>🏗️ Фундаменты (оценка)</div>
        <div style={styles.resRow}>
          <span>Кол-во опор</span>
          <span>
            <b>{estimation.foundationCount} шт</b>
          </span>
        </div>
        <div style={styles.resRow}>
          <span>Бетон М300</span>
          <span>
            <b>{estimation.concreteCubic} м³</b>
          </span>
        </div>
        <div style={styles.resRow}>
          <span>Арматура</span>
          <span>
            <b>{estimation.rebarWeight} т</b>
          </span>
        </div>
        <div style={styles.subPrice}>
          {estimation.foundationCost.toLocaleString()} ₽
        </div>
      </div>

      {useSandwich && (
        <div style={styles.resultCard}>
          <div style={styles.subHeader}>🏠 Ограждающие</div>
          <div style={styles.resRow}>
            <span>Стены</span>
            <span>
              <b>{estimation.wallAreaBox} м²</b>
            </span>
          </div>
          {estimation.openingsArea > 0 && (
            <div style={styles.resRowDetail}>
              <span>→ Вычтено проёмы</span>
              <span>-{estimation.openingsArea} м²</span>
            </div>
          )}
          <div style={styles.resRow}>
            <span>Фронтоны</span>
            <span>
              <b>{estimation.gableAreaTotal} м²</b>
            </span>
          </div>
          <div style={styles.resRow}>
            <span>Кровля</span>
            <span>
              <b>{estimation.roofArea} м²</b>
            </span>
          </div>
          <div
            style={{
              borderTop: "1px dashed #ccc",
              paddingTop: "5px",
              marginTop: "5px",
            }}
          >
            <div style={styles.resRow}>
              <span>Доборы</span>
              <span>
                <b>{estimation.trimCost.toLocaleString()} ₽</b>
              </span>
            </div>
          </div>
          <div style={styles.subPrice}>
            {(
              estimation.wallCost +
              estimation.roofCost +
              estimation.trimCost
            ).toLocaleString()}{" "}
            ₽
          </div>
        </div>
      )}

      <div style={styles.resultCardTotal}>
        <div>
          <div
            style={{ fontSize: "1.3em", fontWeight: "bold", color: "#28a745" }}
          >
            ИТОГО:
          </div>
          <div style={{ fontSize: "0.9em", color: "#666", marginTop: "5px" }}>
            Металл + {useSandwich ? "Ограждение + " : ""}Фундаменты
          </div>
        </div>
        <div>
          <div
            style={{ fontSize: "1.8em", fontWeight: "bold", color: "#28a745" }}
          >
            {estimation.totalCost} ₽
          </div>
        </div>
      </div>
    </div>
  );
}
