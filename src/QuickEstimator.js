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
  apertureRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    flexWrap: "wrap",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #e9ecef"
  },
  addBtn: {
    padding: "10px 15px",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
    marginRight: "10px"
  },
  delBtn: {
    padding: "8px 12px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    height: "36px"
  },
  validationBox: {
    padding: "15px",
    borderRadius: "8px",
    marginTop: "15px",
    marginBottom: "15px",
    fontSize: "0.95em",
    lineHeight: "1.4"
  },
  wallsConfigBox: {
    backgroundColor: "#f1f3f5",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #ced4da"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.95em",
    fontWeight: "bold",
    color: "#495057",
    cursor: "pointer"
  }
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

  const [activeWalls, setActiveWalls] = useState({
    north: true,
    south: true,
    east: true,
    west: true,
  });

  const [baseMatrix210, setBaseMatrix210] = useState(null);
  const [snowCoefficients, setSnowCoefficients] = useState(null);
  const [roofPurlins, setRoofPurlins] = useState(null);
  const [trussTable, setTrussTable] = useState(null);
  const [windCoefficients, setWindCoefficients] = useState(null);

  const [isBaseMatrixOpen, setIsBaseMatrixOpen] = useState(false);
  const [isSnowCoeffsOpen, setIsSnowCoeffsOpen] = useState(false);
  const [isPurlinsOpen, setIsPurlinsOpen] = useState(false);
  const [isTrussEditorOpen, setIsTrussEditorOpen] = useState(false);
  const [isWindCoeffsOpen, setIsWindCoeffsOpen] = useState(false);
  const [isBuildingTypesOpen, setIsBuildingTypesOpen] = useState(false);

  const [aperturesList, setAperturesList] = useState([]); 

  const [strictFilter, setStrictFilter] = useState(true);
  const [useSandwich, setUseSandwich] = useState(true);
  const [layoutMode, setLayoutMode] = useState("horizontal");
  const [panelModule, setPanelModule] = useState(1.0);
  const [panelStockLength, setPanelStockLength] = useState(6.0);

  const [gkPrice, setGkPrice] = useState(DEFAULT_GK_PRICE);
  const [lstkPrice, setLstkPrice] = useState(DEFAULT_LSTK_PRICE);
  const [fasonkaPrice, setFasonkaPrice] = useState(DEFAULT_FASONKA_PRICE);

  const [wallPrice, setWallPrice] = useState(DEFAULT_WALL_PRICE);
  const [roofPrice, setRoofPrice] = useState(DEFAULT_ROOF_PRICE);
  const [trimPrice, setTrimPrice] = useState(DEFAULT_TRIM_PRICE);
  const [concretePrice, setConcretePrice] = useState(DEFAULT_CONCRETE_PRICE);
  const [rebarPrice, setRebarPrice] = useState(DEFAULT_REBAR_PRICE);

  useEffect(() => {
    const savedBase = localStorage.getItem("baseMatrix210");
    setBaseMatrix210(savedBase ? JSON.parse(savedBase) : generateBase210Matrix());
    const savedSnow = localStorage.getItem("snowCoefficients");
    setSnowCoefficients(savedSnow ? JSON.parse(savedSnow) : generateSnowCoefficients());
    const savedPurlins = localStorage.getItem("roofPurlins");
    setRoofPurlins(savedPurlins ? JSON.parse(savedPurlins) : generateRoofPurlins());
    const savedTruss = localStorage.getItem("trussEfficiencyTable");
    setTrussTable(savedTruss ? JSON.parse(savedTruss) : generateDefaultTable());
    const savedWind = localStorage.getItem("windCoefficients");
    setWindCoefficients(savedWind ? JSON.parse(savedWind) : generateWindCoefficients());
  }, []);

  useEffect(() => {
    const count = Math.max(1, Number(spansCount) || 1);
    setCranes((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }).map(
          (_, i) => ({ id: prev.length + i, cap: "0", type: "support" })
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

  const toggleWall = (wallKey) => {
    setActiveWalls(prev => ({ ...prev, [wallKey]: !prev[wallKey] }));
  };

  const addAperture = (type) => {
    const H_val = Number(height) || 0;
    const pMod_val = Number(panelModule) || 1.0;
    
    let defaultWidth = "3.0";
    let defaultHeight = "1.2";
    let eTop = 0;
    let eBot = 0;

    if (type === "window") {
      defaultWidth = "3.0";
      defaultHeight = "1.2";
      if (layoutMode === "vertical") {
        eTop = H_val - 0.5;
      } else {
        eTop = Math.floor((H_val - 0.5) / pMod_val) * pMod_val;
      }
      eBot = eTop - Number(defaultHeight);
    } else if (type === "gate") {
      defaultWidth = "4.0";
      defaultHeight = "4.2";
      eTop = Number(defaultHeight);
      eBot = 0.0;
    } else if (type === "door") {
      defaultWidth = "1.0";
      defaultHeight = "2.1";
      eTop = Number(defaultHeight);
      eBot = 0.0;
    }

    setAperturesList([
      ...aperturesList,
      {
        id: Date.now() + Math.random(),
        type,
        width: defaultWidth,
        height: defaultHeight,
        count: "1",
        eTop: String(Math.max(0, eTop).toFixed(2)),
        eBot: String(Math.max(0, eBot).toFixed(2)),
        profile: type === "window" ? "СтОП" : "ГКП"
      }
    ]);
  };

  const updateAperture = (id, field, value) => {
    setAperturesList(prev => prev.map(ap => {
      if (ap.id === id) {
        const updated = { ...ap, [field]: value };
        const h = Number(updated.height) || 0;

        if (ap.type === "window") {
          if (field === 'height' || field === 'eTop') {
            const t = Number(updated.eTop) || 0;
            updated.eBot = String(Math.max(0, t - h).toFixed(2));
          }
          if (field === 'eBot') {
            const b = Number(updated.eBot) || 0;
            updated.eTop = String((b + h).toFixed(2));
          }
        } else {
          updated.eBot = "0.00";
          if (field === 'height') {
            updated.eTop = String(h.toFixed(2));
          }
          if (field === 'eTop') {
            updated.height = value;
          }
        }
        return updated;
      }
      return ap;
    }));
  };

  const removeAperture = (id) => {
    setAperturesList(prev => prev.filter(ap => ap.id !== id));
  };

  const validationMetrics = useMemo(() => {
    const W = Number(spanWidth) || 0;
    const N = cranes.length;
    const L = Number(length) || 0;
    const H = Number(height) || 0;
    const totalWidth = W * N;

    const sNorth = activeWalls.north ? (L * H) : 0;
    const sSouth = activeWalls.south ? (L * H) : 0;
    const sEast = activeWalls.east ? (totalWidth * H) : 0;
    const sWest = activeWalls.west ? (totalWidth * H) : 0;

    const totalWallsGeomArea = sNorth + sSouth + sEast + sWest;
    
    let totalAperturesArea = 0;
    aperturesList.forEach(ap => {
      const w = Number(ap.width) || 0;
      const h = Number(ap.height) || 0;
      const c = Number(ap.count) || 0;
      totalAperturesArea += (w * h * c);
    });

    const perforationPercent = totalWallsGeomArea > 0 ? (totalAperturesArea / totalWallsGeomArea) * 100 : 0;
    const isOverloaded = perforationPercent > 100.0;

    return {
      totalWallsGeomArea: totalWallsGeomArea.toFixed(1),
      totalAperturesArea: totalAperturesArea.toFixed(1),
      perforationPercent: perforationPercent.toFixed(1),
      isOverloaded
    };
  }, [spanWidth, cranes.length, length, height, aperturesList, activeWalls]);

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
    return {
      found: true,
      count,
      avgRate: (sumRate / count).toFixed(1),
      detWelded: (sumWelded / count).toFixed(1),
      detRolled: (sumRolled / count).toFixed(1),
    };
  }, [spanWidth, projectsDb, strictFilter, cranes, stories]);

  const estimation = useMemo(() => {
    if (
      !baseMatrix210 ||
      !snowCoefficients ||
      !roofPurlins ||
      !trussTable ||
      !windCoefficients
    ) {
      return {
        roofPurlinsKg: 0, wallPurlinsLength: 0, floorArea: 0, metalRate: "0.0", metalWeight: "0.00", metalCost: 0,
        framesWeight: "0.00", framesRate: "0.0", framesCost: 0, purlinsWeight: "0.00", purlinsRate: "0.0", purlinsCost: 0,
        tiesWeight: "0.00", tiesRate: "0.0", tiesCost: 0, currentDiscount: "0", savingsAmount: 0, envelopeDiffAmount: 0,
        craneSystemWeight: null, craneSystemCost: 0, craneInfo: "", foundationCount: 0, concreteCubic: "0.0", rebarWeight: "0.00",
        foundationCost: 0, wallAreaBox: "0.0", gableAreaTotal: "0.0", roofArea: "0.0", openingsArea: "0.0",
        wallCost: 0, roofCost: 0, trimCost: 0, totalCost: "0", isBlockedByValidation: false
      };
    }

    const W = Number(spanWidth) || 0;
    const N = cranes.length;
    const L = Number(length) || 0;
    const H = Number(height) || 0;
    const S = Number(slope) || 0;
    const baseSnow = Number(snowLoad) || 0;
    const currentWind = Number(windLoad) || 38;

    const activeMetalPrice = Number(gkPrice) || 0;

    let pMod = Number(panelModule);
    if (!pMod) pMod = 1.0;
    const pStock = Number(panelStockLength) || 6.0;

    const purlinHeight = baseSnow <= 400 ? 0.24 : 0.3;

    let supportHeight = 0.35;
    if (W > 18 && W < 33)
      supportHeight = 0.35 + ((W - 18) * (0.75 - 0.35)) / (33 - 18);
    else if (W >= 33) supportHeight = 0.75;

    let trussCorrectionValue = 0;
    if (S <= 21) {
      trussCorrectionValue = 0.65 + (10 - S) * 0.0597;
    }

    const fullWallHeightBeam = H + purlinHeight + supportHeight;
    const fullWallHeightTruss = fullWallHeightBeam + trussCorrectionValue;

    const fullWallHeight = frameType === "truss" ? fullWallHeightTruss : fullWallHeightBeam;

    const getTrussDiscount = (w, h) => {
      const hList = trussTable.heights;
      const sList = trussTable.spans;
      const hSafe = Math.max(hList[0], Math.min(h, hList[hList.length - 1]));
      const wSafe = Math.max(sList[0], Math.min(w, sList[sList.length - 1]));
      let h1 = hList[0], h2 = hList[hList.length - 1];
      for (let i = 0; i < hList.length - 1; i++) {
        if (hSafe >= hList[i] && hSafe <= hList[i + 1]) {
          h1 = hList[i]; h2 = hList[i + 1]; break;
        }
      }
      let s1 = sList[0], s2 = sList[sList.length - 1];
      for (let i = 0; i < sList.length - 1; i++) {
        if (wSafe >= sList[i] && wSafe <= sList[i + 1]) {
          s1 = sList[i]; s2 = sList[i + 1]; break;
        }
      }
      try {
        const Q11 = trussTable.data[h1][s1], Q12 = trussTable.data[h1][s2];
        const Q21 = trussTable.data[h2][s1], Q22 = trussTable.data[h2][s2];
        const interpolate = (x, x1, y1, x2, y2) => x2 === x1 ? y1 : y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
        const R1 = interpolate(wSafe, s1, Q11, s2, Q12);
        const R2 = interpolate(wSafe, s1, Q21, s2, Q22);
        return interpolate(hSafe, h1, R1, h2, R2);
      } catch (e) { return 0; }
    };

    let lMult = 1;
    if (L < 30) lMult += 0.05;
    let floorMult = 1;
    if (stories > 1) floorMult = 1 + (stories - 1) * 0.4;

    let totalFrameKgRaw = 0;
    let totalPurlinsKg = 0;
    let totalCraneSystemKg = 0;
    let totalTiesKg = 0;
    let totalSavingsKg = 0;

    cranes.forEach((crane) => {
      const capVal = Number(crane.cap);
      const hasThisCrane = capVal > 0;
      let spanSnow = baseSnow;

      if (hasThisCrane && crane.type === "suspension") spanSnow += 140;

      const baseWeight210_Truss = interpolate2D(baseMatrix210, H, W);
      const basePurlins210 = getRoofPurlinWeight(roofPurlins, 210);
      const currentPurlinsRate = getRoofPurlinWeight(roofPurlins, spanSnow);
      const snowCoeff = getSnowCoefficient(snowCoefficients, spanSnow);
      const windCoeff = getWindCoefficient(windCoefficients, currentWind);

      const baseTrussDiscountPercent = getTrussDiscount(W, H);
      const columnStep = 6;
      const totalFrames = Math.ceil(L / columnStep) + 1;
      const framesWithTruss = Math.max(0, totalFrames - 2);
      const finalDiscountPercent = (baseTrussDiscountPercent * framesWithTruss) / totalFrames / 0.9;
      const dynamicTrussCoeff = 1 - finalDiscountPercent / 100;

      const baseBeamTotal210 = baseWeight210_Truss / dynamicTrussCoeff;

      const savedConf = localStorage.getItem("euroangar_building_types_config");
      let pType4 = 0.47;
      if (savedConf) {
        try { pType4 = JSON.parse(savedConf).purlinType4 || 0.47; } catch (e) {}
      }

      const basePurlinsGK210 = basePurlins210 / pType4;

      let pureBeamFramesAndTies210 = baseBeamTotal210 - basePurlinsGK210;
      if (pureBeamFramesAndTies210 < 0) pureBeamFramesAndTies210 = 0;

      pureBeamFramesAndTies210 *= lMult * floorMult;

      if (hasThisCrane && crane.type === "support") {
        if (capVal <= 5) pureBeamFramesAndTies210 *= 1.15;
        else pureBeamFramesAndTies210 *= 1.25;
      }

      const adjustedBeamFramesAndTies = pureBeamFramesAndTies210 * snowCoeff * windCoeff;
      const fullBeamBuildingRate = adjustedBeamFramesAndTies + currentPurlinsRate;

      let totalReducedBuildingRate = fullBeamBuildingRate;
      if (frameType === "truss") {
        totalReducedBuildingRate = fullBeamBuildingRate * dynamicTrussCoeff;
      }

      const tiesRate = adjustedBeamFramesAndTies * COEFFS.tiesRatio;
      const purlinsRate = currentPurlinsRate;

      let framesRate = totalReducedBuildingRate - tiesRate - purlinsRate;
      if (framesRate < 0) framesRate = 0;

      const spanArea = W * L;
      totalFrameKgRaw += framesRate * spanArea;
      totalTiesKg += tiesRate * spanArea;
      totalPurlinsKg += purlinsRate * spanArea;

      if (frameType === "truss") {
        totalSavingsKg += (fullBeamBuildingRate - totalReducedBuildingRate) * spanArea;
      }

      if (hasThisCrane) {
        const trackLength = L * 2;
        let trackLinW = 0;
        if (crane.type === "suspension") trackLinW = CRANE_DATA.suspension.beam;
        else {
          if (capVal <= 5) trackLinW = CRANE_DATA.support[5];
          else if (capVal <= 10) trackLinW = CRANE_DATA.support[10];
          else trackLinW = CRANE_DATA.support[20];
        }
        totalCraneSystemKg += trackLength * trackLinW * 1.15 + trackLength * CRANE_DATA.ties * 1.1;
      }
    });

    const totalWidth = W * N;
    const floorAreaTotal = totalWidth * L;

    let dynamicPerimeter = 0;
    if (activeWalls.north) dynamicPerimeter += L;
    if (activeWalls.south) dynamicPerimeter += L;
    if (activeWalls.east) dynamicPerimeter += totalWidth;
    if (activeWalls.west) dynamicPerimeter += totalWidth;

    let wallPurlinsLength = 0;
    let wallPurlinsBaseKg = 0;

    if (useSandwich && layoutMode === "vertical") {
      const wPress = currentWind / 100; 
      let purlinStep = 4.5;
      if (wPress <= 0.23) purlinStep = 4.5;
      else if (wPress <= 0.42) purlinStep = 3.0;
      else if (wPress <= 0.60) purlinStep = 1.5;
      else purlinStep = 1.2;

      const lines = Math.ceil(fullWallHeight / purlinStep);
      wallPurlinsLength = dynamicPerimeter * lines;
      wallPurlinsBaseKg = wallPurlinsLength * 6.375;
    }

    const totalRoofPurlinsKg = totalPurlinsKg;
    totalPurlinsKg += wallPurlinsBaseKg; 

    let aperturesFrameKg = 0;
    let aperturesDeductArea = 0;
    let physicalAperturesAreaTotal = 0;

    aperturesList.forEach(ap => {
      const h_ap = Number(ap.height) || 0;
      const L_ap = Number(ap.width) || 0;
      const n = Number(ap.count) || 0;
      const eTop = Number(ap.eTop) || 0;
      const eBot = Number(ap.eBot) || 0;

      if (h_ap > 0 && L_ap > 0 && n > 0) {
        physicalAperturesAreaTotal += (h_ap * L_ap * n);

        let lFrame = 0;
        const horizLinesCount = (Math.abs(eBot) < 0.01) ? 1 : 2; 
        lFrame = (Math.ceil(L_ap / 6) * 6) * horizLinesCount + (2 * h_ap);

        if (ap.profile === "ГКП") {
          aperturesFrameKg += lFrame * 7.07 * 1.10 * n;
        } else {
          aperturesFrameKg += lFrame * 5.1 * 1.11 * n;
        }

        if (useSandwich) {
          if (layoutMode === "vertical") {
            const w_panels = Math.floor(L_ap / pMod);
            aperturesDeductArea += w_panels * pMod * h_ap * n;
          } else {
            const eps = 0.01;
            const eTopRem = eTop % pMod;
            const eBotRem = eBot % pMod;

            const isTopAligned = eTopRem < eps || (pMod - eTopRem) < eps;
            const isBotAligned = eBotRem < eps || (pMod - eBotRem) < eps;

            if (isTopAligned || isBotAligned) {
              const rowsCount = Math.floor(h_ap / pMod);
              aperturesDeductArea += rowsCount * pMod * L_ap * n;
            } else {
              const rowsCount = Math.floor(h_ap / pMod);
              aperturesDeductArea += rowsCount * pMod * L_ap * n;
            }
          }
        }
      }
    });

    totalFrameKgRaw += aperturesFrameKg; 

    const totalFrameKg = totalFrameKgRaw + totalPurlinsKg + totalTiesKg;
    const totalMetalKg = totalFrameKg + totalCraneSystemKg;
    const metalWeightTons = totalMetalKg / 1000;
    const metalCost = metalWeightTons * activeMetalPrice;

    const framesWeightTons = totalFrameKgRaw / 1000;
    const purlinsWeightTons = totalPurlinsKg / 1000;
    const tiesWeightTons = totalTiesKg / 1000;

    const framesCost = framesWeightTons * activeMetalPrice;
    const purlinsCost = purlinsWeightTons * activeMetalPrice;
    const tiesCost = tiesWeightTons * activeMetalPrice;

    const savingsAmount = (totalSavingsKg / 1000) * activeMetalPrice;

    const axesLong = Math.ceil(L / 6) + 1;
    const axesWidth = N + 1;
    const foundationCount = axesLong * axesWidth;

    const concreteCubic = (foundationCount * 2.7).toFixed(1);
    const rebarWeight = ((foundationCount * 80) / 1000).toFixed(2);
    const foundationCost = Math.round(
      concreteCubic * concretePrice + rebarWeight * rebarPrice
    );

    let wallCost = 0, roofCost = 0, trimCost = 0;
    let wallAreaBox = 0, textGableArea = 0, textRoofArea = 0;
    let envelopeDiffAmount = 0;

    if (useSandwich) {
      const calcEnvelope = (wallH) => {
        const angleRad = Math.atan(S / 100);
        const ridgeRise = roofShape === "gable" ? (W / 2) * (S / 100) : W * (S / 100);
        const slopeLengthGeom = roofShape === "gable" ? W / 2 / Math.cos(angleRad) : W / Math.cos(angleRad);
        const slopeLengthPurchase = slopeLengthGeom + OVERHANG;
        const roofLengthAlongL = L + OVERHANG * 2;

        let rArea = roofShape === "gable" ? slopeLengthPurchase * roofLengthAlongL * 2 * N : slopeLengthPurchase * roofLengthAlongL * N;

        let wAreaBox = 0;
        if (layoutMode === "horizontal") {
          const rowsBox = Math.ceil(wallH / pMod);
          const boxHeightFact = rowsBox * pMod;
          const panelsInRing = Math.ceil(dynamicPerimeter / pStock);
          wAreaBox = panelsInRing * pStock * boxHeightFact;
        } else {
          wAreaBox = Math.ceil(dynamicPerimeter / pMod) * pMod * wallH;
        }

        wAreaBox = Math.max(0, wAreaBox - aperturesDeductArea);

        let singleEndArea = 0;
        if (layoutMode === "horizontal") {
          const boxHfact = Math.ceil(wallH / pMod) * pMod;
          let startH = boxHfact - wallH;
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

        let gArea = 0;
        if (activeWalls.east) gArea += singleEndArea * N;
        if (activeWalls.west) gArea += singleEndArea * N;

        const wCost = (wAreaBox + gArea) * wallPrice;
        const rCost = rArea * roofPrice;
        const tCost = (wAreaBox + gArea + rArea) * trimPrice;

        return { wAreaBox, gArea, rArea, wCost, rCost, tCost };
      };

      const actualEnv = calcEnvelope(fullWallHeight);
      wallAreaBox = actualEnv.wAreaBox;
      textGableArea = actualEnv.gArea;
      textRoofArea = actualEnv.rArea;
      wallCost = actualEnv.wCost;
      roofCost = actualEnv.rCost;
      trimCost = actualEnv.tCost;

      const beamEnv = calcEnvelope(fullWallHeightBeam);
      const trussEnv = calcEnvelope(fullWallHeightTruss);
      envelopeDiffAmount = trussEnv.wCost + trussEnv.tCost - (beamEnv.wCost + beamEnv.tCost);
    }

    const cranesSummary = cranes.filter((c) => c.cap !== "0").map((c, i) => `№${i + 1}:${c.cap}т`).join(", ");

    let currentDiscount = "0";
    if (frameType === "truss") {
      const baseTrussDiscountPercent = getTrussDiscount(W, H);
      const columnStep = 6;
      const totalFrames = Math.ceil(L / columnStep) + 1;
      const framesWithTruss = Math.max(0, totalFrames - 2);
      const finalDiscountPercent = (baseTrussDiscountPercent * framesWithTruss) / totalFrames / 0.9;
      currentDiscount = Math.max(0, finalDiscountPercent).toFixed(1);
    }

    const totalCostNum = metalCost + wallCost + roofCost + trimCost + foundationCost;

    return {
      roofPurlinsKg: totalRoofPurlinsKg, 
      wallPurlinsLength: wallPurlinsLength, 
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
      envelopeDiffAmount: Math.round(envelopeDiffAmount),
      craneSystemWeight: totalCraneSystemKg > 0 ? (totalCraneSystemKg / 1000).toFixed(2) : null,
      craneSystemCost: totalCraneSystemKg > 0 ? Math.round((totalCraneSystemKg / 1000) * activeMetalPrice) : 0,
      craneInfo: cranesSummary || "",
      foundationCount, concreteCubic, rebarWeight, foundationCost,
      wallAreaBox: wallAreaBox.toFixed(1),
      gableAreaTotal: textGableArea.toFixed(1),
      roofArea: textRoofArea.toFixed(1),
      openingsArea: physicalAperturesAreaTotal.toFixed(1),
      wallCost: Math.round(wallCost),
      roofCost: Math.round(roofCost),
      trimCost: Math.round(trimCost),
      totalCost: Math.round(totalCostNum).toLocaleString("ru-RU"),
      isBlockedByValidation: validationMetrics.isOverloaded 
    };
  }, [
    spanWidth, spansCount, length, height, slope, roofShape, snowLoad,
    windLoad, cranes, stories, gkPrice, lstkPrice, fasonkaPrice,
    useSandwich, layoutMode, panelModule, panelStockLength, wallPrice,
    roofPrice, trimPrice, frameType, baseMatrix210, snowCoefficients,
    roofPurlins, trussTable, windCoefficients, aperturesList, activeWalls,
    concretePrice, rebarPrice, validationMetrics.isOverloaded
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
          <h2 style={styles.h2}>Быстрый расчёт v14 (ЕВРОАНГАР)</h2>
          <button style={styles.settingsBtn} onClick={() => setIsBaseMatrixOpen(true)} title="📊 База 210">📊 База</button>
          <button style={styles.settingsBtn} onClick={() => setIsSnowCoeffsOpen(true)} title="❄️ Снег">❄️ Снег</button>
          <button style={styles.settingsBtn} onClick={() => setIsWindCoeffsOpen(true)} title="💨 Ветер">💨 Ветер</button>
          <button style={styles.settingsBtn} onClick={() => setIsPurlinsOpen(true)} title="🏗️ Прогоны">🏗️ Прогоны</button>
          <button style={styles.settingsBtn} onClick={() => setIsTrussEditorOpen(true)} title="⚙️ Ферма">⚙️ Ферма</button>
          <button style={styles.settingsBtn} onClick={() => setIsBuildingTypesOpen(true)} title="⚙️ Типы зданий">⚙️ Типы</button>
        </div>
        <button style={styles.closeButton} onClick={onBack}>Закрыть</button>
      </div>

      <QuickEstimatorForm
        spanWidth={spanWidth} setSpanWidth={setSpanWidth}
        length={length} setLength={setLength}
        height={height} setHeight={setHeight}
        spansCount={spansCount} setSpansCount={setSpansCount}
        snowLoad={snowLoad} setSnowLoad={setSnowLoad}
        windLoad={windLoad} setWindLoad={setWindLoad}
        stories={stories} setStories={setStories}
        roofShape={roofShape} setRoofShape={setRoofShape}
        slope={slope} setSlope={setSlope}
        frameType={frameType} setFrameType={setFrameType}
        cranes={cranes} updateCrane={updateCrane}
        currentDiscount={estimation.currentDiscount}
      />

      <QuickEstimatorAnalytics dbAnalytics={dbAnalytics} />

      <div style={styles.sectionTitle}>1.1. Конфигуратор сопряжения стен (Пристройки ЕВРОАНГАР)</div>
      <div style={styles.wallsConfigBox}>
        <div style={{fontSize: "0.85em", color: "#666", marginBottom: "10px"}}>
          * Снимите чекбокс со стены, чтобы исключить её обшивку и стеновые прогоны (актуально для пристраиваемых пролетов к существующим цехам).
        </div>
        <div style={{display: "flex", gap: "20px", flexWrap: "wrap"}}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={activeWalls.north} onChange={() => toggleWall("north")} />
            🪵 Северная стена (Продольная {length}м)
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={activeWalls.south} onChange={() => toggleWall("south")} />
            🪵 Южная стена (Продольная {length}м)
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={activeWalls.east} onChange={() => toggleWall("east")} />
            📐 Восточная стена (Торцевая {Number(spanWidth) * Number(spansCount)}м)
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={activeWalls.west} onChange={() => toggleWall("west")} />
            📐 Западная стена (Торцевая {Number(spanWidth) * Number(spansCount)}м)
          </label>
        </div>
      </div>

      <div style={styles.sectionTitle}>2. Панели и цены</div>
      {useSandwich && (
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Раскладка</label>
            <select style={styles.select} value={layoutMode} onChange={(e) => setLayoutMode(e.target.value)}>
              <option value="horizontal">Горизонт.</option>
              <option value="vertical">Вертикал.</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{layoutMode === "horizontal" ? "Модуль (м)" : "Модуль вертик. (м)"}</label>
            <input style={styles.input} type="number" step="0.01" value={panelModule} onChange={(e) => setPanelModule(parseFloat(e.target.value) || 1.0)} />
          </div>
          {layoutMode === "horizontal" && (
            <div style={styles.field}>
              <label style={styles.label}>Длина панели (м)</label>
              <input style={styles.input} type="number" value={panelStockLength} onChange={(e) => setPanelStockLength(parseFloat(e.target.value) || 6.0)} />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Цена ГК (₽/т)</label>
            <input style={styles.input} type="number" value={gkPrice} onChange={(e) => setGkPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена ЛСТК (₽/т)</label>
            <input style={styles.input} type="number" value={lstkPrice} onChange={(e) => setLstkPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена фасонки (₽/т)</label>
            <input style={styles.input} type="number" value={fasonkaPrice} onChange={(e) => setFasonkaPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена стен (₽/м²)</label>
            <input style={styles.input} type="number" value={wallPrice} onChange={(e) => setWallPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена кровли (₽/м²)</label>
            <input style={styles.input} type="number" value={roofPrice} onChange={(e) => setRoofPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена доборов (₽/м²)</label>
            <input style={styles.input} type="number" value={trimPrice} onChange={(e) => setTrimPrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена бетона (₽/м³)</label>
            <input style={styles.input} type="number" value={concretePrice} onChange={(e) => setConcretePrice(Number(e.target.value))} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Цена арматуры (₽/т)</label>
            <input style={styles.input} type="number" value={rebarPrice} onChange={(e) => setRebarPrice(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div style={styles.sectionTitle}>3. Модуль инженерных проемов комплекса ЕВРОАНГАР</div>
      
      <div style={{
        ...styles.validationBox,
        backgroundColor: Number(validationMetrics.perforationPercent) > 70.0 ? "#fff3e0" : "#f1f8e9",
        border: Number(validationMetrics.perforationPercent) > 70.0 ? "2px solid #ff9800" : "1px solid #8bc34a",
        color: Number(validationMetrics.perforationPercent) > 70.0 ? "#e65100" : "#33691e"
      }}>
        📐 <b>Контроль пространственной жесткости стен:</b><br />
        • Геометрическая площадь активных стен: <b>{validationMetrics.totalWallsGeomArea} м²</b><br />
        • Суммарная площадь всех проемов: <b>{validationMetrics.totalAperturesArea} м²</b><br />
        • Процент перфорации оставшегося каркаса: <b style={{ fontSize: "1.1em" }}>{validationMetrics.perforationPercent}%</b> из доступных <b>100%</b>.<br />
        {Number(validationMetrics.perforationPercent) > 70.0 && (
          <span style={{ display: "block", marginTop: "5px", fontWeight: "bold" }}>
            ⚠️ ВНИМАНИЕ: Проемы занимают большую часть оставшихся стен. Требуется усиление продольных связей каркаса!
          </span>
        )}
      </div>

      {aperturesList.map((ap) => (
        <div key={ap.id} style={styles.apertureRow}>
          <div style={styles.field}>
            <label style={styles.label}>Тип проема</label>
            <select style={{...styles.select, width: "110px", fontWeight: "bold"}} value={ap.type} onChange={e => updateAperture(ap.id, 'type', e.target.value)}>
              <option value="window">🪟 Окно</option>
              <option value="gate">🚪 Ворота</option>
              <option value="door">🚪 Дверь</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Ширина (м)</label>
            <input style={{...styles.input, width: "70px"}} type="number" step="0.1" value={ap.width} onChange={e => updateAperture(ap.id, 'width', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Высота (м)</label>
            <input style={{...styles.input, width: "70px"}} type="number" step="0.1" value={ap.height} onChange={e => updateAperture(ap.id, 'height', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Кол-во (шт)</label>
            <input style={{...styles.input, width: "55px"}} type="number" value={ap.count} onChange={e => updateAperture(ap.id, 'count', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Верх (E.top)</label>
            <input style={{...styles.input, width: "75px"}} type="number" step="0.01" value={ap.eTop} disabled={ap.type !== "window"} onChange={e => updateAperture(ap.id, 'eTop', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Низ (E.bot)</label>
            <input style={{...styles.input, width: "75px", backgroundColor: ap.type !== "window" ? "#e9ecef" : "#fff"}} type="number" step="0.01" value={ap.eBot} disabled={ap.type !== "window"} onChange={e => updateAperture(ap.id, 'eBot', e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Профиль</label>
            <select style={styles.select} value={ap.profile} onChange={e => updateAperture(ap.id, 'profile', e.target.value)}>
              <option value="СтОП">СтОП (ЛСТК)</option>
              <option value="ГКП">ГКП (Черный)</option>
            </select>
          </div>
          <button style={styles.delBtn} onClick={() => removeAperture(ap.id)}>🗑️</button>
        </div>
      ))}

      <div style={{ marginBottom: "20px" }}>
        <button style={{...styles.addBtn, backgroundColor: "#007bff"}} onClick={() => addAperture("window")}>+ Окно</button>
        <button style={{...styles.addBtn, backgroundColor: "#fd7e14"}} onClick={() => addAperture("gate")}>+ Ворота</button>
        <button style={{...styles.addBtn, backgroundColor: "#6f42c1"}} onClick={() => addAperture("door")}>+ Дверь</button>
      </div>

      {/* СКВОЗНАЯ ПЕРЕДАЧА ВСЕХ ПАРАМЕТРОВ ГЕОМЕТРИИ, УКЛОНА, СНЕГА И ВЕТРА */}
      <QuickEstimatorResults
        estimation={estimation}
        useSandwich={useSandwich}
        frameType={frameType}
        roofShape={roofShape}
        slope={slope}
        spanWidth={spanWidth}
        length={length}
        height={height}
        snowLoad={snowLoad}
        windLoad={windLoad}
        cranes={cranes}
        gkPrice={gkPrice}
        lstkPrice={lstkPrice}
        fasonkaPrice={fasonkaPrice}
      />

      <BaseMatrix210Editor isOpen={isBaseMatrixOpen} onClose={() => setIsBaseMatrixOpen(false)} onSave={setBaseMatrix210} />
      <SnowCoefficientsEditor isOpen={isSnowCoeffsOpen} onClose={() => setIsSnowCoeffsOpen(false)} onSave={setSnowCoefficients} />
      <WindCoefficientsEditor isOpen={isWindCoeffsOpen} onClose={() => setIsWindCoeffsOpen(false)} onSave={setWindCoefficients} />
      <RoofPurlinsEditor isOpen={isPurlinsOpen} onClose={() => setIsPurlinsOpen(false)} onSave={setRoofPurlins} />
      <TrussEfficiencyEditor isOpen={isTrussEditorOpen} onClose={() => setIsTrussEditorOpen(false)} onSave={setTrussTable} />
      {isBuildingTypesOpen && <BuildingTypesEditor onClose={() => setIsBuildingTypesOpen(false)} />}
    </div>
  );
}
