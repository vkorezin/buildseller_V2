import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Надежные ссылки на шрифты с поддержкой кириллицы
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
  cellHeader: { width: '28%', fontWeight: 'bold', fontSize: 9 },
  cell: { width: '18%', textAlign: 'center', fontSize: 9 },
  cellBase: { width: '18%', textAlign: 'center', fontSize: 9, fontWeight: 'bold', backgroundColor: '#e8f4fd', paddingVertical: 4 },
  labelCell: { width: '28%', fontSize: 9, fontWeight: 'bold' },
  analyticsBox: { backgroundColor: '#e8f5e9', padding: 10, borderRadius: 4, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  analyticsText: { color: '#2e7d32', fontSize: 11, fontWeight: 'bold' },
  analyticsSub: { color: '#555', fontSize: 8, marginTop: 4 },
  listText: { marginBottom: 4, lineHeight: 1.4 },
  breakdownTitle: { fontWeight: 'bold', fontSize: 10, marginBottom: 4, marginTop: 8 },
  breakdownNote: { fontSize: 8, color: '#666', marginTop: 3 }, // Без курсива!
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

        {/* 2. СРАВНИТЕЛЬНАЯ МАТРИЦА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ</Text>
          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={styles.cellHeader}>Параметр</Text>
            {types.map((t, index) => <Text key={index} style={t.isBase ? styles.cellBase : styles.cell}>{t.name || '-'}{t.isBase ? ' (База)' : ''}</Text>)}
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>Рамы / Колонны</Text>
            {types.map((t, index) => { const d = !t.blocked ? t.calc() : null; return <Text key={index} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.frames / 1000).toFixed(2)} т` : '-'}</Text>; })}
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>Прогоны (Кровля+Стены)</Text>
            {types.map((t, index) => { const d = !t.blocked ? t.calc() : null; return <Text key={index} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.purlins / 1000).toFixed(2)} т` : '-'}</Text>; })}
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>Металлокаркас (₽)</Text>
            {types.map((t, index) => { const d = !t.blocked ? t.calc() : null; return <Text key={index} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${Math.round(d.metalCost || 0).toLocaleString('ru-RU')} ₽` : 'Неприменимо'}</Text>; })}
          </View>
          <View style={[styles.row, { borderBottomWidth: 2, borderBottomColor: '#333' }]}>
            <Text style={[styles.labelCell, { fontSize: 10 }]}>ИТОГО ПО ЗДАНИЮ</Text>
            {types.map((t, index) => {
              const d = !t.blocked ? t.calc() : null;
              const totalAll = d ? (Number(d.metalCost) || 0) + (Number(data.envelopeCost) || 0) + (Number(data.foundationCost) || 0) : 0;
              return <Text key={index} style={[t.isBase ? styles.cellBase : styles.cell, { fontSize: 10 }]}>{d ? `${Math.round(totalAll).toLocaleString('ru-RU')} ₽` : '-'}</Text>;
            })}
          </View>
        </View>

        {/* 3. ДЕТАЛИЗАЦИЯ КОМПЛЕКТАЦИИ */}
        {(data.useSandwich || data.foundationCost > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. ДЕТАЛИЗАЦИЯ ОГРАЖДАЮЩИХ КОНСТРУКЦИЙ И ФУНДАМЕНТА</Text>
            
            {/* Детализация Обшивки */}
            {data.useSandwich && (
              <View>
                <Text style={styles.breakdownTitle}>Ограждающие конструкции (Сэндвич-панели):</Text>
                <Text style={styles.listText}>• Стеновые панели: {Math.round(data.wallCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.listText}>• Кровельные панели: {Math.round(data.roofCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.listText}>• Фасонные элементы (нащельники, отливы) и крепеж: {Math.round(data.trimCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.breakdownNote}>
                  * Стоимость обшивки рассчитана на основе габаритов здания (периметр стен и площадь скатов кровли) с учетом коэффициента на подрезку и отходы.
                </Text>
              </View>
            )}

            {/* Детализация Фундамента */}
            {data.foundationCost > 0 && (
              <View>
                <Text style={styles.breakdownTitle}>Фундаментные работы (Справочно):</Text>
                <Text style={styles.listText}>• Ориентировочная стоимость материалов и работ: {Math.round(data.foundationCost || 0).toLocaleString('ru-RU')} ₽</Text>
                <Text style={styles.breakdownNote}>
                  * Расчет фундамента является укрупненным (ж/б фундамент стаканного типа / буронабивные сваи). Итоговая стоимость зависит от результатов геологических изысканий грунта на вашем участке застройки.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 4. АНАЛИТИКА */}
        {data.frameType === 'truss' && netSavings > 0 && (
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsText}>💎 ВЫГОДА ОТ ЗАМЕНЫ БАЛКИ НА ФЕРМУ: {netSavings.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.analyticsSub}>* Сравнение произведено по Базовому типу. Удорожание сэндвич-панелей (из-за высоты фермы) уже учтено в расчете.</Text>
          </View>
        )}

        {/* 5. УСЛОВИЯ */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>УСЛОВИЯ ПОСТАВКИ И ОПЛАТЫ</Text>
          <Text style={styles.listText}>• Срок поставки: Срок поставки первой партии товара составляет 43 рабочих дня.</Text>
          <Text style={styles.listText}>• Условия оплаты: 70% — аванс, 30% — по готовности к отгрузке.</Text>
          <Text style={styles.listText}>• НДС: Все цены указаны с учетом НДС 22%.</Text>
        </View>

        {/* ПОДВАЛ С КОНТАКТАМИ */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Ваш персональный менеджер: {managerName}</Text>
          <Text>Телефон: {managerPhone}</Text>
          <Text>Email: {managerEmail}</Text>
          
          <Text style={styles.disclaimer}>
            Данное коммерческое предложение носит исключительно индикативный характер, является предварительным расчетом стоимости на основе введенных параметров и не является публичной офертой. Окончательная стоимость формируется после разработки раздела КМ.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
