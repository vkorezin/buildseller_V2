import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import PDFBuildingSectionEskiz from './PDFBuildingSectionEskiz';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 35, fontFamily: 'Roboto', fontSize: 9.5, color: '#333' },
  header: { marginBottom: 15, borderBottomWidth: 1.5, borderBottomColor: '#007bff', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, paddingRight: 15 },
  logo: { width: 140, marginBottom: 8 },
  brandFallback: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginBottom: 6, letterSpacing: 1 },
  title: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#111', lineHeight: 1.3 },
  subtitle: { fontSize: 9, color: '#555' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, backgroundColor: '#f0f0f0', padding: 4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 5, alignItems: 'center' },
  listText: { marginBottom: 3.5, lineHeight: 1.35, fontSize: 9 },
  breakdownTitle: { fontWeight: 'bold', fontSize: 9.5, marginBottom: 3, marginTop: 6 },
  breakdownNote: { fontSize: 7.5, color: '#666', marginTop: 2 },
  analyticsBox: { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 4, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  analyticsText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },
  analyticsSub: { color: '#555', fontSize: 7.5, marginTop: 3 },
  footer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10, fontSize: 9 },
  managerName: { fontWeight: 'bold', fontSize: 10, marginBottom: 2 },
  disclaimer: { marginTop: 12, fontSize: 7.5, color: '#999', textAlign: 'justify', lineHeight: 1.25 }
});

const CommercialProposalPDF = ({ data = {}, types = [], managerName, managerPhone, managerEmail }) => {
  const date = data.formattedDate || new Date().toLocaleDateString('ru-RU');
  const kpNumber = data.kpNumber || `КП-${Date.now().toString().slice(-6)}`;

  const savings = Number(data.savingsAmount) || 0;
  const diff = Number(data.envelopeDiffAmount) || 0;
  const netSavings = savings - diff;

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.jpg` : '';

  const visibleTypes = types;
  const labelCellWidth = '31%';
  const valueCellWidth = visibleTypes.length > 0 ? `${69 / visibleTypes.length}%` : '69%';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ШАПКА ДОКУМЕНТА */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : <Text style={styles.brandFallback}>ЕВРОАНГАР</Text>}
            <Text style={styles.title}>
              Технико-коммерческое предложение сравнения вариантов конструктивных решений
            </Text>
            <Text style={styles.subtitle}>Предложение № {kpNumber} от {date}</Text>
          </View>
        </View>

        {/* 1. ПАРАМЕТРЫ ОБЪЕКТА (ДВУХКОЛОНОЧНЫЙ FLEX LAYOUT) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ПАРАМЕТРЫ ОБЪЕКТА</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Левая колонка: ТТХ */}
            <View style={{ width: '53%', paddingRight: 10 }}>
              <Text style={styles.listText}>• Габариты: Пролет {data.spanWidth || '-'} м × Длина {data.length || '-'} м</Text>
              <Text style={styles.listText}>• Высота до низа несущих конструкций: {data.height || '-'} м</Text>
              <Text style={styles.listText}>• Тип схемы: {data.frameType === 'truss' ? 'Решетчатая ферма' : 'Рамная балка'}</Text>
              <Text style={styles.listText}>• Форма кровли: {data.roofShape === 'single' ? 'Односкатная' : 'Двускатная'} (уклон {data.slope || 10}%)</Text>
              <Text style={styles.listText}>• Нагрузки: Снег {data.snowLoad || '-'} кг/м², Ветер {data.windLoad || '-'} кг/м²</Text>
              <Text style={styles.listText}>• Крановое оборудование: {data.craneInfo || 'Нет крана'}</Text>
            </View>

            {/* Правая колонка: Векторный эскиз */}
            <View style={{ width: '47%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', borderRadius: 4, padding: 4, border: '1px solid #eee' }}>
              <PDFBuildingSectionEskiz
                spanWidth={data.spanWidth}
                height={data.height}
                roofShape={data.roofShape}
                slope={data.slope}
                frameType={data.frameType}
                cranes={data.cranes}
              />
            </View>
          </View>
        </View>

        {/* 2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ</Text>
          <Text style={{ fontSize: 8.5, marginBottom: 6, color: '#555', lineHeight: 1.25 }}>
            Вариант ЕВРОАНГАР (База) обеспечивает наилучшие прочностные и стоимостные показатели за счет гибридной технологии.
          </Text>

          {/* Заголовки таблицы */}
          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={{ width: labelCellWidth, fontWeight: 'bold', fontSize: 8.5 }}>Вариант каркаса</Text>
            {visibleTypes.map((t, index) => (
              <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8.5, fontWeight: 'bold', backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 3 : 0 }}>
                {t.name || '-'}{t.isBase ? ' (База)' : ''}
              </Text>
            ))}
          </View>
          
          {/* Стоимость Каркаса */}
          <View style={styles.row}>
            <Text style={{ width: labelCellWidth, fontSize: 8.5, fontWeight: 'bold' }}>Металлокаркас (₽)</Text>
            {visibleTypes.map((t, index) => (
              <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8.5, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 3 : 0 }}>
                {Math.round(t.metalCost || 0).toLocaleString('ru-RU')} ₽
              </Text>
            ))}
          </View>

          {/* Обшивка */}
          {data.useSandwich && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 8.5, fontWeight: 'bold' }}>Обшивка (Сэндвич-панели) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8.5, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 3 : 0 }}>
                  {Math.round(data.envelopeCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          {/* Фундамент */}
          {data.foundationCost > 0 && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 8.5, fontWeight: 'bold' }}>Фундамент (Справочно) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8.5, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 3 : 0 }}>
                  {Math.round(data.foundationCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          {/* ИТОГО ПО ОБЪЕКТУ */}
          <View style={[styles.row, { borderBottomWidth: 1.5, borderBottomColor: '#333' }]}>
            <Text style={{ width: labelCellWidth, fontSize: 9.5, fontWeight: 'bold' }}>ИТОГО ПО ОБЪЕКТУ</Text>
            {visibleTypes.map((t, index) => {
              const envCost = Number(data.envelopeCost) || 0;
              const foundCost = Number(data.foundationCost) || 0;
              const totalAll = (Number(t.metalCost) || 0) + envCost + foundCost;
              return (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9.5, fontWeight: 'bold', backgroundColor: t.isBase ? '#e8f4fd' : '#f1f8e9', paddingVertical: 3 }}>
                  {Math.round(totalAll).toLocaleString('ru-RU')} ₽
                </Text>
              );
            })}
          </View>
        </View>

        {/* 3. ПОЯСНЕНИЯ К СТОИМОСТИ СМЕТНЫХ РАЗДЕЛОВ */}
        {(data.useSandwich || data.foundationCost > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. ПОЯСНЕНИЯ К СТОИМОСТИ СМЕТНЫХ РАЗДЕЛОВ</Text>
            
            {data.useSandwich && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.breakdownTitle}>Ограждающие конструкции комплекта здания:</Text>
                <Text style={styles.listText}>• Трехслойные стеновые сэндвич-панели с фасонными элементами: {Math.round(data.wallCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.listText}>• Трехслойные кровельные сэндвич-панели с комплектом крепежа: {Math.round(data.roofCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.listText}>• Нащельники, соединительные, сливные элементы и герметизирующие материалы: {Math.round(data.trimCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.breakdownNote}>
                  * Стоимость обшивки определена на основе проектных линейных размеров стен и кровли с учетом технологического запаса на монтажную подрезку.
                </Text>
              </View>
            )}

            {data.foundationCost > 0 && (
              <View>
                <Text style={styles.breakdownTitle}>Фундаменты здания (Справочная оценка):</Text>
                <Text style={styles.listText}>• Укрупненная базовая стоимость материалов и общестроительных работ: {Math.round(data.foundationCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.breakdownNote}>
                  * Финансовая оценка фундамента является предварительной и базируется на типовых нагрузках стаканного типа опор. Точная проектная спецификация и смета утверждаются исключительно после предоставления отчета об инженерно-геологических изысканиях площадки.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 4. АНАЛИТИКА */}
        {data.frameType === 'truss' && netSavings > 0 && (
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsText}>💎 ЭКОНОМИЧЕСКИЙ ЭФФЕКТ ОТ ЗАМЕНЫ БАЛКИ НА ФЕРМУ: {netSavings.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.analyticsSub}>* Оценка произведена по Базовому типу. Дополнительные затраты на тепловой контур из-за геометрии фермы учтены.</Text>
          </View>
        )}

        {/* 5. УСЛОВИЯ ПОСТАВКИ */}
        <View style={[styles.section, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>4. СРОКИ И КОММЕРЧЕСКИЕ УСЛОВИЯ</Text>
          <Text style={styles.listText}>• Срок поставки: Период отгрузки первой технологической партии конструкций на площадку — 43 рабочих дня.</Text>
          <Text style={styles.listText}>• Порядок расчетов: 70% — авансовое финансирование для запуска производства, 30% — оплата по факту готовности к отгрузке завода.</Text>
          <Text style={styles.listText}>• Налоговый режим: Все цены сформированы и указаны с учетом НДС 22%.</Text>
        </View>

        {/* ПОДВАЛ МЕНЕДЖЕРА */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Коммерческое предложение подготовил специалист:</Text>
          <Text style={{ marginBottom: 2 }}>ФИО: {managerName || '________________________________________'}</Text>
          <Text style={{ marginBottom: 2 }}>Телефон: {managerPhone || '____________________'}</Text>
          {managerEmail ? <Text style={{ marginBottom: 2 }}>Email: {managerEmail}</Text> : null}
          
          <Text style={styles.disclaimer}>
            Данное технико-коммерческое предложение носит исключительно индикативный (ознакомительный) характер, основано на предварительных экспресс-расчетах параметров здания и не является публичной офертой. Полная юридическая и техническая гарантия стоимости формируется исключительно по итогам разработки стадии КМ.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
