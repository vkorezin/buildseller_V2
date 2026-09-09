import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

const FONT_REGULAR = typeof window !== 'undefined' && window.location?.origin
  ? `${window.location.origin}/fonts/Roboto-Regular.ttf`
  : 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Regular.ttf';

const FONT_MEDIUM = typeof window !== 'undefined' && window.location?.origin
  ? `${window.location.origin}/fonts/Roboto-Medium.ttf`
  : 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Medium.ttf';

const FONT_BOLD = typeof window !== 'undefined' && window.location?.origin
  ? `${window.location.origin}/fonts/Roboto-Bold.ttf`
  : 'https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Bold.ttf';

try {
  Font.register({
    family: "Roboto",
    fonts: [
      {
        src: FONT_REGULAR,
        fontWeight: "normal"
      },
      {
        src: FONT_MEDIUM,
        fontWeight: 500
      },
      {
        src: FONT_BOLD,
        fontWeight: "bold"
      }
    ]
  });
} catch (e) {
  console.warn("Font registration failed, fallback to default font:", e);
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#1f2937",
    lineHeight: 1.3
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#0284c7",
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase"
  },
  headerSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2
  },
  headerDate: {
    fontSize: 8,
    color: "#475569",
    textAlign: "right"
  },
  section: {
    marginBottom: 8
  },
  sectionHeader: {
    backgroundColor: "#f1f5f9",
    borderLeftWidth: 3,
    borderLeftColor: "#0284c7",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase"
  },
  table: {
    width: "100%",
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1"
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 2.5,
    paddingHorizontal: 4
  },
  rowHighlight: {
    backgroundColor: "#f0f9ff"
  },
  colLabel: {
    width: "55%",
    fontSize: 8.5,
    color: "#475569"
  },
  colValue: {
    width: "45%",
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right"
  },
  gridTable: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    marginTop: 2
  },
  gridHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 3,
    paddingHorizontal: 4
  },
  gridRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 2.5,
    paddingHorizontal: 4
  },
  th: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#334155"
  },
  td: {
    fontSize: 7.5,
    color: "#1e293b"
  },
  signBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  signParty: {
    width: "45%"
  },
  signTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16
  },
  signLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#94a3b8",
    marginBottom: 4
  },
  signDesc: {
    fontSize: 7,
    color: "#64748b",
    textAlign: "center"
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerText: {
    fontSize: 6.5,
    color: "#94a3b8"
  }
});

export default function SpecificationTZPDF({ data = {} }) {
  const {
    spanWidth = 18,
    spansCount = 1,
    length = 48,
    height = 6,
    roofShape = "gable",
    slope = 10,
    stories = 1,
    floorStructure = null,
    cranes = [],
    snowLoad = "180",
    windLoad = "38",
    frameType = "beam",
    useSandwich = true,
    layoutMode = "horizontal",
    aperturesList = [],
    estimation = {}
  } = data;

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
  const hasMezzanine = Number(stories) > 1;

  const wallArea = parseFloat(estimation?.wallAreaBox || 0);
  const roofArea = parseFloat(estimation?.roofArea || 0);
  const totalOKArea = wallArea + roofArea;

  const currentDate = new Date().toLocaleDateString("ru-RU");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Шапка документа */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Техническое задание на здание</Text>
            <Text style={styles.headerSubtitle}>
              Система быстровозводимых зданий ЕВРОАНГАР • Габариты: {totalWidth}×{L}×{H} м
            </Text>
          </View>
          <View>
            <Text style={styles.headerDate}>Дата: {currentDate}</Text>
            <Text style={styles.headerDate}>Шаг рам: {columnStep} м</Text>
          </View>
        </View>

        {/* 1. Общие габариты и объемно-планировочные решения */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Общие габариты и объемно-планировочные решения</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Ширина здания (общая):</Text>
              <Text style={styles.colValue}>
                {totalWidth} м {N > 1 ? `(${N} прол. по ${W} м)` : ""}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Длина здания:</Text>
              <Text style={styles.colValue}>{L} м</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Высота до низа несущих конструкций:</Text>
              <Text style={styles.colValue}>{H} м</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Шаг рам каркаса / количество рам:</Text>
              <Text style={styles.colValue}>{columnStep} м / {totalFrames} шт.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Этажность здания:</Text>
              <Text style={styles.colValue}>{stories} этаж(а)</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Форма и уклон кровли:</Text>
              <Text style={styles.colValue}>
                {roofShape === "single" ? "Односкатная" : "Двускатная"} ({slope}%)
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Климатические нагрузки */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Климатические нагрузки (СП 20.13330)</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Расчетная снеговая нагрузка:</Text>
              <Text style={styles.colValue}>{snowLoad} кг/м²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Нормативное ветровое давление:</Text>
              <Text style={styles.colValue}>{windLoad} кг/м²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Сейсмичность площадки строительства:</Text>
              <Text style={styles.colValue}>до 6 баллов</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Коэффициент надежности по ответственности:</Text>
              <Text style={styles.colValue}>γn = 1.0 (Нормальный уровень)</Text>
            </View>
          </View>
        </View>

        {/* 3. Металлокаркас и массы */}
        <View style={styles.section} wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Металлокаркас здания и спецификация масс</Text>
          </View>
          <View style={styles.table}>
            <View style={[styles.row, styles.rowHighlight]}>
              <Text style={[styles.colLabel, { color: "#0369a1", fontWeight: "bold" }]}>
                Общая масса металлокаркаса:
              </Text>
              <Text style={[styles.colValue, { color: "#0284c7" }]}>
                {estimation?.metalWeight ? `${estimation.metalWeight} т` : "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Площадь здания общая:</Text>
              <Text style={styles.colValue}>{estimation?.floorArea || totalWidth * L} м²</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Несущие рамы (черный прокат):</Text>
              <Text style={styles.colValue}>{estimation?.framesWeight ? `${estimation.framesWeight} т` : "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Прогонная система покрытия и фахверк:</Text>
              <Text style={styles.colValue}>{estimation?.purlinsWeight ? `${estimation.purlinsWeight} т` : "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Связевые конструкции и фасонные элементы:</Text>
              <Text style={styles.colValue}>{estimation?.tiesWeight ? `${estimation.tiesWeight} т` : "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.colLabel}>Удельная металлоемкость:</Text>
              <Text style={styles.colValue}>{estimation?.metalRate ? `${estimation.metalRate} кг/м²` : "-"}</Text>
            </View>
          </View>
        </View>

        {/* 4. Ограждающие конструкции */}
        {useSandwich && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>4. Ограждающие конструкции (ОК)</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Стеновое ограждение / раскладка:</Text>
                <Text style={styles.colValue}>
                  Сэндвич-панели ({layoutMode === "vertical" ? "вертикальная" : "горизонтальная"})
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Площадь стен / Площадь кровли:</Text>
                <Text style={styles.colValue}>
                  {estimation?.wallAreaBox || "-"} м² / {estimation?.roofArea || "-"} м²
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Общая площадь панелей ограждения:</Text>
                <Text style={styles.colValue}>
                  {totalOKArea > 0 ? `${totalOKArea.toFixed(1)} м²` : "-"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Комплектующие и фасонные элементы:</Text>
                <Text style={styles.colValue}>В комплекте поставки</Text>
              </View>
            </View>
          </View>
        )}

        {/* 5. Инженерные проемы */}
        {hasApertures && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>5. Инженерные проемы (окна, ворота, двери)</Text>
            </View>
            <View style={styles.gridTable}>
              <View style={styles.gridHeader}>
                <Text style={[styles.th, { width: "8%" }]}>№</Text>
                <Text style={[styles.th, { width: "20%" }]}>Тип</Text>
                <Text style={[styles.th, { width: "32%" }]}>Конструкция</Text>
                <Text style={[styles.th, { width: "15%", textAlign: "right" }]}>Ш×В (м)</Text>
                <Text style={[styles.th, { width: "13%", textAlign: "right" }]}>Низ (м)</Text>
                <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Кол-во</Text>
              </View>
              {aperturesList.map((ap, idx) => {
                const apType = (ap.type || "").toLowerCase();
                const isGateOrDoor = apType === "gate" || apType === "ворота" || apType === "door" || apType === "дверь";
                const typeLabel = (apType === "gate" || apType === "ворота")
                  ? "Ворота"
                  : (apType === "door" || apType === "дверь")
                  ? "Дверь"
                  : "Окно";
                const structLabel = ap.construction || ap.profile || "—";
                const eBotVal = isGateOrDoor ? "0.00" : (ap.eBot || "0.00");
                return (
                  <View key={idx} style={styles.gridRow}>
                    <Text style={[styles.td, { width: "8%" }]}>{idx + 1}</Text>
                    <Text style={[styles.td, { width: "20%", fontWeight: "bold" }]}>{typeLabel}</Text>
                    <Text style={[styles.td, { width: "32%" }]}>{structLabel}</Text>
                    <Text style={[styles.td, { width: "15%", textAlign: "right" }]}>
                      {ap.width} × {ap.height}
                    </Text>
                    <Text style={[styles.td, { width: "13%", textAlign: "right" }]}>{eBotVal}</Text>
                    <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>{ap.count || 1} шт.</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 6. Крановое оборудование */}
        {activeCranes.length > 0 && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>6. Крановое оборудование</Text>
            </View>
            <View style={styles.gridTable}>
              <View style={styles.gridHeader}>
                <Text style={[styles.th, { width: "20%" }]}>Пролёт</Text>
                <Text style={[styles.th, { width: "35%" }]}>Тип крана</Text>
                <Text style={[styles.th, { width: "25%", textAlign: "right" }]}>Г/п (тн)</Text>
                <Text style={[styles.th, { width: "20%", textAlign: "right" }]}>Пролет (м)</Text>
              </View>
              {activeCranes.map((crane, idx) => (
                <View key={idx} style={styles.gridRow}>
                  <Text style={[styles.td, { width: "20%" }]}>
                    Пролёт #{crane.spanNum}
                  </Text>
                  <Text style={[styles.td, { width: "35%", fontWeight: "bold" }]}>
                    {crane.type === "suspension" ? "Подвесной" : "Мостовой опорный"}
                  </Text>
                  <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>{crane.cap} т</Text>
                  <Text style={[styles.td, { width: "20%", textAlign: "right" }]}>{W} м</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Междуэтажные перекрытия */}
        {hasMezzanine && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>7. Междуэтажные перекрытия (Антресоль)</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Площадь антресоли / полезная нагрузка:</Text>
                <Text style={styles.colValue}>
                  {estimation?.mezzanineArea || "-"} м² / {floorStructure?.liveLoad || 400} кг/м²
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Тип конструкции перекрытия:</Text>
                <Text style={styles.colValue}>{floorStructure?.name || "Монолитный ЖБ по профлисту"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.colLabel}>Толщина плиты / Масса металлокаркаса:</Text>
                <Text style={styles.colValue}>
                  {floorStructure?.thickness || 120} мм / {estimation?.mezzanineWeight ? `${estimation.mezzanineWeight} т` : "-"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Подписи сторон */}
        <View style={styles.signBlock} wrap={false}>
          <View style={styles.signParty}>
            <Text style={styles.signTitle}>СОГЛАСОВАНО (ЗАКАЗЧИК):</Text>
            <View style={styles.signLine} />
            <Text style={styles.signDesc}>Подпись / ФИО / М.П.</Text>
          </View>
          <View style={styles.signParty}>
            <Text style={styles.signTitle}>РАЗРАБОТАНО (ПОСТАВЩИК):</Text>
            <View style={styles.signLine} />
            <Text style={styles.signDesc}>ЕВРОАНГАР / М.П.</Text>
          </View>
        </View>

        {/* Подвал */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Здание ЕВРОАНГАР {totalWidth}×{L}×{H} м • Автоматическая выгрузка ТЗ
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Стр. ${pageNumber} из ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
