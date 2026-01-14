import React, { useState, useMemo, useEffect } from "react";
import TrussEfficiencyEditor, {
  generateDefaultTable,
} from "./TrussEfficiencyEditor";
import BaseMatrix210Editor from "./BaseMatrix210Editor";
import SnowCoefficientsEditor from "./SnowCoefficientsEditor";
import RoofPurlinsEditor from "./RoofPurlinsEditor";
import QuickEstimatorForm from "./QuickEstimatorForm";
import QuickEstimatorAnalytics from "./QuickEstimatorAnalytics";
import QuickEstimatorResults from "./QuickEstimatorResults";
import {
  generateBase210Matrix,
  generateSnowCoefficients,
  generateRoofPurlins,
  interpolate2D,
  getSnowCoefficient,
  getRoofPurlinWeight,
} from "./baseMatrixUtils";

const COEFFS = {
  tiesRatio: 0.15, // Связи 15% от рам
};

const OVERHANG = 0.4;

const CRANE_DATA = {
  suspension: { beam: 77.6 },
  support: { 5: 40.0, 10: 56.0, 20: 75.0 },
  ties: 10.84,
};

const DEFAULT_METAL_PRICE = 140000;
const DEFAULT_WALL_PRICE = 3500;
const DEFAULT_ROOF_PRICE = 3800;
const DEFAULT_TRIM_PRICE = 450;
const DEFAULT_CONCRETE_PRICE = 5500;
const DEFAULT_REBAR_PRICE = 65000;

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "30px auto",
    padding: "25px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #007bff",
    paddingBottom: "15px",
    marginBottom: "20px",
  },
  h2: { margin: 0, color: "#333" },
  closeButton: {
    padding: "8px 15px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  settingsBtn: {
    background: "none",
    border: "1px solid #007bff",
    fontSize: "0.85em",
    cursor: "pointer",
    marginLeft: "8px",
    padding: "6px 12px",
    borderRadius: "5px",
    color: "#007bff",
    transition: "all 0.2s",
  },
  sectionTitle: {
    marginTop: "20px",
    marginBottom: "10px",
    fontSize: "1.1em",
    fontWeight: "bold",
    color: "#555",
    borderBottom: "1px solid #eee",
    paddingBottom: "5px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  field: { display: "flex", flexDirection: "column" },
  label: {
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "0.85em",
    color: "#666",
  },
  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1em",
  },
  select: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1em",
    backgroundColor: "#fff",
  },
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

  // Новые таблицы
  const [baseMatrix210, setBaseMatrix210] = useState(null);
  const [snowCoefficients, setSnowCoefficients] = useState(null);
  const [roofPurlins, setRoofPurlins] = useState(null);
  const [trussTable, setTrussTable] = useState(null);

  // Состояния редакторов
  const [isBaseMatrixOpen, setIsBaseMatrixOpen] = useState(false);
  const [isSnowCoeffsOpen, setIsSnowCoeffsOpen] = useState(false);
  const [isPurlinsOpen, setIsPurlinsOpen] = useState(false);
  const [isTrussEditorOpen, setIsTrussEditorOpen] = useState(false);

  const [gatesArea, setGatesArea] = useState("0");
  const [windowsArea, setWindowsArea] = useState("0");

  const [strictFilter, setStrictFilter] = useState(true);
  const [useSandwich, setUseSandwich] = useState(true);
  const [layoutMode, setLayoutMode] = useState("horizontal");
  const [panelModule, setPanelModule] = useState(1.0);
  const [panelStockLength, setPanelStockLength] = useState(6.0);
  const [metalPrice, setMetalPrice] = useState(DEFAULT_METAL_PRICE);
  const [wallPrice, setWallPrice] = useState(DEFAULT_WALL_PRICE);
  const [roofPrice, setRoofPrice] = useState(DEFAULT_ROOF_PRICE);
  const [trimPrice, setTrimPrice] = useState(DEFAULT_TRIM_PRICE);
  const [concretePrice, setConcretePrice] = useState(DEFAULT_CONCRETE_PRICE);
  const [rebarPrice, setRebarPrice] = useState(DEFAULT_REBAR_PRICE);

  // Загрузка всех таблиц при монтировании
  useEffect(() => {
    // База 210
    const savedBase = localStorage.getItem("baseMatrix210");
    if (savedBase) {
      try {
        setBaseMatrix210(JSON.parse(savedBase));
      } catch {
        setBaseMatrix210(generateBase210Matrix());
      }
    } else {
      setBaseMatrix210(generateBase210Matrix());
    }

    // Коэффициенты снега
    const savedSnow = localStorage.getItem("snowCoefficients");
    if (savedSnow) {
      try {
        setSnowCoefficients(JSON.parse(savedSnow));
      } catch {
        setSnowCoefficients(generateSnowCoefficients());
      }
    } else {
      setSnowCoefficients(generateSnowCoefficients());
    }

    // Прогоны кровли
    const savedPurlins = localStorage.getItem("roofPurlins");
    if (savedPurlins) {
      try {
        setRoofPurlins(JSON.parse(savedPurlins));
      } catch {
        setRoofPurlins(generateRoofPurlins());
      }
    } else {
      setRoofPurlins(generateRoofPurlins());
    }

    // Таблица эффективности ферм
    const savedTruss = localStorage.getItem("trussEfficiencyTable");
    if (savedTruss) {
      try {
        setTrussTable(JSON.parse(savedTruss));
      } catch {
        setTrussTable(generateDefaultTable());
      }
    } else {
      setTrussTable(generateDefaultTable());
    }
  }, []);

  useEffect(() => {
    const count = Math.max(1, Number(spansCount) || 1);
    setCranes((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }).map(
          (_, i) => ({
            id: prev.length + i,
            cap: "0",
            type: "support",
          })
        );
        return [...prev, ...added];
      } else return prev.slice(0, count);
    });
  }, [spansCount]);

  const updateCrane = (index, field, value) => {
    const newCranes = [...cranes];
    newCranes[index] = { ...newCranes[index], [field]: value };
    if (field === "cap" && (value === "10" || value === "20"))
      newCranes[index].type = "support";
    setCranes(newCranes);
  };

  const dbAnalytics = useMemo(() => {
    if (!projectsDb || projectsDb.length === 0) return null;
    const W = Number(spanWidth);
    let similar = projectsDb.filter(
      (p) => p.width >= W * 0.8 && p.width <= W * 1.2 && p.specificWeight > 0
    );
    if (strictFilter) {
      const hasAnyCrane = cranes.some((c) => c.cap !== "0");
      const needMezzanine = stories > 1;
      similar = similar.filter(
        (p) => p.hasCrane === hasAnyCrane && p.hasMezzanine === needMezzanine
      );
    }
    if (similar.length === 0) return { found: false };
    let sumRate = 0,
      sumWelded = 0,
      sumRolled = 0;
    similar.forEach((p) => {
      sumRate += p.specificWeight;
      const area = p.width * p.length;
      if (area > 0) {
        sumWelded += ((p.massWelded || 0) * 1000) / area;
        sumRolled += ((p.massRolled || 0) * 1000) / area;
      }
    });
    const count = similar.length;
    return {
      found: true,
      count,
      avgRate: (sumRate / count).toFixed(1),
      detWelded: (sumWelded / count).toFixed(1),
      detRolled: (sumRolled / count).toFixed(1),
    };
  }, [spanWidth, projectsDb, strictFilter, cranes, stories]);

  const estimation = useMemo(() => {
    // Проверяем готовность данных
    if (!baseMatrix210 || !snowCoefficients || !roofPurlins || !trussTable) {
      return {
        floorArea: 0,
        metalRate: "0.0",
        metalWeight: "0.00",
        metalCost: 0,
        framesWeight: "0.00",
        framesRate: "0.0",
        framesCost: 0,
        purlinsWeight: "0.00",
        purlinsRate: "0.0",
        purlinsCost: 0,
        tiesWeight: "0.00",
        tiesRate: "0.0",
        tiesCost: 0,
        currentDiscount: "0",
        savingsAmount: 0,
        craneSystemWeight: null,
        craneSystemCost: 0,
        craneInfo: "",
        foundationCount: 0,
        concreteCubic: "0.0",
        rebarWeight: "0.00",
        foundationCost: 0,
        wallAreaBox: "0.0",
        gableAreaTotal: "0.0",
        roofArea: "0.0",
        openingsArea: "0.0",
        wallCost: 0,
        roofCost: 0,
        trimCost: 0,
        totalCost: "0",
      };
    }

    const W = Number(spanWidth) || 0;
    const N = cranes.length;
    const L = Number(length) || 0;
    const H = Number(height) || 0;
    const S = Number(slope) || 0;
    const baseSnow = Number(snowLoad) || 0;
    let pMod = Number(panelModule);
    if (!pMod) pMod = 1.0;
    const pStock = Number(panelStockLength) || 6.0;
    const openingsTotal = Number(gatesArea) + Number(windowsArea);

    const getTrussDiscount = (w, h) => {
      const hList = trussTable.heights;
      const sList = trussTable.spans;
      const hSafe = Math.max(hList[0], Math.min(h, hList[hList.length - 1]));
      const wSafe = Math.max(sList[0], Math.min(w, sList[sList.length - 1]));
      let h1 = hList[0],
        h2 = hList[hList.length - 1];
      for (let i = 0; i < hList.length - 1; i++) {
        if (hSafe >= hList[i] && hSafe <= hList[i + 1]) {
          h1 = hList[i];
          h2 = hList[i + 1];
          break;
        }
      }
      let s1 = sList[0],
        s2 = sList[sList.length - 1];
      for (let i = 0; i < sList.length - 1; i++) {
        if (wSafe >= sList[i] && wSafe <= sList[i + 1]) {
          s1 = sList[i];
          s2 = sList[i + 1];
          break;
        }
      }
      try {
        const Q11 = trussTable.data[h1][s1];
        const Q12 = trussTable.data[h1][s2];
        const Q21 = trussTable.data[h2][s1];
        const Q22 = trussTable.data[h2][s2];

        const interpolate = (x, x1, y1, x2, y2) => {
          if (x2 === x1) return y1;
          return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
        };

        const R1 = interpolate(wSafe, s1, Q11, s2, Q12);
        const R2 = interpolate(wSafe, s1, Q21, s2, Q22);
        return interpolate(hSafe, h1, R1, h2, R2);
      } catch (e) {
        return 0;
      }
    };

    let lMult = 1;
    if (L < 30) lMult += 0.05;
    let floorMult = 1;
    if (stories > 1) floorMult = 1 + (stories - 1) * 0.4;

    let totalFrameKgRaw = 0;
    let totalPurlinsKg = 0;
    let totalCraneSystemKg = 0;

    cranes.forEach((crane) => {
      const capVal = Number(crane.cap);
      const hasThisCrane = capVal > 0;
      let spanSnow = baseSnow;

      // НОВАЯ ЛОГИКА: База 210 + коэффициент снега

      // Корректируем снег для подвесного крана
      if (hasThisCrane && crane.type === "suspension") {
        spanSnow += 140;
      }

      // 1. Получаем базовый вес из матрицы 210
      const baseWeight = interpolate2D(baseMatrix210, H, W);

      // 2. Применяем коэффициент снега
      const snowCoeff = getSnowCoefficient(snowCoefficients, spanSnow);
      let frameRate = baseWeight * snowCoeff;

      // 3. Применяем коэффициент длины и этажности
      frameRate *= lMult * floorMult;

      // 4. Применяем коэффициент опорного крана (не подвесного!)
      if (hasThisCrane && crane.type === "support") {
        if (capVal <= 5) frameRate *= 1.15;
        else frameRate *= 1.25;
      }

      // 5. Применяем скидку на ферму
      let trussDiscount = 0;
      if (frameType === "truss") {
        trussDiscount = getTrussDiscount(W, H);
      }
      frameRate *= 1 - trussDiscount / 100;

      // 6. Прогоны кровли (из таблицы)
      const purlinRate = getRoofPurlinWeight(roofPurlins, spanSnow);

      const spanArea = W * L;
      totalFrameKgRaw += frameRate * spanArea;
      totalPurlinsKg += purlinRate * spanArea;

      // Крановая система
      if (hasThisCrane) {
        const trackLength = L * 2;
        let trackLinW = 0;
        if (crane.type === "suspension") trackLinW = CRANE_DATA.suspension.beam;
        else {
          if (capVal <= 5) trackLinW = CRANE_DATA.support[5];
          else if (capVal <= 10) trackLinW = CRANE_DATA.support[10];
          else trackLinW = CRANE_DATA.support[20];
        }
        totalCraneSystemKg +=
          trackLength * trackLinW * 1.15 + trackLength * CRANE_DATA.ties * 1.1;
      }
    });

    const totalWidth = W * N;
    const floorAreaTotal = totalWidth * L;

    // Прогоны стен (фахверк) - считаем отдельно как раньше
    let wallPurlinWeight = 0;
    if (useSandwich && layoutMode === "vertical") {
      const wPress = (Number(windLoad) * 30) / 100;
      let purlinStep = 4.5;
      if (wPress <= 0.23) purlinStep = 4.5;
      else if (wPress <= 0.42) purlinStep = 3.0;
      else if (wPress <= 0.6) purlinStep = 1.5;
      else purlinStep = 1.2;

      const perimeter = (totalWidth + L) * 2;
      let lines = 0;
      if (wPress > 0.6) {
        lines = Math.ceil(H / purlinStep);
        wallPurlinWeight = perimeter * lines * 6.375;
      } else {
        wallPurlinWeight = perimeter * H * 10;
      }
    }
    totalPurlinsKg += wallPurlinWeight;

    // Связи (15% от рам)
    const totalTiesKg = totalFrameKgRaw * COEFFS.tiesRatio;

    const totalFrameKg = totalFrameKgRaw + totalPurlinsKg + totalTiesKg;
    const totalMetalKg = totalFrameKg + totalCraneSystemKg;
    const metalWeightTons = totalMetalKg / 1000;
    const metalCost = metalWeightTons * metalPrice;

    const framesWeightTons = totalFrameKgRaw / 1000;
    const purlinsWeightTons = totalPurlinsKg / 1000;
    const tiesWeightTons = totalTiesKg / 1000;

    const framesCost = framesWeightTons * metalPrice;
    const purlinsCost = purlinsWeightTons * metalPrice;
    const tiesCost = tiesWeightTons * metalPrice;

    let savingsAmount = 0;
    if (frameType === "truss") {
      const discount = getTrussDiscount(W, H);
      savingsAmount = (framesCost * discount) / 100;
    }

    const axesLong = Math.ceil(L / 6) + 1;
    const axesWidth = N + 1;
    const foundationCount = axesLong * axesWidth;

    const concreteCubic = (foundationCount * 2.7).toFixed(1);
    const rebarWeight = ((foundationCount * 80) / 1000).toFixed(2);
    const foundationCost = Math.round(
      concreteCubic * concretePrice + rebarWeight * rebarPrice
    );

    let wallCost = 0,
      roofCost = 0,
      trimCost = 0;
    let wallAreaBox = 0,
      gableAreaTotal = 0,
      roofAreaTotal = 0;

    if (useSandwich) {
      const angleRad = Math.atan(S / 100);
      const ridgeRise =
        roofShape === "gable" ? (W / 2) * (S / 100) : W * (S / 100);
      const slopeLengthGeom =
        roofShape === "gable"
          ? W / 2 / Math.cos(angleRad)
          : W / Math.cos(angleRad);
      const slopeLengthPurchase = slopeLengthGeom + OVERHANG;
      const roofLengthAlongL = L + OVERHANG * 2;

      if (roofShape === "gable")
        roofAreaTotal = slopeLengthPurchase * roofLengthAlongL * 2 * N;
      else roofAreaTotal = slopeLengthPurchase * roofLengthAlongL * N;

      const perimeter = (totalWidth + L) * 2;
      if (layoutMode === "horizontal") {
        const rowsBox = Math.ceil(H / pMod);
        const boxHeightFact = rowsBox * pMod;
        const panelsInRing = Math.ceil(perimeter / pStock);
        wallAreaBox = panelsInRing * pStock * boxHeightFact;
      } else {
        wallAreaBox = Math.ceil(perimeter / pMod) * pMod * H;
      }

      wallAreaBox = Math.max(0, wallAreaBox - openingsTotal);

      let singleEndArea = 0;
      if (layoutMode === "horizontal") {
        const boxHfact = Math.ceil(H / pMod) * pMod;
        let startH = boxHfact - H;
        let currentH = startH;
        let loopSafe = 0;
        while (currentH < ridgeRise && loopSafe < 1000) {
          loopSafe++;
          let wAtBottom = W * (1 - currentH / ridgeRise);
          if (wAtBottom < 0) wAtBottom = 0;
          const pieces = Math.ceil(wAtBottom / pStock);
          singleEndArea += pieces * pStock * pMod;
          currentH += pMod;
        }
      } else {
        singleEndArea = (W * ridgeRise) / 2;
      }
      gableAreaTotal = singleEndArea * 2 * N;

      wallCost = (wallAreaBox + gableAreaTotal) * wallPrice;
      roofCost = roofAreaTotal * roofPrice;
      trimCost = (wallAreaBox + gableAreaTotal + roofAreaTotal) * trimPrice;
    }

    const cranesSummary = cranes
      .filter((c) => c.cap !== "0")
      .map((c, i) => `№${i + 1}:${c.cap}т`)
      .join(", ");

    const currentDiscount =
      frameType === "truss" ? getTrussDiscount(W, H).toFixed(1) : "0";

    const totalCostNum =
      metalCost + wallCost + roofCost + trimCost + foundationCost;

    return {
      floorArea: floorAreaTotal,
      metalRate: (totalMetalKg / floorAreaTotal).toFixed(1),
      metalWeight: metalWeightTons.toFixed(2),
      metalCost: Math.round(metalCost),

      framesWeight: framesWeightTons.toFixed(2),
      framesRate: (totalFrameKgRaw / floorAreaTotal).toFixed(1),
      framesCost: Math.round(framesCost),

      purlinsWeight: purlinsWeightTons.toFixed(2),
      purlinsRate: (totalPurlinsKg / floorAreaTotal).toFixed(1),
      purlinsCost: Math.round(purlinsCost),

      tiesWeight: tiesWeightTons.toFixed(2),
      tiesRate: (totalTiesKg / floorAreaTotal).toFixed(1),
      tiesCost: Math.round(tiesCost),

      currentDiscount,
      savingsAmount: Math.round(savingsAmount),

      craneSystemWeight:
        totalCraneSystemKg > 0 ? (totalCraneSystemKg / 1000).toFixed(2) : null,
      craneSystemCost:
        totalCraneSystemKg > 0
          ? Math.round((totalCraneSystemKg / 1000) * metalPrice)
          : 0,
      craneInfo: cranesSummary || "",

      foundationCount,
      concreteCubic,
      rebarWeight,
      foundationCost,

      wallAreaBox: wallAreaBox.toFixed(1),
      gableAreaTotal: gableAreaTotal.toFixed(1),
      roofArea: roofAreaTotal.toFixed(1),
      openingsArea: openingsTotal.toFixed(1),
      wallCost: Math.round(wallCost),
      roofCost: Math.round(roofCost),
      trimCost: Math.round(trimCost),

      totalCost: Math.round(totalCostNum).toLocaleString("ru-RU"),
    };
  }, [
    spanWidth,
    spansCount,
    length,
    height,
    slope,
    roofShape,
    snowLoad,
    windLoad,
    cranes,
    stories,
    metalPrice,
    useSandwich,
    layoutMode,
    panelModule,
    panelStockLength,
    wallPrice,
    roofPrice,
    trimPrice,
    frameType,
    baseMatrix210,
    snowCoefficients,
    roofPurlins,
    trussTable,
    gatesArea,
    windowsArea,
    concretePrice,
    rebarPrice,
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "5px",
          }}
        >
          <h2 style={styles.h2}>Быстрый расчёт v11 (База 210)</h2>
          <button
            style={styles.settingsBtn}
            onClick={() => setIsBaseMatrixOpen(true)}
            title="📊 Базовая матрица 210"
          >
            📊 База
          </button>
          <button
            style={styles.settingsBtn}
            onClick={() => setIsSnowCoeffsOpen(true)}
            title="❄️ Коэффициенты снега"
          >
            ❄️ Снег
          </button>
          <button
            style={styles.settingsBtn}
            onClick={() => setIsPurlinsOpen(true)}
            title="🏗️ Прогоны кровли"
          >
            🏗️ Прогоны
          </button>
          <button
            style={styles.settingsBtn}
            onClick={() => setIsTrussEditorOpen(true)}
            title="⚙️ Эффективность ферм"
          >
            ⚙️ Ферма
          </button>
        </div>
        <button style={styles.closeButton} onClick={onBack}>
          Закрыть
        </button>
      </div>

      <QuickEstimatorForm
        spanWidth={spanWidth}
        setSpanWidth={setSpanWidth}
        length={length}
        setLength={setLength}
        height={height}
        setHeight={setHeight}
        spansCount={spansCount}
        setSpansCount={setSpansCount}
        snowLoad={snowLoad}
        setSnowLoad={setSnowLoad}
        windLoad={windLoad}
        setWindLoad={setWindLoad}
        stories={stories}
        setStories={setStories}
        roofShape={roofShape}
        setRoofShape={setRoofShape}
        slope={slope}
        setSlope={setSlope}
        frameType={frameType}
        setFrameType={setFrameType}
        cranes={cranes}
        updateCrane={updateCrane}
        currentDiscount={estimation.currentDiscount}
        gatesArea={gatesArea}
        setGatesArea={setGatesArea}
        windowsArea={windowsArea}
        setWindowsArea={setWindowsArea}
      />

      <QuickEstimatorAnalytics dbAnalytics={dbAnalytics} />

      <div style={styles.sectionTitle}>
        <input
          type="checkbox"
          checked={useSandwich}
          onChange={(e) => setUseSandwich(e.target.checked)}
          style={{ marginRight: "10px" }}
        />
        2. Панели и цены
      </div>

      {useSandwich && (
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Раскладка</label>
            <select
              style={styles.select}
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
            >
              <option value="horizontal">Горизонт.</option>
              <option value="vertical">Вертикал.</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              {layoutMode === "horizontal"
                ? "Модуль (м)"
                : "Модуль вертик. (м)"}
            </label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              value={panelModule}
              onChange={(e) => setPanelModule(e.target.value)}
            />
          </div>
          {layoutMode === "horizontal" && (
            <div style={styles.field}>
              <label style={styles.label}>Длина панели (м)</label>
              <input
                style={styles.input}
                type="number"
                value={panelStockLength}
                onChange={(e) => setPanelStockLength(e.target.value)}
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Цена металла (₽/т)</label>
            <input
              style={styles.input}
              type="number"
              value={metalPrice}
              onChange={(e) => setMetalPrice(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена стен (₽/м²)</label>
            <input
              style={styles.input}
              type="number"
              value={wallPrice}
              onChange={(e) => setWallPrice(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена кровли (₽/м²)</label>
            <input
              style={styles.input}
              type="number"
              value={roofPrice}
              onChange={(e) => setRoofPrice(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена доборов (₽/м²)</label>
            <input
              style={styles.input}
              type="number"
              value={trimPrice}
              onChange={(e) => setTrimPrice(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена бетона (₽/м³)</label>
            <input
              style={styles.input}
              type="number"
              value={concretePrice}
              onChange={(e) => setConcretePrice(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена арматуры (₽/т)</label>
            <input
              style={styles.input}
              type="number"
              value={rebarPrice}
              onChange={(e) => setRebarPrice(e.target.value)}
            />
          </div>
        </div>
      )}

      <QuickEstimatorResults
        estimation={estimation}
        useSandwich={useSandwich}
        frameType={frameType}
      />

      {/* Редакторы */}
      <BaseMatrix210Editor
        isOpen={isBaseMatrixOpen}
        onClose={() => setIsBaseMatrixOpen(false)}
        onSave={setBaseMatrix210}
      />

      <SnowCoefficientsEditor
        isOpen={isSnowCoeffsOpen}
        onClose={() => setIsSnowCoeffsOpen(false)}
        onSave={setSnowCoefficients}
      />

      <RoofPurlinsEditor
        isOpen={isPurlinsOpen}
        onClose={() => setIsPurlinsOpen(false)}
        onSave={setRoofPurlins}
      />

      <TrussEfficiencyEditor
        isOpen={isTrussEditorOpen}
        onClose={() => setIsTrussEditorOpen(false)}
        onSave={setTrussTable}
      />
    </div>
  );
}
