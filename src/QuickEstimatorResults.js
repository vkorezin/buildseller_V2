import React from "react";

export default function QuickEstimatorResults({
  estimation,
  useSandwich,
  frameType,
}) {
  if (!estimation) return null;

  const styles = {
    container: {
      marginTop: "30px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      fontFamily: "Arial, sans-serif",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "20px",
    },
    card: {
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #e9ecef",
      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    },
    cardTitle: {
      margin: "0 0 15px 0",
      fontSize: "1.2em",
      color: "#007bff",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      borderBottom: "1px solid #dee2e6",
      paddingBottom: "10px",
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "5px",
      fontSize: "1.05em",
    },
    subRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      fontSize: "0.9em",
      color: "#6c757d",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "15px",
      paddingTop: "15px",
      borderTop: "2px solid #007bff",
      fontWeight: "bold",
      fontSize: "1.15em",
    },
    savingsBox: {
      marginTop: "15px",
      backgroundColor: "#d4edda",
      color: "#155724",
      padding: "12px",
      borderRadius: "6px",
      fontWeight: "bold",
      border: "1px solid #c3e6cb",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    envelopeWarning: {
      display: "flex",
      justifyContent: "space-between",
      color: "#d9534f",
      fontWeight: "bold",
      marginTop: "10px",
      paddingTop: "10px",
      borderTop: "1px dashed #d9534f",
    },
    finalTotalCard: {
      backgroundColor: "#343a40",
      color: "white",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      fontSize: "1.5em",
      fontWeight: "bold",
      boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    },
    netSavingsCard: {
      backgroundColor: "#e8f5e9",
      border: "2px solid #4caf50",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      marginTop: "10px",
    },
    pdfBtn: {
      display: "block",
      width: "100%",
      padding: "15px",
      marginTop: "20px",
      backgroundColor: "#ffc107",
      color: "#212529",
      border: "none",
      borderRadius: "8px",
      fontSize: "1.2em",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      transition: "background 0.2s",
    },
  };

  const netSavings =
    estimation.savingsAmount - (estimation.envelopeDiffAmount || 0);

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {/* КАРТОЧКА: Металлоконструкции */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Металлоконструкции</h3>

          <div style={styles.row}>
            <span>Рамы и колонны</span>
            <b>{estimation.framesWeight} т</b>
          </div>
          <div style={styles.subRow}>
            <span>→ {estimation.framesRate} кг/м²</span>
            <span>{estimation.framesCost.toLocaleString("ru-RU")} ₽</span>
          </div>

          <div style={styles.row}>
            <span>Прогоны</span>
            <b>{estimation.purlinsWeight} т</b>
          </div>
          <div style={styles.subRow}>
            <span>→ {estimation.purlinsRate} кг/м²</span>
            <span>{estimation.purlinsCost.toLocaleString("ru-RU")} ₽</span>
          </div>

          <div style={styles.row}>
            <span>Связи (~9.8%)</span>
            <b>{estimation.tiesWeight} т</b>
          </div>
          <div style={styles.subRow}>
            <span>→ {estimation.tiesRate} кг/м²</span>
            <span>{estimation.tiesCost.toLocaleString("ru-RU")} ₽</span>
          </div>

          {estimation.craneSystemWeight && (
            <>
              <div style={styles.row}>
                <span>Крановые пути</span>
                <b>{estimation.craneSystemWeight} т</b>
              </div>
              <div style={styles.subRow}>
                <span>{estimation.craneInfo}</span>
                <span>
                  {estimation.craneSystemCost.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </>
          )}

          <div style={styles.totalRow}>
            <span>ИТОГО металл</span>
            <span>{estimation.metalWeight} т</span>
          </div>
          <div style={styles.subRow}>
            <span>→ {estimation.metalRate} кг/м²</span>
            <b style={{ color: "#333", fontSize: "1.1em" }}>
              {estimation.metalCost.toLocaleString("ru-RU")} ₽
            </b>
          </div>

          {frameType === "truss" && estimation.savingsAmount > 0 && (
            <div style={styles.savingsBox}>
              💰 Экономия по ферме: {estimation.currentDiscount}% ≈{" "}
              {estimation.savingsAmount.toLocaleString("ru-RU")} ₽
            </div>
          )}
        </div>

        {/* КАРТОЧКА: Фундаменты */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏗️ Фундаменты (оценка)</h3>

          <div style={styles.row}>
            <span>Кол-во опор</span>
            <b>{estimation.foundationCount} шт</b>
          </div>
          <div style={{ ...styles.row, marginTop: "15px" }}>
            <span>Бетон М300</span>
            <b>{estimation.concreteCubic} м³</b>
          </div>
          <div style={styles.row}>
            <span>Арматура</span>
            <b>{estimation.rebarWeight} т</b>
          </div>

          <div style={{ ...styles.totalRow, justifyContent: "flex-end" }}>
            <span>{estimation.foundationCost.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        {/* КАРТОЧКА: Ограждающие конструкции */}
        {useSandwich && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏭 Ограждающие конструкции</h3>

            <div style={styles.row}>
              <span>Стены (сэндвич)</span>
              <b>{estimation.wallAreaBox} м²</b>
            </div>
            <div style={styles.subRow}>
              <span>Без учета проемов</span>
              <span>{estimation.wallCost.toLocaleString("ru-RU")} ₽</span>
            </div>

            <div style={styles.row}>
              <span>Кровля (сэндвич)</span>
              <b>{estimation.roofArea} м²</b>
            </div>
            <div style={styles.subRow}>
              <span>С учетом свесов</span>
              <span>{estimation.roofCost.toLocaleString("ru-RU")} ₽</span>
            </div>

            <div style={styles.row}>
              <span>Доборные элементы</span>
              <b>{estimation.trimCost.toLocaleString("ru-RU")} ₽</b>
            </div>

            {frameType === "truss" && estimation.envelopeDiffAmount > 0 && (
              <div style={styles.envelopeWarning}>
                <span>Удорожание панелей (из-за высоты фермы)</span>
                <span>
                  +{estimation.envelopeDiffAmount.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            )}

            <div style={{ ...styles.totalRow, justifyContent: "flex-end" }}>
              <span>
                {(
                  estimation.wallCost +
                  estimation.roofCost +
                  estimation.trimCost
                ).toLocaleString("ru-RU")}{" "}
                ₽
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ФИНАЛЬНЫЕ ИТОГИ */}
      <div style={styles.finalTotalCard}>
        ПОЛНАЯ СТОИМОСТЬ: {estimation.totalCost} ₽
      </div>

      {/* ЧИСТАЯ ВЫГОДА ЕВРОАНГАР (Только для фермы) */}
      {frameType === "truss" && netSavings > 0 && (
        <div style={styles.netSavingsCard}>
          <div
            style={{
              color: "#2e7d32",
              fontSize: "1.4em",
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            💎 ЧИСТАЯ ВЫГОДА КЛИЕНТА: {netSavings.toLocaleString("ru-RU")} ₽
          </div>
          <div style={{ color: "#555", fontSize: "0.95em" }}>
            Учтена экономия на металлокаркасе минус переплата за стеновые панели
          </div>
        </div>
      )}

      {/* КНОПКА PDF */}
      <button
        style={styles.pdfBtn}
        onClick={() => alert("Функция генерации PDF находится в разработке")}
      >
        📄 Скачать КП в PDF
      </button>
    </div>
  );
}
