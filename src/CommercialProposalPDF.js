import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Регистрируем шрифт для кириллицы
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

// Стили документа
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#007bff', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  logo: { width: 140, marginBottom: 10 }, // Размер логотипа
  brandFallback: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginBottom: 5 },
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

const CommercialProposalPDF = ({ data, types, managerName, managerPhone, managerEmail }) => {
  const date = new Date().toLocaleDateString('ru-RU');
  const kpNumber = `КП-${Date.now().toString().slice(-6)}`;

  // Расчет экономии (Балка vs Ферма)
  const netSavings = data.savingsAmount - (data.envelopeDiffAmount || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ШАПКА */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Берем логотип из папки public */}
            <Image src="/logo.png" style={styles.logo} />
            <Text style={styles.title}>Коммерческое предложение № {kpNumber}</Text>
            <Text style={styles.subtitle}>Дата формирования: {date}</Text>
          </View>
        </View>

        {/* 1. ПАРАМЕТРЫ ОБЪЕКТА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ПАРАМЕТРЫ ОБЪЕКТА</Text>
          <Text style={styles.listText}>• Габариты здания: Пролет {data.spanWidth} м × Длина {data.length} м × Высота {data.height} м</Text>
          <Text style={styles.listText}>• Тип конструкции: {data.frameType === 'truss' ? 'Ферма' : 'Балка'}</Text>
          <Text style={styles.listText}>• Климатические нагрузки: Снег {data.snowLoad} кг/м², Ветер {data.windLoad} кг/м²</Text>
          <Text style={styles.listText}>• Крановое оборудование: {data.craneInfo || 'Нет крана'}</Text>
        </View>

        {/* 2. СРАВНИТЕЛЬНАЯ МАТРИЦА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ</Text>
          <Text style={{ fontSize: 9, marginBottom: 8, color: '#555' }}>
            Мы предлагаем 4 варианта реализации вашего проекта. Обратите внимание на Базовый тип (ЕВРОАНГАР) — за счет применения гибридных технологий он обеспечивает наилучшее соотношение массы и стоимости.
          </Text>

          {/* Заголовки таблицы */}
          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={styles.cellHeader}>Параметр</Text>
            {types.map(t => (
              <Text key={t.id} style={t.isBase ? styles.cellBase : styles.cell}>
                {t.name}{t.isBase ? ' (База)' : ''}
              </Text>
            ))}
          </View>
          
          {/* Масса Рам */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Рамы / Колонны</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.frames / 1000).toFixed(2)} т` : '-'}</Text>;
            })}
          </View>

          {/* Масса Прогонов */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Прогоны (Кровля + Стены)</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${(d.purlins / 1000).toFixed(2)} т` : '-'}</Text>;
            })}
          </View>

          {/* Стоимость Каркаса */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Металлокаркас (₽)</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              return <Text key={t.id} style={t.isBase ? styles.cellBase : styles.cell}>{d ? `${Math.round(d.metalCost).toLocaleString('ru-RU')} ₽` : 'Неприменимо'}</Text>;
            })}
          </View>

          {/* Обшивка */}
          <View style={styles.row}>
            <Text style={styles.labelCell}>Обшивка стен и кровли (₽)</Text>
            {types.map(t => (
              <Text key={t.id} style={t.isBase ? styles.cellBase : styles.cell}>{!t.blocked && data.envelopeCost ? `${Math.round(data.envelopeCost).toLocaleString('ru-RU')} ₽` : '-'}</Text>
            ))}
          </View>

          {/* ИТОГО */}
          <View style={[styles.row, { borderBottomWidth: 2, borderBottomColor: '#333' }]}>
            <Text style={[styles.labelCell, { fontSize: 10 }]}>ИТОГО ПО ЗДАНИЮ</Text>
            {types.map(t => {
              const d = !t.blocked ? t.calc() : null;
              const totalAll = d ? d.metalCost + (data.envelopeCost || 0) + (data.foundationCost || 0) : 0;
              return (
                <Text key={t.id} style={[t.isBase ? styles.cellBase : styles.cell, { fontSize: 10 }]}>
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
          <Text style={styles.listText}>• Срок поставки: Срок поставки первой партии товара составляет 43 рабочих дня с момента подписания договора.</Text>
          <Text style={styles.listText}>• Условия оплаты: 70% — авансовый платеж, 30% — по готовности металлоконструкций к отгрузке.</Text>
          <Text style={styles.listText}>• НДС: Все цены указаны с учетом НДС 22%.</Text>
        </View>

        {/* ПОДВАЛ (Менеджер) */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Ваш персональный менеджер:</Text>
          <Text>{managerName || 'Иванов Иван Иванович'}</Text>
          <Text>Телефон: {managerPhone || '+7 (999) 000-00-00'}</Text>
          <Text>Email: {managerEmail || 'info@euroangar.ru'}</Text>
          
          <Text style={styles.disclaimer}>
            Данное коммерческое предложение носит исключительно индикативный характер, является предварительным расчетом стоимости на основе введенных параметров и не является публичной офертой. Окончательная стоимость формируется после разработки раздела КМ.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
