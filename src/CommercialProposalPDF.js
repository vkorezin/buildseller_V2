import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import PDFBuildingSectionEskiz from './PDFBuildingSectionEskiz';

Font.register({
  family: 'Roboto',
  fonts: [
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Regular.ttf', 
      fontWeight: 'normal' 
    },
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Medium.ttf', 
      fontWeight: 500 
    },
    { 
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.9/fonts/Roboto/Roboto-Medium.ttf', 
      fontWeight: 'bold' 
    }
  ]
});

const styles = StyleSheet.create({
  page: { 
    padding: 35, 
    fontFamily: 'Roboto', 
    fontSize: 9.5, 
    color: '#333333' 
  },
  header: { 
    marginBottom: 12, 
    borderBottomWidth: 1.5, 
    borderBottomColor: '#007bff', 
    paddingBottom: 8, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  headerLeft: { 
    flex: 1, 
    paddingRight: 15 
  },
  logo: { 
    width: 140, 
    marginBottom: 6 
  },
  brandFallback: { 
    fontSize: 24, 
    color: '#007bff', 
    marginBottom: 4, 
    letterSpacing: 1 
  },
  title: { 
    fontSize: 11, 
    marginBottom: 3, 
    color: '#111111', 
    lineHeight: 1.3 
  },
  subtitle: { 
    fontSize: 8.5, 
    color: '#555555' 
  },
  section: { 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 10.5, 
    marginBottom: 5, 
    backgroundColor: '#f0f0f0', 
    padding: 3.5, 
    textTransform: 'uppercase' 
  },
  row: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eeeeee', 
    paddingVertical: 4.5, 
    alignItems: 'center' 
  },
  listText: { 
    marginBottom: 3, 
    lineHeight: 1.3, 
    fontSize: 8.5 
  },
  breakdownTitle: { 
    fontSize: 9, 
    marginBottom: 2.5, 
    marginTop: 4 
  },
  breakdownNote: { 
    fontSize: 7.5, 
    color: '#666666', 
    marginTop: 2 
  },
  analyticsBox: { 
    backgroundColor: '#e8f5e9', 
    padding: 7, 
    borderRadius: 4, 
    marginTop: 6, 
    borderLeftWidth: 3, 
    borderLeftColor: '#4caf50' 
  },
  analyticsText: { 
    color: '#2e7d32', 
    fontSize: 9.5 
  },
  analyticsSub: { 
    color: '#555555', 
    fontSize: 7.5, 
    marginTop: 2 
  },
  footer: { 
    marginTop: 14, 
    borderTopWidth: 1, 
    borderTopColor: '#cccccc', 
    paddingTop: 8, 
    fontSize: 8.5 
  },
  managerName: { 
    fontSize: 9.5, 
    marginBottom: 2 
  },
  disclaimer: { 
    marginTop: 8, 
    fontSize: 7, 
    color: '#999999', 
    textAlign: 'justify', 
    lineHeight: 1.2 
  }
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

  const spansCountNum = Number(data.spansCount) || 1;
  const spanWidthNum = Number(data.spanWidth) || 18;
  const totalBuildingWidth = spanWidthNum * spansCountNum;
  const storiesNum = Number(data.stories) || 1;

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

        {/* 1. ПАРАМЕТРЫ ОБЪЕКТА */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ПАРАМЕТРЫ ОБЪЕКТА</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ width: '49%' }}>
              <Text style={styles.listText}>
                • Габариты: {spansCountNum > 1 ? `${spansCountNum} прол. по ${spanWidthNum} м (общ. ${totalBuildingWidth} м)` : `Пролет ${spanWidthNum} м`} × Длина {data.length || '-'} м
              </Text>
              <Text style={styles.listText}>
                • Этажность: {storiesNum > 1 ? `${storiesNum} эт. (${data.floorStructure?.shortName || 'Ж/б перекрытие'}, толщ. ${data.floorStructure?.thickness || 120} мм, полезная ${data.floorStructure?.liveLoad || 400} кг/м², γf=${data.floorStructure?.safetyFactor || 1.2})` : '1 этаж (однообъемное здание)'}
              </Text>
              <Text style={styles.listText}>• Высота до низа несущих конструкций: {data.height || '-'} м</Text>
              <Text style={styles.listText}>• Несущий каркас: {data.frameType === 'truss' ? 'Решетчатая ферма' : 'Рамная балка'}</Text>
            </View>
            <View style={{ width: '49%' }}>
              <Text style={styles.listText}>• Форма кровли: {data.roofShape === 'single' ? 'Односкатная' : 'Двускатная'} (уклон {data.slope || 10}%)</Text>
              <Text style={styles.listText}>• Нагрузки: Снег {data.snowLoad || '-'} кг/м², Ветер {data.windLoad || '-'} кг/м²</Text>
              <Text style={styles.listText}>• Крановое оборудование: {data.craneInfo || 'Нет крана'}</Text>
            </View>
          </View>

          {/* Крупный эскиз поперечного разреза */}
          <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', borderRadius: 4, padding: 4, borderWidth: 1, borderColor: '#eeeeee' }}>
            <PDFBuildingSectionEskiz
              spanWidth={data.spanWidth}
              spansCount={data.spansCount}
              height={data.height}
              stories={data.stories}
              roofShape={data.roofShape}
              slope={data.slope}
              frameType={data.frameType}
              cranes={data.cranes}
              spanOrientations={data.spanOrientations}
              floorStructure={data.floorStructure}
            />
          </View>
        </View>

        {/* 2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. СРАВНЕНИЕ ВАРИАНТОВ ИСПОЛНЕНИЯ</Text>
          <Text style={{ fontSize: 8, marginBottom: 5, color: '#555555', lineHeight: 1.2 }}>
            Вариант ЕВРОАНГАР (База) обеспечивает наилучшие прочностные и стоимостные показатели за счет гибридной технологии.
          </Text>

          <View style={[styles.row, { backgroundColor: '#f8f9fa' }]}>
            <Text style={{ width: labelCellWidth, fontSize: 8 }}>Вариант каркаса</Text>
            {visibleTypes.map((t, index) => (
              <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 2.5 : 0 }}>
                {t.name || '-'}{t.isBase ? ' (База)' : ''}
              </Text>
            ))}
          </View>
          
          <View style={styles.row}>
            <Text style={{ width: labelCellWidth, fontSize: 8 }}>Металлокаркас (₽)</Text>
            {visibleTypes.map((t, index) => (
              <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 2.5 : 0 }}>
                {Math.round(t.metalCost || 0).toLocaleString('ru-RU')} ₽
              </Text>
            ))}
          </View>

          {data.useSandwich && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 8 }}>Обшивка (Сэндвич-панели) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 2.5 : 0 }}>
                  {Math.round(data.envelopeCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          {data.foundationCost > 0 && (
            <View style={styles.row}>
              <Text style={{ width: labelCellWidth, fontSize: 8 }}>Фундамент (Справочно) (₽)</Text>
              {visibleTypes.map((t, index) => (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 8, backgroundColor: t.isBase ? '#e8f4fd' : '#ffffff', paddingVertical: t.isBase ? 2.5 : 0 }}>
                  {Math.round(data.foundationCost || 0).toLocaleString('ru-RU')} ₽
                </Text>
              ))}
            </View>
          )}

          <View style={[styles.row, { borderBottomWidth: 1.5, borderBottomColor: '#333333' }]}>
            <Text style={{ width: labelCellWidth, fontSize: 9 }}>ИТОГО ПО ОБЪЕКТУ</Text>
            {visibleTypes.map((t, index) => {
              const envCost = Number(data.envelopeCost) || 0;
              const foundCost = Number(data.foundationCost) || 0;
              const totalAll = (Number(t.metalCost) || 0) + envCost + foundCost;
              return (
                <Text key={index} style={{ width: valueCellWidth, textAlign: 'center', fontSize: 9, backgroundColor: t.isBase ? '#e8f4fd' : '#f1f8e9', paddingVertical: 2.5 }}>
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
              <View style={{ marginBottom: 4 }}>
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
        <View style={[styles.section, { marginTop: 6 }]}>
          <Text style={styles.sectionTitle}>4. СРОКИ И КОММЕРЧЕСКИЕ УСЛОВИЯ</Text>
          <Text style={styles.listText}>• Срок поставки: Период отгрузки первой технологической партии конструкций на площадку — 43 рабочих дня.</Text>
          <Text style={styles.listText}>• Порядок расчетов: 70% — авансовое финансирование для запуска производства, 30% — оплата по факту готовности к отгрузке завода.</Text>
          <Text style={styles.listText}>• Налоговый режим: Все цены сформированы и указаны с учетом НДС 22%.</Text>
        </View>

        {/* ПОДВАЛ МЕНЕДЖЕРА */}
        <View style={styles.footer}>
          <Text style={styles.managerName}>Коммерческое предложение подготовил специалист:</Text>
          <Text style={{ marginBottom: 1.5 }}>ФИО: {managerName || '________________________________________'}</Text>
          <Text style={{ marginBottom: 1.5 }}>Телефон: {managerPhone || '____________________'}</Text>
          {managerEmail ? <Text style={{ marginBottom: 1.5 }}>Email: {managerEmail}</Text> : null}
          
          <Text style={styles.disclaimer}>
            Данное технико-коммерческое предложение носит исключительно индикативный (ознакомительный) характер, основано на предварительных экспресс-расчетах параметров здания и не является публичной офертой. Полная юридическая и техническая гарантия стоимости формируется исключительно по итогам разработки стадии КМ.
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default CommercialProposalPDF;
