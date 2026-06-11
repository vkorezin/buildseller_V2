import React, { useState, useEffect } from "react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import CommercialProposalPDF from './CommercialProposalPDF';

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
  length = "48",
  height = "6",
  snowLoad = "180",
  windLoad = "38",
  cranes = [],
  gkPrice = 140000,
  lstkPrice = 160000,
  fasonkaPrice = 150000
}) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showPdf, setShowPdf] = useState(false);

  // Данные менеджера с сохранением в память браузера
  const [managerName, setManagerName] = useState(() => localStorage.getItem('euroangar_pdf_m_name') || "");
  const [managerPhone, setManagerPhone] = useState(() => localStorage.getItem('euroangar_pdf_m_phone') || "");
  const [managerEmail, setManagerEmail] = useState(() => localStorage.getItem('euroangar_pdf_m_email') || "");

  useEffect(() => {
    const saved = localStorage.getItem('euroangar_building_types_config');
    if (saved) {
      try { setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) }); } catch (e) {}
    }
  }, []);

  useEffect(() => { localStorage.setItem('euroangar_pdf_m_name', managerName); }, [managerName]);
  useEffect(() => { localStorage.setItem('euroangar_pdf_m_phone', managerPhone); }, [managerPhone]);
  useEffect(() => { localStorage.setItem('euroangar_pdf_m_email', managerEmail); }, [managerEmail]);

  // Защита от падения: если объекта нет, просто не рендерим ничего, но не падаем
  if (!estimation) return null;

  // Если ядро зафиксировало перегрузку проемами — выводим сообщение об ошибке прямо здесь, красиво
  if (estimation.isOverloaded) {
    return (
      <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "15px", borderRadius: "8px", border: "1px solid #f5c6cb", marginTop: "20px", fontWeight: "bold", textAlign: "center" }}>
        🚫 ОШИБКА: Суммарная площадь проемов превышает общую площадь стен здания! Уменьшите габариты или количество ворот/окон.
      </div>
    );
  }

  const W = Number(spanWidth) || 18;
  const H = Number(height) || 6;
  const L = Number(length) || 48;
  const pGk = Number(gkPrice) || 140000;
  const pLstk = Number(lstkPrice) || 160000;
  const pFas = Number(fasonkaPrice) || 150000;

  const hasAnyCrane = Array.isArray(cranes) && cranes.some(c => Number(c?.cap) > 0);
  const hasSuspensionCrane = Array.isArray(cranes) && cranes.some(c => Number(c?.cap) > 0 && c?.type === "suspension");

  // Безопасное приведение типов с защитой от пустых строк
  const baseFramesKg = (parseFloat(estimation.framesWeight) || 0) * 1000;
  const baseTiesKg = Number(estimation.baseTiesKg) || 0;
  const baseCraneKg = estimation.craneSystemWeight ? (parseFloat(estimation.craneSystemWeight) * 1000) : 0;

  const roofPurlinsKg = Number(estimation.roofPurlinsKg) || 0;
  const wLen = Number(estimation.wallPurlinsLength) || 0;

  const wpLstk = wLen * 5.1;
  const wpFas = wLen * 1.275;
  const wpGk = wLen * (10.84 * 1.05);

  const envelopeCost = useSandwich ? (Number(estimation.wallCost || 0) + Number(estimation.roofCost || 0) + Number(estimation.trimCost || 0)) : 0;
  const foundationCost = Number(estimation.foundationCost) || 0;

  let cW = 1.0;
  if (W <= 12) cW = config.coeff12m;
  else if (W >= 24) cW = config.coeff24m;
  else if (W <= 18) cW = config.coeff12m - ((config.coeff12m - config.coeff18m) * ((W - 12) / 6));
  else cW = config.coeff18m - ((config.coeff18m - config.coeff24m) * ((W - 18) / 6));

  let cH = 1.0;
  if (H <= 0) cH = config.height0m;
  else if (H >= 7) cH = config.height7m;
  else cH = config.height0m + ((config.height7m - config.height0m) * (H / 7));

  const framesKg1 = (baseFramesKg / (cW || 1)) * cH;

  let blockType1 = null;
  let blockType2 = null;

  if (frameType === "beam") {
    if (W > 7 || H > 7.5) blockType1 = "Балка: пролет до 7м, высота до 7.5м";
    if (W > 7) blockType2 = "Балка: пролет до 7м";
  }
  if (frameType === "truss" && W > 30) {
    blockType1 = "Ферма: пролет до 30м";
    blockType2 = "Ферма: пролет до 30м";
  }
  if (H > 7.5) blockType1 = "Тип 1: высота колонн не более 7.5м";
  if (hasAnyCrane) blockType1 = "Краны недопустимы для полностью ЛСТК каркаса";
  if (hasSuspensionCrane) blockType2 = "Подвесные краны недопустимы для комби-каркаса";

  const types = [
    {
      id: 1, name: "Тип 1: ЛСТК", desc: "Оцинкованные рамы", blocked: blockType1,
      calc: () => {
        const purlinsCost = (roofPurlinsKg / 1000 * pLstk) + (wpLstk / 1000 * pLstk) + (wpFas / 1000 * pFas);
        const metalCost = ((framesKg1 * (1 - config.type1Fastener)) / 1000 * pLstk) + ((framesKg1 * config.type1Fastener) / 1000 * pFas) + (baseTiesKg / 1000 * pFas) + purlinsCost;
        return { metalCost };
      }
    },
    {
      id: 2, name: "Тип 2: Комби", desc: "ГК колонны + ЛСТК кровля", blocked: blockType2,
      calc: () => {
        const framesKg2 = hasAnyCrane ? (baseFramesKg / (config.craneType2 || 1)) : ((framesKg1 + baseFramesKg) / 2);
        const purlinsCost = (roofPurlinsKg / 1000 * pLstk) + (wpLstk / 1000 * pLstk) + (wpFas / 1000 * pFas);
        const metalCost = ((framesKg2 * config.type2Gk) / 1000 * pGk) + ((framesKg2 * (1 - config.type2Gk)) / 1000 * pLstk) + (baseTiesKg / 1000 * pGk) + (baseCraneKg / 1000 * pGk) + purlinsCost;
        return { metalCost };
      }
    },
    {
      id: 3, name: "Тип 3: ЕВРОАНГАР", desc: "ГК каркас + ЛСТК прогоны", blocked: null, isBase: true,
      calc: () => {
        const purlinsCost = (roofPurlinsKg / 1000 * pLstk) + (wpLstk / 1000 * pLstk) + (wpFas / 1000 * pFas);
        const metalCost = (baseFramesKg / 1000 * pGk) + (baseTiesKg / 1000 * pGk) + (baseCraneKg / 1000 * pGk) + purlinsCost;
        return { metalCost };
      }
    },
    {
      id: 4, name: "Тип 4: Классика", desc: "Полностью черный металл", blocked: null,
      calc: () => {
        const roofPurlinsKg4 = roofPurlinsKg / (config.purlinType4 || 0.47);
        const purlinsCost = (roofPurlinsKg4 / 1000 * pGk) + (wpGk / 1000 * pGk);
        const metalCost = (baseFramesKg / 1000 * pGk) + (baseTiesKg / 1000 * pGk) + (baseCraneKg / 1000 * pGk) + purlinsCost;
        return { metalCost };
      }
    }
  ];

  const styles = {
    container: { marginTop: "20px", fontFamily: "Arial, sans-serif" },
    matrixContainer: { display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "15px" },
    card: { flex: "1 1 23%", minWidth: "250px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" },
    cardBase: { borderColor: "#007bff", borderWidth: "2px" },
    baseBadge: { backgroundColor: "#007bff", color: "#fff", fontSize: "0.75em", padding: "4px 12px", position: "absolute", top: 0, right: 0, fontWeight: "bold", borderRadius: "0 0 0 8px" },
    cardHeader: { padding: "12px", backgroundColor: "#f8f9fa", borderBottom: "1px solid #eee" },
    typeName: { margin: 0, fontSize: "1em", fontWeight: "bold" },
    cardBody: { padding: "12px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9em" },
    dataRow: { display: "flex", justifyContent: "space-between" },
    dataVal: { fontWeight: "bold" },
    divider: { height: "1px", backgroundColor: "#eee", margin: "4px 0" },
    blockedOverlay: { flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "15px", textAlign: "center", backgroundColor: "#fff5f5", color: "#d9534f" },
    totalPriceBox: { backgroundColor: "#e8f5e9", padding: "12px", textAlign: "center", borderTop: "1px solid #c8e6c9" },
    totalPriceVal: { fontSize: "1.3em", fontWeight: "bold", color: "#1b5e20" },
    managerForm: { backgroundColor: "#f8f9fa", border: "1px solid #ccc", borderRadius: "8px", padding: "15px", marginTop: "20px" },
    inputGroup: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" },
    input: { flex: "1 1 30%", minWidth: "180px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" },
    pdfBtn: { display: "block", width: "100%", padding: "14px", marginTop: "15px", backgroundColor: "#ffc107", color: "#212529", border: "none", borderRadius: "8px", fontSize: "1.1em", fontWeight: "bold", cursor: "pointer" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.matrixContainer}>
        {types.map(t => {
          const isBase = t.isBase;
          const data = !t.blocked ? t.calc() : null;
          const totalAll = data ? (Number(data.metalCost || 0) + envelopeCost + foundationCost) : 0;

          return (
            <div key={t.id} style={{...styles.card, ...(isBase ? styles.cardBase : {})}}>
              {isBase && <div style={styles.baseBadge}>БАЗА</div>}
              <div style={styles.cardHeader}>
                <h4 style={styles.typeName}>{t.name}</h4>
              </div>

              {t.blocked ? (
                <div style={styles.blockedOverlay}>
                  <div><b>Неприменимо:</b></div>
                  <div style={{fontSize: "0.85em", marginTop: "5px"}}>{t.blocked}</div>
                </div>
              ) : (
                <>
                  <div style={styles.cardBody}>
                    <div style={styles.dataRow}><span>Металлокаркас:</span><span style={styles.dataVal}>{Math.round(data?.metalCost || 0).toLocaleString("ru-RU")} ₽</span></div>
                    {useSandwich && <div style={styles.dataRow}><span>Обшивка стен/кровли:</span><span style={styles.dataVal}>{Math.round(envelopeCost).toLocaleString("ru-RU")} ₽</span></div>}
                    <div style={styles.dataRow}><span>Фундамент (справочно):</span><span style={styles.dataVal}>{Math.round(foundationCost).toLocaleString("ru-RU")} ₽</span></div>
                    <div style={styles.divider}></div>
                    <div style={{...styles.dataRow, fontSize: "0.8em", color: "#666"}}><span>Учтено проемов:</span><span>{estimation.openingsArea || 0} м²</span></div>
                  </div>
                  <div style={styles.totalPriceBox}>
                    <div style={{fontSize: "0.8em", color: "#2e7d32"}}>ИТОГО ПО ОБЪЕКТУ</div>
                    <div style={styles.totalPriceVal}>{Math.round(totalAll).toLocaleString("ru-RU")} ₽</div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ФОРМА МЕНЕДЖЕРА */}
      <div style={styles.managerForm}>
        <div style={{fontWeight: "bold"}}>👤 Данные специалиста ЕВРОАНГАР для выгрузки КП:</div>
        <div style={styles.inputGroup}>
          <input type="text" placeholder="ФИО специалиста" value={managerName} onChange={(e) => setManagerName(e.target.value)} style={styles.input} />
          <input type="text" placeholder="Телефон" value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} style={styles.input} />
          <input type="text" placeholder="Email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} style={styles.input} />
        </div>
      </div>

      {!showPdf ? (
        <button style={styles.pdfBtn} onClick={() => setShowPdf(true)}>📄 Подготовить КП в PDF</button>
      ) : (
        <PDFDownloadLink 
          document={
            <CommercialProposalPDF 
              data={{ 
                spanWidth, length, height, snowLoad, windLoad, frameType,
                craneInfo: estimation.craneInfo || "",
                envelopeCost, foundationCost, useSandwich,
                wallCost: estimation.wallCost || 0, roofCost: estimation.roofCost || 0, trimCost: estimation.trimCost || 0,
                savingsAmount: estimation.savingsAmount || 0, openingsArea: estimation.openingsArea || 0
              }}
              types={types} managerName={managerName} managerPhone={managerPhone} managerEmail={managerEmail}
            />
          } 
          fileName={`ЕВРОАНГАР_КП_${spanWidth}x${length}.pdf`} style={{textDecoration: 'none'}}
        >
          {({ loading, error }) => (
            <button style={{...styles.pdfBtn, backgroundColor: error ? '#ffcdd2' : '#4caf50', color: '#fff'}}>
              {loading ? '⏳ Формирование PDF...' : error ? '❌ Ошибка генерации' : '⬇️ Скачать готовый PDF'}
            </button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  );
}
