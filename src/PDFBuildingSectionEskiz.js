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
  
  let N_spans = Number(spansCount) || 1;
  if (Array.isArray(cranes) && cranes.length > N_spans) {
    N_spans = cranes.length;
  }
  N_spans = Math.max(1, Math.min(N_spans, 10));

  const H_clear = Number(height) > 0 ? Number(height) : 6;
  const S = Number(slope) > 0 ? Number(slope) : 10;
  const isGable = String(roofShape) !== 'single';
  const isTruss = String(frameType) === 'truss';

  // Точный расчет высоты на опоре из QuickEstimator.js
  let supportH = 0.35;
  if (W_span > 18 && W_span < 33) {
    supportH = 0.35 + ((W_span - 18) * (0.75 - 0.35)) / (33 - 18);
  } else if (W_span >= 33) {
    supportH = 0.75;
  }
  const trussAdd = S <= 21 ? 0.65 + (10 - S) * 0.0597 : 0;
  const hBeam = isTruss ? (supportH + trussAdd) : (supportH + 0.1);
  const hPurlin = 0.2;

  const totalWidth = W_span * N_spans;
  const ridgeRise = isGable ? (W_span / 2) * (S / 100) : W_span * (S / 100);

  // Высотные отметки
  const H_eave_top = H_clear + hBeam;
  const H_ridge_top = H_eave_top + ridgeRise + hPurlin;

  const svgWidth = 525;
  const svgHeight = 150;

  const padLeft = 45;
  const padRight = 35;
  const padBottom = 28;
  const padTop = 22;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const scale = Math.min(drawAreaW / totalWidth, drawAreaH / (H_ridge_top * 1.15));
  const realDrawW = totalWidth * scale;

  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;
  const baseGroundY = svgHeight - padBottom;

  // Y-координаты уровней
  const yClear = baseGroundY - H_clear * scale;       // Оголовок колонны и низ фермы/балки (+6.000)
  const yEaveTop = baseGroundY - H_eave_top * scale;   // Верх несущей конструкции на опоре
  const yPurlinEave = yEaveTop - hPurlin * scale;     // Верх стропильного прогона на карнизе

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

      {/* 2. Оси и колонны (колонны идут строго от 0.00 до отметки низа несущих конструкций yClear) */}
      {colXList.map((x, i) => {
        const axisLabel = AXIS_LABELS[i] || `${i + 1}`;
        return (
          <G key={`col-axis-${i}`}>
            <Line
              x1={x}
              y1={yPurlinEave - 8}
              x2={x}
              y2={baseGroundY + 12}
              stroke="#aaaaaa"
              strokeWidth={0.5}
              opacity={0.6}
            />

            {/* Колонна до оголовка (+6.000) */}
            <Line
              x1={x}
              y1={baseGroundY}
              x2={x}
              y2={yClear}
              stroke="#007bff"
              strokeWidth={i === 0 || i === N_spans ? 2.5 : 2}
            />

            {/* Опорная стойка/стойка фахверка выше отметки +6.000 */}
            <Line
              x1={x}
              y1={yClear}
              x2={x}
              y2={yEaveTop}
              stroke="#007bff"
              strokeWidth={1.2}
              opacity={0.8}
            />

            <Circle cx={x} cy={baseGroundY + 18} r={5.5} fill="#ffffff" stroke="#333333" strokeWidth={0.6} />
            <Text
              x={x}
              y={baseGroundY + 21}
              fontSize={6.5}
              fontFamily="Roboto"
              fill="#333333"
              textAnchor="middle"
              fontWeight="bold"
            >
              {axisLabel}
            </Text>

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
                <Line x1={x} y1={baseGroundY + 9} x2={x} y2={baseGroundY + 5} stroke="#333333" strokeWidth={0.7} />
                <Line x1={colXList[i + 1]} y1={baseGroundY + 9} x2={colXList[i + 1]} y2={baseGroundY + 5} stroke="#333333" strokeWidth={0.7} />
                <Text
                  x={(x + colXList[i + 1]) / 2}
                  y={baseGroundY + 5}
                  fontSize={5.5}
                  fontFamily="Roboto"
                  fill="#333333"
                  textAnchor="middle"
                >
                  {`${W_span.toFixed(1)} м`}
                </Text>
              </G>
            )}
          </G>
        );
      })}

      {/* 3. Пролеты */}
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
            {/* Несущий каркас */}
            {isTruss ? (
              <G>
                {/* Нижний пояс фермы строго на отметке +6.000 */}
                <Line x1={x1} y1={yClear} x2={x2} y2={yClear} stroke="#007bff" strokeWidth={1.5} />
                {/* Верхний пояс фермы */}
                <Line x1={x1} y1={yEaveTop} x2={xMid} y2={yRidgeTop} stroke="#007bff" strokeWidth={1.8} />
                <Line x1={xMid} y1={yRidgeTop} x2={x2} y2={yEaveTop} stroke="#007bff" strokeWidth={1.8} />
                {/* Стойки и раскосы */}
                <Line x1={xMid} y1={yRidgeTop} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={x1} y1={yClear} x2={(x1 + xMid) / 2} y2={(yEaveTop + yRidgeTop) / 2} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={(x1 + xMid) / 2} y1={(yEaveTop + yRidgeTop) / 2} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={x2} y1={yClear} x2={(x2 + xMid) / 2} y2={(yEaveTop + yRidgeTop) / 2} stroke="#007bff" strokeWidth={0.6} />
                <Line x1={(x2 + xMid) / 2} y1={(yEaveTop + yRidgeTop) / 2} x2={xMid} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
              </G>
            ) : (
              <G>
                {/* Балка */}
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

            {/* Стропильные прогоны */}
            {purlins.map((pt, pIdx) => (
              <Line
                key={`purlin-${i}-${pIdx}`}
                x1={pt.x}
                y1={pt.y}
                x2={pt.x}
                y2={pt.y - hPurlin * scale}
                stroke="#17a2b8"
                strokeWidth={1}
              />
            ))}

            {/* Кровельное покрытие */}
            {isGable ? (
              <G>
                <Line x1={x1 - 2} y1={yPurlinEave} x2={xMid} y2={yRidgeTop - hPurlin * scale} stroke="#28a745" strokeWidth={1} />
                <Line x1={xMid} y1={yRidgeTop - hPurlin * scale} x2={x2 + 2} y2={yPurlinEave} stroke="#28a745" strokeWidth={1} />
              </G>
            ) : (
              <Line x1={x1 - 2} y1={yPurlinEave} x2={x2 + 2} y2={yRidgeTop - hPurlin * scale} stroke="#28a745" strokeWidth={1} />
            )}

            {/* Отметка конька */}
            <Line
              x1={xMid - 4}
              y1={yPurlinEave - (ridgeRise * scale)}
              x2={xMid + 4}
              y2={yPurlinEave - (ridgeRise * scale)}
              stroke="#28a745"
              strokeWidth={0.6}
            />
            <Text
              x={xMid}
              y={yPurlinEave - (ridgeRise * scale) - 3}
              fontSize={5.5}
              fontFamily="Roboto"
              fill="#28a745"
              textAnchor="middle"
              fontWeight="bold"
            >
              {`+${H_ridge_top.toFixed(2)}`}
            </Text>

            {/* Кран */}
            {hasCrane && (
              <G key={`crane-span-${i}`}>
                {isSupport ? (
                  <G>
                    <Line x1={x1} y1={yBracket} x2={x1 + 4} y2={yBracket} stroke="#e65100" strokeWidth={1.5} />
                    <Line x1={x2} y1={yBracket} x2={x2 - 4} y2={yBracket} stroke="#e65100" strokeWidth={1.5} />
                    <Rect x={x1 + 2} y={yBracket - 3} width={2.5} height={3} fill="#e65100" />
                    <Rect x={x2 - 4.5} y={yBracket - 3} width={2.5} height={3} fill="#e65100" />
                    <Line x1={x1 + 4} y1={yBracket - 4} x2={x2 - 4} y2={yBracket - 4} stroke="#f57c00" strokeWidth={1.5} />
                    <Rect x={(x1 + x2) / 2 - 4} y={yBracket - 6.5} width={8} height={4} fill="#ffb74d" stroke="#e65100" strokeWidth={0.5} />
                    <Text
                      x={(x1 + x2) / 2}
                      y={yBracket - 8}
                      fontSize={4.5}
                      fontFamily="Roboto"
                      fill="#e65100"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {`Кран ${craneCap} т`}
                    </Text>
                  </G>
                ) : (
                  <G>
                    <Line x1={x1 + 10} y1={yClear} x2={x1 + 10} y2={yClear + 5} stroke="#e65100" strokeWidth={1} />
                    <Line x1={x2 - 10} y1={yClear} x2={x2 - 10} y2={yClear + 5} stroke="#e65100" strokeWidth={1} />
                    <Line x1={x1 + 8} y1={yClear + 5} x2={x2 - 8} y2={yClear + 5} stroke="#f57c00" strokeWidth={1.5} />
                    <Text
                      x={(x1 + x2) / 2}
                      y={yClear + 11}
                      fontSize={4.5}
                      fontFamily="Roboto"
                      fill="#e65100"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {`Подвесной кран ${craneCap} т`}
                    </Text>
                  </G>
                )}
              </G>
            )}
          </G>
        );
      })}

      {/* 4. Высотные отметки слева */}
      <Line x1={colXList[0] - 4} y1={baseGroundY} x2={colXList[0] - 12} y2={baseGroundY} stroke="#333333" strokeWidth={0.6} />
      <Text
        x={colXList[0] - 14}
        y={baseGroundY + 2}
        fontSize={5.5}
        fontFamily="Roboto"
        fill="#333333"
        textAnchor="end"
        fontWeight="bold"
      >
        0.000
      </Text>

      {/* Отметка низа несущих конструкций (оголовок колонны) */}
      <Line x1={colXList[0] - 4} y1={yClear} x2={colXList[0] - 12} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
      <Text
        x={colXList[0] - 14}
        y={yClear + 2}
        fontSize={5.5}
        fontFamily="Roboto"
        fill="#007bff"
        textAnchor="end"
        fontWeight="bold"
      >
        {`+${H_clear.toFixed(2)}`}
      </Text>
    </Svg>
  );
}
