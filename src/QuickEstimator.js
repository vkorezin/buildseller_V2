import React, { useState, useMemo, useEffect } from "react";
import TrussEfficiencyEditor, {
  generateDefaultTable,
} from "./TrussEfficiencyEditor";
import BaseMatrix210Editor from "./BaseMatrix210Editor";
import SnowCoefficientsEditor from "./SnowCoefficientsEditor";
import RoofPurlinsEditor from "./RoofPurlinsEditor";
import WindCoefficientsEditor from "./WindCoefficientsEditor";
import BuildingTypesEditor from "./BuildingTypesEditor";
import QuickEstimatorForm from "./QuickEstimatorForm";
import QuickEstimatorAnalytics from "./QuickEstimatorAnalytics";
import QuickEstimatorResults from "./QuickEstimatorResults";
import {
  generateBase210Matrix,
  generateSnowCoefficients,
  generateRoofPurlins,
  generateWindCoefficients,
  interpolate2D,
  getSnowCoefficient,
  getRoofPurlinWeight,
  getWindCoefficient,
} from "./baseMatrixUtils";

const COEFFS = {
  tiesRatio: 0.098, // Связи ровно 9.8% от массы очищенных рам
};

const OVERHANG = 0.4;

const CRANE_DATA = {
  suspension: { beam: 77.6 },
  support: { 5: 40.0, 10: 56.0, 20: 75.0 },
  ties: 10.84,
};

const DEFAULT_GK_PRICE = 140000;
const DEFAULT_LSTK_PRICE = 160000;
const DEFAULT_FASONKA_PRICE = 150000;

const DEFAULT_WALL_PRICE = 3500;
const DEFAULT_ROOF_PRICE = 3800;
const DEFAULT_TRIM_PRICE = 450;
const DEFAULT_CONCRETE_PRICE = 5500;
const DEFAULT_REBAR_PRICE = 65000;

const styles = {
  container: { maxWidth: "1000px", margin: "30px auto", padding: "25px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #007bff", paddingBottom: "15px", marginBottom: "20px" },
  h2: { margin: 0, color: "#333" },
  closeButton: { padding: "8px 15px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  settingsBtn: { background: "none", border: "1px solid #007bff", fontSize: "0.85em", cursor: "pointer", marginLeft: "8px", padding: "6px 12px", borderRadius: "5px", color: "#007bff" },
  sectionTitle: { marginTop: "20px", marginBottom: "10px", fontSize: "1.1em", fontWeight: "bold", color: "#555", borderBottom: "1px solid #eee", paddingBottom: "5px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginBottom: "20px" },
  field: { display: "flex", flexDirection: "column" },
  label: { fontWeight: "bold", marginBottom: "5px", fontSize: "0.85em", color: "#666" },
  input: { padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1em" },
  select: { padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1em", backgroundColor: "#fff" },
  rowBlock: { display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #e9ecef" },
  addBtn: { padding: "8px 15px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", marginTop: "5px", marginRight: "10px" },
  delBtn: { padding: "8px 12px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", height: "36px" },
  errorBox: { backgroundColor: "#f8d7da", color: "#721c24", padding: "15px", borderRadius: "8px", border: "1px solid #f5c6cb", marginTop: "20px", fontWeight: "bold", textAlign: "center" },
  infoBadge: { backgroundColor: "#e2e3e5", color: "#383d41", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "0.9em", display: "flex", gap: "15px" }
};

export default function QuickEstimator({ onBack, projectsDb }) {
  const [spanWidth, setSpanWidth] = useState("18");
  const [spansCount, setSpansCount] = useState("1");
  const [length, setLength] = useState("48");
  const [height, setHeight] = useState("6");
  const [roofShape, setRoofShape] = useState("gable");
  const [slope, setSlope] = useState("10");
  const [stories, setStories] = useState(1);
  const [snowLoad, setSnowLoad] = useState("180");
  const [windLoad, setWindLoad] = useState("38");
  const [cranes, setCranes] = useState([{ id: 0, cap: "0", type: "support" }]);
  const [frameType, setFrameType] = useState("beam");

  // Таблицы баз
  const [baseMatrix210, setBaseMatrix210] = useState(null);
  const [snowCoefficients, setSnowCoefficients] = useState(null);
  const [roofPurlins, setRoofPurlins] = useState(null);
  const [trussTable, setTrussTable] = useState(null);
  const [windCoefficients, setWindCoefficients] = useState(null);

  // Состояния редакторов
  const [isBaseMatrixOpen, setIsBaseMatrixOpen] = useState(false);
  const [isSnowCoeffsOpen, setIsSnowCoeffsOpen] = useState(false);
  const [isPurlinsOpen, setIsPurlinsOpen] = useState(false);
  const [isTrussEditorOpen, setIsTrussEditorOpen] = useState(false);
  const [isWindCoeffsOpen, setIsWindCoeffsOpen] = useState(false);
  const [isBuildingTypesOpen, setIsBuildingTypesOpen] = useState(false);

  // Списки проемов
  const [windowsList, setWindowsList] = useState([]); 
  const [gatesList, setGatesList] = useState([]); 

  const [strictFilter, setStrictFilter] = useState(true);
  const [useSandwich, setUseSandwich] = useState(true);
  const [layoutMode, setLayoutMode] = useState("horizontal");
  const [panelModule, setPanelModule] = useState(1.0);
  const [panelStockLength, setPanelStockLength] = useState(6.0);

  // Цены
  const [gkPrice, setGkPrice] = useState(DEFAULT_GK_PRICE);
  const [lstkPrice, setLstkPrice] = useState(DEFAULT_LSTK_PRICE);
  const [fasonkaPrice, setFasonkaPrice] = useState(DEFAULT_FASONKA_PRICE);
  const [wallPrice, setWallPrice] = useState(DEFAULT_WALL_PRICE);
  const [roofPrice, setRoofPrice] = useState(DEFAULT_ROOF_PRICE);
  const [trimPrice, setTrimPrice] = useState(DEFAULT_TRIM_PRICE);
  const [concretePrice, setConcretePrice] = useState(DEFAULT_CONCRETE_PRICE);
  const [rebarPrice, setRebarPrice] = useState(DEFAULT_REBAR_PRICE);

  // Загрузка справочников
  useEffect(() => {
    setBaseMatrix210(localStorage.getItem("baseMatrix210") ? JSON.parse(localStorage.getItem("baseMatrix210")) : generateBase210Matrix());
    setSnowCoefficients(localStorage.getItem("snowCoefficients") ? JSON.parse(localStorage.getItem("snowCoefficients")) : generateSnowCoefficients());
    setRoofPurlins(localStorage.getItem("roofPurlins") ? JSON.parse(localStorage.getItem("roofPurlins")) : generateRoofPurlins());
    setTrussTable(localStorage.getItem("trussEfficiencyTable") ? JSON.parse(localStorage.getItem("trussEfficiencyTable")) : generateDefaultTable());
    setWindCoefficients(localStorage.getItem("windCoefficients") ? JSON.parse(localStorage.getItem("windCoefficients")) : generateWindCoefficients());
  }, []);

  useEffect(() => {
    const count = Math.max(1, Number(spansCount) || 1);
    setCranes((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }).map((_, i) => ({ id: prev.length + i, cap: "0", type: "support" }));
        return [...prev, ...added];
      } else return prev.slice(0, count);
    });
  }, [spansCount]);

  const updateCrane = (index, field, value) => {
    const newCranes = [...cranes];
    newCranes[index] = { ...newCranes[index], [field]: value };
    if (field === "cap" && (value === "10" || value === "20")) newCranes[index].type = "support";
    setCranes(newCranes);
  };

  // --- УПРАВЛЕНИЕ ОКНАМИ ---
  const addWindow = () => {
    const H_val = Number(height) || 0;
    const pMod_val = Number(panelModule) || 1.0;
    const h_w_default = 1.2;
    let eTop = layoutMode === "vertical" ? H_val - 0.5 : Math.floor((H_val - 0.5) / pMod_val) * pMod_val;
    
    setWindowsList([...windowsList, {
      id: Date.now(), width: "3.0", height: String(h_w_default), count: "1",
      eTop: String(Math.max(0, eTop).toFixed(2)), eBot: String(Math.max(0, eTop - h_w_default).toFixed(2)), profile: "СтОП"
    }]);
  };

  const updateWindow = (id, field, value) => {
    setWindowsList(prev => prev.map(w => {
      if (w.id === id) {
        const updated = { ...w, [field]: value };
        if (field === 'height' || field === 'eTop') {
          updated.eBot = String(Math.max(0, (Number(updated.eTop) || 0) - (Number(updated.height) || 0)).toFixed(2));
        }
        if (field === 'eBot') {
          updated.eTop = String(((Number(updated.eBot) || 0) + (Number(updated.height) || 0)).toFixed(2));
        }
        return updated;
      }
      return w;
    }));
  };

  // --- УПРАВЛЕНИЕ ВОРОТАМИ / ДВЕРЯМИ ---
  const addGate = () => {
    const h_g_default = 4.2;
    setGatesList([...gatesList, {
      id: Date.now(), width: "4.0", height: String(h_g_default), count: "1",
      eBot: "0.00", eTop: String(h_g_default), profile: "ГКП"
    }]);
  };

  const updateGate = (id, field, value) => {
    setGatesList(prev => prev.map(g => {
      if (g.id === id) {
        const updated = { ...g, [field]: value };
        if (field === 'height' || field === 'eBot') {
          updated.eTop = String(((Number(updated.eBot) || 0) + (Number(updated.height) || 0)).toFixed(2));
        }
        if (field === 'eTop') {
          updated.eBot = String(Math.max(0, (Number(updated.eTop) || 0) - (Number(updated.height) || 0)).toFixed(2));
        }
        return updated;
      }
      return g;
    }));
  };

  const totalWindowsAreaFact = useMemo(() => {
    return windowsList.reduce((sum, w) => sum + (Number(w.width) || 0) * (Number(w.height) || 0) * (Number(w.count) || 0), 0);
  }, [windowsList]);

  const totalGatesAreaFact = useMemo(() => {
    return gatesList.reduce((sum, g) => sum + (Number(g.width) || 0) * (Number(g.height) || 0) * (Number(g.count) || 0), 0);
  }, [gatesList]);

  const dbAnalytics = useMemo(() => {
    if (!projectsDb || projectsDb.length === 0) return null;
    const W = Number(spanWidth);
    let similar = projectsDb.filter((p) => p.width >= W * 0.8 && p.width <= W * 1.2 && p.specificWeight > 0);
    if (strictFilter) {
      const hasAnyCrane = cranes.some((c) => c.cap !== "0");
      const needMezzanine = stories > 1;
      similar = similar.filter((p) => p.hasCrane === hasAnyCrane && p.hasMezzanine === needMezzanine);
    }
    if (similar.length === 0) return { found: false };
    let sumRate = 0, sumWelded = 0, sumRolled = 0;
    similar.forEach((p) => {
      sumRate += p.specificWeight;
      const area = p.width * p.length;
      if (area > 0) {
        sumWelded += ((p.massWelded || 0) * 1000) / area;
        sumRolled += ((p.massRolled || 0) * 1000) / area;
      }
    });
    const count = similar.length;
    return { found: true, count, avgRate: (sumRate / count).toFixed(1), detWelded: (sumWelded / count).toFixed(1), detRolled: (sumRolled / count).toFixed(1) };
  }, [spanWidth, projectsDb, strictFilter, cranes, stories]);

  // ГЛАВНЫЙ РАСЧЕТНЫЙ БЛОК ЕВРОАНГАР
  const estimation = useMemo(() => {
    if (!baseMatrix210 || !snowCoefficients || !roofPurlins || !trussTable || !windCoefficients) {
      return { roofPurlinsKg: 0, wallPurlinsLength: 0, floorArea: 0, metalCost: 0, foundationCost: 0, wallCost: 0, roofCost: 0, trimCost: 0, totalCost: "0", isOverloaded: false };
    }

    const W = Number(spanWidth) || 0;
    const N = cranes.length;
    const L = Number(length) || 0;
    const H = Number(height) || 0;
    const S = Number(slope) || 0;
    const baseSnow = Number(snowLoad) || 0;
    const currentWind = Number(windLoad) || 38;
    const activeMetalPrice = Number(gkPrice) || 0;
    let pMod = Number(panelModule) || 1.0;
    const pStock = Number(panelStockLength) || 6.0;

    const purlinHeight = baseSnow <= 400 ? 0.24 : 0.3;
    let supportHeight = 0.35;
    if (W > 18 && W < 33) supportHeight = 0.35 + ((W - 18) * (0.75 - 0.35)) / (33 - 18);
    else if (W >= 33) supportHeight = 0.75;

    const fullWallHeight = frameType === "truss" ? H + purlinHeight + supportHeight + (S <= 21 ? 0.65 + (10 - S) * 0.0597 : 0) : H + purlinHeight + supportHeight;

    const totalWidth = W * N;
    const perimeter = (totalWidth + L) * 2;
    const rawWallAreaBox = perimeter * fullWallHeight; 

    const totalProemsArea = totalWindowsAreaFact + totalGatesAreaFact;
    if (totalProemsArea >= rawWallAreaBox) {
      return { isOverloaded: true, rawWallAreaBox, totalProemsArea };
    }

    let lMult = L < 30 ? 1.05 : 1;
    let floorMult = stories > 1 ? 1 + (stories - 1) * 0.4 : 1;
    let totalFrameKgRaw = 0, totalPurlinsKg = 0, totalCraneSystemKg = 0, totalTiesKg = 0, totalSavingsKg = 0;

    cranes.forEach((crane) => {
      const capVal = Number(crane.cap);
      const hasThisCrane = capVal > 0;
      let spanSnow = hasThisCrane && crane.type === "suspension" ? baseSnow + 140 : baseSnow;

      const baseWeight210_Truss = interpolate2D(baseMatrix210, H, W);
      const snowCoeff = getSnowCoefficient(snowCoefficients, spanSnow);
      const windCoeff = getWindCoefficient(windCoefficients, currentWind);

      const hList = trussTable.heights, sList = trussTable.spans;
      const hSafe = Math.max(hList[0], Math.min(H, hList[hList.length - 1])), wSafe = Math.max(sList[0], Math.min(W, sList[sList.length - 1]));
      let h1 = hList.find((h, i) => hSafe >= h && hSafe <= hList[i+1]) || hList[0];
      let h2 = hList[hList.indexOf(h1) + 1] || h1;
      let s1 = sList.find((s, i) => wSafe >= s && wSafe <= sList[i+1]) || sList[0];
      let s2 = sList[sList.indexOf(s1) + 1] || s1;
      const interpolate = (x, x1, y1, x2, y2) => x2 === x1 ? y1 : y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
      const baseTrussDiscountPercent = interpolate(H, h1, interpolate(W, s1, trussTable.data[h1][s1], s2, trussTable.data[h1][s2]), h2, interpolate(W, s1, trussTable.data[h2][s1], s2, trussTable.data[h2][s2]));

      const dynamicTrussCoeff = 1 - ((baseTrussDiscountPercent * Math.max(0, (Math.ceil(L / 6) + 1) - 2)) / (Math.ceil(L / 6) + 1) / 0.9) / 100;
      let pureBeamFramesAndTies210 = Math.max(0, (baseWeight210_Truss / dynamicTrussCoeff) - (getRoofPurlinWeight(roofPurlins, 210) / 0.47)) * lMult * floorMult;
      if (hasThisCrane && crane.type === "support") pureBeamFramesAndTies210 *= capVal <= 5 ? 1.15 : 1.25;

      const adjustedBeamFramesAndTies = pureBeamFramesAndTies210 * snowCoeff * windCoeff;
      const currentPurlinsRate = getRoofPurlinWeight(roofPurlins, spanSnow);
      const fullBeamBuildingRate = adjustedBeamFramesAndTies + currentPurlinsRate;
      const totalReducedBuildingRate = frameType === "truss" ? fullBeamBuildingRate * dynamicTrussCoeff : fullBeamBuildingRate;

      const tiesRate = adjustedBeamFramesAndTies * COEFFS.tiesRatio;
      totalFrameKgRaw += Math.max(0, totalReducedBuildingRate - tiesRate - currentPurlinsRate) * (W * L);
      totalTiesKg += tiesRate * (W * L);
      totalPurlinsKg += currentPurlinsRate * (W * L);
      if (frameType === "truss") totalSavingsKg += (fullBeamBuildingRate - totalReducedBuildingRate) * (W * L);

      if (hasThisCrane) {
        const trackLength = L * 2;
        totalCraneSystemKg += trackLength * (crane.type === "suspension" ? CRANE_DATA.suspension.beam : CRANE_DATA.support[capVal <= 5 ? 5 : capVal <= 10 ? 10 : 20]) * 1.15 + trackLength * CRANE_DATA.ties * 1.1;
      }
    });

    let wallPurlinsLength = 0;
    if (useSandwich && layoutMode === "vertical") {
      const lines = Math.ceil(fullWallHeight / (currentWind/100 <= 0.23 ? 4.5 : currentWind/100 <= 0.42 ? 3.0 : currentWind/100 <= 0.60 ? 1.5 : 1.2));
      wallPurlinsLength = perimeter * lines;
      totalPurlinsKg += wallPurlinsLength * 6.375;
    }

    let proemsFrameKg = 0;
    let spDeductArea = 0;

    windowsList.forEach(w => {
      const h = Number(w.height) || 0, len = Number(w.width) || 0, n = Number(w.count) || 0, eTop = Number(w.eTop) || 0;
      if (h > 0 && len > 0 && n > 0) {
        const lf = (Math.ceil(len / 6) * 6) * 2 + (2 * h);
        proemsFrameKg += lf * (w.profile === "ГКП" ? 7.07 * 1.10 : 5.1 * 1.11) * n;
        if (useSandwich) {
          if (layoutMode === "vertical") spDeductArea += Math.floor(len / pMod) * pMod * h * n;
          else if (eTop % pMod < 0.01 && h % pMod < 0.01) spDeductArea += Math.floor(h / pMod) * pMod * len * n;
        }
      }
    });

    gatesList.forEach(g => {
      const h = Number(g.height) || 0, len = Number(g.width) || 0, n = Number(g.count) || 0, eBot = Number(g.eBot) || 0, eTop = Number(g.eTop) || 0;
      if (h > 0 && len > 0 && n > 0) {
        const multiplier = Math.abs(eBot) < 0.01 ? 1 : 2;
        const lf = (Math.ceil(len / 6) * 6) * multiplier + (2 * h);
        
        proemsFrameKg += lf * (g.profile === "ГКП" ? 7.07 * 1.10 : 5.1 * 1.11) * n;
        if (useSandwich) {
          if (layoutMode === "vertical") spDeductArea += Math.floor(len / pMod) * pMod * h * n;
          else if (eTop % pMod < 0.01 && eBot % pMod < 0.01) spDeductArea += Math.floor(h / pMod) * pMod * len * n;
        }
      }
    });

    totalFrameKgRaw += proemsFrameKg; 

    const totalMetalKg = totalFrameKgRaw + totalPurlinsKg + totalTiesKg + totalCraneSystemKg;
    const metalCost = (totalMetalKg / 1000) * activeMetalPrice;

    // ИСПРАВЛЕНО: Убран китайский иероглиф, формула осей теперь абсолютно валидна
    const foundationCount = (Math.ceil(L / 6) + 1) * (N + 1);
    const foundationCost = (foundationCount * 2.7) * concretePrice + ((foundationCount * 80) / 1000) * rebarPrice;

    let wallCost = 0, roofCost = 0, trimCost = 0, finalWarea = 0, rArea = 0, gArea = 0;
    if (useSandwich) {
      const angleRad = Math.atan(S / 100);
      const ridgeRise = roofShape === "gable" ? (W / 2) * (S / 100) : W * (S / 100);
      rArea = (roofShape === "gable" ? (W / 2 / Math.cos(angleRad) + OVERHANG) * (L + OVERHANG * 2) * 2 * N : (W / Math.cos(angleRad) + OVERHANG) * (L + OVERHANG * 2) * N);
      
      let wAreaBox = layoutMode === "horizontal" ? Math.ceil(perimeter / pStock) * pStock * (Math.ceil(fullWallHeight / pMod) * pMod) : Math.ceil(perimeter / pMod) * pMod * fullWallHeight;
      finalWarea = Math.max(0, wAreaBox - spDeductArea);
      gArea = (layoutMode === "horizontal" ? Array.from({length: Math.ceil(ridgeRise/pMod)}).reduce((sum, _, i) => sum + Math.ceil(Math.max(0, W * (1 - (i * pMod)/ridgeRise)) / pStock) * pStock * pMod, 0) : (W * ridgeRise) / 2) * 2 * N;

      wallCost = (finalWarea + gArea) * wallPrice;
      roofCost = rArea * roofPrice;
      trimCost = (finalWarea + gArea + rArea) * trimPrice;
    }

    const cranesSummary = cranes.filter((c) => c.cap !== "0").map((c, i) => `№${i + 1}:${c.cap}т`).join(", ");
    const totalCostNum = metalCost + wallCost + roofCost + trimCost + foundationCost;

    return {
      roofPurlinsKg: totalPurlinsKg - wallPurlinsLength * 6.375, wallPurlinsLength, floorArea: totalWidth * L,
      metalWeight: (totalMetalKg / 1000).toFixed(2), metalCost: Math.round(metalCost),
      framesWeight: (totalFrameKgRaw / 1000).toFixed(2), baseTiesKg: totalTiesKg,
      savingsAmount: Math.round((totalSavingsKg / 1000) * activeMetalPrice),
      envelopeDiffAmount: 0, craneSystemWeight: totalCraneSystemKg > 0 ? (totalCraneSystemKg / 1000).toFixed(2) : null,
      craneInfo: cranesSummary || "", foundationCount, foundationCost: Math.round(foundationCost),
      wallAreaBox: finalWarea.toFixed(1), gableAreaTotal: gArea.toFixed(1), roofArea: rArea.toFixed(1),
      openingsArea: totalProemsArea.toFixed(1), wallCost: Math.round(wallCost), roofCost: Math.round(roofCost), trimCost: Math.round(trimCost),
      totalCost: Math.round(totalCostNum).toLocaleString("ru-RU"), isOverloaded: false
    };
  }, [
    spanWidth, spansCount, length, height, slope, roofShape, snowLoad, windLoad, cranes, stories,
    gkPrice, lstkPrice, fasonkaPrice, useSandwich, layoutMode, panelModule, panelStockLength,
    wallPrice, roofPrice, trimPrice, frameType, baseMatrix210, snowCoefficients, roofPurlins, trussTable, windCoefficients,
    windowsList, gatesList, concretePrice, rebarPrice, totalWindowsAreaFact, totalGatesAreaFact
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
          <h2 style={styles.h2}>Быстрый расчёт v15 (ЕВРОАНГАР)</h2>
          <button style={styles.settingsBtn} onClick={() => setIsBaseMatrixOpen(true)}>📊 База</button>
          <button style={styles.settingsBtn} onClick={() => setIsSnowCoeffsOpen(true)}>❄️ Снег</button>
          <button style={styles.settingsBtn} onClick={() => setIsWindCoeffsOpen(true)}>💨 Ветер</button>
          <button style={styles.settingsBtn} onClick={() => setIsPurlinsOpen(true)}>🏗️ Прогоны</button>
          <button style={styles.settingsBtn} onClick={() => setIsTrussEditorOpen(true)}>⚙️ Ферма</button>
          <button style={styles.settingsBtn} onClick={() => setIsBuildingTypesOpen(true)}>⚙️ Типы</button>
        </div>
        <button style={styles.closeButton} onClick={onBack}>Закрыть</button>
      </div>

      <QuickEstimatorForm
        spanWidth={spanWidth} setSpanWidth={setSpanWidth} length={length} setLength={setLength} height={height} setHeight={setHeight}
        spansCount={spansCount} setSpansCount={setSpansCount} snowLoad={snowLoad} setSnowLoad={setSnowLoad} windLoad={windLoad} setWindLoad={setWindLoad}
        stories={stories} setStories={setStories} roofShape={roofShape} setRoofShape={setRoofShape} slope={slope} setSlope={setSlope}
        frameType={frameType} setFrameType={setFrameType} cranes={cranes} updateCrane={updateCrane} currentDiscount={estimation.currentDiscount}
        gatesArea={"0"} setGatesArea={() => {}} windowsArea={"0"} setWindowsArea={() => {}} 
      />

      <QuickEstimatorAnalytics dbAnalytics={dbAnalytics} />

      <div style={styles.sectionTitle}>
        <input type="checkbox" checked={useSandwich} onChange={(e) => setUseSandwich(e.target.checked)} style={{ marginRight: "10px" }} />
        2. Панели и цены
      </div>
      {useSandwich && (
        <div style={styles.grid}>
          <div style={styles.field}><label style={styles.label}>Раскладка</label>
            <select style={styles.select} value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)}>
              <option value="horizontal">Горизонт.</option><option value="vertical">Вертикал.</option>
            </select>
          </div>
          <div style={styles.field}><label style={styles.label}>Модуль панели (м)</label>
            <input style={styles.input} type="number" step="0.01" value={panelModule} onChange={(e) => setPanelModule(e.target.value)} />
          </div>
          {layoutMode === "horizontal" && (
            <div style={styles.field}><label style={styles.label}>Длина панели (м)</label>
              <input style={styles.input} type="number" value={panelStockLength} onChange={(e) => setPanelStockLength(e.target.value)} />
            </div>
          )}
          <div style={styles.field}><label style={styles.label}>Цена ГК (₽/т)</label><input style={styles.input} type="number" value={gkPrice} onChange={(e) => setGkPrice(e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Цена ЛСТК (₽/т)</label><input style={styles.input} type="number" value={lstkPrice} onChange={(e) => setLstkPrice(e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Цена фасонки (₽/т)</label><input style={styles.input} type="number" value={fasonkaPrice} onChange={(e) => setFasonkaPrice(e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Цена стен (₽/м²)</label><input style={styles.input} type="number" value={wallPrice} onChange={(e) => setWallPrice(e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Цена кровли (₽/м²)</label><input style={styles.input} type="number" value={roofPrice} onChange={(e) => setRoofPrice(e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Цена доборов (₽/м²)</label><input style={styles.input} type="number" value={trimPrice} onChange={(e) => setTrimPrice(e.target.value)} /></div>
        </div>
      )}

      <div style={styles.sectionTitle}>3. Детализация проемов (Окна, Ворота, Двери)</div>
      
      {!estimation.isOverloaded && baseMatrix210 && (
        <div style={styles.infoBadge}>
          <span>🪟 Сумма окон: <b>{totalWindowsAreaFact.toFixed(1)} м²</b></span>
          <span>🚪 Сумма ворот/дверей: <b>{totalGatesAreaFact.toFixed(1)} м²</b></span>
          <span>📊 Всего проемов: <b>{totalProemsArea.toFixed(1)} м²</b></span>
        </div>
      )}

      <div style={{fontWeight: "bold", fontSize: "0.9em", marginBottom: "5px", color: "#007bff"}}>Окна:</div>
      {windowsList.map((win) => (
        <div key={win.id} style={styles.rowBlock}>
          <div style={styles.field}><label style={styles.label}>Ширина (м)</label><input style={{...styles.input, width: "70px"}} type="number" value={win.width} onChange={e => updateWindow(win.id, 'width', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Высота (м)</label><input style={{...styles.input, width: "70px"}} type="number" value={win.height} onChange={e => updateWindow(win.id, 'height', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Кол-во (шт)</label><input style={{...styles.input, width: "50px"}} type="number" value={win.count} onChange={e => updateWindow(win.id, 'count', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Верх (E.top)</label><input style={{...styles.input, width: "70px"}} type="number" value={win.eTop} onChange={e => updateWindow(win.id, 'eTop', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Низ (E.bot)</label><input style={{...styles.input, width: "70px"}} type="number" value={win.eBot} onChange={e => updateWindow(win.id, 'eBot', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Профиль</label>
            <select style={styles.select} value={win.profile} onChange={e => updateWindow(win.id, 'profile', e.target.value)}>
              <option value="СтОП">СтОП</option><option value="ГКП">ГКП</option>
            </select>
          </div>
          <button style={styles.delBtn} onClick={() => setWindowsList(windowsList.filter(w => w.id !== win.id))}>🗑️</button>
        </div>
      ))}
      <button style={styles.addBtn} onClick={addWindow}>+ Добавить окно</button>

      <div style={{fontWeight: "bold", fontSize: "0.9em", marginTop: "15px", marginBottom: "5px", color: "#e67e22"}}>Ворота, Технические двери:</div>
      {gatesList.map((gate) => (
        <div key={gate.id} style={styles.rowBlock}>
          <div style={styles.field}><label style={styles.label}>Ширина (м)</label><input style={{...styles.input, width: "70px"}} type="number" value={gate.width} onChange={e => updateGate(gate.id, 'width', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Высота (м)</label><input style={{...styles.input, width: "70px"}} type="number" value={gate.height} onChange={e => updateGate(gate.id, 'height', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Кол-во (шт)</label><input style={{...styles.input, width: "50px"}} type="number" value={gate.count} onChange={e => updateGate(gate.id, 'count', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Низ (E.bot)</label><input style={{...styles.input, width: "70px"}} type="number" value={gate.eBot} onChange={e => updateGate(gate.id, 'eBot', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Верх (E.top)</label><input style={{...styles.input, width: "70px"}} type="number" value={gate.eTop} onChange={e => updateGate(gate.id, 'eTop', e.target.value)} /></div>
          <div style={styles.field}><label style={styles.label}>Профиль</label>
            <select style={styles.select} value={gate.profile} onChange={e => updateGate(gate.id, 'profile', e.target.value)}>
              <option value="ГКП">ГКП</option><option value="СтОП">СтОП</option>
            </select>
          </div>
          <button style={styles.delBtn} onClick={() => setGatesList(gatesList.filter(g => g.id !== gate.id))}>🗑️</button>
        </div>
      ))}
      <button style={{...styles.addBtn, backgroundColor: "#e67e22"}} onClick={addGate}>+ Добавить ворота/дверь</button>

      {estimation.isOverloaded ? (
        <div style={styles.errorBox}>
          🚫 ОШИБКА РАСЧЕТА: Суммарная площадь проемов ({estimation.totalProemsArea.toFixed(1)} м²) превышает общую геометрическую площадь стен здания ({estimation.rawWallAreaBox.toFixed(1)} м²)! Уменьшите габариты или количество ворот/окон.
        </div>
      ) : (
        <QuickEstimatorResults
          estimation={estimation} useSandwich={useSandwich} frameType={frameType} spanWidth={spanWidth} height={height} cranes={cranes}
          gkPrice={gkPrice} lstkPrice={lstkPrice} fasonkaPrice={fasonkaPrice} length={length} snowLoad={snowLoad} windLoad={windLoad}
        />
      )}

      <BaseMatrix210Editor isOpen={isBaseMatrixOpen} onClose={() => setIsBaseMatrixOpen(false)} onSave={setBaseMatrix210} />
      <SnowCoefficientsEditor isOpen={isSnowCoeffsOpen} onClose={() => setIsSnowCoeffsOpen(false)} onSave={setSnowCoefficients} />
      <WindCoefficientsEditor isOpen={isWindCoeffsOpen} onClose={() => setIsWindCoeffsOpen(false)} onSave={setWindCoefficients} />
      <RoofPurlinsEditor isOpen={isPurlinsOpen} onClose={() => setIsPurlinsOpen(false)} onSave={setRoofPurlins} />
      <TrussEfficiencyEditor isOpen={isTrussEditorOpen} onClose={() => setIsTrussEditorOpen(false)} onSave={setTrussTable} />
      {isBuildingTypesOpen && <BuildingTypesEditor onClose={() => setIsBuildingTypesOpen(false)} />}
    </div>
  );
}
