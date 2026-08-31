import React from 'react';
import { Svg, Line, Circle, Text, G, Path, Rect } from '@react-pdf/renderer';

export default function PDFBuildingSectionEskiz({
  spanWidth = 18,
  height = 6,
  roofShape = 'gable',
  slope = 10,
  frameType = 'beam',
  cranes = []
}) {
  const W = Math.max(6, Number(spanWidth) || 18);
  const H = Math.max(3, Number(height) || 6);
  const S = Math.max(5, Number(slope) || 10);

  const ridgeRise = roofShape === 'gable' ? (W / 2) * (S / 100) : W * (S / 100);
  const H_ridge = H + ridgeRise;

  const svgWidth = 230;
  const svgHeight = 120;

  const padLeft = 32;
  const padRight = 24;
  const padBottom = 26;
  const padTop = 22;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const maxRealW = W;
  const maxRealH = H_ridge * 1.05;

  const scaleX = drawAreaW / maxRealW;
  const scaleY = drawAreaH / maxRealH;
  const scale = Math.min(scaleX, scaleY);

  const realDrawW = W * scale;

  const offsetX = padLeft + (drawAreaW - realDrawW) / 2;
  const baseGroundY = svgHeight - padBottom;

  const col1X = offsetX;
  const col2X = offsetX + realDrawW;

  const eaveY = baseGroundY - H * scale;
  const ridgeY = baseGroundY - H_ridge * scale;
  const ridgeX = roofShape === 'gable' ? offsetX + realDrawW / 2 : col2X;

  const hasCrane = Array.isArray(cranes) && cranes.some((c) => Number(c?.cap) > 0);
  const craneData = hasCrane ? cranes.find((c) => Number(c?.cap) > 0) : null;
  const craneCap = craneData ? craneData.cap : 0;
  const craneType = craneData ? craneData.type : 'support';

  const craneBracketH = H * 0.7;
  const craneBracketY = baseGroundY - craneBracketH * scale;

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {/* 1. Уровень земли */}
      <Line
        x1={col1X - 12}
        y1={baseGroundY}
        x2={col2X + 12}
        y2={baseGroundY}
        stroke="#444"
        strokeWidth={1.2}
      />

      {/* 2. Координационные оси и штрих-пунктир */}
      <Line
        x1={col1X}
        y1={eaveY - 8}
        x2={col1X}
        y2={baseGroundY + 12}
        stroke="#999"
        strokeWidth={0.6}
        strokeDasharray="3,2"
      />
      <Line
        x1={col2X}
        y1={(roofShape === 'single' ? ridgeY : eaveY) - 8}
        x2={col2X}
        y2={baseGroundY + 12}
        stroke="#999"
        strokeWidth={0.6}
        strokeDasharray="3,2"
      />

      <Circle cx={col1X} cy={baseGroundY + 18} r={5} fill="#fff" stroke="#333" strokeWidth={0.7} />
      <Text x={col1X} y={baseGroundY + 20} fontSize={6} textAnchor="middle" fill="#333" fontWeight="bold">А</Text>

      <Circle cx={col2X} cy={baseGroundY + 18} r={5} fill="#fff" stroke="#333" strokeWidth={0.7} />
      <Text x={col2X} y={baseGroundY + 20} fontSize={6} textAnchor="middle" fill="#333" fontWeight="bold">Б</Text>

      {/* 3. Колонны */}
      <Line x1={col1X} y1={baseGroundY} x2={col1X} y2={eaveY} stroke="#007bff" strokeWidth={2.5} />
      <Line x1={col2X} y1={baseGroundY} x2={col2X} y2={roofShape === 'single' ? ridgeY : eaveY} stroke="#007bff" strokeWidth={2.5} />

      {/* 4. Кровля: Ферма или Балка */}
      {frameType === 'truss' ? (
        <G>
          {/* Нижний пояс */}
          <Line x1={col1X} y1={eaveY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={1.5} />
          {/* Верхний пояс */}
          {roofShape === 'gable' ? (
            <>
              <Line x1={col1X} y1={eaveY} x2={ridgeX} y2={ridgeY} stroke="#007bff" strokeWidth={2} />
              <Line x1={ridgeX} y1={ridgeY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={2} />
              {/* Раскосы двускатной фермы */}
              <Line x1={ridgeX} y1={ridgeY} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={col1X} y1={eaveY} x2={(col1X + ridgeX) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={(col1X + ridgeX) / 2} y1={(eaveY + ridgeY) / 2} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={col2X} y1={eaveY} x2={(col2X + ridgeX) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={(col2X + ridgeX) / 2} y1={(eaveY + ridgeY) / 2} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.8} />
            </>
          ) : (
            <>
              <Line x1={col1X} y1={eaveY} x2={col2X} y2={ridgeY} stroke="#007bff" strokeWidth={2} />
              {/* Раскосы односкатной фермы */}
              <Line x1={(col1X + col2X) / 2} y1={eaveY} x2={(col1X + col2X) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={col1X} y1={eaveY} x2={(col1X + col2X) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.8} />
              <Line x1={(col1X + col2X) / 2} y1={eaveY} x2={col2X} y2={ridgeY} stroke="#007bff" strokeWidth={0.8} />
            </>
          )}
        </G>
      ) : (
        <G>
          {roofShape === 'gable' ? (
            <>
              <Line x1={col1X} y1={eaveY} x2={ridgeX} y2={ridgeY} stroke="#007bff" strokeWidth={2.5} />
              <Line x1={ridgeX} y1={ridgeY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={2.5} />
            </>
          ) : (
            <Line x1={col1X} y1={eaveY} x2={col2X} y2={ridgeY} stroke="#007bff" strokeWidth={2.5} />
          )}
        </G>
      )}

      {/* 5. Крановое оборудование */}
      {hasCrane && (
        <G>
          {craneType === 'support' ? (
            <>
              <Line x1={col1X} y1={craneBracketY} x2={col1X + 4} y2={craneBracketY} stroke="#e65100" strokeWidth={1.5} />
              <Line x1={col2X} y1={craneBracketY} x2={col2X - 4} y2={craneBracketY} stroke="#e65100" strokeWidth={1.5} />
              <Rect x={col1X + 2} y={craneBracketY - 3} width={3} height={3} fill="#e65100" />
              <Rect x={col2X - 5} y={craneBracketY - 3} width={3} height={3} fill="#e65100" />
              <Line x1={col1X + 4} y1={craneBracketY - 4} x2={col2X - 4} y2={craneBracketY - 4} stroke="#f57c00" strokeWidth={2} />
              <Rect x={(col1X + col2X) / 2 - 4} y={craneBracketY - 6} width={8} height={4} fill="#ffb74d" stroke="#e65100" strokeWidth={0.5} />
              <Text x={(col1X + col2X) / 2} y={craneBracketY - 8} fontSize={5} textAnchor="middle" fill="#e65100" fontWeight="bold">
                Кран {craneCap}т
              </Text>
            </>
          ) : (
            <>
              <Line x1={col1X + 12} y1={eaveY} x2={col1X + 12} y2={eaveY + 5} stroke="#e65100" strokeWidth={1} />
              <Line x1={col2X - 12} y1={eaveY} x2={col2X - 12} y2={eaveY + 5} stroke="#e65100" strokeWidth={1} />
              <Line x1={col1X + 8} y1={eaveY + 5} x2={col2X - 8} y2={eaveY + 5} stroke="#f57c00" strokeWidth={1.5} />
              <Text x={(col1X + col2X) / 2} y={eaveY + 11} fontSize={5} textAnchor="middle" fill="#e65100" fontWeight="bold">
                Кран подв. {craneCap}т
              </Text>
            </>
          )}
        </G>
      )}

      {/* 6. Размерная цепочка пролета */}
      <Line x1={col1X} y1={baseGroundY + 6} x2={col2X} y2={baseGroundY + 6} stroke="#333" strokeWidth={0.5} />
      <Line x1={col1X - 2} y1={baseGroundY + 8} x2={col1X + 2} y2={baseGroundY + 4} stroke="#333" strokeWidth={0.8} />
      <Line x1={col2X - 2} y1={baseGroundY + 8} x2={col2X + 2} y2={baseGroundY + 4} stroke="#333" strokeWidth={0.8} />
      <Text x={(col1X + col2X) / 2} y={baseGroundY + 4} fontSize={6} textAnchor="middle" fill="#333" fontWeight="bold">
        {W.toFixed(1)} м
      </Text>

      {/* 7. Высотные архитектурные отметки через Path */}
      {/* 0.000 */}
      <Path
        d={`M ${col1X - 8} ${baseGroundY} L ${col1X - 14} ${baseGroundY - 3} L ${col1X - 14} ${baseGroundY + 3} Z`}
        fill="#333"
      />
      <Text x={col1X - 16} y={baseGroundY + 2} fontSize={5.5} textAnchor="end" fill="#333" fontWeight="bold">
        0.000
      </Text>

      {/* +H.карниза (низ) */}
      <Path
        d={`M ${col1X - 8} ${eaveY} L ${col1X - 14} ${eaveY - 3} L ${col1X - 14} ${eaveY + 3} Z`}
        fill="#007bff"
      />
      <Text x={col1X - 16} y={eaveY + 2} fontSize={5.5} textAnchor="end" fill="#007bff" fontWeight="bold">
        +{H.toFixed(3)}
      </Text>

      {/* +H.конька / верхняя отметка */}
      {roofShape === 'gable' ? (
        <>
          <Path
            d={`M ${ridgeX} ${ridgeY - 4} L ${ridgeX - 3} ${ridgeY - 9} L ${ridgeX + 3} ${ridgeY - 9} Z`}
            fill="#007bff"
          />
          <Text x={ridgeX} y={ridgeY - 11} fontSize={5.5} textAnchor="middle" fill="#007bff" fontWeight="bold">
            +{H_ridge.toFixed(3)}
          </Text>
        </>
      ) : (
        <>
          <Path
            d={`M ${col2X + 8} ${ridgeY} L ${col2X + 14} ${ridgeY - 3} L ${col2X + 14} ${ridgeY + 3} Z`}
            fill="#007bff"
          />
          <Text x={col2X + 16} y={ridgeY + 2} fontSize={5.5} textAnchor="start" fill="#007bff" fontWeight="bold">
            +{H_ridge.toFixed(3)}
          </Text>
        </>
      )}
    </Svg>
  );
}
