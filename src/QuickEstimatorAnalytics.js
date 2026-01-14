import React from "react";

const styles = {
  analyticsBox: {
    gridColumn: "1 / -1",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffecb3",
    padding: "15px",
    borderRadius: "6px",
    fontSize: "0.95em",
    color: "#856404",
  },
  barContainer: {
    display: "flex",
    height: "10px",
    width: "100%",
    backgroundColor: "#e9ecef",
    borderRadius: "5px",
    overflow: "hidden",
    marginTop: "8px",
  },
  barSegment: {
    height: "100%",
  },
};

export default function QuickEstimatorAnalytics({ dbAnalytics }) {
  if (!dbAnalytics || !dbAnalytics.found) return null;

  return (
    <div style={styles.analyticsBox}>
      <div>
        📂 Найдено <b>{dbAnalytics.count}</b> аналогов. Средний удельный вес:{" "}
        <b>{dbAnalytics.avgRate} кг/м²</b>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barSegment,
            width: `${(dbAnalytics.detWelded / dbAnalytics.avgRate) * 100}%`,
            backgroundColor: "#007bff",
          }}
          title="Сварные"
        />
        <div
          style={{
            ...styles.barSegment,
            width: `${(dbAnalytics.detRolled / dbAnalytics.avgRate) * 100}%`,
            backgroundColor: "#28a745",
          }}
          title="Прокат"
        />
      </div>
    </div>
  );
}
