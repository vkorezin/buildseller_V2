import React from 'react';
import { Svg, Line, Circle, Text, G, Rect } from '@react-pdf/renderer';

const AXIS_LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'И', 'К', 'Л'];

export default function PDFBuildingSectionEskiz({
  spanWidth = 18,
  spansCount = 1,
  height = 6,
  roofShape = 'gable',
  slope = 10,
  frameType = 'beam',
  cranes = []
}) {
  const W_span = Number(spanWidth) > 0 ? Number(spanWidth) : 18;
  const N_spans = Math.max(1, Number(spansCount) || (Array.isArray(cranes) && cranes.length > 0 ? cranes.length : 1));
  const H_clear = Number(height) > 0 ? Number(height) : 6;
  const S = Number(slope) > 0 ? Number(slope) : 10;
  const isGable = String(roofShape) !== 'single';
  const isTruss = String(frameType) === 'truss';

  const totalWidth = W_span * N_spans;
  const hBeam = isTruss ? 1.2 : 0.45; // Строительная высота ригеля
  const hPurlin = 0.2; // Высота прогонов

  const ridgeRise = isGable ? (W_span / 2) * (S / 100) : W_span * (S / 100);
  const H_eave_top = H_clear + hBeam;
  const H_ridge_top = H_eave_top + ridgeRise + hPurlin;

  // Размеры SVG на всю ширину страницы A4 (с учетом отступов листа)
  const svgWidth = 525;
  const svgHeight = 150;

  const padLeft = 45;
  const padRight = 35;
  const padBottom = 28;
  const padTop = 22;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const maxRealW = totalWidth;
  const maxRealH = H_ridge_top * 1.1;

  const scale = Math.min(drawAreaW / maxRealW, drawAreaH / maxRealH);
  const realDrawW = totalWidth * scale;

  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;
  const baseGroundY = svgHeight - padBottom;

  // Y-координаты
  const yClear = baseGroundY - H_clear * scale;      // Низ несущих конструкций (+6.00)
  const yEaveTop = baseGroundY - H_eave_top * scale;  // Верх колонн/карниза
  const yPurlinEave = yEaveTop - hPurlin * scale;    // Верх стропильной системы на карнизе

  // Координаты X для всех рядов колонн (осей)
  const colXList = [];
  for (let i = 0; i <= N_spans; i++) {
    colXList.push(offsetX + i * (W_span * scale));
  }

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {/* 1. Уровень чистого пола */}
      <Line
        x1={colXList[0] - 15}
        y1={baseGroundY}
        x2={colXList[N_spans] + 15}
        y2={baseGroundY}
        stroke="#333333"
        strokeWidth={1}
      />

      {/* 2. Оси, колонны и размерная цепочка по пролетам */}
      {colXList.map((x, i) => {
        const axisLabel = AXIS_LABELS[i] || `${i + 1}`;
        return (
          <G key={`col-axis-${i}`}>
            {/* Осевая направляющая */}
            <Line
              x1={x}
              y1={yPurlinEave - 8}
              x2={x}
              y2={baseGroundY + 12}
              stroke="#aaaaaa"
              strokeWidth={0.5}
              opacity={0.6}
            />

            {/* Колонна (до низа несущих конструкций) */}
            <Line
              x1={x}
              y1={baseGroundY}
              x2={x}
              y2={yEaveTop}
              stroke="#007bff"
              strokeWidth={i === 0 || i === N_spans ? 2.5 : 2}
            />

            {/* Маркер оси */}
            <Circle cx={x} cy={baseGroundY + 18} r={5} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />
            <Text x={x - 2.5} y={baseGroundY + 21} fontSize={6} fill="#333333" fontWeight="bold">
              {axisLabel}
            </Text>

            {/* Размерная засечка */}
            {i < N_spans && (
              <G key={`dim-span-${i}`}>
                <Line
                  x1={x}
                  y1={baseGroundY + 7}
                  x2={colXList[i + 1]}
                  y2={baseGroundY + 7}
                  stroke="#333333"
                  strokeWidth={0.5}
                />
                <Line x1={x - 2} y1={baseGroundY + 9} x2={x + 2} y2={baseGroundY + 5} stroke="#333333" strokeWidth={0.7} />
                <Line x1={colXList[i + 1] - 2} y1={baseGroundY + 9} x2={colXList[i + 1] + 2} y2={baseGroundY + 5} stroke="#333333" strokeWidth={0.7} />
                <Text
                  x={(x + colXList[i + 1]) / 2 - 8}
                  y={baseGroundY + 5}
                  fontSize={5.5}
                  fill="#333333"
                >
                  {`${W_span.toFixed(1)} м`}
                </Text>
              </G>
            )}
          </G>
        );
      })}

      {/* 3. Пролеты: Несущие ригели, стропильная система и краны */}
      {Array.from({ length: N_spans }).map((_, i) => {
        const x1 = colXList[i];
        const x2 = colXList[i + 1];
        const xMid = isGable ? (x1 + x2) / 2 : x2;

        const yRidgeTop = yEaveTop - (ridgeRise * scale);
        const yRidgeBot = isTruss ? yClear : (yClear - ridgeRise * scale);

        const crane = Array.isArray(cranes) && cranes[i] ? cranes[i] : null;
        const hasCrane = Number(crane?.cap) > 0;
        const craneCap = crane?.cap || 0;
        const isSupport = !crane || crane.type !== 'suspension';
        const craneBracketH = H_clear * 0.7;
        const yBracket = baseGroundY - craneBracketH * scale;

        // Стропильные прогоны (шаг по скату)
        const purlinCount = Math.max(3, Math.round(W_span / 3));
        const purlins = [];
        for (let p = 0; p <= purlinCount; p++) {
          const ratio = p / purlinCount;
          let px, py;
          if (isGable) {
            if (ratio <= 0.5) {
              px = x1 + ratio * 2 * (xMid - x1);
              py = yEaveTop - ratio * 2 * (yEaveTop - yRidgeTop);
            } else {
              px = xMid + (ratio - 0.5) * 2 * (x2 - xMid);
              py = yRidgeTop + (ratio - 0.5) * 2 * (yEaveTop - yRidgeTop);
            }
          } else {
            px = x1 + ratio * (x2 - x1);
            py = yEaveTop - ratio * (yEaveTop - yRidgeTop);
          }
          purlins.push({ x: px, y: py });
        }

        return (
          <G key={`span-construct-${i}`}>
            {/* Несущий каркас покрытия */}
            {isTruss ? (
              <G>
                {/* Нижний пояс (по отметке низа конструкций) */}
                <Line x1={x1} y1={yClear} x2={x2} y2={yClear} stroke="#007bff" strokeWidth={1.5} />
                {/* Верхний пояс */}
                <Line x1={x1} y1={yEaveTop} x2={xMid} y2={yRidgeTop} stroke="#007bff" strokeWidth={1.8} />
                <Line x1={xMid} y1={yRidgeTop} x2={x2} y2={yEaveTop} stroke="#007bff" strokeWidth={1.8} />
                {/* Стойки и раскосы фермы */}
                <Line x1={xMid} y1={yRidgeTop} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={x1} y1={yClear} x2={(x1 + xMid) / 2} y2={(yEaveTop + yRidgeTop) / 2} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={(x1 + xMid) / 2} y1={(yEaveTop + yRidgeTop) / 2} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={x2} y1={yClear} x2={(x2 + xMid) / 2} y2={(yEaveTop + yRidgeTop) / 2} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={(x2 + xMid) / 2} y1={(yEaveTop + yRidgeTop) / 2} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
              </G>
            ) : (
              <G>
                {/* Сплошностенчатый двутавровый ригель (двойной контур) */}
                {isGable ? (
                  <G>
                    <Line x1={x1} y1={yEaveTop} x2={xMid} y2={yRidgeTop} stroke="#007bff" strokeWidth={2} />
                    <Line x1={xMid} y1={yRidgeTop} x2={x2} y2={yEaveTop} stroke="#007bff" strokeWidth={2} />
                    <Line x1={x1} y1={yClear} x2={xMid} y2={yRidgeBot} stroke="#007bff" strokeWidth={1} opacity={0.6} />
                    <Line x1={xMid} y1={yRidgeBot} x2={x2} y2={yClear} stroke="#007bff" strokeWidth={1} opacity={0.6} />
                  </G>
                ) : (
                  <G>
                    <Line x1={x1} y1={yEaveTop} x2={x2} y2={yRidgeTop} stroke="#007bff" strokeWidth={2} />
                    <Line x1={x1} y1={yClear} x2={x2} y2={yRidgeBot} stroke="#007bff" strokeWidth={1} opacity={0.6} />
                  </G>
                )}
              </G>
            )}

            {/* Стропильные прогоны (маленькие стойки-прогоны поверх балок) */}
            {purlins.map((pt, pIdx) => (
              <Line
                key={`purlin-${i}-${pIdx}`}
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={pt.y - hPurlin * scale}
                stroke="#17a2b8"
                strokeWidth={1.2}
              />
            ))}

            {/* Линия профлиста / сэндвич-панелей кровли */}
            {isGable ? (
              <G>
                <Line x1={x1 - 2} y1={yPurlinEave} x2={xMid} y2={yRidgeTop - hPurlin * scale} stroke="#28a745" strokeWidth={1} />
                <Line x1={xMid} y1={yRidgeTop - hPurlin * scale} x2={x2 + 2} y2={yPurlinEave} stroke="#28a745" strokeWidth={1} />
              </G>
            ) : (
              <Line x1={x1 - 2} y1={yPurlinEave} x2={x2 + 2} y2={yRidgeTop - hPurlin * scale} stroke="#28a745" strokeWidth={1} />
            )}

            {/* Крановое оборудование пролета */}
            {hasCrane && (
              <G key={`crane-span-${i}`}>
                {isSupport ? (
                  <G>
                    <Line x1={x1} y1={yBracket} x2={x1 + 5} y2={yBracket} stroke="#e65100" strokeWidth={1.5} />
                    <Line x1={x2} y1={yBracket} x2={x2 - 5} y2={yBracket} stroke="#e65100" strokeWidth={1.5} />
                    <Rect x={x1 + 2} y={yBracket - 3} width={3} height={3} fill="#e65100" />
                    <Rect x={x2 - 5} y={yBracket - 3} width={3} height={3} fill="#e65100" />
                    <Line x1={x1 + 4} y1={yBracket - 4} x2={x2 - 4} y2={yBracket - 4} stroke="#f57c00" strokeWidth={1.5} />
                    <Rect x={(x1 + x2) / 2 - 5} y={yBracket - 7} width={10} height={5} fill="#ffb74d" stroke="#e65100" strokeWidth={0.5} />
                    <Text x={(x1 + x2) / 2 - 10} y={yBracket - 9} fontSize={5} fill="#e65100" fontWeight="bold">
                      {`Кран ${craneCap}т`}
                    </Text>
                  </G>
                ) : (
                  <G>
                    <Line x1={x1 + 12} y1={yClear} x2={x1 + 12} y2={yClear + 6} stroke="#e65100" strokeWidth={1} />
                    <Line x1={x2 - 12} y1={yClear} x2={x2 - 12} y2={yClear + 6} stroke="#e65100" strokeWidth={1} />
                    <Line x1={x1 + 8} y1={yClear + 6} x2={x2 - 8} y2={yClear + 6} stroke="#f57c00" strokeWidth={1.5} />
                    <Text x={(x1 + x2) / 2 - 14} y={yClear + 12} fontSize={5} fill="#e65100" fontWeight="bold">
                      {`Подв. кран ${craneCap}т`}
                    </Text>
                  </G>
                )}
              </G>
            )}
          </G>
        );
      })}

      {/* 4. Высотные отметки (Слева и Справа) */}
      {/* Отметка 0.000 (Уровень чистого пола) */}
      <Line x1={colXList[0] - 4} y1={baseGroundY} x2={colXList[0] - 12} y2={baseGroundY} stroke="#333333" strokeWidth={0.6} />
      <Text x={colXList[0] - 34} y={baseGroundY + 2} fontSize={5.5} fill="#333333" fontWeight="bold">
        0.000
      </Text>

      {/* Отметка низа несущих конструкций (+6.00) */}
      <Line x1={colXList[0] - 4} y1={yClear} x2={colXList[0] - 12} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
      <Text x={colXList[0] - 36} y={yClear + 2} fontSize={5.5} fill="#007bff" fontWeight="bold">
        {`+${H_clear.toFixed(2)}`}
      </Text>

      {/* Отметка конька кровли */}
      <Line
        x1={isGable ? (colXList[0] + colXList[1]) / 2 - 4 : colXList[N_spans] - 4}
        y1={yPurlinEave - (ridgeRise * scale)}
        x2={isGable ? (colXList[0] + colXList[1]) / 2 + 4 : colXList[N_spans] + 4}
        y2={yPurlinEave - (ridgeRise * scale)}
        stroke="#28a745"
        strokeWidth={0.6}
      />
      <Text
        x={isGable ? (colXList[0] + colXList[1]) / 2 - 8 : colXList[N_spans] + 6}
        y={yPurlinEave - (ridgeRise * scale) - 3}
        fontSize={5.5}
        fill="#28a745"
        fontWeight="bold"
      >
        {`+${H_ridge_top.toFixed(2)}`}
      </Text>
    </Svg>
  );
}
