import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { exportTo1CExcel, generate1CRows } from "./export1CUtils";
import SpecificationTZPDF from "./SpecificationTZPDF";

export default function SpecificationTZModal({
  isOpen,
  onClose,
  spanWidth,
  spansCount,
  spanOrientations = [],
  length,
  height,
  roofShape,
  slope,
  stories,
  floorStructure,
  cranes,
  snowLoad,
  windLoad,
  frameType,
  useSandwich,
  layoutMode,
  aperturesList,
  estimation,
  buildingName = "Здание ЕВРОАНГАР"
}) {
  const [activeTab, setActiveTab] = useState("spec"); // "spec" | "1c_table"
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const dataPayload = {
    spanWidth,
    spansCount,
    spanOrientations,
    length,
    height,
    roofShape,
    slope,
    stories,
    floorStructure,
    cranes,
    snowLoad,
    windLoad,
    frameType,
    useSandwich,
    layoutMode,
    aperturesList,
    estimation
  };

  const rows1C = generate1CRows(dataPayload);

  const W = Number(spanWidth) || 18;
  const N = Number(spansCount) || 1;
  const L = Number(length) || 48;
  const H = Number(height) || 6;
  const totalWidth = W * N;
  const columnStep = 6;
  const totalFrames = Math.ceil(L / columnStep) + 1;

  const activeCranes = (cranes || [])
    .map((c, originalIndex) => ({
      ...c,
      spanNum: (c.id != null ? Number(c.id) : originalIndex) + 1,
    }))
    .filter((c) => parseFloat(c.cap || 0) > 0);
  const hasApertures = Array.isArray(aperturesList) && aperturesList.length > 0;
  const showSupplyColumn = hasApertures && aperturesList.some((ap) => ap.supply != null);
  const hasMezzanine = Number(stories) > 1;
  const floorTypeLabel =
    floorStructure?.typeName ||
    floorStructure?.name ||
    floorStructure?.shortName ||
    "Монолитный ЖБ по профлисту";

  const handleDownload1C = () => {
    const ok = exportTo1CExcel(dataPayload);
    if (ok) {
      setDownloadSuccess(true);
      setStatusMessage({ type: "success", text: "Файл 1С (.xlsx) успешно скачан!" });
      setTimeout(() => {
        setDownloadSuccess(false);
        setStatusMessage(null);
      }, 3500);
    }
  };

  const generatePdfBlob = async () => {
    const doc = <SpecificationTZPDF data={dataPayload} />;
    const asBlob = await pdf(doc).toBlob();
    return asBlob;
  };

  const handleDownloadPDF = async () => {
    if (isPdfGenerating) return;
    try {
      setIsPdfGenerating(true);
      setStatusMessage({ type: "info", text: "⏳ Формирование PDF документа ТЗ..." });
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TZ_Euroangar_${totalWidth}x${L}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatusMessage({ type: "success", text: "✅ PDF технического задания успешно сохранен!" });
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setStatusMessage(null);
      }, 4000);
    } catch (err) {
      console.error("PDF generation error detail:", err);
      setStatusMessage({ type: "error", text: "❌ Не удалось сгенерировать PDF. Попробуйте еще раз." });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (isPdfGenerating) return;
    try {
      setIsPdfGenerating(true);
      setStatusMessage({ type: "info", text: "⏳ Подготовка документа к печати..." });
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);

      // Открываем документ в новой вкладке для встроенного средства просмотра и печати браузера
      let printWindow = null;
      try {
        printWindow = window.open(url, "_blank");
      } catch (e) {
        console.warn("window.open failed:", e);
      }

      // Fallback: если всплывающее окно заблокировано браузером
      if (!printWindow || printWindow.closed || typeof printWindow.closed === "undefined") {
        const a = document.createElement("a");
        a.href = url;
        a.download = `TZ_Euroangar_${totalWidth}x${L}_print.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setStatusMessage({
          type: "warning",
          text: "Всплывающее окно заблокировано браузером. Документ сохранен в файл — откройте его для печати."
        });
      } else {
        setStatusMessage({
          type: "success",
          text: "✅ Документ открыт в новой вкладке для печати!"
        });
      }

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err) {
      console.error("PDF generation error detail:", err);
      setStatusMessage({
        type: "error",
        text: "❌ Не удалось подготовить PDF для печати. Попробуйте еще раз."
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        className="tz-modal-content"
      >
        {/* Шапка модального окна */}
        <div style={styles.header} className="tz-no-print">
          <div>
            <div style={styles.titleRow}>
              <span style={styles.iconBadge}>📋</span>
              <h2 style={styles.title}>Техническое задание (ТЗ) и интеграция с 1С</h2>
            </div>
            <p style={styles.subtitle}>
              Параметры быстровозводимого здания для производства и автоматической загрузки в 1С
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={{
                ...styles.btnDownload,
                backgroundColor: downloadSuccess ? "#16a34a" : "#0284c7"
              }}
              onClick={handleDownload1C}
              title="Экспорт файла .xlsx с системными кодами 1С"
            >
              📥 {downloadSuccess ? "Файл .xlsx сохранен!" : "Скачать для 1С (.xlsx)"}
            </button>

            <button
              style={{
                ...styles.btnPdf,
                opacity: isPdfGenerating ? 0.7 : 1,
                cursor: isPdfGenerating ? "wait" : "pointer"
              }}
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              title="Скачать официальный бланк ТЗ в формате PDF"
            >
              📄 {isPdfGenerating ? "Формирование..." : "Скачать PDF"}
            </button>

            <button
              style={{
                ...styles.btnPrint,
                opacity: isPdfGenerating ? 0.7 : 1,
                cursor: isPdfGenerating ? "wait" : "pointer"
              }}
              onClick={handlePrint}
              disabled={isPdfGenerating}
              title="Печать документа ТЗ или сохранение в PDF"
            >
              🖨️ Печать / PDF
            </button>

            <button
              style={styles.btnClose}
              onClick={onClose}
              title="Закрыть окно"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Уведомление о статусе генерации/скачивания */}
        {statusMessage && (
          <div
            style={{
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor:
                statusMessage.type === "success"
                  ? "#f0fdf4"
                  : statusMessage.type === "error"
                  ? "#fef2f2"
                  : "#f0f9ff",
              color:
                statusMessage.type === "success"
                  ? "#15803d"
                  : statusMessage.type === "error"
                  ? "#b91c1c"
                  : "#0369a1",
              borderBottom: `1px solid ${
                statusMessage.type === "success"
                  ? "#bbf7d0"
                  : statusMessage.type === "error"
                  ? "#fecaca"
                  : "#bae6fd"
              }`
            }}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "13px",
                color: "inherit",
                padding: "2px 6px"
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Переключатель вкладок */}
        <div style={styles.tabBar} className="tz-no-print">
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "spec" ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab("spec")}
          >
            📑 Структурированное ТЗ
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "1c_table" ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab("1c_table")}
          >
            📊 Таблица маппинга 1С ({rows1C.length} реквизитов)
          </button>
        </div>

        {/* Тело модального окна */}
        <div style={styles.scrollArea} className="tz-scroll-area">
          {activeTab === "spec" ? (
            <div style={styles.specContainer}>
              {/* Шапка документа для печати */}
              <div style={styles.printHeader} className="tz-print-only">
                <h1 style={{ margin: "0 0 5px 0", fontSize: "20px", color: "#111827" }}>
                  ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ПРОЕКТИРОВАНИЕ И ПОСТАВКУ ЗДАНИЯ
                </h1>
                <p style={{ margin: 0, fontSize: "13px", color: "#4b5563" }}>
                  Система ЕВРОАНГАР • Дата формирования: {new Date().toLocaleDateString("ru-RU")}
                </p>
                <div style={{ height: "2px", backgroundColor: "#0284c7", margin: "12px 0 20px 0" }} />
              </div>

              {/* 1. Общие габариты */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>📐</span>
                  <h3 style={styles.sectionTitle}>1. Общие габариты и объемно-планировочные решения</h3>
                </div>
                <div style={styles.grid}>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Ширина здания (общая):</span>
                    <span style={styles.fieldValue}>
                      {totalWidth} м {N > 1 ? `(${N} прол. по ${W} м)` : ""}
                    </span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Длина здания:</span>
                    <span style={styles.fieldValue}>{L} м</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Высота до низа несущих конструкций:</span>
                    <span style={styles.fieldValue}>{H} м</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Шаг рам каркаса:</span>
                    <span style={styles.fieldValue}>{columnStep} м (всего рам: {totalFrames})</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Этажность здания:</span>
                    <span style={styles.fieldValue}>{stories} этаж(а)</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Форма и уклон кровли:</span>
                    <span style={styles.fieldValue}>
                      {roofShape === "single" ? "Односкатная" : "Двускатная"} ({slope}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Климатические нагрузки */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>❄️</span>
                  <h3 style={styles.sectionTitle}>2. Климатические нагрузки (СП 20.13330)</h3>
                </div>
                <div style={styles.grid}>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Расчетная снеговая нагрузка:</span>
                    <span style={styles.fieldValue}>{snowLoad} кг/м²</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Нормативное ветровое давление:</span>
                    <span style={styles.fieldValue}>{windLoad} кг/м²</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Сейсмичность площадки:</span>
                    <span style={styles.fieldValue}>до 6 баллов</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Коэффициент надежности по ответственности:</span>
                    <span style={styles.fieldValue}>γn = 1.0 (Нормальный)</span>
                  </div>
                </div>
              </div>

              {/* 3. Металлокаркас и массы */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>🏗️</span>
                  <h3 style={styles.sectionTitle}>3. Металлокаркас здания и спецификация масс</h3>
                </div>
                <div style={styles.grid}>
                  <div style={{ ...styles.fieldItem, backgroundColor: "#f0f9ff", borderRadius: "6px", padding: "8px" }}>
                    <span style={{ ...styles.fieldLabel, fontWeight: "bold", color: "#0369a1" }}>
                      Общая масса металлокаркаса:
                    </span>
                    <span style={{ ...styles.fieldValue, fontSize: "16px", fontWeight: "bold", color: "#0284c7" }}>
                      {estimation?.metalWeight || "-"} т
                    </span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Площадь здания общая:</span>
                    <span style={styles.fieldValue}>{estimation?.floorArea || totalWidth * L} м²</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Несущие рамы (черный прокат):</span>
                    <span style={styles.fieldValue}>{estimation?.framesWeight || "-"} т</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Прогонная система покрытия и фахверк:</span>
                    <span style={styles.fieldValue}>{estimation?.purlinsWeight || "-"} т</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Связевые конструкции и фасонные элементы:</span>
                    <span style={styles.fieldValue}>{estimation?.tiesWeight || "-"} т</span>
                  </div>
                  <div style={styles.fieldItem}>
                    <span style={styles.fieldLabel}>Удельная металлоемкость:</span>
                    <span style={styles.fieldValue}>{estimation?.metalRate || "-"} кг/м²</span>
                  </div>
                </div>
              </div>

              {/* 4. Ограждающие конструкции (если включены) */}
              {useSandwich && (
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionIcon}>🧱</span>
                    <h3 style={styles.sectionTitle}>4. Ограждающие конструкции (ОК)</h3>
                  </div>
                  <div style={styles.grid}>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Стеновое ограждение:</span>
                      <span style={styles.fieldValue}>Сэндвич-панель стеновая</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Раскладка панелей стен:</span>
                      <span style={styles.fieldValue}>
                        {layoutMode === "vertical" ? "Вертикальная" : "Горизонтальная"}
                      </span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Площадь стен:</span>
                      <span style={styles.fieldValue}>{estimation?.wallAreaBox || "-"} м²</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Кровельное ограждение:</span>
                      <span style={styles.fieldValue}>Сэндвич-панель кровельная</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Площадь кровли:</span>
                      <span style={styles.fieldValue}>{estimation?.roofArea || "-"} м²</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Общая площадь ограждающих конструкций:</span>
                      <span style={styles.fieldValue}>
                        {(parseFloat(estimation?.wallAreaBox || 0) + parseFloat(estimation?.roofArea || 0)).toFixed(1)} м²
                      </span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Поставка и разработка фасонных элементов:</span>
                      <span style={styles.fieldValue}>Да (в комплекте)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Инженерные проемы */}
              {hasApertures && (
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionIcon}>🚪</span>
                    <h3 style={styles.sectionTitle}>5. Инженерные проемы (окна, ворота, двери)</h3>
                  </div>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>№</th>
                          <th style={styles.th}>Тип</th>
                          <th style={styles.th}>Профиль обрамления</th>
                          <th style={styles.th}>Ширина, м</th>
                          <th style={styles.th}>Высота, м</th>
                          <th style={styles.th}>Отметка низа, м</th>
                          <th style={styles.th}>Кол-во</th>
                          {showSupplyColumn && <th style={styles.th}>Поставка</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {aperturesList.map((ap, idx) => {
                          const apType = (ap.type || "").toLowerCase();
                          const isGateOrDoor = apType === "gate" || apType === "ворота" || apType === "door" || apType === "дверь";
                          const typeLabel = (apType === "gate" || apType === "ворота")
                            ? "Ворота"
                            : (apType === "door" || apType === "дверь")
                            ? "Дверь"
                            : "Окно";
                          const profileLabel = ap.profile || "—";
                          const eBotVal = isGateOrDoor ? "0.00" : (ap.eBot || "0.00");
                          const supplyVal = ap.supply != null ? (ap.supply ? "Да" : "Нет") : "—";
                          return (
                            <tr key={idx} style={idx % 2 === 1 ? { backgroundColor: "#f9fafb" } : {}}>
                              <td style={styles.td}>{idx + 1}</td>
                              <td style={styles.td}><b>{typeLabel}</b></td>
                              <td style={styles.td}>{profileLabel}</td>
                              <td style={styles.td}>{ap.width}</td>
                              <td style={styles.td}>{ap.height}</td>
                              <td style={styles.td}>{eBotVal}</td>
                              <td style={styles.td}>{ap.count || 1} шт.</td>
                              {showSupplyColumn && <td style={styles.td}>{supplyVal}</td>}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. Крановое оборудование */}
              {activeCranes.length > 0 && (
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionIcon}>🚡</span>
                    <h3 style={styles.sectionTitle}>6. Крановое оборудование</h3>
                  </div>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Пролёт</th>
                          <th style={styles.th}>Тип крана</th>
                          <th style={styles.th}>Грузоподъемность</th>
                          <th style={styles.th}>Пролет крана</th>
                          <th style={styles.th}>Количество</th>
                          <th style={styles.th}>Подкрановые пути</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCranes.map((crane, idx) => (
                          <tr key={idx} style={idx % 2 === 1 ? { backgroundColor: "#f9fafb" } : {}}>
                            <td style={styles.td}>Пролёт #{crane.spanNum}</td>
                            <td style={styles.td}>
                              <b>{crane.type === "suspension" ? "Кран подвесной" : "Кран мостовой опорный"}</b>
                            </td>
                            <td style={styles.td}>{crane.cap} т</td>
                            <td style={styles.td}>{W} м</td>
                            <td style={styles.td}>1 шт.</td>
                            <td style={styles.td}>{crane.runways || "Разрабатываются и поставляются"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. Междуэтажные перекрытия / Антресоль */}
              {hasMezzanine && (
                <div style={styles.sectionCard}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionIcon}>🏢</span>
                    <h3 style={styles.sectionTitle}>7. Междуэтажные перекрытия (Антресоль)</h3>
                  </div>
                  <div style={styles.grid}>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Площадь антресоли:</span>
                      <span style={styles.fieldValue}>{estimation?.mezzanineArea || "-"} м²</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Конструктив перекрытия:</span>
                      <span style={styles.fieldValue}>
                        {floorTypeLabel}
                      </span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Толщина плиты перекрытия:</span>
                      <span style={styles.fieldValue}>{floorStructure?.thickness || 120} мм</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Нормативная полезная нагрузка:</span>
                      <span style={styles.fieldValue}>
                        {floorStructure?.liveLoad !== undefined &&
                        floorStructure?.liveLoad !== null &&
                        floorStructure?.liveLoad !== "" &&
                        !isNaN(Number(floorStructure.liveLoad))
                          ? Number(floorStructure.liveLoad)
                          : 400}{" "}
                        кг/м²
                      </span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Масса металлокаркаса антресоли:</span>
                      <span style={styles.fieldValue}>{estimation?.mezzanineWeight || "-"} т</span>
                    </div>
                    <div style={styles.fieldItem}>
                      <span style={styles.fieldLabel}>Этаж в системе 1С:</span>
                      <span style={styles.fieldValue}>Этаж 2 (отметка перекрытия)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Вкладка: Просмотр строк выгрузки 1С */
            <div style={styles.table1CContainer}>
              <div style={styles.tableNotice}>
                Строго отфильтрованная таблица параметров, готовая к автоматическому импорту в 1С.
                Пустые поля исключены. Числовые значения форматированы с десятичной запятой.
              </div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th style={{ ...styles.th, width: "35%" }}>Параметр (1C Идентификатор)</th>
                      <th style={{ ...styles.th, width: "30%", color: "#0284c7" }}>Значение</th>
                      <th style={{ ...styles.th, width: "35%" }}>Название (Реквизит)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows1C.map((row, idx) => (
                      <tr key={idx} style={idx % 2 === 1 ? { backgroundColor: "#f9fafb" } : {}}>
                        <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "12px", color: "#374151" }}>
                          {row.Параметр}
                        </td>
                        <td style={{ ...styles.td, fontWeight: "600", color: "#111827" }}>
                          {row.Значение}
                        </td>
                        <td style={{ ...styles.td, color: "#4b5563" }}>
                          {row.Название}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Подвал модального окна */}
        <div style={styles.footer} className="tz-no-print">
          <div style={{ fontSize: "13px", color: "#6b7280" }}>
            💡 Файл <b>.xlsx</b> полностью совместим со стандартом загрузки параметров заявок 1С:Предприятие
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              style={{
                ...styles.btnPdfFooter,
                opacity: isPdfGenerating ? 0.7 : 1,
                cursor: isPdfGenerating ? "wait" : "pointer"
              }}
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
            >
              📄 {isPdfGenerating ? "Формирование..." : "Скачать PDF (ТЗ)"}
            </button>
            <button
              style={styles.btnDownloadFooter}
              onClick={handleDownload1C}
            >
              📥 Скачать .xlsx для 1С
            </button>
            <button
              style={styles.btnCloseFooter}
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .tz-no-print {
            display: none !important;
          }
          .tz-print-only {
            display: block !important;
          }
          body * {
            visibility: hidden;
          }
          .tz-modal-content, .tz-modal-content * {
            visibility: visible;
          }
          .tz-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
          }
          .tz-scroll-area {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
          }
        }
        @media screen {
          .tz-print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px"
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "980px",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    flexWrap: "wrap",
    gap: "12px"
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  iconBadge: {
    fontSize: "20px"
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    margin: "3px 0 0 0",
    fontSize: "13px",
    color: "#64748b"
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  btnDownload: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.15s ease"
  },
  btnPdf: {
    backgroundColor: "#d97706",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.15s ease"
  },
  btnPrint: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer"
  },
  btnClose: {
    backgroundColor: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px"
  },
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    padding: "0 20px"
  },
  tabBtn: {
    padding: "10px 16px",
    border: "none",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
    cursor: "pointer"
  },
  tabBtnActive: {
    color: "#0284c7",
    borderBottom: "2px solid #0284c7"
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  },
  specContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  printHeader: {
    marginBottom: "16px"
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "8px"
  },
  sectionIcon: {
    fontSize: "16px"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "10px 16px"
  },
  fieldItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  fieldLabel: {
    fontSize: "12px",
    color: "#64748b"
  },
  fieldValue: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#0f172a"
  },
  tableWrap: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12.5px"
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "2px solid #e2e8f0",
    color: "#475569",
    fontWeight: "600"
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#1e293b"
  },
  table1CContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  tableNotice: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "12.5px",
    color: "#166534"
  },
  footer: {
    padding: "12px 20px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    flexWrap: "wrap",
    gap: "10px"
  },
  btnPdfFooter: {
    backgroundColor: "#d97706",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer"
  },
  btnDownloadFooter: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer"
  },
  btnCloseFooter: {
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer"
  }
};
