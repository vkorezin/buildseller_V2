import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Надежные ссылки на шрифты с поддержкой кириллицы
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Me5Q.ttf' }, // Обычный
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfChc9.ttf', fontWeight: 'bold' } // Жирный
  ]
});

// Стили документа
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#007bff', paddingBottom: 10 },
  brandText: { fontSize: 26, fontWeight: 'bold', color: '#007bff', marginBottom: 8, letterSpacing: 1 },
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
  footer: { marginTop: 30, borderTop: 1, borderTopColor: '#ccc', paddingTop: 15, fontSize: 10 },
  managerName: { fontWeight: 'bold', fontSize: 11, marginBottom: 3 },
  disclaimer: { marginTop: 20, fontSize: 8, fontStyle: 'italic', color: '#999', textAlign: 'justify' }
});

const CommercialProposalPDF = ({ data = {}, types = [], managerName, managerPhone, managerEmail }) => {
  const date = new Date().toLocaleDateString('ru-RU');
  const kpNumber = `КП-${Date.now().toString().slice(-6)}`;

  // Безопасный расчет экономии
  const savings = Number(data.savingsAmount) || 0;
  const diff = Number(data.envelopeDiffAmount) || 0;
  const netSavings = savings - diff;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ШАПКА БЕЗ КАРТИНКИ (Защита от падений) */}
        <View style={styles.header}>
          <Text style={styles.brandText}>ЕВРОАНГАР</Text>
          <Text style={styles.title}>Коммерческое предложение № {kpNumber}</Text>
          <Text style={styles.subtitle}>Дата формирования: {date}</Text>
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
          <Text style={{ fontSize: 9, marginBottom: 8, color: '#555' }}>
            Мы предлагаем 4 варианта реализации вашего проекта. Обратите внимание на Базовый тип (ЕВРОАНГАР) — за счет применения гибридных технологий он обеспечивает наилучшее соотношение массы и стоимости.
          </Text>

          {/* Заголовки */}
          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={styles.cellHeader}>Параметр</Text>
            {types.map(t => (
              <Text key={t.id || Math.random()} style={t.isBase ? styles.cellBase : styles.cell}>
                {t.name || '-'}{t.isBase ? ' (База)' : ''}
              </Text>
            ))}
          </View>
          
          {/* Масса Рам */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Рамы / Колонны</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id || Math.random()} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.frames / 1000).toFixed(2)} т` : '-'}</Text>;
            })}
          </View>

          {/* Масса Прогонов */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Прогоны (Кровля+Стены)</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id || Math.random()} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.purlins / 1000).toFixed(2)} т` : '-'}</Text>;
            })}
          </View>

          {/* Стоимость Каркаса */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Металлокаркас (₽)</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id || Math.random()} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${Math.round(d.metalCost || 0).toLocaleString('ru-RU')} ₽` : 'Неприменимо'}</Text>;
            })}
          </View>

          {/* ИТОГО */}
          <View style={[styles.row, { borderBottomWidth: 2, borderBottomColor: '#333' }]}>
            <Text style={[styles.labelCell, { fontSize: 10 }]}>ИТОГО ПО ЗДАНИЮ</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              const envCost = Number(data.envelopeCost) || 0;
              const foundCost = Number(data.foundationCost) || 0;
              const totalAll = d ? (Number(d.metalCost) || 0) + envCost + foundCost : 0;
              return (
                <Text key={t.id || Math.random()} style={[t.isBase ? styles.cellBase : styles.cell, { fontSize: 10 }]}>
                  {d ? `${Math.round(totalAll).toLocaleString('ru-RU')} ₽` : '-'}
                </Text>
              );
            })}
          </View>
        </View>

        {/* 3. АНАЛИТИКА */}
        {data.frameType === 'truss' && netSavings > 0 && (
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsText}>💎 ВЫГОДА ОТ ЗАМЕНЫ БАЛКИ НА ФЕРМУ: {netSavings.toLocaleString('ru-RU')} ₽</Text>
            <Text style={styles.analyticsSub}>* Сравнение произведено по Базовому типу. Удорожание сэндвич-панелей (из-за высоты фермы) уже учтено в расчете.</Text>
          </View>
        )}

        {/* 4. УСЛОВИЯ */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>4. УСЛОВИЯ ПОСТАВКИ И ОПЛАТЫ</Text>
          <Text style={styles.listText}>• Срок поставки: Срок поставки первой партии товара составляет 43 рабочих дня.</Text>
          <Text style={styles.listText}>• Условия оплаты: 70% — аванс, 30% — по готовности.</Text>
          <Text style={styles.listText}>• НДС: Все цены указаны с учетом НДС 22%.</Text>
        </View>

        {/* ПОДВАЛ */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Ваш персональный менеджер:</Text>
          <Text>{managerName || 'Менеджер Проектов'}</Text>
          <Text>Телефон: {managerPhone || '+7 (495) 000-00-00'}</Text>
          <Text style={styles.disclaimer}>
            Данное коммерческое предложение носит исключительно индикативный характер и не является публичной офертой.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
