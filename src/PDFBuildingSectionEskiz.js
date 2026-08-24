import React from 'react';
import { Svg, Line, Circle, Text, G, Rect, Polygon } from '@react-pdf/renderer';

const AXIS_LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'И', 'К', 'Л'];

export default function PDFBuildingSectionEskiz({
  spanWidth = 18,
  spansCount = 1,
  height = 6,
  stories = 1,
  roofShape = 'gable',
  slope = 10,
  frameType = 'beam',
  cranes = []
}) {
  const W_span = Number(spanWidth) > 0 ? Number(spanWidth) : 18;
  const numStories = Math.max(1, Math.min(4, Number(stories) || 1));
  
  let N_spans = Number(spansCount) || 1;
  if (Array.isArray(cranes) && cranes.length > N_spans) {
    N_spans = cranes.length;
  }
  N_spans = Math.max(1, Math.min(N_spans, 10));

  const H_clear = Number(height) > 0 ? Number(height) : 6;
  const S = Number(slope) > 0 ? Number(slope) : 10;
  const isGable = String(roofShape) !== 'single';
  const isTruss = String(frameType) === 'truss';

  // 1. Расчет высоты балки/фермы
  let hBeamEave = 0.35;
  let hBeamRidge = 0.35;

  if (isTruss) {
    let supportH = 0.35;
    if (W_span > 18 && W_span < 33) supportH = 0.35 + ((W_span - 18) * (0.75 - 0.35)) / (33 - 18);
    else if (W_span >= 33) supportH = 0.75;
    const trussAdd = S <= 21 ? 0.65 + (10 - S) * 0.0597 : 0;
    hBeamEave = supportH + trussAdd;
    hBeamRidge = hBeamEave;
  } else {
    // Балка: дискретный ряд <= 12м, переменка > 12м
    if (W_span <= 12.0) {
      if (W_span <= 6.0) hBeamEave = 0.232;
      else if (W_span <= 8.0) hBeamEave = 0.268;
      else if (W_span <= 9.0) hBeamEave = 0.317;
      else if (W_span <= 10.0) hBeamEave = 0.391;
      else if (W_span <= 11.0) hBeamEave = 0.443;
      else if (W_span <= 11.5) hBeamEave = 0.515;
      else hBeamEave = 0.613;
      hBeamRidge = hBeamEave;
    } else {
      if (W_span > 18 && W_span < 33) {
        hBeamEave = 0.35 + ((W_span - 18) * (0.75 - 0.35)) / (33 - 18);
      } else if (W_span >= 33) {
        hBeamEave = 0.75;
      } else {
        hBeamEave = 0.35;
      }
      hBeamRidge = Math.min(1.50, 2.0 * hBeamEave);
    }
  }

  const hPurlin = 0.2;
  const totalBuildingWidth = W_span * N_spans;
  const ridgeRise = isGable ? (W_span / 2) * (S / 100) : totalBuildingWidth * (S / 100);

  const H_eave_top = H_clear + hBeamEave;
  const H_max_roof = H_eave_top + ridgeRise + hPurlin;

  const svgWidth = 525;
  const svgHeight = 150;

  const padLeft = 45;
  const padRight = 35;
  const padBottom = 28;
  const padTop = 22;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const scale = Math.min(drawAreaW / totalBuildingWidth, drawAreaH / (H_max_roof * 1.15));
  const realDrawW = totalBuildingWidth * scale;

  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;
  const baseGroundY = svgHeight - padBottom;

  const yClear = baseGroundY - H_clear * scale;
  const yEaveTop = baseGroundY - H_eave_top * scale;

  const colXList = [];
  for (let i = 0; i <= N_spans; i++) {
    colXList.push(offsetX + i * (W_span * scale));
  }

  const floorLevels = [];
  const floorHeight = H_clear / numStories;
  for (let f = 1; f < numStories; f++) {
    const hLevel = f * floorHeight;
    const yLevel = baseGroundY - hLevel * scale;
    floorLevels.push({ index: f, hLevel, yLevel });
  }
  const topMezzanineY = floorLevels.length > 0 ? floorLevels[floorLevels.length - 1].yLevel : baseGroundY;

  const intermediateColsPerSpan = [];
  const kSubSpans = Math.max(1, Math.ceil(W_span / 8.0));
  if (numStories > 1 && kSubSpans > 1) {
    for (let s = 1; s < kSubSpans; s++) {
      intermediateColsPerSpan.push(s / kSubSpans);
    }
  }

  const getRoofTopY = (x) => {
    if (isGable) {
      const relX = x - offsetX;
      const spanIndex = Math.min(N_spans - 1, Math.floor(relX / (W_span * scale)));
      const spanX1 = colXList[spanIndex];
      const spanX2 = colXList[spanIndex + 1];
      const spanMid = (spanX1 + spanX2) / 2;
      const ridgeY = yEaveTop - ((W_span / 2) * (S / 100) * scale);

      if (x <= spanMid) {
        return yEaveTop - ((x - spanX1) / (spanMid - spanX1)) * (yEaveTop - ridgeY);
      } else {
        return ridgeY + ((x - spanMid) / (spanX2 - spanMid)) * (yEaveTop - ridgeY);
      }
    } else {
      const progress = (x - colXList[0]) / realDrawW;
      const topTotalRise = totalRidgeRise * scale;
      return yEaveTop - progress * topTotalRise;
    }
  };

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {/* 1. Уровень пола */}
      <Line
        x1={colXList[0] - 15}
        y1={baseGroundY}
        x2={colXList[N_spans] + 15}
        y2={baseGroundY}
        stroke="#333333"
        strokeWidth={1}
      />

      {/* 2. Колонны и оси */}
      {colXList.map((x, i) => {
        const axisLabel = AXIS_LABELS[i] || `${i + 1}`;
        const colTopY = getRoofTopY(x);

        return (
          <G key={`col-axis-${i}`}>
            <Line
              x1={x}
              y1={colTopY - 10}
              x2={x}
              y2={baseGroundY + 12}
              stroke="#aaaaaa"
              strokeWidth={0.5}
              opacity={0.6}
            />

            <Line
              x1={x}
              y1={baseGroundY}
              x2={x}
              y2={yClear}
              stroke="#007bff"
              strokeWidth={i === 0 || i === N_spans ? 2.5 : 2}
            />

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
              y={baseGroundY + 21.5}
              fontSize={7}
              fontFamily="Roboto"
              fill="#111111"
              textAnchor="middle"
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
                  fontSize={6}
                  fontFamily="Roboto"
                  fill="#111111"
                  textAnchor="middle"
                >
                  {`${W_span.toFixed(1)} м`}
                </Text>
              </G>
            )}
          </G>
        );
      })}

      {/* 3. Междуэтажные конструкции */}
      {numStories > 1 && (
        <G>
          {floorLevels.map((fl) => (
            <G key={`floor-level-beam-${fl.index}`}>
              <Line
                x1={colXList[0]}
                y1={fl.yLevel}
                x2={colXList[N_spans]}
                y2={fl.yLevel}
                stroke="#0056b3"
                strokeWidth={2}
              />
              <Line
                x1={colXList[0]}
                y1={fl.yLevel - 1.5}
                x2={colXList[N_spans]}
                y2={fl.yLevel - 1.5}
                stroke="#6c757d"
                strokeWidth={1}
              />
            </G>
          ))}

          {Array.from({ length: N_spans }).map((_, i) => {
            const x1 = colXList[i];
            const x2 = colXList[i + 1];
            return intermediateColsPerSpan.map((ratio, cIdx) => {
              const cx = x1 + ratio * (x2 - x1);
              return (
                <G key={`inter-col-${i}-${cIdx}`}>
                  <Line
                    x1={cx}
                    y1={baseGroundY}
                    x2={cx}
                    y2={topMezzanineY}
                    stroke="#007bff"
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={cx - 1.5}
                    y={baseGroundY - 2}
                    width={3}
                    height={2}
                    fill="#333333"
                  />
                </G>
              );
            });
          })}
        </G>
      )}

      {/* 4. Ригель покрытия и кровля */}
      {Array.from({ length: N_spans }).map((_, i) => {
        const x1 = colXList[i];
        const x2 = colXList[i + 1];
        const xMid = isGable ? (x1 + x2) / 2 : x2;

        const yTop1 = getRoofTopY(x1);
        const yTop2 = getRoofTopY(x2);
        const yTopMid = getRoofTopY(xMid);

        const yBot1 = yClear;
        const yBot2 = yClear;
        const yBotMid = yTopMid + (hBeamRidge * scale);

        const crane = Array.isArray(cranes) && cranes[i] ? cranes[i] : null;
        const hasCrane = Number(crane?.cap) > 0;
        const craneCap = crane?.cap || 0;
        const isSupport = !crane || crane.type !== 'suspension';
        
        const craneBaseY = numStories > 1 ? topMezzanineY : baseGroundY;
        const craneAvailableH = numStories > 1 ? (floorHeight * scale) : (H_clear * scale);
        const yBracket = craneBaseY - craneAvailableH * 0.7;

        const panelCount = Math.max(4, Math.round(W_span / 3));
        const spanNodes = [];
        for (let p = 0; p <= panelCount; p++) {
          const px = x1 + (p / panelCount) * (x2 - x1);
          const pyTop = getRoofTopY(px);
          spanNodes.push({ x: px, yTop: pyTop, yBot: yClear });
        }

        return (
          <G key={`span-construct-${i}`}>
            {isTruss ? (
              <G>
                <Line x1={x1} y1={yClear} x2={x2} y2={yClear} stroke="#007bff" strokeWidth={1.5} />
                {isGable ? (
                  <G>
                    <Line x1={x1} y1={yTop1} x2={xMid} y2={yTopMid} stroke="#007bff" strokeWidth={1.8} />
                    <Line x1={xMid} y1={yTopMid} x2={x2} y2={yTop2} stroke="#007bff" strokeWidth={1.8} />
                  </G>
                ) : (
                  <Line x1={x1} y1={yTop1} x2={x2} y2={yTop2} stroke="#007bff" strokeWidth={1.8} />
                )}

                {spanNodes.map((node, nIdx) => (
                  <G key={`truss-web-${i}-${nIdx}`}>
                    <Line x1={node.x} y1={yClear} x2={node.x} y2={node.yTop} stroke="#007bff" strokeWidth={0.7} />
                    {nIdx < panelCount && (
                      <Line
                        x1={node.x}
                        y1={isGable && nIdx >= panelCount / 2 ? node.yTop : yClear}
                        x2={spanNodes[nIdx + 1].x}
                        y2={isGable && nIdx >= panelCount / 2 ? yClear : spanNodes[nIdx + 1].yTop}
                        stroke="#007bff"
                        strokeWidth={0.6}
                      />
                    )}
                  </G>
                ))}
              </G>
            ) : (
              /* Точная балка: верх по скату кровли, конёк h_ridge = 2*h_eave */
              <G>
                {isGable ? (
                  <G>
                    <Polygon
                      points={`${x1},${yBot1} ${x1},${yTop1} ${xMid},${yTopMid} ${x2},${yTop2} ${x2},${yBot2} ${xMid},${yBotMid}`}
                      fill="#e3f2fd"
                      stroke="#007bff"
                      strokeWidth={1.8}
                    />
                    <Line x1={xMid} y1={yBotMid} x2={xMid} y2={yTopMid} stroke="#0056b3" strokeWidth={1.5} />
                    <Line x1={x1} y1={yBot1} x2={x1} y2={yTop1} stroke="#0056b3" strokeWidth={1.5} />
                    <Line x1={x2} y1={yBot2} x2={x2} y2={yTop2} stroke="#0056b3" strokeWidth={1.5} />
                  </G>
                ) : (
                  <G>
                    <Polygon
                      points={`${x1},${yBot1} ${x1},${yTop1} ${x2},${yTop2} ${x2},${yBot2}`}
                      fill="#e3f2fd"
                      stroke="#007bff"
                      strokeWidth={1.8}
                    />
                    <Line x1={x1} y1={yBot1} x2={x1} y2={yTop1} stroke="#0056b3" strokeWidth={1.5} />
                    <Line x1={x2} y1={yBot2} x2={x2} y2={yTop2} stroke="#0056b3" strokeWidth={1.5} />
                  </G>
                )}
              </G>
            )}

            {/* Прогоны */}
            {spanNodes.map((node, pIdx) => (
              <Line
                key={`purlin-${i}-${pIdx}`}
                x1={node.x}
                y1={node.yTop}
                x2={node.x}
                y2={node.yTop - hPurlin * scale}
                stroke="#17a2b8"
                strokeWidth={1}
              />
            ))}

            {/* Кровля */}
            {isGable ? (
              <G>
                <Line x1={x1 - 2} y1={yTop1 - hPurlin * scale} x2={xMid} y2={yTopMid - hPurlin * scale} stroke="#28a745" strokeWidth={1.2} />
                <Line x1={xMid} y1={yTopMid - hPurlin * scale} x2={x2 + 2} y2={yTop2 - hPurlin * scale} stroke="#28a745" strokeWidth={1.2} />
              </G>
            ) : (
              <Line x1={x1 - (i === 0 ? 2 : 0)} y1={yTop1 - hPurlin * scale} x2={x2 + (i === N_spans - 1 ? 2 : 0)} y2={yTop2 - hPurlin * scale} stroke="#28a745" strokeWidth={1.2} />
            )}

            {/* Краны */}
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
                      fontSize={5}
                      fontFamily="Roboto"
                      fill="#b33c00"
                      textAnchor="middle"
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
                      fontSize={5}
                      fontFamily="Roboto"
                      fill="#b33c00"
                      textAnchor="middle"
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

      {/* 5. Высотные отметки */}
      <Line x1={colXList[0] - 4} y1={baseGroundY} x2={colXList[0] - 12} y2={baseGroundY} stroke="#333333" strokeWidth={0.6} />
      <Text
        x={colXList[0] - 14}
        y={baseGroundY + 2}
        fontSize={6}
        fontFamily="Roboto"
        fill="#111111"
        textAnchor="end"
      >
        0.000
      </Text>

      {floorLevels.map((fl) => (
        <G key={`floor-level-mark-${fl.index}`}>
          <Line x1={colXList[0] - 4} y1={fl.yLevel} x2={colXList[0] - 12} y2={fl.yLevel} stroke="#0056b3" strokeWidth={0.6} />
          <Text
            x={colXList[0] - 14}
            y={fl.yLevel + 2}
            fontSize={5.5}
            fontFamily="Roboto"
            fill="#0056b3"
            textAnchor="end"
          >
            {`+${fl.hLevel.toFixed(2)}`}
          </Text>
        </G>
      ))}

      <Line x1={colXList[0] - 4} y1={yClear} x2={colXList[0] - 12} y2={yClear} stroke="#007bff" strokeWidth={0.6} />
      <Text
        x={colXList[0] - 14}
        y={yClear + 2}
        fontSize={6}
        fontFamily="Roboto"
        fill="#007bff"
        textAnchor="end"
      >
        {`+${H_clear.toFixed(2)}`}
      </Text>

      {isGable ? (
        colXList.slice(0, N_spans).map((x, i) => {
          const midX = (x + colXList[i + 1]) / 2;
          const ridgeY = getRoofTopY(midX) - hPurlin * scale;
          return (
            <G key={`ridge-level-${i}`}>
              <Line x1={midX - 4} y1={ridgeY} x2={midX + 4} y2={ridgeY} stroke="#28a745" strokeWidth={0.6} />
              <Text
                x={midX}
                y={ridgeY - 3}
                fontSize={6}
                fontFamily="Roboto"
                fill="#1e7e34"
                textAnchor="middle"
              >
                {`+${(H_eave_top + (W_span / 2) * (S / 100) + hPurlin).toFixed(2)}`}
              </Text>
            </G>
          );
        })
      ) : (
        <G>
          <Line
            x1={colXList[N_spans] + 4}
            y1={getRoofTopY(colXList[N_spans]) - hPurlin * scale}
            x2={colXList[N_spans] + 12}
            y2={getRoofTopY(colXList[N_spans]) - hPurlin * scale}
            stroke="#28a745"
            strokeWidth={0.6}
          />
          <Text
            x={colXList[N_spans] + 14}
            y={getRoofTopY(colXList[N_spans]) - hPurlin * scale + 2}
            fontSize={6}
            fontFamily="Roboto"
            fill="#1e7e34"
            textAnchor="start"
          >
            {`+${H_max_roof.toFixed(2)}`}
          </Text>
        </G>
      )}
    </Svg>
  );
}
