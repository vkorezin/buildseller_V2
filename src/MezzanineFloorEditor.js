import React, { useEffect, useMemo, useState } from "react";
import {
  FLOOR_TYPES,
  STEEL_GRATING_PROFILES,
  DEFAULT_STEEL_GRATING_PROFILE_ID,
  KNAUF_FILL_DENSITY_PRESETS,
  DEFAULT_KNAUF_FILL_DENSITY,
  LIVE_LOAD_PRESETS,
  SAFETY_FACTOR_PRESETS,
  RESPONSIBILITY_FACTORS,
  DEFAULT_FLOOR_STRUCTURE,
  getSteelGratingProfile,
  normalizeKnaufFillDensity,
  calculateDeadLoadForType,
  calculateStructuralDeadLoadForType,
  calculateFloorFinishLoad,
  calculateMezzanineQBase,
  getLayersForTypeAndThickness,
  validateFloorThickness,
} from "./floorStructureConstants";

const CUSTOM_TYPE = "custom_floor";
const SEPARATE_FINISH_TYPES = ["monolithic_deck", "precast_hollow_core", "monolithic_slab"];

const CHEQUER_LENTIL = [
  [2.5, 20.1], [3, 24.2], [4, 32.2], [5, 40.5], [6, 48.5], [8, 64.9], [10, 80.9], [12, 96.8],
];
const CHEQUER_DIAMOND = [
  [2.5, 21.0], [3, 25.1], [4, 33.5], [5, 41.8], [6, 50.1], [8, 66.6], [10, 83.0], [12, 99.3],
];
const PVL = [
  ["406", 15.7], ["506", 16.4], ["508", 20.9], ["510", 24.7], ["606", 17.3], ["608", 21.9], ["610", 26.0],
];

const STRUCTURAL_PRESETS = [
  { id: "struct_h75", name: "Профлист Н75-750-0.8", mode: "fixed", thickness: 75, weight: 11.2 },
  { id: "struct_profile_other", name: "Профлист — другой", mode: "manual", weight: 0 },
  { id: "struct_concrete", name: "Тяжёлый бетон", mode: "density", thickness: 80, density: 2450 },
  { id: "struct_rebar", name: "Арматура / сетка", mode: "manual", weight: 8 },
  {
    id: "sp_grating",
    name: "Сварной решётчатый настил SP 34×38",
    mode: "profile",
    profiles: STEEL_GRATING_PROFILES.map((p) => ({
      id: p.id,
      label: `${p.name} — ${p.gratingWeight} кг/м²`,
      thickness: p.height,
      weight: p.gratingWeight,
    })),
  },
  {
    id: "chequer_lentil",
    name: "Рифлёный лист — чечевица",
    mode: "profile",
    profiles: CHEQUER_LENTIL.map(([t, w]) => ({
      id: String(t), label: `${t} мм — ${w} кг/м²`, thickness: t, weight: w,
    })),
  },
  {
    id: "chequer_diamond",
    name: "Рифлёный лист — ромб",
    mode: "profile",
    profiles: CHEQUER_DIAMOND.map(([t, w]) => ({
      id: String(t), label: `${t} мм — ${w} кг/м²`, thickness: t, weight: w,
    })),
  },
  {
    id: "pvl",
    name: "Просечно-вытяжной лист ПВЛ",
    mode: "profile",
    profiles: PVL.map(([p, w]) => ({
      id: String(p), label: `ПВЛ ${p} — ${w} кг/м²`, thickness: Number(String(p)[0]), weight: w,
    })),
  },
  { id: "struct_custom", name: "Другая несущая конструкция", mode: "manual", weight: 0, customName: true },
];

const FINISH_PRESETS = [
  { id: "finish_topping", name: "Топпинг / обеспыливающее покрытие", mode: "manual", weight: 15 },
  { id: "finish_screed", name: "Цементно-песчаная стяжка", mode: "density", thickness: 40, density: 2000 },
  { id: "finish_concrete_screed", name: "Бетонная стяжка", mode: "density", thickness: 50, density: 2200 },
  { id: "finish_self_level", name: "Самонивелирующийся пол", mode: "density", thickness: 10, density: 1800 },
  { id: "finish_polymer", name: "Эпоксидное / полимерное покрытие", mode: "manual", weight: 3 },
  { id: "finish_ceramic", name: "Керамическая плитка", mode: "density", thickness: 10, density: 2000 },
  { id: "finish_porcelain", name: "Керамогранит", mode: "density", thickness: 10, density: 2300 },
  { id: "finish_stone", name: "Натуральный камень", mode: "density", thickness: 20, density: 2700 },
  { id: "finish_osb", name: "OSB-3", mode: "density", thickness: 22, density: 650 },
  { id: "finish_plywood", name: "Фанера", mode: "density", thickness: 18, density: 650 },
  { id: "finish_csp", name: "ЦСП", mode: "density", thickness: 16, density: 1300 },
  { id: "finish_gvl", name: "ГВЛ / KNAUF Суперпол", mode: "manual", thickness: 20, weight: 24 },
  { id: "finish_knauf_fill", name: "Сухая засыпка KNAUF", mode: "density", thickness: 50, density: 600 },
  { id: "finish_mineral_wool", name: "Минеральная вата", mode: "density", thickness: 50, density: 100 },
  { id: "finish_xps", name: "XPS", mode: "density", thickness: 50, density: 35 },
  { id: "finish_pir", name: "PIR", mode: "density", thickness: 50, density: 35 },
  { id: "finish_expanded_clay", name: "Керамзитовая засыпка", mode: "density", thickness: 50, density: 450 },
  { id: "finish_waterproof", name: "Гидроизоляция", mode: "manual", weight: 5 },
  { id: "finish_acoustic", name: "Звукоизоляционная мембрана", mode: "manual", weight: 5 },
  { id: "finish_custom", name: "Другое покрытие / слой пола", mode: "manual", weight: 0, customName: true },
];

const LEGACY_PRESET_MAP = {
  concrete: "struct_concrete",
  h75: "struct_h75",
  rebar: "struct_rebar",
  custom: "struct_custom",
  screed: "finish_screed",
  osb: "finish_osb",
  plywood: "finish_plywood",
  csp: "finish_csp",
  gvl: "finish_gvl",
  knauf_fill: "finish_knauf_fill",
  tile: "finish_porcelain",
};

const clone = (v) => JSON.parse(JSON.stringify(v));
const finite = (v, fallback = 0) =>
  v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : fallback;

const field = {
  width: "100%",
  padding: "7px 8px",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  backgroundColor: "#fff",
};
const smallBtn = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  borderRadius: 6,
  padding: "6px 9px",
  cursor: "pointer",
};
const miniLabel = { display: "block", fontSize: ".73em", color: "#64748b", marginBottom: 3 };
const errorText = { color: "#dc2626", fontSize: ".72em", marginTop: 4, lineHeight: 1.25 };

const isFiniteValue = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));
const nonNegativeValue = (v, fallback = 0) => isFiniteValue(v) && Number(v) >= 0 ? Number(v) : fallback;
const positiveValue = (v) => isFiniteValue(v) && Number(v) > 0;

function getPreset(group, presetId) {
  const list = group === "finish" ? FINISH_PRESETS : STRUCTURAL_PRESETS;
  return list.find((p) => p.id === presetId) || null;
}

function makeCustomLayer(group, presetId) {
  const list = group === "finish" ? FINISH_PRESETS : STRUCTURAL_PRESETS;
  const p = list.find((x) => x.id === presetId) || list[0];
  const profile = p.profiles?.[0];
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    presetId: p.id,
    name: p.name,
    group,
    mode: p.mode,
    enabled: true,
    thickness: profile?.thickness ?? p.thickness ?? 0,
    density: p.density ?? 0,
    weight: profile?.weight ?? p.weight ?? 0,
    profileId: profile?.id ?? null,
  };
}

function normalizeLayer(layer) {
  const group = layer?.group === "finish" ? "finish" : "structural";
  let presetId = LEGACY_PRESET_MAP[layer?.presetId] || layer?.presetId;
  if (layer?.presetId === "custom") presetId = group === "finish" ? "finish_custom" : "struct_custom";
  let preset = getPreset(group, presetId);
  if (!preset) {
    presetId = group === "finish" ? "finish_custom" : "struct_custom";
    preset = getPreset(group, presetId);
  }
  const profile = preset.profiles?.find((p) => String(p.id) === String(layer?.profileId)) || preset.profiles?.[0];
  return {
    ...layer,
    id: layer?.id || `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    group,
    presetId,
    name: layer?.name || preset.name,
    mode: preset.mode,
    enabled: layer?.enabled !== false,
    thickness: layer?.thickness ?? profile?.thickness ?? preset.thickness ?? 0,
    density: layer?.density ?? preset.density ?? 0,
    weight: layer?.weight ?? profile?.weight ?? preset.weight ?? 0,
    profileId: layer?.profileId ?? profile?.id ?? null,
  };
}

function layerWeight(layer) {
  if (!layer || layer.enabled === false) return 0;
  const preset = getPreset(layer.group, layer.presetId);
  if (layer.mode === "density") {
    return Math.max(0, finite(layer.thickness)) / 1000 * Math.max(0, finite(layer.density));
  }
  if (layer.mode === "profile") {
    const p = preset?.profiles?.find((x) => String(x.id) === String(layer.profileId)) || preset?.profiles?.[0];
    return p ? p.weight : Math.max(0, finite(layer.weight));
  }
  return Math.max(0, finite(layer.weight));
}

function normalizeCustomLayers(layers, legacyDeadLoad = 0) {
  if (Array.isArray(layers) && layers.length) return layers.map(normalizeLayer);
  return [{
    ...makeCustomLayer("structural", "struct_custom"),
    name: "Существующая постоянная нагрузка",
    weight: Math.max(0, finite(legacyDeadLoad)),
  }];
}

export function validateMezzanineFloorStructure(structure = {}) {
  const errors = [];
  const typeId = structure.type || DEFAULT_FLOOR_STRUCTURE.type;
  const ti = FLOOR_TYPES.find((x) => x.id === typeId);

  if (typeId === CUSTOM_TYPE) {
    if (!positiveValue(structure.thickness) || Number(structure.thickness) > 500) {
      errors.push("Общая толщина своего пола должна быть больше 0 и не более 500 мм.");
    }
    const layers = normalizeCustomLayers(structure.customLayers, structure.deadLoad);
    const activeStructural = layers.filter((x) => x.enabled !== false && x.group === "structural");
    if (activeStructural.length === 0 || activeStructural.reduce((sum, x) => sum + layerWeight(x), 0) <= 0) {
      errors.push("Добавьте хотя бы один несущий слой с массой больше 0 кг/м².");
    }
    layers.forEach((layer) => {
      if (layer.enabled === false) return;
      const preset = getPreset(layer.group, layer.presetId);
      if (preset?.mode === "density") {
        if (!positiveValue(layer.thickness)) errors.push(`Слой «${layer.name || preset.name}»: толщина должна быть больше 0.`);
        if (!positiveValue(layer.density)) errors.push(`Слой «${layer.name || preset.name}»: плотность должна быть больше 0.`);
      } else if (preset?.mode === "manual") {
        if (!isFiniteValue(layer.weight) || Number(layer.weight) < 0) errors.push(`Слой «${layer.name || preset.name}»: масса должна быть 0 или больше.`);
      }
    });
  } else if (ti) {
    if (typeId !== "steel_grating") {
      const check = validateFloorThickness(ti, structure.thickness ?? ti.defaultThickness);
      if (!check.isValid) errors.push(check.error);
    }
    if (SEPARATE_FINISH_TYPES.includes(typeId)) {
      const fl = Array.isArray(structure.floorFinishLayers) ? structure.floorFinishLayers : [];
      fl.forEach((layer) => {
        if (!isFiniteValue(layer?.load) || Number(layer.load) < 0) {
          errors.push(`Слой пола «${layer?.name || "без названия"}»: нагрузка должна быть 0 или больше.`);
        }
      });
    }
  }

  if (!isFiniteValue(structure.liveLoad) || Number(structure.liveLoad) < 0) {
    errors.push("Полезная нагрузка должна быть числом 0 или больше.");
  }
  if (!isFiniteValue(structure.partitionsLoad) || Number(structure.partitionsLoad) < 0) {
    errors.push("Нагрузка от перегородок должна быть числом 0 или больше.");
  }
  if (!positiveValue(structure.safetyFactor)) errors.push("Коэффициент γf должен быть больше 0.");
  if (!positiveValue(structure.responsibilityFactor)) errors.push("Коэффициент γn должен быть больше 0.");

  return { isValid: errors.length === 0, errors };
}

export function createDefaultMezzanineFloorStructure() {
  return clone(DEFAULT_FLOOR_STRUCTURE);
}

export function normalizeMezzanineFloor(mezzanine = {}, blockFloorStructure = null) {
  let floorStructure;
  if (mezzanine.floorStructure?.type) {
    floorStructure = clone(mezzanine.floorStructure);
  } else if (blockFloorStructure?.type) {
    floorStructure = clone(blockFloorStructure);
    if (mezzanine.loadLive !== undefined) floorStructure.liveLoad = finite(mezzanine.loadLive, floorStructure.liveLoad ?? 400);
    if (mezzanine.loadPartitions !== undefined) floorStructure.partitionsLoad = finite(mezzanine.loadPartitions, floorStructure.partitionsLoad ?? 50);
    if (mezzanine.safetyFactor !== undefined) floorStructure.safetyFactor = finite(mezzanine.safetyFactor, floorStructure.safetyFactor ?? 1.2);
    if (mezzanine.responsibilityFactor !== undefined) floorStructure.responsibilityFactor = finite(mezzanine.responsibilityFactor, floorStructure.responsibilityFactor ?? 1.0);
  } else {
    const dead = finite(mezzanine.loadDead, 0);
    floorStructure = {
      type: CUSTOM_TYPE,
      typeName: "Свой пол",
      shortName: "Свой пол",
      thickness: finite(mezzanine.thickness, 120),
      customLayers: normalizeCustomLayers(null, dead),
      structuralDeadLoad: dead,
      floorFinishLayers: [],
      floorFinishLoad: 0,
      deadLoad: dead,
      partitionsLoad: finite(mezzanine.loadPartitions, 50),
      liveLoad: finite(mezzanine.loadLive, 200),
      safetyFactor: finite(mezzanine.safetyFactor, 1.2),
      responsibilityFactor: finite(mezzanine.responsibilityFactor, 1.0),
    };
  }
  if (floorStructure.type === CUSTOM_TYPE) {
    floorStructure.customLayers = normalizeCustomLayers(floorStructure.customLayers, floorStructure.deadLoad);
  }
  return {
    ...mezzanine,
    floorStructure,
    thickness: floorStructure.thickness ?? mezzanine.thickness ?? 120,
    loadDead: floorStructure.deadLoad ?? mezzanine.loadDead ?? 0,
    loadLive: floorStructure.liveLoad ?? mezzanine.loadLive ?? 0,
    loadPartitions: floorStructure.partitionsLoad ?? mezzanine.loadPartitions ?? 0,
    safetyFactor: floorStructure.safetyFactor ?? mezzanine.safetyFactor ?? 1.2,
    responsibilityFactor: floorStructure.responsibilityFactor ?? mezzanine.responsibilityFactor ?? 1.0,
  };
}

export default function MezzanineFloorEditor({ mezzanine, onPatch }) {
  const fs = mezzanine?.floorStructure || createDefaultMezzanineFloorStructure();
  const type = fs.type || "monolithic_deck";
  const typeInfo = FLOOR_TYPES.find((x) => x.id === type);
  const isCustom = type === CUSTOM_TYPE;
  const isSeparateFinish = SEPARATE_FINISH_TYPES.includes(type);

  const finishLayers = Array.isArray(fs.floorFinishLayers) && fs.floorFinishLayers.length
    ? fs.floorFinishLayers
    : (typeInfo?.defaultFloorFinishLayers ? clone(typeInfo.defaultFloorFinishLayers) : []);
  const finishLoad = isSeparateFinish
    ? finishLayers.reduce((sum, layer) => sum + nonNegativeValue(layer?.load, 0), 0)
    : 0;
  const density = normalizeKnaufFillDensity(fs.knaufFillDensity ?? DEFAULT_KNAUF_FILL_DENSITY);
  const grating = getSteelGratingProfile(fs.gratingProfileId || DEFAULT_STEEL_GRATING_PROFILE_ID);

  const initialThicknessDraft = type === "steel_grating"
    ? grating.height
    : (fs.thickness ?? typeInfo?.defaultThickness ?? 120);
  const [thicknessDraft, setThicknessDraft] = useState(initialThicknessDraft);
  useEffect(() => {
    setThicknessDraft(type === "steel_grating" ? grating.height : (fs.thickness ?? typeInfo?.defaultThickness ?? 120));
  }, [mezzanine?.id, type, fs.thickness, grating.height, typeInfo?.defaultThickness]);

  const thicknessValidation = isCustom
    ? {
        isValid: positiveValue(thicknessDraft) && Number(thicknessDraft) <= 500,
        error: "Общая толщина своего пола должна быть больше 0 и не более 500 мм.",
      }
    : typeInfo && type !== "steel_grating"
      ? validateFloorThickness(typeInfo, thicknessDraft)
      : { isValid: true, error: null };

  const thickness = type === "steel_grating"
    ? grating.height
    : thicknessValidation.isValid
      ? Number(thicknessDraft)
      : finite(fs.lastValidThickness, finite(fs.thickness, typeInfo?.defaultThickness || 120));

  const customCalc = useMemo(() => {
    const layers = normalizeCustomLayers(fs.customLayers, fs.deadLoad);
    const structuralLayers = layers.filter((x) => x.group === "structural");
    const finishCustomLayers = layers.filter((x) => x.group === "finish");
    const structural = structuralLayers.reduce((s, x) => s + layerWeight(x), 0);
    const finish = finishCustomLayers.reduce((s, x) => s + layerWeight(x), 0);
    return { layers, structuralLayers, finishCustomLayers, structural, finish, total: structural + finish };
  }, [fs.customLayers, fs.deadLoad]);

  const structuralDeadLoad = isCustom
    ? customCalc.structural
    : isSeparateFinish
      ? calculateStructuralDeadLoadForType(type, thickness, { knaufFillDensity: density, gratingProfileId: grating.id })
      : calculateDeadLoadForType(type, thickness, undefined, { knaufFillDensity: density, gratingProfileId: grating.id });
  const deadLoad = isCustom
    ? customCalc.total
    : calculateDeadLoadForType(type, thickness, isSeparateFinish ? finishLoad : undefined, { knaufFillDensity: density, gratingProfileId: grating.id });
  const floorFinishLoad = isCustom ? customCalc.finish : finishLoad;
  const liveLoad = nonNegativeValue(fs.liveLoad, 0);
  const partitionsLoad = nonNegativeValue(fs.partitionsLoad, 0);
  const safetyFactor = finite(fs.safetyFactor, 1.2);
  const responsibilityFactor = finite(fs.responsibilityFactor, 1.0);
  const qDesign = calculateMezzanineQBase({ deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor });
  const qNorm = deadLoad + partitionsLoad + liveLoad;
  const validation = validateMezzanineFloorStructure({ ...fs, thickness: thicknessDraft });

  const dynamicLayers = !isCustom && typeInfo
    ? getLayersForTypeAndThickness(typeInfo, thickness, { knaufFillDensity: density, gratingProfileId: grating.id })
    : [];

  const commit = (changes) => {
    const next = { ...fs, ...changes };
    const nextType = next.type || type;
    let nextDead = deadLoad;
    let nextStructural = structuralDeadLoad;
    let nextFinish = floorFinishLoad;
    let nextThickness = next.thickness ?? thickness;

    if (nextType === CUSTOM_TYPE) {
      const layers = normalizeCustomLayers(next.customLayers, next.deadLoad);
      next.customLayers = layers;
      nextStructural = layers
        .filter((x) => x.enabled !== false && x.group === "structural")
        .reduce((s, x) => s + layerWeight(x), 0);
      nextFinish = layers
        .filter((x) => x.enabled !== false && x.group === "finish")
        .reduce((s, x) => s + layerWeight(x), 0);
      nextDead = nextStructural + nextFinish;
    } else {
      const ti = FLOOR_TYPES.find((x) => x.id === nextType) || FLOOR_TYPES[0];
      const nextDensity = normalizeKnaufFillDensity(next.knaufFillDensity);
      const nextGrating = getSteelGratingProfile(next.gratingProfileId);
      nextThickness = nextType === "steel_grating"
        ? nextGrating.height
        : (ti.isConstantThickness ? ti.defaultThickness : finite(next.thickness, ti.defaultThickness));
      const sep = SEPARATE_FINISH_TYPES.includes(nextType);
      const fl = sep
        ? (Array.isArray(next.floorFinishLayers) && next.floorFinishLayers.length
            ? next.floorFinishLayers
            : clone(ti.defaultFloorFinishLayers || []))
        : [];
      nextFinish = sep ? fl.reduce((sum, layer) => sum + nonNegativeValue(layer?.load, 0), 0) : 0;
      nextStructural = sep
        ? calculateStructuralDeadLoadForType(nextType, nextThickness, { knaufFillDensity: nextDensity, gratingProfileId: nextGrating.id })
        : calculateDeadLoadForType(nextType, nextThickness, undefined, { knaufFillDensity: nextDensity, gratingProfileId: nextGrating.id });
      nextDead = calculateDeadLoadForType(nextType, nextThickness, sep ? nextFinish : undefined, { knaufFillDensity: nextDensity, gratingProfileId: nextGrating.id });
      next.floorFinishLayers = fl;
      next.knaufFillDensity = nextDensity;
      next.gratingProfileId = nextGrating.id;
      next.gratingProfileName = nextGrating.name;
      next.gratingWeight = nextGrating.gratingWeight;
    }

    const ti = FLOOR_TYPES.find((x) => x.id === nextType);
    next.typeName = nextType === CUSTOM_TYPE ? (next.customName || "Свой пол") : ti?.name;
    next.shortName = nextType === CUSTOM_TYPE ? "Свой пол" : ti?.shortName;
    next.thickness = finite(nextThickness, 0);
    next.structuralDeadLoad = Math.round(nextStructural * 1000) / 1000;
    next.floorFinishLoad = Math.round(nextFinish * 1000) / 1000;
    next.deadLoad = Math.round(nextDead * 1000) / 1000;
    const q = calculateMezzanineQBase({
      deadLoad: next.deadLoad,
      partitionsLoad: nonNegativeValue(next.partitionsLoad, partitionsLoad),
      liveLoad: nonNegativeValue(next.liveLoad, liveLoad),
      safetyFactor: finite(next.safetyFactor, safetyFactor),
      responsibilityFactor: finite(next.responsibilityFactor, responsibilityFactor),
    });
    next.designLoadKg = q;
    next.normLoadKg = next.deadLoad + nonNegativeValue(next.partitionsLoad, partitionsLoad) + nonNegativeValue(next.liveLoad, liveLoad);
    next.lastValidThickness = next.thickness;

    onPatch({
      floorStructure: next,
      thickness: next.thickness,
      loadDead: next.deadLoad,
      loadLive: nonNegativeValue(next.liveLoad, liveLoad),
      loadPartitions: nonNegativeValue(next.partitionsLoad, partitionsLoad),
      safetyFactor: finite(next.safetyFactor, safetyFactor),
      responsibilityFactor: finite(next.responsibilityFactor, responsibilityFactor),
      designLoadKg: q,
    });
  };

  const handleThicknessChange = (raw) => {
    setThicknessDraft(raw);
    if (type === "steel_grating") return;
    const check = isCustom
      ? { isValid: positiveValue(raw) && Number(raw) <= 500 }
      : validateFloorThickness(typeInfo, raw);
    if (check.isValid) {
      commit({ thickness: Number(raw), lastValidThickness: Number(raw) });
    }
  };

  const switchType = (newType) => {
    if (newType === CUSTOM_TYPE) {
      const existing = Array.isArray(fs.customLayers) && fs.customLayers.length
        ? normalizeCustomLayers(fs.customLayers, deadLoad)
        : [{
            ...makeCustomLayer("structural", "struct_custom"),
            name: "Исходная конструкция",
            weight: deadLoad,
          }];
      commit({ type: CUSTOM_TYPE, thickness: fs.thickness || 120, customLayers: existing });
      return;
    }
    const ti = FLOOR_TYPES.find((x) => x.id === newType) || FLOOR_TYPES[0];
    commit({
      type: newType,
      thickness: ti.defaultThickness,
      floorFinishLayers: clone(ti.defaultFloorFinishLayers || []),
      knaufFillDensity: DEFAULT_KNAUF_FILL_DENSITY,
      gratingProfileId: DEFAULT_STEEL_GRATING_PROFILE_ID,
    });
  };

  const updateLayer = (layerId, patch) => {
    const layers = customCalc.layers.map((l) => l.id === layerId ? normalizeLayer({ ...l, ...patch }) : l);
    commit({ customLayers: layers });
  };

  const changeLayerPreset = (layerId, group, presetId) => {
    const replacement = makeCustomLayer(group, presetId);
    replacement.id = layerId;
    const layers = customCalc.layers.map((l) => l.id === layerId ? replacement : l);
    commit({ customLayers: layers });
  };

  const addLayer = (group, presetId) => {
    if (!presetId) return;
    commit({ customLayers: [...customCalc.layers, makeCustomLayer(group, presetId)] });
  };

  const removeLayer = (layerId) => {
    commit({ customLayers: customCalc.layers.filter((l) => l.id !== layerId) });
  };

  const renderLayer = (layer, group) => {
    const list = group === "finish" ? FINISH_PRESETS : STRUCTURAL_PRESETS;
    const preset = getPreset(group, layer.presetId) || list[list.length - 1];
    const profile = preset.profiles?.find((p) => String(p.id) === String(layer.profileId)) || preset.profiles?.[0];
    const customName = preset.customName;
    return (
      <div key={layer.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 9, marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 32px", gap: 7, alignItems: "start" }}>
          <select style={field} value={layer.presetId} onChange={(e) => changeLayerPreset(layer.id, group, e.target.value)}>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" style={smallBtn} onClick={() => removeLayer(layer.id)} title="Удалить слой">×</button>
        </div>

        {customName && (
          <input
            style={{ ...field, marginTop: 7 }}
            value={layer.name || ""}
            placeholder={group === "finish" ? "Название слоя пола" : "Название несущего элемента"}
            onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 7 }}>
          {preset.mode === "profile" ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={miniLabel}>Типоразмер</span>
              <select
                style={field}
                value={profile?.id || ""}
                onChange={(e) => {
                  const p = preset.profiles.find((x) => String(x.id) === String(e.target.value));
                  updateLayer(layer.id, { profileId: p.id, thickness: p.thickness, weight: p.weight });
                }}
              >
                {preset.profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          ) : preset.mode === "density" ? (
            <>
              <div>
                <span style={miniLabel}>Толщина, мм</span>
                <input style={{ ...field, borderColor: positiveValue(layer.thickness) ? "#cbd5e1" : "#ef4444", background: positiveValue(layer.thickness) ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.thickness ?? 0} onChange={(e) => updateLayer(layer.id, { thickness: e.target.value })} />
              </div>
              <div>
                <span style={miniLabel}>Плотность, кг/м³</span>
                <input style={{ ...field, borderColor: positiveValue(layer.density) ? "#cbd5e1" : "#ef4444", background: positiveValue(layer.density) ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.density ?? 0} onChange={(e) => updateLayer(layer.id, { density: e.target.value })} />
              </div>
            </>
          ) : preset.mode === "fixed" ? (
            <div style={{ gridColumn: "1 / -1", fontSize: ".78em", color: "#475569", padding: "5px 0" }}>
              Фиксированная масса по выбранному материалу: <strong>{finite(preset.weight).toFixed(1)} кг/м²</strong>
            </div>
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={miniLabel}>Масса, кг/м²</span>
              <input style={{ ...field, borderColor: isFiniteValue(layer.weight) && Number(layer.weight) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(layer.weight) && Number(layer.weight) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.weight ?? 0} onChange={(e) => updateLayer(layer.id, { weight: e.target.value })} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, fontSize: ".78em" }}>
          <label style={{ color: "#475569" }}>
            <input type="checkbox" checked={layer.enabled !== false} onChange={(e) => updateLayer(layer.id, { enabled: e.target.checked })} /> В расчёте
          </label>
          <strong>{layerWeight(layer).toFixed(1)} кг/м²</strong>
        </div>
      </div>
    );
  };

  const renderCustomGroup = (group, title, subtitle, layers, total) => {
    const list = group === "finish" ? FINISH_PRESETS : STRUCTURAL_PRESETS;
    const isFinish = group === "finish";
    return (
      <div style={{ border: `1px solid ${isFinish ? "#fed7aa" : "#bfdbfe"}`, background: isFinish ? "#fffaf3" : "#f8fbff", borderRadius: 10, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: ".9em" }}>{title}</div>
            <div style={{ fontSize: ".73em", color: "#64748b", marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{ whiteSpace: "nowrap", fontSize: ".8em", fontWeight: 700, color: isFinish ? "#9a3412" : "#1d4ed8" }}>
            {total.toFixed(1)} кг/м²
          </div>
        </div>

        {layers.length === 0 && (
          <div style={{ fontSize: ".76em", color: "#94a3b8", padding: "8px 0" }}>Слои пока не добавлены.</div>
        )}
        {layers.map((layer) => renderLayer(layer, group))}

        <select
          style={{ ...field, borderStyle: "dashed", cursor: "pointer" }}
          value=""
          onChange={(e) => {
            addLayer(group, e.target.value);
            e.target.value = "";
          }}
        >
          <option value="">＋ Добавить {isFinish ? "слой пола" : "несущий материал"}…</option>
          {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    );
  };

  const typeCards = [
    ...FLOOR_TYPES,
    {
      id: CUSTOM_TYPE,
      shortName: "Свой пол",
      name: "Пользовательская конструкция из отдельных несущих материалов и слоёв пола",
      standard: "Послойная сборка",
      deadLoad: null,
      fireRating: "Индивидуально",
    },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: "1.08em", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 7 }}>
        3. Перекрытие и нагрузки
      </h3>

      <div style={{ fontSize: ".85em", fontWeight: 700, color: "#1e293b", marginBottom: 7 }}>Тип несущего перекрытия</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(205px, 1fr))", gap: 8 }}>
        {typeCards.map((card) => {
          const selected = card.id === type;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => switchType(card.id)}
              style={{
                textAlign: "left",
                border: selected ? "2px solid #0969da" : "1px solid #cbd5e1",
                borderRadius: 9,
                background: selected ? "#f0f7ff" : "#fff",
                padding: 10,
                cursor: "pointer",
                minHeight: 82,
              }}
            >
              <div style={{ fontWeight: 700, color: selected ? "#0969da" : "#1e293b", fontSize: ".82em" }}>{card.shortName}</div>
              <div style={{ color: "#64748b", fontSize: ".69em", lineHeight: 1.3, marginTop: 4 }}>{card.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 7, marginTop: 7, fontSize: ".68em", color: "#475569" }}>
                <span>{card.deadLoad != null ? `≈ ${card.deadLoad} кг/м²` : "Собственный состав"}</span>
                <span>{card.fireRating}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!isCustom && typeInfo && (
        <div style={{ marginTop: 12, border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: ".88em" }}>{typeInfo.name}</div>
              <div style={{ color: "#64748b", fontSize: ".72em", marginTop: 2 }}>{typeInfo.standard}</div>
            </div>
            <div style={{ fontSize: ".74em", color: "#0369a1", background: "#e0f2fe", padding: "4px 8px", borderRadius: 5 }}>
              Шаг балок: {typeInfo.beamSpacing}
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {type === "steel_grating" ? (
              <div>
                <span style={miniLabel}>Профиль настила</span>
                <select style={field} value={grating.id} onChange={(e) => commit({ gratingProfileId: e.target.value })}>
                  {STEEL_GRATING_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.gratingWeight} кг/м²</option>)}
                </select>
              </div>
            ) : !typeInfo.isConstantThickness ? (
              <div>
                <span style={miniLabel}>Толщина конструкции, мм</span>
                <input
                  style={{ ...field, borderColor: thicknessValidation.isValid ? "#cbd5e1" : "#ef4444", background: thicknessValidation.isValid ? "#fff" : "#fef2f2" }}
                  type="number"
                  min={typeInfo.thicknessRange?.[0]}
                  max={typeInfo.thicknessRange?.[1]}
                  value={thicknessDraft}
                  onChange={(e) => handleThicknessChange(e.target.value)}
                />
                {!thicknessValidation.isValid && <div style={errorText}>⚠️ {thicknessValidation.error}</div>}
              </div>
            ) : (
              <div style={{ paddingTop: 16, fontSize: ".78em", color: "#475569" }}>Толщина: <strong>{typeInfo.defaultThickness} мм</strong></div>
            )}

            {type === "knauf_dry_floor" && (
              <div>
                <span style={miniLabel}>Плотность засыпки, кг/м³</span>
                <select style={field} value={density} onChange={(e) => commit({ knaufFillDensity: Number(e.target.value) })}>
                  {KNAUF_FILL_DENSITY_PRESETS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, border: "1px solid #bfdbfe", borderRadius: 8, background: "#fff", padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: ".8em", color: "#1e3a8a", marginBottom: 6 }}>
              Несущая конструкция {isSeparateFinish ? `— ${structuralDeadLoad.toFixed(1)} кг/м²` : ""}
            </div>
            {dynamicLayers.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", borderTop: i ? "1px solid #f1f5f9" : "none", fontSize: ".75em" }}>
                <span style={{ color: "#475569" }}>{l.name}</span>
                <strong style={{ whiteSpace: "nowrap" }}>{Number(l.weight || 0).toFixed(1)} кг/м²</strong>
              </div>
            ))}
          </div>

          {isSeparateFinish && (
            <div style={{ marginTop: 9, border: "1px solid #fed7aa", borderRadius: 8, background: "#fffaf3", padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: ".8em", color: "#9a3412", marginBottom: 6 }}>
                <span>Состав пола</span><span>{floorFinishLoad.toFixed(1)} кг/м²</span>
              </div>
              {finishLayers.map((layer, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 95px 30px", gap: 6, marginBottom: 6 }}>
                  <input style={field} value={layer.name || ""} onChange={(e) => { const a = clone(finishLayers); a[idx].name = e.target.value; commit({ floorFinishLayers: a }); }} />
                  <input style={{ ...field, borderColor: isFiniteValue(layer.load) && Number(layer.load) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(layer.load) && Number(layer.load) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.load ?? 0} onChange={(e) => { const a = clone(finishLayers); a[idx].load = e.target.value; commit({ floorFinishLayers: a }); }} />
                  <button type="button" style={smallBtn} onClick={() => commit({ floorFinishLayers: finishLayers.filter((_, i) => i !== idx) })}>×</button>
                </div>
              ))}
              <button type="button" style={smallBtn} onClick={() => commit({ floorFinishLayers: [...finishLayers, { name: "Новый слой пола", load: 0 }] })}>＋ слой пола</button>
            </div>
          )}
        </div>
      )}

      {isCustom && (
        <div style={{ marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 10, background: "#f8fafc", padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 8, marginBottom: 10 }}>
            <div>
              <span style={miniLabel}>Название своей конструкции</span>
              <input style={field} value={fs.customName || "Свой пол"} onChange={(e) => commit({ customName: e.target.value })} />
            </div>
            <div>
              <span style={miniLabel}>Общая толщина, мм</span>
              <input
                style={{ ...field, borderColor: thicknessValidation.isValid ? "#cbd5e1" : "#ef4444", background: thicknessValidation.isValid ? "#fff" : "#fef2f2" }}
                type="number" min="1" max="500" value={thicknessDraft}
                onChange={(e) => handleThicknessChange(e.target.value)}
              />
              {!thicknessValidation.isValid && <div style={errorText}>⚠️ {thicknessValidation.error}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
            {renderCustomGroup(
              "structural",
              "🏗️ Несущая конструкция",
              "Только материалы, которые формируют несущую часть перекрытия.",
              customCalc.structuralLayers,
              customCalc.structural
            )}
            {renderCustomGroup(
              "finish",
              "🧱 Состав пола",
              "Стяжки, покрытия, плиты, утеплители, засыпки и отделочные слои.",
              customCalc.finishCustomLayers,
              customCalc.finish
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
        <div style={{ fontSize: ".85em", fontWeight: 700, color: "#1e293b", marginBottom: 7 }}>Нагрузки</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
          <div>
            <span style={miniLabel}>Полезная (нормативная), кг/м²</span>
            <input style={{ ...field, borderColor: isFiniteValue(fs.liveLoad) && Number(fs.liveLoad) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(fs.liveLoad) && Number(fs.liveLoad) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={fs.liveLoad ?? 0} onChange={(e) => commit({ liveLoad: e.target.value })} />
          </div>
          <div>
            <span style={miniLabel}>Перегородки, кг/м²</span>
            <input style={{ ...field, borderColor: isFiniteValue(fs.partitionsLoad) && Number(fs.partitionsLoad) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(fs.partitionsLoad) && Number(fs.partitionsLoad) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={fs.partitionsLoad ?? 0} onChange={(e) => commit({ partitionsLoad: e.target.value })} />
          </div>
          <div>
            <span style={miniLabel}>Коэффициент γf</span>
            <select style={field} value={fs.safetyFactor ?? 1.2} onChange={(e) => commit({ safetyFactor: Number(e.target.value) })}>
              {SAFETY_FACTOR_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <span style={miniLabel}>Класс ответственности γn</span>
            <select style={field} value={fs.responsibilityFactor ?? 1.0} onChange={(e) => commit({ responsibilityFactor: Number(e.target.value) })}>
              {RESPONSIBILITY_FACTORS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 5 }}>
          {LIVE_LOAD_PRESETS.map((p) => {
            const active = Number(liveLoad) === Number(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => commit({ liveLoad: p.value, safetyFactor: p.factor || safetyFactor })}
                title={p.label}
                style={{
                  border: active ? "2px solid #0969da" : "1px solid #cbd5e1",
                  background: active ? "#f0f7ff" : "#fff",
                  borderRadius: 6,
                  padding: "6px 5px",
                  cursor: "pointer",
                  fontSize: ".71em",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#0969da" : "#475569",
                }}
              >
                {p.title}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 7 }}>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, padding: 8, fontSize: ".75em" }}>
          <div style={{ color: "#64748b" }}>Несущая часть</div><strong>{structuralDeadLoad.toFixed(1)} кг/м²</strong>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: 8, fontSize: ".75em" }}>
          <div style={{ color: "#64748b" }}>Состав пола</div><strong>{floorFinishLoad.toFixed(1)} кг/м²</strong>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 7, padding: 8, fontSize: ".75em" }}>
          <div style={{ color: "#64748b" }}>Постоянная G</div><strong>{deadLoad.toFixed(1)} кг/м²</strong>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 7, padding: 8, fontSize: ".75em" }}>
          <div style={{ color: "#64748b" }}>Нормативная</div><strong>{qNorm.toFixed(1)} кг/м²</strong>
        </div>
        <div style={{ background: "#e6f7ff", border: "1px solid #7dd3fc", borderRadius: 7, padding: 8, fontSize: ".75em" }}>
          <div style={{ color: "#0369a1" }}>Расчётная</div><strong style={{ color: "#075985" }}>{qDesign.toFixed(1)} кг/м²</strong>
        </div>
      </div>

      {!validation.isValid && (
        <div style={{ marginTop: 10, padding: 9, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", fontSize: ".75em" }}>
          <strong>⚠️ Исправьте параметры перед сохранением:</strong>
          <ul style={{ margin: "5px 0 0 18px", padding: 0 }}>
            {validation.errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 7, fontSize: ".69em", color: "#64748b" }}>
        q = (G × 1.1 + Pперег × 1.2 + Q × γf) × γn
      </div>
    </div>
  );
}
