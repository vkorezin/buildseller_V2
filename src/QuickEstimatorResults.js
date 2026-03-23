import React, { useState, useEffect } from "react";

// Базовые константы на случай, если пользователь еще не открывал настройки
const DEFAULT_CONFIG = {
  coeff12m: 1.15,
  coeff18m: 1.1,
  coeff24m: 1.01,
  height0m: 0.9,
  height7m: 1.1,
  purlinType4: 0.47,
  craneType2: 1.0137,
  type1Fastener: 0.2,
  type2Gk: 0.7
};

export default function QuickEstimatorResults({
  estimation,
  useSandwich,
  frameType,
  spanWidth = "18",
  height = "6",
  cranes = [],
  gkPrice = 140000,
  lstkPrice = 160000,
  fasonkaPrice = 150000
}) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const saved = localStorage.getItem('euroangar_building_types_config');
    if (saved) {
      try {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } catch (e) {}
    }
  }, []);

  if (!estimation) return null;

  // Парсинг переданных значений
  const W = Number(spanWidth);
  const H = Number(height);
  const pGk = Number(gkPrice);
  const pLstk = Number(lstkPrice);
  const pFas = Number(fasonkaPrice);

  const hasAnyCrane = cranes.some(c => Number(c.cap) > 0);
  const hasSuspensionCrane = cranes.some(c => Number(c.cap) > 0 && c.type === "suspension");

  // Извлечение БАЗОВЫХ весов (Тип 3) из главной математики
  const baseFramesKg = parseFloat(estimation.framesWeight || 0) * 1000;
  const basePurlinsKg = parseFloat(estimation.purlinsWeight || 0) * 1000;
  const baseTiesKg = parseFloat(estimation.tiesWeight || 0) * 1000;
  const baseCraneKg = estimation.craneSystemWeight ? parseFloat(estimation.craneSystemWeight) * 1000 : 0;

  const envelopeCost = useSandwich ? ((estimation.wallCost || 0) + (estimation.roofCost || 0) + (estimation.trimCost || 0)) : 0;
  const foundationCost = estimation.foundationCost || 0;

  // --- МАТЕМАТИКА ЕВРОАНГАР (ИНТЕРПОЛЯЦИИ) ---

  // Интерполяция коэффициента пролета (Тип 1)
  let cW = 1.0;
  if (W <= 12) cW = config.coeff12m;
  else if (W >= 24) cW = config.coeff24m;
  else if (W <= 18) cW = config.coeff12m - ((config.coeff12m - config.coeff18m) * ((W - 12) / 6));
  else cW = config.coeff18m - ((config.coeff18m - config.coeff24m) * ((W - 18) / 6));

  // Интерполяция утяжеления по высоте (Тип 1)
  let cH = 1.0;
  if (H <= 0) cH = config.height0m;
  else if (H >= 7) cH = config.height7m;
  else cH = config.height0m + ((config.height7m - config.height0m) * (H / 7));

  // Итоговая масса рам Типа 1
  const framesKg1 = (baseFramesKg / (cW || 1)) * cH;

  // Блокировки (Защита от дурака)
  let blockType1 = null;
  let blockType2 = null;

  if (frameType === "beam" && (W > 7 || H > 7.5)) {
    blockType1 = "Балка: пролет до 7м, высота до 7.5м";
    blockType2 = "Балка: пролет до 7м, высота до 7.5м";
  }
  if (frameType === "truss" && W > 30) {
    blockType1 = "Ферма: пролет до 30м";
    blockType2 = "Ферма: пролет до 30м";
  }
  
  // Жесткое ограничение по высоте для ЛСТК-колонн
  if (H > 7.5) {
    blockType1 = "Тип 1: высота колонн не более 7.5м";
  }

  if (hasAnyCrane) {
    blockType1 = "Краны недопустимы для полностью ЛСТК каркаса";
  }
  if (hasSuspensionCrane) {
    blockType2 = "Подвесные краны недопустимы для комби-каркаса";
  }

  // --- ФОРМИРОВАНИЕ 4 ТИПОВ ---
  const types = [
    {
      id: 1,
      name: "Тип 1: ЛСТК",
      desc: "Оцинкованные рамы + фасонка",
      blocked: blockType1,
      calc: () => {
        const metalCost = ((framesKg1 * (1 - config.type1Fastener)) / 1000 * pLstk) +
                          ((framesKg1 * config.type1Fastener) / 1000 * pFas) +
                          (baseTiesKg / 1000 * pFas) +
                          (basePurlinsKg / 1000 * pLstk);
        return { frames: framesKg1, purlins: basePurlinsKg, metalCost };
      }
    },
    {
      id: 2,
      name: "Тип 2: Комби",
      desc: "ГК колонны + Оцинкованная кровля",
      blocked: blockType2,
      calc: () => {
        const framesKg2 = hasAnyCrane ? (baseFramesKg / (config.craneType2 || 1)) : ((framesKg1 + baseFramesKg) / 2);
        const metalCost = ((framesKg2 * config.type2Gk) / 1000 * pGk) +
                          ((framesKg2 * (1 - config.type2Gk)) / 1000 * pLstk) +
                          (baseTiesKg / 1000 * pGk) +
                          (basePurlinsKg / 1000 * pLstk) +
                          (baseCraneKg / 1000 * pGk);
        return { frames: framesKg2, purlins: basePurlinsKg, metalCost };
      }
    },
    {
      id: 3,
      name: "Тип 3: ЕВРОАНГАР",
      desc: "База: ГК каркас + ЛСТК прогоны",
      blocked: null,
      isBase: true,
      calc: () => {
        const metalCost = (baseFramesKg / 1000 * pGk) +
                          (baseTiesKg / 1000 * pGk) +
                          (basePurlinsKg / 1000 * pLstk) +
                          (baseCraneKg / 1000 * pGk);
        return { frames: baseFramesKg, purlins: basePurlinsKg, metalCost };
      }
    },
    {
      id: 4,
      name: "Тип 4: Классика",
      desc: "Полностью черный металл (ГК)",
      blocked: null,
      calc: () => {
        const purlinsKg4 = basePurlinsKg / (config.purlinType4 || 0.47);
        const metalCost = (baseFramesKg / 1000 * pGk) +
                          (baseTiesKg / 1000 * pGk) +
                          (purlinsKg4 / 1000 * pGk) +
                          (baseCraneKg / 1000 * pGk);
        return { frames: baseFramesKg, purlins: purlinsKg4, metalCost };
      }
    }
  ];

  const netSavings = estimation.savingsAmount - (estimation.envelopeDiffAmount || 0);

  const styles = {
    container: { marginTop: "30px", fontFamily: "Arial, sans-serif" },
    mainTitle: { fontSize: "1.4em", fontWeight: "bold", color: "#2c3e50", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" },
    matrixContainer: { display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "15px" },
    card: {
      flex: "1 1 23%",
      minWidth: "260px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      border: "1px solid #e0e0e0",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
      position: "relative",
      overflow: "hidden"
    },
    cardBase: {
      borderColor: "#007bff",
      borderWidth: "2px",
      boxShadow: "0 8px 20px rgba(0,123,255,0.15)",
    },
    baseBadge: {
      backgroundColor: "#007bff",
      color: "#fff",
      fontSize: "0.75em",
      padding: "4px 12px",
      borderRadius: "0 0 0 8px",
      position: "absolute",
      top: 0,
      right: 0,
      fontWeight: "bold",
      letterSpacing: "1px"
    },
    cardHeader: { padding: "15px", borderBottom: "1px solid #eee", backgroundColor: "#f8f9fa" },
    typeName: { margin: 0, fontSize: "1.1em", fontWeight: "bold", color: "#333" },
    typeDesc: { margin: "5px 0 0 0", fontSize: "0.85em", color: "#666", minHeight: "34px" },
    cardBody: { padding: "15px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" },
    dataRow: { display: "flex", justifyContent: "space-between", fontSize: "0.9em", color: "#444" },
    dataVal: { fontWeight: "bold", color: "#222" },
    divider: { height: "1px", backgroundColor: "#eee", margin: "5px 0" },
    blockedOverlay: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#fff5f5",
      color: "#d9534f"
    },
    blockedIcon: { fontSize: "2.5em", marginBottom: "10px" },
    totalPriceBox: {
      backgroundColor: "#e8f5e9",
      padding: "15px",
      textAlign: "center",
      borderTop: "1px solid #c8e6c9"
    },
    totalPriceLabel: { fontSize: "0.85em", color: "#2e7d32", marginBottom: "5px", fontWeight: "bold" },
    totalPriceVal: { fontSize: "1.4em", fontWeight: "bold", color: "#1b5e20" },
    envelopeWarning: { color: "#d9534f", fontWeight: "bold", marginTop: "15px", fontSize: "0.95em" },
    netSavingsCard: { backgroundColor: "#e8f5e9", border: "2px solid #4caf50", padding: "20px", borderRadius: "8px", textAlign: "center", marginTop: "20px" },
    pdfBtn: { display: "block", width: "100%", padding: "15px", marginTop: "25px", backgroundColor: "#ffc107", color: "#212529", border: "none", borderRadius: "8px", fontSize: "1.2em", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", transition: "background 0.2s" }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.mainTitle}>📊 Сравнительная матрица типов зданий ЕВРОАНГАР</h3>
      
      <div style={styles.matrixContainer}>
        {types.map(t => {
          const isBase = t.isBase;
          const data = !t.blocked ? t.calc() : null;
          let totalAll = 0;
          if (data) {
             totalAll = data.metalCost + envelopeCost + foundationCost;
          }

          return (
            <div key={t.id} style={{...styles.card, ...(isBase ? styles.cardBase : {})}}>
              {isBase && <div style={styles.baseBadge}>БАЗОВЫЙ</div>}
              <div style={styles.cardHeader}>
                <h4 style={styles.typeName}>{t.name}</h4>
                <p style={styles.typeDesc}>{t.desc}</p>
              </div>

              {t.blocked ? (
                <div style={styles.blockedOverlay}>
                  <div style={styles.blockedIcon}>🚫</div>
                  <div><b>Неприменимо:</b></div>
                  <div style={{fontSize: "0.9em", marginTop: "5px"}}>{t.blocked}</div>
                </div>
              ) : (
                <>
                  <div style={styles.cardBody}>
                    <div style={styles.dataRow}>
                      <span>Рамы/Колонны:</span>
                      <span style={styles.dataVal}>{(data.frames / 1000).toFixed(2)} т</span>
                    </div>
                    <div style={styles.dataRow}>
                      <span>Прогоны:</span>
                      <span style={styles.dataVal}>{(data.purlins / 1000).toFixed(2)} т</span>
                    </div>
                    <div style={styles.dataRow}>
                      <span>Связи:</span>
                      <span style={styles.dataVal}>{(baseTiesKg / 1000).toFixed(2)} т</span>
                    </div>
                    {baseCraneKg > 0 && (
                      <div style={styles.dataRow}>
                        <span>Крановые пути:</span>
                        <span style={styles.dataVal}>{(baseCraneKg / 1000).toFixed(2)} т</span>
                      </div>
                    )}

                    <div style={styles.divider}></div>

                    <div style={styles.dataRow}>
                      <span>Металлокаркас:</span>
                      <span style={styles.dataVal}>{Math.round(data.metalCost).toLocaleString("ru-RU")} ₽</span>
                    </div>
                    {useSandwich && (
                      <div style={styles.dataRow}>
                        <span>Обшивка:</span>
                        <span style={styles.dataVal}>{Math.round(envelopeCost).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                    <div style={styles.dataRow}>
                      <span>Фундамент:</span>
                      <span style={styles.dataVal}>{Math.round(foundationCost).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  </div>

                  <div style={styles.totalPriceBox}>
                    <div style={styles.totalPriceLabel}>ИТОГО ПО ЗДАНИЮ</div>
                    <div style={styles.totalPriceVal}>{Math.round(totalAll).toLocaleString("ru-RU")} ₽</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Предупреждение об удорожании сэндвича для фермы */}
      {frameType === "truss" && estimation.envelopeDiffAmount > 0 && (
        <div style={styles.envelopeWarning}>
          * Внимание: Применена ферма. Удорожание сэндвич-панелей (из-за высоты фермы) составило +{estimation.envelopeDiffAmount.toLocaleString("ru-RU")} ₽. Эта сумма уже учтена в итогах выше.
        </div>
      )}

      {/* Сохраняем логику чистой выгоды Балка vs Ферма */}
      {frameType === "truss" && netSavings > 0 && (
        <div style={styles.netSavingsCard}>
          <div style={{ color: "#2e7d32", fontSize: "1.3em", fontWeight: "bold", marginBottom: "5px" }}>
            💎 ВЫГОДА ОТ ЗАМЕНЫ БАЛКИ НА ФЕРМУ: {netSavings.toLocaleString("ru-RU")} ₽
          </div>
          <div style={{ color: "#555", fontSize: "0.95em" }}>
            Сравнение произведено по Базовому типу (ГК каркас + ЛСТК прогоны)
          </div>
        </div>
      )}

      <button style={styles.pdfBtn} onClick={() => alert("Функция генерации PDF находится в разработке")}>
        📄 Скачать КП в PDF
      </button>
    </div>
  );
}
