import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#007bff', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  logo: { width: 150, marginBottom: 12 },
  brandFallback: { fontSize: 26, fontWeight: 'bold', color: '#007bff', marginBottom: 8, letterSpacing: 1 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, backgroundColor: '#f0f0f0', padding: 4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 6, alignItems: 'center' },
  listText: { marginBottom: 4, lineHeight: 1.4 },
  breakdownTitle: { fontWeight: 'bold', fontSize: 10, marginBottom: 4, marginTop: 8 },
  breakdownNote: { fontSize: 8, color: '#666', marginTop: 3 },
  analyticsBox: { backgroundColor: '#e8f5e9', padding: 10, borderRadius: 4, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  analyticsText: { color: '#2e7d32', fontSize: 11, fontWeight: 'bold' },
  analyticsSub: { color: '#555', fontSize: 8, marginTop: 4 },
  footer: { marginTop: 30, borderTop: 1, borderTopColor: '#ccc', paddingTop: 15, fontSize: 10 },
  managerName: { fontWeight: 'bold', fontSize: 11, marginBottom: 3 },
  disclaimer: { marginTop: 20, fontSize: 8, color: '#999', textAlign: 'justify' }
});

const CommercialProposalPDF = ({ data = {}, types = [], managerName, managerPhone, managerEmail }) => {
  const date = new Date().toLocaleDateString('ru-RU');
  const kpNumber = `КП-${Date.now().toString().slice(-6)}`;

  const savings = Number(data.savingsAmount) || 0;
  const diff = Number(data.envelopeDiffAmount) || 0;
  const netSavings = savings - diff;

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.jpg` : '';

  // ТРЕБОВАНИЕ 1: Фильтруем типы, оставляем только доступные (не заблокированные)
  const visibleTypes = types.filter(t => !t.blocked);
  
  // Рассчитываем динамическую ширину колонок в таблице в зависимости от их количества
  const labelCellWidth = '31%';
  const valueCellWidth = visibleTypes.length > 0 ? `${69 / visibleTypes.length}%` : '69%';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ШАПКА */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : <Text style={styles.brandFallback}>ЕВРОАНГАР</Text>}
            <Text style={styles.title}>Коммерческое предложение № {kpNumber}</Text>
            <Text style={styles.subtitle}>Дата формирования: {date}</Text>
          </View>
        </View>

        {/* 1. ПАРАМЕТРЫ ОБЪЕКТА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ПАРАМЕТРЫ ОБЪЕКТА</Text>
          <Text style={styles.listText}>• Габариты здания: Пролет {data.spanWidth || '-'} м × Длина {data.length || '-'} м × Высота {data.height || '-'} м</Text>
          <Text style={styles.listText}>• Тип конструкции: {data.frameType === 'truss' ? 'Ферма' : 'Балка'}</Text>
          <Text style={styles.listText}>• Климатические нагрузки: Снег {data.snowLoad || '-'} кг/м², Ветер {data.windLoad || '-'} кг/м²</Text>
          <Text style={styles.listText}>• Крановое оборудование: {data.craneInfo || 'Нет крана'}</Text>
        </View>

        {/* 2. СРАВНИТЕЛЬНАЯ МАТРИЦА СТОИМОСТИ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ</Text>
          <Text style={{ fontSize: 9, marginBottom: 8, color: '#555' }}>
            Мы предлагаем оптимальные варианты реализации вашего проекта. Вариант ЕВРОАНГАР (База) обеспечивает наилучшие прочностные и стоимостные показатели за счет гибридной технологии.
          </Text>

          {/* Заголовки таблицы */}
          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={{ width: labelCellWidth, fontWeight: 'bold', fontSize: 9 }}>Вариант каркаса</Text>
            {visibleTypes.map((t, index) => (
              <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9, fontWeight: 'bold', backgroundColor: t.isBase ? '#e8f4fd' : 'transparent', paddingVertical: t.isBase ? 4 : 0 }}>
                {t.name || '-'}{t.isBase ? ' (База)' : ''}
              </Text>
            ))}
          </View>
          
          {/* ТРЕБОВАНИЕ 3: Строки массы удалены! Оставляем только стоимости */}
          {/* Стоимость Каркаса */}
          <View style={styles.row}>
            <Text style={{ width: labelCellWidth, fontSize: 9, fontWeight: 'bold' }}>Металлокаркас (₽)</Text>
            {visibleTypes.map((t, index) => {
              const d = t.calc();
              return (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9, backgroundColor: t.isBase ? '#e8f4fd' : 'transparent', paddingVertical: t.isBase ? 4 : 0 }}>
                  {Math.round(d.metalCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              );
            })}
          </View>

          {/* Обшивка */}
          {data.useSandwich && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 9, fontWeight: 'bold' }}>Обшивка (Сэндвич-панели) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9, backgroundColor: t.isBase ? '#e8f4fd' : 'transparent', paddingVertical: t.isBase ? 4 : 0 }}>
                  {Math.round(data.envelopeCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          {/* Фундамент */}
          {data.foundationCost > 0 && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 9, fontWeight: 'bold' }}>Фундамент (Справочно) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9, backgroundColor: t.isBase ? '#e8f4fd' : 'transparent', paddingVertical: t.isBase ? 4 : 0 }}>
                  {Math.round(data.foundationCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          {/* ИТОГО ПО ЗДАНИЮ */}
          <View style={[styles.row, { borderBottomWidth: 2, borderBottomColor: '#333' }]}>
            <Text style={{ width: labelCellWidth, fontSize: 10, fontWeight: 'bold' }}>ИТОГО ПО ОБЪЕКТУ</Text>
            {visibleTypes.map((t, index) => {
              const d = t.calc();
              const envCost = Number(data.envelopeCost) || 0;
              const foundCost = Number(data.foundationCost) || 0;
              const totalAll = d ? (Number(d.metalCost) || 0) + envCost + foundCost : 0;
              return (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 10, fontWeight: 'bold', backgroundColor: t.isBase ? '#e8f4fd' : '#f1f8e9', paddingVertical: 4 }}>
                  {Math.round(totalAll).toLocaleString('ru-RU')} ₽
                </Text>
              );
            })}
          </View>
        </View>

        {/* 3. ДЕТАЛИЗАЦИЯ КОМПЛЕКТАЦИИ (Только стоимости, без площадей и объемов!) */}
        {(data.useSandwich || data.foundationCost > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. ПОЯСНЕНИЯ К СТОИМОСТИ СМЕТНЫХ РАЗДЕЛОВ</Text>
            
            {data.useSandwich && (
              <View style={{ marginBottom: 10 }}>
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

        {/* 5. УСЛОВИЯ */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>5. СРОКИ И КОММЕРЧЕСКИЕ УСЛОВИЯ</Text>
          <Text style={styles.listText}>• Срок поставки: Период отгрузки первой технологической партии конструкций на площадку — 43 рабочих дня.</Text>
          <Text style={styles.listText}>• Порядок расчетов: 70% — авансовое финансирование для запуска производства, 30% — оплата по факту готовности к отгрузке завода.</Text>
          <Text style={styles.listText}>• Налоговый режим: Все цены сформированы и указаны с учетом НДС 22%.</Text>
        </View>

        {/* ТРЕБОВАНИЕ 2: ДИНАМИЧЕСКИЙ ПОДВАЛ С ДАННЫМИ МЕНЕДЖЕРА */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Коммерческое предложение подготовил специалист:</Text>
          <Text>ФИО: {managerName || '________________________________________'}</Text>
          <Text>Телефон: {managerPhone || '____________________'}</Text>
          {managerEmail ? <Text>Email: {managerEmail}</Text> : null}
          
          <Text style={styles.disclaimer}>
            Данное технико-коммерческое предложение носит исключительно индикативный (ознакомительный) характер, основано на предварительных экспресс-расчетах параметров здания и не является публичной офертой. Полная юридическая и техническая гарантия стоимости формируется исключительно по итогам разработки стадии КМ.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
