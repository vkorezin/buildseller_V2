import React, { useMemo } from "react";
import {
  FLOOR_TYPES,
  STEEL_GRATING_PROFILES,
  DEFAULT_STEEL_GRATING_PROFILE_ID,
  KNAUF_FILL_DENSITY_PRESETS,
  DEFAULT_KNAUF_FILL_DENSITY,
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

export const CUSTOM_FLOOR_PRESETS = [
  { id: "concrete", name: "Тяжёлый бетон", mode: "density", thickness: 80, density: 2450, group: "structural" },
  { id: "screed", name: "Цементно-песчаная стяжка", mode: "density", thickness: 40, density: 2000, group: "finish" },
  { id: "h75", name: "Профлист Н75-750-0.8", mode: "fixed", thickness: 75, weight: 11.2, group: "structural" },
  { id: "rebar", name: "Арматура / сетка", mode: "manual", weight: 8, group: "structural" },
  { id: "chequer_lentil", name: "Лист рифлёный — чечевица (ГОСТ 8568-77)", mode: "profile", profiles: CHEQUER_LENTIL.map(([t,w]) => ({ id: String(t), label: `${t} мм — ${w} кг/м²`, thickness: t, weight: w })), group: "structural" },
  { id: "chequer_diamond", name: "Лист рифлёный — ромб (ГОСТ 8568-77)", mode: "profile", profiles: CHEQUER_DIAMOND.map(([t,w]) => ({ id: String(t), label: `${t} мм — ${w} кг/м²`, thickness: t, weight: w })), group: "structural" },
  { id: "pvl", name: "Лист просечно-вытяжной ПВЛ (ГОСТ 8706-78)", mode: "profile", profiles: PVL.map(([p,w]) => ({ id: String(p), label: `ПВЛ ${p} — ${w} кг/м²`, thickness: Number(String(p)[0]), weight: w })), group: "structural" },
  { id: "sp_grating", name: "Сварной решётчатый настил SP 34×38", mode: "profile", profiles: STEEL_GRATING_PROFILES.map((p) => ({ id: p.id, label: `${p.name} — ${p.gratingWeight} кг/м²`, thickness: p.height, weight: p.gratingWeight })), group: "structural" },
  { id: "osb", name: "OSB-3", mode: "density", thickness: 22, density: 650, group: "finish" },
  { id: "plywood", name: "Фанера", mode: "density", thickness: 18, density: 650, group: "finish" },
  { id: "csp", name: "ЦСП", mode: "density", thickness: 16, density: 1300, group: "finish" },
  { id: "gvl", name: "ГВЛ / элемент пола KNAUF", mode: "manual", thickness: 20, weight: 24, group: "finish" },
  { id: "knauf_fill", name: "Сухая засыпка KNAUF", mode: "density", thickness: 50, density: 600, group: "finish" },
  { id: "tile", name: "Керамогранит / плитка", mode: "density", thickness: 10, density: 2300, group: "finish" },
  { id: "custom", name: "Пользовательский слой", mode: "manual", weight: 0, group: "finish" },
];

const clone = (v) => JSON.parse(JSON.stringify(v));
const finite = (v, fallback = 0) => (v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : fallback);

export function createDefaultMezzanineFloorStructure() {
  return clone(DEFAULT_FLOOR_STRUCTURE);
}

export function makeCustomLayer(presetId = "custom") {
  const p = CUSTOM_FLOOR_PRESETS.find((x) => x.id === presetId) || CUSTOM_FLOOR_PRESETS[CUSTOM_FLOOR_PRESETS.length - 1];
  const profile = p.profiles?.[0];
  return {
    id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    presetId: p.id,
    name: p.name,
    group: p.group,
    mode: p.mode,
    enabled: true,
    thickness: profile?.thickness ?? p.thickness ?? 0,
    density: p.density ?? 0,
    weight: profile?.weight ?? p.weight ?? 0,
    profileId: profile?.id ?? null,
  };
}

function layerWeight(layer) {
  if (!layer || layer.enabled === false) return 0;
  if (layer.mode === "density") return Math.max(0, finite(layer.thickness)) / 1000 * Math.max(0, finite(layer.density));
  if (layer.mode === "profile") {
    const p = CUSTOM_FLOOR_PRESETS.find((x) => x.id === layer.presetId);
    const item = p?.profiles?.find((x) => String(x.id) === String(layer.profileId)) || p?.profiles?.[0];
    return item ? item.weight : Math.max(0, finite(layer.weight));
  }
  return Math.max(0, finite(layer.weight));
}

function normalizeCustomLayers(layers, legacyDeadLoad = 0) {
  if (Array.isArray(layers) && layers.length) return clone(layers);
  return [{
    ...makeCustomLayer("custom"),
    name: "Существующая постоянная нагрузка",
    group: "structural",
    weight: Math.max(0, finite(legacyDeadLoad)),
  }];
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

const field = { width: "100%", padding: "6px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 4 };
const smallBtn = { border: "1px solid #cbd5e1", background: "#fff", borderRadius: 4, padding: "5px 8px", cursor: "pointer" };

export default function MezzanineFloorEditor({ mezzanine, onPatch }) {
  const fs = mezzanine?.floorStructure || createDefaultMezzanineFloorStructure();
  const type = fs.type || "monolithic_deck";
  const typeInfo = FLOOR_TYPES.find((x) => x.id === type);
  const isCustom = type === CUSTOM_TYPE;
  const isSeparateFinish = SEPARATE_FINISH_TYPES.includes(type);

  const finishLayers = Array.isArray(fs.floorFinishLayers) && fs.floorFinishLayers.length
    ? fs.floorFinishLayers
    : (typeInfo?.defaultFloorFinishLayers ? clone(typeInfo.defaultFloorFinishLayers) : []);
  const finishLoad = isSeparateFinish ? calculateFloorFinishLoad(finishLayers) : 0;
  const density = normalizeKnaufFillDensity(fs.knaufFillDensity ?? DEFAULT_KNAUF_FILL_DENSITY);
  const grating = getSteelGratingProfile(fs.gratingProfileId || DEFAULT_STEEL_GRATING_PROFILE_ID);
  const thickness = type === "steel_grating" ? grating.height : finite(fs.thickness, typeInfo?.defaultThickness || 120);

  const customCalc = useMemo(() => {
    const layers = normalizeCustomLayers(fs.customLayers, fs.deadLoad);
    const enabled = layers.filter((x) => x.enabled !== false);
    const structural = enabled.filter((x) => x.group === "structural").reduce((s, x) => s + layerWeight(x), 0);
    const finish = enabled.filter((x) => x.group !== "structural").reduce((s, x) => s + layerWeight(x), 0);
    return { layers, structural, finish, total: structural + finish };
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

  const liveLoad = finite(fs.liveLoad, 0);
  const partitionsLoad = finite(fs.partitionsLoad, 0);
  const safetyFactor = finite(fs.safetyFactor, 1.2);
  const responsibilityFactor = finite(fs.responsibilityFactor, 1.0);
  const qDesign = calculateMezzanineQBase({ deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor });
  const qNorm = deadLoad + partitionsLoad + liveLoad;

  const commit = (changes) => {
    const next = { ...fs, ...changes };
    const nextType = next.type || type;
    let nextDead = deadLoad;
    let nextStructural = structuralDeadLoad;
    let nextFinish = floorFinishLoad;
    let nextThickness = next.thickness ?? thickness;
    if (nextType === CUSTOM_TYPE) {
      const layers = normalizeCustomLayers(next.customLayers, next.deadLoad);
      nextStructural = layers.filter((x) => x.enabled !== false && x.group === "structural").reduce((s, x) => s + layerWeight(x), 0);
      nextFinish = layers.filter((x) => x.enabled !== false && x.group !== "structural").reduce((s, x) => s + layerWeight(x), 0);
      nextDead = nextStructural + nextFinish;
    } else {
      const ti = FLOOR_TYPES.find((x) => x.id === nextType) || FLOOR_TYPES[0];
      const nextDensity = normalizeKnaufFillDensity(next.knaufFillDensity);
      const nextGrating = getSteelGratingProfile(next.gratingProfileId);
      nextThickness = nextType === "steel_grating" ? nextGrating.height : (ti.isConstantThickness ? ti.defaultThickness : finite(next.thickness, ti.defaultThickness));
      const sep = SEPARATE_FINISH_TYPES.includes(nextType);
      const fl = sep ? (Array.isArray(next.floorFinishLayers) && next.floorFinishLayers.length ? next.floorFinishLayers : clone(ti.defaultFloorFinishLayers || [])) : [];
      nextFinish = sep ? calculateFloorFinishLoad(fl) : 0;
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
    next.typeName = nextType === CUSTOM_TYPE ? "Свой пол" : ti?.name;
    next.shortName = nextType === CUSTOM_TYPE ? "Свой пол" : ti?.shortName;
    next.thickness = finite(nextThickness, 0);
    next.structuralDeadLoad = Math.round(nextStructural * 1000) / 1000;
    next.floorFinishLoad = Math.round(nextFinish * 1000) / 1000;
    next.deadLoad = Math.round(nextDead * 1000) / 1000;
    const q = calculateMezzanineQBase({
      deadLoad: next.deadLoad,
      partitionsLoad: finite(next.partitionsLoad, partitionsLoad),
      liveLoad: finite(next.liveLoad, liveLoad),
      safetyFactor: finite(next.safetyFactor, safetyFactor),
      responsibilityFactor: finite(next.responsibilityFactor, responsibilityFactor),
    });
    next.designLoadKg = q;
    next.normLoadKg = next.deadLoad + finite(next.partitionsLoad, partitionsLoad) + finite(next.liveLoad, liveLoad);
    onPatch({
      floorStructure: next,
      thickness: next.thickness,
      loadDead: next.deadLoad,
      loadLive: finite(next.liveLoad, liveLoad),
      loadPartitions: finite(next.partitionsLoad, partitionsLoad),
      safetyFactor: finite(next.safetyFactor, safetyFactor),
      responsibilityFactor: finite(next.responsibilityFactor, responsibilityFactor),
      designLoadKg: q,
    });
  };

  const switchType = (newType) => {
    if (newType === CUSTOM_TYPE) {
      commit({
        type: CUSTOM_TYPE,
        thickness: fs.thickness || 120,
        customLayers: normalizeCustomLayers(fs.customLayers, deadLoad),
      });
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

  const updateCustomLayer = (idx, patch) => {
    const layers = customCalc.layers.map((l, i) => i === idx ? { ...l, ...patch } : l);
    commit({ customLayers: layers });
  };

  const changePreset = (idx, presetId) => {
    const replacement = makeCustomLayer(presetId);
    replacement.id = customCalc.layers[idx].id;
    const layers = customCalc.layers.map((l, i) => i === idx ? replacement : l);
    commit({ customLayers: layers });
  };

  const dynamicLayers = !isCustom && typeInfo ? getLayersForTypeAndThickness(typeInfo, thickness, { knaufFillDensity: density, gratingProfileId: grating.id }) : [];

  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: "1.1em", color: "#333", borderBottom: "1px solid #ddd", paddingBottom: 5 }}>3. Перекрытие и нагрузки</h3>

      <label style={{ display: "block", fontWeight: 700, fontSize: ".85em", marginBottom: 4 }}>Конструкция перекрытия</label>
      <select style={field} value={type} onChange={(e) => switchType(e.target.value)}>
        {FLOOR_TYPES.map((t) => <option key={t.id} value={t.id}>{t.shortName}</option>)}
        <option value={CUSTOM_TYPE}>Свой пол / пользовательская конструкция</option>
      </select>

      {!isCustom && typeInfo && (
        <div style={{ marginTop: 10, padding: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
          {type === "steel_grating" ? (
            <div>
              <label style={{ fontSize: ".8em", fontWeight: 700 }}>Профиль настила</label>
              <select style={field} value={grating.id} onChange={(e) => commit({ gratingProfileId: e.target.value })}>
                {STEEL_GRATING_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.gratingWeight} кг/м²</option>)}
              </select>
            </div>
          ) : !typeInfo.isConstantThickness ? (
            <div>
              <label style={{ fontSize: ".8em", fontWeight: 700 }}>Толщина, мм</label>
              <input style={field} type="number" value={fs.thickness ?? typeInfo.defaultThickness} onChange={(e) => commit({ thickness: e.target.value })} />
            </div>
          ) : (
            <div style={{ fontSize: ".82em" }}>Толщина: <strong>{typeInfo.defaultThickness} мм</strong></div>
          )}
          {type === "knauf_dry_floor" && (
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: ".8em", fontWeight: 700 }}>Плотность засыпки, кг/м³</label>
              <select style={field} value={density} onChange={(e) => commit({ knaufFillDensity: Number(e.target.value) })}>
                {KNAUF_FILL_DENSITY_PRESETS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          {isSeparateFinish && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: ".8em", fontWeight: 700, marginBottom: 5 }}>Состав пола</div>
              {finishLayers.map((layer, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 100px 28px", gap: 6, marginBottom: 5 }}>
                  <input style={field} value={layer.name || ""} onChange={(e) => { const a = clone(finishLayers); a[idx].name = e.target.value; commit({ floorFinishLayers: a }); }} />
                  <input style={field} type="number" value={layer.load ?? 0} onChange={(e) => { const a = clone(finishLayers); a[idx].load = e.target.value; commit({ floorFinishLayers: a }); }} />
                  <button style={smallBtn} onClick={() => commit({ floorFinishLayers: finishLayers.filter((_, i) => i !== idx) })}>×</button>
                </div>
              ))}
              <button style={smallBtn} onClick={() => commit({ floorFinishLayers: [...finishLayers, { name: "Новый слой", load: 0 }] })}>+ слой пола</button>
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: ".78em", color: "#475569" }}>
            {dynamicLayers.map((l, i) => <div key={i}>{l.name}: <strong>{Number(l.weight || 0).toFixed(1)} кг/м²</strong></div>)}
          </div>
        </div>
      )}

      {isCustom && (
        <div style={{ marginTop: 10, padding: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 8, marginBottom: 10 }}>
            <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>Название конструкции</label><input style={field} value={fs.customName || "Свой пол"} onChange={(e) => commit({ customName: e.target.value })} /></div>
            <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>Общая толщина, мм</label><input style={field} type="number" value={fs.thickness ?? 120} onChange={(e) => commit({ thickness: e.target.value })} /></div>
          </div>
          {customCalc.layers.map((layer, idx) => {
            const preset = CUSTOM_FLOOR_PRESETS.find((x) => x.id === layer.presetId) || CUSTOM_FLOOR_PRESETS[CUSTOM_FLOOR_PRESETS.length - 1];
            const profile = preset.profiles?.find((x) => String(x.id) === String(layer.profileId)) || preset.profiles?.[0];
            return (
              <div key={layer.id} style={{ borderTop: idx ? "1px solid #e2e8f0" : "none", padding: "8px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 30px", gap: 6 }}>
                  <select style={field} value={layer.group} onChange={(e) => updateCustomLayer(idx, { group: e.target.value })}><option value="structural">Несущая</option><option value="finish">Пол</option></select>
                  <select style={field} value={layer.presetId} onChange={(e) => changePreset(idx, e.target.value)}>{CUSTOM_FLOOR_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <button style={smallBtn} onClick={() => commit({ customLayers: customCalc.layers.filter((_, i) => i !== idx) })}>×</button>
                </div>
                {preset.id === "custom" && <input style={{ ...field, marginTop: 5 }} value={layer.name || ""} placeholder="Название слоя" onChange={(e) => updateCustomLayer(idx, { name: e.target.value })} />}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 5, alignItems: "end" }}>
                  {preset.mode === "profile" ? (
                    <div style={{ gridColumn: "1 / span 2" }}><label style={{ fontSize: ".75em" }}>Типоразмер</label><select style={field} value={profile?.id || ""} onChange={(e) => { const p = preset.profiles.find((x) => String(x.id) === String(e.target.value)); updateCustomLayer(idx, { profileId: p.id, thickness: p.thickness, weight: p.weight }); }}>{preset.profiles.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                  ) : preset.mode === "density" ? <>
                    <div><label style={{ fontSize: ".75em" }}>Толщина, мм</label><input style={field} type="number" value={layer.thickness ?? 0} onChange={(e) => updateCustomLayer(idx, { thickness: e.target.value })} /></div>
                    <div><label style={{ fontSize: ".75em" }}>Плотность, кг/м³</label><input style={field} type="number" value={layer.density ?? 0} onChange={(e) => updateCustomLayer(idx, { density: e.target.value })} /></div>
                  </> : preset.mode === "fixed" ? <div style={{ gridColumn: "1 / span 2", fontSize: ".78em" }}>Фиксированная масса по сортаменту</div> : <div style={{ gridColumn: "1 / span 2" }}><label style={{ fontSize: ".75em" }}>Масса, кг/м²</label><input style={field} type="number" value={layer.weight ?? 0} onChange={(e) => updateCustomLayer(idx, { weight: e.target.value })} /></div>}
                  <div><label style={{ fontSize: ".75em" }}>В расчёте</label><div style={{ padding: "6px 0" }}><input type="checkbox" checked={layer.enabled !== false} onChange={(e) => updateCustomLayer(idx, { enabled: e.target.checked })} /> <strong>{layerWeight(layer).toFixed(1)}</strong> кг/м²</div></div>
                </div>
              </div>
            );
          })}
          <button style={smallBtn} onClick={() => commit({ customLayers: [...customCalc.layers, makeCustomLayer("custom")] })}>+ Добавить слой</button>
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>Полезная (нормативная), кг/м²</label><input style={field} type="number" value={fs.liveLoad ?? 0} onChange={(e) => commit({ liveLoad: e.target.value })} /></div>
        <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>Перегородки, кг/м²</label><input style={field} type="number" value={fs.partitionsLoad ?? 0} onChange={(e) => commit({ partitionsLoad: e.target.value })} /></div>
        <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>γf</label><select style={field} value={fs.safetyFactor ?? 1.2} onChange={(e) => commit({ safetyFactor: Number(e.target.value) })}>{SAFETY_FACTOR_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.value}</option>)}</select></div>
        <div><label style={{ fontSize: ".8em", fontWeight: 700 }}>γn</label><select style={field} value={fs.responsibilityFactor ?? 1.0} onChange={(e) => commit({ responsibilityFactor: Number(e.target.value) })}>{RESPONSIBILITY_FACTORS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
      </div>

      <div style={{ marginTop: 10, padding: 10, background: "#e6f7ff", border: "1px solid #b0e0ff", borderRadius: 5, color: "#005699", fontSize: ".84em" }}>
        <div>Несущая часть: <strong>{structuralDeadLoad.toFixed(1)}</strong> кг/м² · состав пола: <strong>{floorFinishLoad.toFixed(1)}</strong> кг/м² · постоянная: <strong>{deadLoad.toFixed(1)}</strong> кг/м²</div>
        <div>Нормативная суммарная: <strong>{qNorm.toFixed(1)}</strong> кг/м²</div>
        <div style={{ fontSize: "1.08em", marginTop: 3 }}>Расчётная: <strong>{qDesign.toFixed(1)} кг/м²</strong> = (G×1.1 + Pпер×1.2 + Q×γf) × γn</div>
      </div>
    </div>
  );
}
