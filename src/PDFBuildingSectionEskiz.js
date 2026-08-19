import React from 'react';
import { Svg, Line, Circle, Text, G, Rect } from '@react-pdf/renderer';

export default function PDFBuildingSectionEskiz({
  spanWidth = 18,
  height = 6,
  roofShape = 'gable',
  slope = 10,
  frameType = 'beam',
  cranes = []
}) {
  const W = Number(spanWidth) > 0 ? Number(spanWidth) : 18;
  const H = Number(height) > 0 ? Number(height) : 6;
  const S = Number(slope) > 0 ? Number(slope) : 10;
  const isGable = String(roofShape) !== 'single';
  const isTruss = String(frameType) === 'truss';

  const ridgeRise = isGable ? (W / 2) * (S / 100) : W * (S / 100);
  const H_ridge = H + ridgeRise;

  const svgWidth = 230;
  const svgHeight = 120;

  const padLeft = 40;
  const padRight = 20;
  const padBottom = 26;
  const padTop = 22;

  const drawAreaW = svgWidth - padLeft - padRight;
  const drawAreaH = svgHeight - padTop - padBottom;

  const maxRealW = W;
  const maxRealH = H_ridge * 1.1;

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
  const ridgeX = isGable ? offsetX + realDrawW / 2 : col2X;

  const hasCrane = Array.isArray(cranes) && cranes.some((c) => Number(c?.cap) > 0);
  const craneData = hasCrane ? cranes.find((c) => Number(c?.cap) > 0) : null;
  const craneCap = craneData ? String(craneData.cap) : '0';
  const isSupportCrane = !craneData || craneData.type !== 'suspension';

  const craneBracketH = H * 0.7;
  const craneBracketY = baseGroundY - craneBracketH * scale;

  const textH0 = '0.000';
  const textHeave = `+${H.toFixed(2)}`;
  const textHridge = `+${H_ridge.toFixed(2)}`;
  const textWidth = `${W.toFixed(1)} м`;

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {/* 1. Уровень земли */}
      <Line
        x1={col1X - 10}
        y1={baseGroundY}
        x2={col2X + 10}
        y2={baseGroundY}
        stroke="#444444"
        strokeWidth={1}
      />

      {/* 2. Оси */}
      <Line
        x1={col1X}
        y1={eaveY - 5}
        x2={col1X}
        y2={baseGroundY + 12}
        stroke="#999999"
        strokeWidth={0.5}
        strokeDasharray="3 2"
      />
      <Line
        x1={col2X}
        y1={eaveY - 5}
        x2={col2X}
        y2={baseGroundY + 12}
        stroke="#999999"
        strokeWidth={0.5}
        strokeDasharray="3 2"
      />

      <Circle cx={col1X} cy={baseGroundY + 18} r={5} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />
      <Text x={col1X - 2.5} y={baseGroundY + 21} fontSize={6} fill="#333333">А</Text>

      <Circle cx={col2X} cy={baseGroundY + 18} r={5} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />
      <Text x={col2X - 2.5} y={baseGroundY + 21} fontSize={6} fill="#333333">Б</Text>

      {/* 3. Колонны */}
      <Line x1={col1X} y1={baseGroundY} x2={col1X} y2={eaveY} stroke="#007bff" strokeWidth={2} />
      <Line x1={col2X} y1={baseGroundY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={2} />

      {/* 4. Кровля */}
      {isTruss ? (
        <G>
          <Line x1={col1X} y1={eaveY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={1} />
          <Line x1={col1X} y1={eaveY} x2={ridgeX} y2={ridgeY} stroke="#007bff" strokeWidth={1.5} />
          <Line x1={ridgeX} y1={ridgeY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={1.5} />
          {isGable ? (
            <G>
              <Line x1={ridgeX} y1={ridgeY} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.5} />
              <Line x1={col1X} y1={eaveY} x2={(col1X + ridgeX) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.5} />
              <Line x1={(col1X + ridgeX) / 2} y1={(eaveY + ridgeY) / 2} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.5} />
              <Line x1={col2X} y1={eaveY} x2={(col2X + ridgeX) / 2} y2={(eaveY + ridgeY) / 2} stroke="#007bff" strokeWidth={0.5} />
              <Line x1={(col2X + ridgeX) / 2} y1={(eaveY + ridgeY) / 2} x2={ridgeX} y2={eaveY} stroke="#007bff" strokeWidth={0.5} />
            </G>
          ) : (
            <Line x1={col1X} y1={eaveY} x2={col2X} y2={ridgeY} stroke="#007bff" strokeWidth={0.5} />
          )}
        </G>
      ) : (
        <G>
          {isGable ? (
            <G>
              <Line x1={col1X} y1={eaveY} x2={ridgeX} y2={ridgeY} stroke="#007bff" strokeWidth={2} />
              <Line x1={ridgeX} y1={ridgeY} x2={col2X} y2={eaveY} stroke="#007bff" strokeWidth={2} />
            </G>
          ) : (
            <Line x1={col1X} y1={eaveY} x2={col2X} y2={ridgeY} stroke="#007bff" strokeWidth={2} />
          )}
        </G>
      )}

      {/* 5. Кран */}
      {hasCrane ? (
        <G>
          {isSupportCrane ? (
            <G>
              <Line x1={col1X} y1={craneBracketY} x2={col1X + 4} y2={craneBracketY} stroke="#e65100" strokeWidth={1.5} />
              <Line x1={col2X} y1={craneBracketY} x2={col2X - 4} y2={craneBracketY} stroke="#e65100" strokeWidth={1.5} />
              <Rect x={col1X + 2} y={craneBracketY - 3} width={3} height={3} fill="#e65100" />
              <Rect x={col2X - 5} y={craneBracketY - 3} width={3} height={3} fill="#e65100" />
              <Line x1={col1X + 4} y1={craneBracketY - 4} x2={col2X - 4} y2={craneBracketY - 4} stroke="#f57c00" strokeWidth={1.5} />
              <Rect x={(col1X + col2X) / 2 - 4} y={craneBracketY - 6} width={8} height={4} fill="#ffb74d" stroke="#e65100" strokeWidth={0.5} />
            </G>
          ) : (
            <G>
              <Line x1={col1X + 10} y1={eaveY} x2={col1X + 10} y2={eaveY + 5} stroke="#e65100" strokeWidth={1} />
              <Line x1={col2X - 10} y1={eaveY} x2={col2X - 10} y2={eaveY + 5} stroke="#e65100" strokeWidth={1} />
              <Line x1={col1X + 6} y1={eaveY + 5} x2={col2X - 6} y2={eaveY + 5} stroke="#f57c00" strokeWidth={1.5} />
            </G>
          )}
        </G>
      ) : null}

      {/* 6. Размерная цепочка */}
      <Line x1={col1X} y1={baseGroundY + 6} x2={col2X} y2={baseGroundY + 6} stroke="#333333" strokeWidth={0.5} />
      <Line x1={col1X - 2} y1={baseGroundY + 8} x2={col1X + 2} y2={baseGroundY + 4} stroke="#333333" strokeWidth={0.8} />
      <Line x1={col2X - 2} y1={baseGroundY + 8} x2={col2X + 2} y2={baseGroundY + 4} stroke="#333333" strokeWidth={0.8} />
      <Text x={(col1X + col2X) / 2 - 10} y={baseGroundY + 4} fontSize={6} fill="#333333">
        {textWidth}
      </Text>

      {/* 7. Отметки высот */}
      <Line x1={col1X - 4} y1={baseGroundY} x2={col1X - 10} y2={baseGroundY} stroke="#333333" strokeWidth={0.6} />
      <Text x={col1X - 32} y={baseGroundY + 2} fontSize={5.5} fill="#333333">
        {textH0}
      </Text>

      <Line x1={col1X - 4} y1={eaveY} x2={col1X - 10} y2={eaveY} stroke="#007bff" strokeWidth={0.6} />
      <Text x={col1X - 32} y={eaveY + 2} fontSize={5.5} fill="#007bff">
        {textHeave}
      </Text>

      <Line x1={ridgeX - 3} y1={ridgeY - 2} x2={ridgeX + 3} y2={ridgeY - 2} stroke="#007bff" strokeWidth={0.6} />
      <Text x={ridgeX - 8} y={ridgeY - 5} fontSize={5.5} fill="#007bff">
        {textHridge}
      </Text>
    </Svg>
  );
}
