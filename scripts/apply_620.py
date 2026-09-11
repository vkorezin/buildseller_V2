from pathlib import Path

# --- MezzanineFloorEditor.js ---
p = Path('src/MezzanineFloorEditor.js')
s = p.read_text()

s = s.replace(
'import React, { useMemo } from "react";',
'import React, { useEffect, useMemo, useState } from "react";'
)
s = s.replace(
'  getLayersForTypeAndThickness,\n} from "./floorStructureConstants";',
'  getLayersForTypeAndThickness,\n  validateFloorThickness,\n} from "./floorStructureConstants";'
)

anchor = '''const miniLabel = { display: "block", fontSize: ".73em", color: "#64748b", marginBottom: 3 };\n\nfunction getPreset(group, presetId) {'''
insert = '''const miniLabel = { display: "block", fontSize: ".73em", color: "#64748b", marginBottom: 3 };\nconst errorText = { color: "#dc2626", fontSize: ".72em", marginTop: 4, lineHeight: 1.25 };\n\nconst isFiniteValue = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));\nconst nonNegativeValue = (v, fallback = 0) => isFiniteValue(v) && Number(v) >= 0 ? Number(v) : fallback;\nconst positiveValue = (v) => isFiniteValue(v) && Number(v) > 0;\n\nfunction getPreset(group, presetId) {'''
assert anchor in s
s = s.replace(anchor, insert)

anchor = '''function normalizeCustomLayers(layers, legacyDeadLoad = 0) {\n  if (Array.isArray(layers) && layers.length) return layers.map(normalizeLayer);\n  return [{\n    ...makeCustomLayer("structural", "struct_custom"),\n    name: "Существующая постоянная нагрузка",\n    weight: Math.max(0, finite(legacyDeadLoad)),\n  }];\n}\n\nexport function createDefaultMezzanineFloorStructure() {'''
insert = '''function normalizeCustomLayers(layers, legacyDeadLoad = 0) {\n  if (Array.isArray(layers) && layers.length) return layers.map(normalizeLayer);\n  return [{\n    ...makeCustomLayer("structural", "struct_custom"),\n    name: "Существующая постоянная нагрузка",\n    weight: Math.max(0, finite(legacyDeadLoad)),\n  }];\n}\n\nexport function validateMezzanineFloorStructure(structure = {}) {\n  const errors = [];\n  const typeId = structure.type || DEFAULT_FLOOR_STRUCTURE.type;\n  const ti = FLOOR_TYPES.find((x) => x.id === typeId);\n\n  if (typeId === CUSTOM_TYPE) {\n    if (!positiveValue(structure.thickness) || Number(structure.thickness) > 500) {\n      errors.push("Общая толщина своего пола должна быть больше 0 и не более 500 мм.");\n    }\n    const layers = normalizeCustomLayers(structure.customLayers, structure.deadLoad);\n    const activeStructural = layers.filter((x) => x.enabled !== false && x.group === "structural");\n    if (activeStructural.length === 0 || activeStructural.reduce((sum, x) => sum + layerWeight(x), 0) <= 0) {\n      errors.push("Добавьте хотя бы один несущий слой с массой больше 0 кг/м².");\n    }\n    layers.forEach((layer) => {\n      if (layer.enabled === false) return;\n      const preset = getPreset(layer.group, layer.presetId);\n      if (preset?.mode === "density") {\n        if (!positiveValue(layer.thickness)) errors.push(`Слой «${layer.name || preset.name}»: толщина должна быть больше 0.`);\n        if (!positiveValue(layer.density)) errors.push(`Слой «${layer.name || preset.name}»: плотность должна быть больше 0.`);\n      } else if (preset?.mode === "manual") {\n        if (!isFiniteValue(layer.weight) || Number(layer.weight) < 0) errors.push(`Слой «${layer.name || preset.name}»: масса должна быть 0 или больше.`);\n      }\n    });\n  } else if (ti) {\n    if (typeId !== "steel_grating") {\n      const check = validateFloorThickness(ti, structure.thickness ?? ti.defaultThickness);\n      if (!check.isValid) errors.push(check.error);\n    }\n    if (SEPARATE_FINISH_TYPES.includes(typeId)) {\n      const fl = Array.isArray(structure.floorFinishLayers) ? structure.floorFinishLayers : [];\n      fl.forEach((layer) => {\n        if (!isFiniteValue(layer?.load) || Number(layer.load) < 0) {\n          errors.push(`Слой пола «${layer?.name || "без названия"}»: нагрузка должна быть 0 или больше.`);\n        }\n      });\n    }\n  }\n\n  if (!isFiniteValue(structure.liveLoad) || Number(structure.liveLoad) < 0) {\n    errors.push("Полезная нагрузка должна быть числом 0 или больше.");\n  }\n  if (!isFiniteValue(structure.partitionsLoad) || Number(structure.partitionsLoad) < 0) {\n    errors.push("Нагрузка от перегородок должна быть числом 0 или больше.");\n  }\n  if (!positiveValue(structure.safetyFactor)) errors.push("Коэффициент γf должен быть больше 0.");\n  if (!positiveValue(structure.responsibilityFactor)) errors.push("Коэффициент γn должен быть больше 0.");\n\n  return { isValid: errors.length === 0, errors };\n}\n\nexport function createDefaultMezzanineFloorStructure() {'''
assert anchor in s
s = s.replace(anchor, insert)

old = '''  const finishLayers = Array.isArray(fs.floorFinishLayers) && fs.floorFinishLayers.length\n    ? fs.floorFinishLayers\n    : (typeInfo?.defaultFloorFinishLayers ? clone(typeInfo.defaultFloorFinishLayers) : []);\n  const finishLoad = isSeparateFinish ? calculateFloorFinishLoad(finishLayers) : 0;\n  const density = normalizeKnaufFillDensity(fs.knaufFillDensity ?? DEFAULT_KNAUF_FILL_DENSITY);\n  const grating = getSteelGratingProfile(fs.gratingProfileId || DEFAULT_STEEL_GRATING_PROFILE_ID);\n  const thickness = type === "steel_grating"\n    ? grating.height\n    : finite(fs.thickness, typeInfo?.defaultThickness || 120);\n'''
new = '''  const finishLayers = Array.isArray(fs.floorFinishLayers) && fs.floorFinishLayers.length\n    ? fs.floorFinishLayers\n    : (typeInfo?.defaultFloorFinishLayers ? clone(typeInfo.defaultFloorFinishLayers) : []);\n  const finishLoad = isSeparateFinish\n    ? finishLayers.reduce((sum, layer) => sum + nonNegativeValue(layer?.load, 0), 0)\n    : 0;\n  const density = normalizeKnaufFillDensity(fs.knaufFillDensity ?? DEFAULT_KNAUF_FILL_DENSITY);\n  const grating = getSteelGratingProfile(fs.gratingProfileId || DEFAULT_STEEL_GRATING_PROFILE_ID);\n\n  const initialThicknessDraft = type === "steel_grating"\n    ? grating.height\n    : (fs.thickness ?? typeInfo?.defaultThickness ?? 120);\n  const [thicknessDraft, setThicknessDraft] = useState(initialThicknessDraft);\n  useEffect(() => {\n    setThicknessDraft(type === "steel_grating" ? grating.height : (fs.thickness ?? typeInfo?.defaultThickness ?? 120));\n  }, [mezzanine?.id, type, fs.thickness, grating.height, typeInfo?.defaultThickness]);\n\n  const thicknessValidation = isCustom\n    ? {\n        isValid: positiveValue(thicknessDraft) && Number(thicknessDraft) <= 500,\n        error: "Общая толщина своего пола должна быть больше 0 и не более 500 мм.",\n      }\n    : typeInfo && type !== "steel_grating"\n      ? validateFloorThickness(typeInfo, thicknessDraft)\n      : { isValid: true, error: null };\n\n  const thickness = type === "steel_grating"\n    ? grating.height\n    : thicknessValidation.isValid\n      ? Number(thicknessDraft)\n      : finite(fs.lastValidThickness, finite(fs.thickness, typeInfo?.defaultThickness || 120));\n'''
assert old in s
s = s.replace(old, new)

s = s.replace(
'  const liveLoad = finite(fs.liveLoad, 0);\n  const partitionsLoad = finite(fs.partitionsLoad, 0);',
'  const liveLoad = nonNegativeValue(fs.liveLoad, 0);\n  const partitionsLoad = nonNegativeValue(fs.partitionsLoad, 0);'
)

anchor = '''  const qDesign = calculateMezzanineQBase({ deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor });\n  const qNorm = deadLoad + partitionsLoad + liveLoad;\n\n  const dynamicLayers = !isCustom && typeInfo'''
insert = '''  const qDesign = calculateMezzanineQBase({ deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor });\n  const qNorm = deadLoad + partitionsLoad + liveLoad;\n  const validation = validateMezzanineFloorStructure({ ...fs, thickness: thicknessDraft });\n\n  const dynamicLayers = !isCustom && typeInfo'''
assert anchor in s
s = s.replace(anchor, insert)

s = s.replace(
'      nextFinish = sep ? calculateFloorFinishLoad(fl) : 0;',
'      nextFinish = sep ? fl.reduce((sum, layer) => sum + nonNegativeValue(layer?.load, 0), 0) : 0;'
)
s = s.replace(
'      partitionsLoad: finite(next.partitionsLoad, partitionsLoad),\n      liveLoad: finite(next.liveLoad, liveLoad),',
'      partitionsLoad: nonNegativeValue(next.partitionsLoad, partitionsLoad),\n      liveLoad: nonNegativeValue(next.liveLoad, liveLoad),'
)
s = s.replace(
'    next.normLoadKg = next.deadLoad + finite(next.partitionsLoad, partitionsLoad) + finite(next.liveLoad, liveLoad);',
'    next.normLoadKg = next.deadLoad + nonNegativeValue(next.partitionsLoad, partitionsLoad) + nonNegativeValue(next.liveLoad, liveLoad);\n    next.lastValidThickness = next.thickness;'
)
s = s.replace(
'      loadLive: finite(next.liveLoad, liveLoad),\n      loadPartitions: finite(next.partitionsLoad, partitionsLoad),',
'      loadLive: nonNegativeValue(next.liveLoad, liveLoad),\n      loadPartitions: nonNegativeValue(next.partitionsLoad, partitionsLoad),'
)

anchor = '''  const switchType = (newType) => {'''
insert = '''  const handleThicknessChange = (raw) => {\n    setThicknessDraft(raw);\n    if (type === "steel_grating") return;\n    const check = isCustom\n      ? { isValid: positiveValue(raw) && Number(raw) <= 500 }\n      : validateFloorThickness(typeInfo, raw);\n    if (check.isValid) {\n      commit({ thickness: Number(raw), lastValidThickness: Number(raw) });\n    }\n  };\n\n  const switchType = (newType) => {'''
assert anchor in s
s = s.replace(anchor, insert)

# custom layer input validation styling
s = s.replace(
'<input style={field} type="number" min="0" value={layer.thickness ?? 0} onChange={(e) => updateLayer(layer.id, { thickness: e.target.value })} />',
'<input style={{ ...field, borderColor: positiveValue(layer.thickness) ? "#cbd5e1" : "#ef4444", background: positiveValue(layer.thickness) ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.thickness ?? 0} onChange={(e) => updateLayer(layer.id, { thickness: e.target.value })} />'
)
s = s.replace(
'<input style={field} type="number" min="0" value={layer.density ?? 0} onChange={(e) => updateLayer(layer.id, { density: e.target.value })} />',
'<input style={{ ...field, borderColor: positiveValue(layer.density) ? "#cbd5e1" : "#ef4444", background: positiveValue(layer.density) ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.density ?? 0} onChange={(e) => updateLayer(layer.id, { density: e.target.value })} />'
)
s = s.replace(
'<input style={field} type="number" min="0" value={layer.weight ?? 0} onChange={(e) => updateLayer(layer.id, { weight: e.target.value })} />',
'<input style={{ ...field, borderColor: isFiniteValue(layer.weight) && Number(layer.weight) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(layer.weight) && Number(layer.weight) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.weight ?? 0} onChange={(e) => updateLayer(layer.id, { weight: e.target.value })} />'
)

# predefined thickness input
old = '<input style={field} type="number" value={fs.thickness ?? typeInfo.defaultThickness} onChange={(e) => commit({ thickness: e.target.value })} />'
new = '''<input\n                  style={{ ...field, borderColor: thicknessValidation.isValid ? "#cbd5e1" : "#ef4444", background: thicknessValidation.isValid ? "#fff" : "#fef2f2" }}\n                  type="number"\n                  min={typeInfo.thicknessRange?.[0]}\n                  max={typeInfo.thicknessRange?.[1]}\n                  value={thicknessDraft}\n                  onChange={(e) => handleThicknessChange(e.target.value)}\n                />\n                {!thicknessValidation.isValid && <div style={errorText}>⚠️ {thicknessValidation.error}</div>}'''
assert old in s
s = s.replace(old, new)

# finish layer load input strict visual validation
old = '<input style={field} type="number" value={layer.load ?? 0} onChange={(e) => { const a = clone(finishLayers); a[idx].load = e.target.value; commit({ floorFinishLayers: a }); }} />'
new = '<input style={{ ...field, borderColor: isFiniteValue(layer.load) && Number(layer.load) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(layer.load) && Number(layer.load) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={layer.load ?? 0} onChange={(e) => { const a = clone(finishLayers); a[idx].load = e.target.value; commit({ floorFinishLayers: a }); }} />'
assert old in s
s = s.replace(old, new)

# custom overall thickness
old = '<input style={field} type="number" min="0" value={fs.thickness ?? 120} onChange={(e) => commit({ thickness: e.target.value })} />'
new = '''<input\n                style={{ ...field, borderColor: thicknessValidation.isValid ? "#cbd5e1" : "#ef4444", background: thicknessValidation.isValid ? "#fff" : "#fef2f2" }}\n                type="number" min="1" max="500" value={thicknessDraft}\n                onChange={(e) => handleThicknessChange(e.target.value)}\n              />\n              {!thicknessValidation.isValid && <div style={errorText}>⚠️ {thicknessValidation.error}</div>}'''
assert old in s
s = s.replace(old, new)

# loads visual validation
old = '<input style={field} type="number" min="0" value={fs.liveLoad ?? 0} onChange={(e) => commit({ liveLoad: e.target.value })} />'
new = '<input style={{ ...field, borderColor: isFiniteValue(fs.liveLoad) && Number(fs.liveLoad) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(fs.liveLoad) && Number(fs.liveLoad) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={fs.liveLoad ?? 0} onChange={(e) => commit({ liveLoad: e.target.value })} />'
assert old in s
s = s.replace(old, new)
old = '<input style={field} type="number" min="0" value={fs.partitionsLoad ?? 0} onChange={(e) => commit({ partitionsLoad: e.target.value })} />'
new = '<input style={{ ...field, borderColor: isFiniteValue(fs.partitionsLoad) && Number(fs.partitionsLoad) >= 0 ? "#cbd5e1" : "#ef4444", background: isFiniteValue(fs.partitionsLoad) && Number(fs.partitionsLoad) >= 0 ? "#fff" : "#fef2f2" }} type="number" min="0" value={fs.partitionsLoad ?? 0} onChange={(e) => commit({ partitionsLoad: e.target.value })} />'
assert old in s
s = s.replace(old, new)

# validation summary before formula
anchor = '''      <div style={{ marginTop: 7, fontSize: ".69em", color: "#64748b" }}>\n        q = (G × 1.1 + Pперег × 1.2 + Q × γf) × γn\n      </div>'''
insert = '''      {!validation.isValid && (\n        <div style={{ marginTop: 10, padding: 9, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#b91c1c", fontSize: ".75em" }}>\n          <strong>⚠️ Исправьте параметры перед сохранением:</strong>\n          <ul style={{ margin: "5px 0 0 18px", padding: 0 }}>\n            {validation.errors.map((err, idx) => <li key={idx}>{err}</li>)}\n          </ul>\n        </div>\n      )}\n\n      <div style={{ marginTop: 7, fontSize: ".69em", color: "#64748b" }}>\n        q = (G × 1.1 + Pперег × 1.2 + Q × γf) × γn\n      </div>'''
assert anchor in s
s = s.replace(anchor, insert)

p.write_text(s)
print('patched MezzanineFloorEditor.js')

# --- MezzanineEditor.js ---
p = Path('src/MezzanineEditor.js')
s = p.read_text()
s = s.replace(
'  normalizeMezzanineFloor,\n} from "./MezzanineFloorEditor";',
'  normalizeMezzanineFloor,\n  validateMezzanineFloorStructure,\n} from "./MezzanineFloorEditor";'
)

s = s.replace(
'  const buildingW = blockData.generalData.blockWidth || 0;\n  const buildingL = blockData.generalData.blockLength || 0;',
'  const buildingW = Number(blockData.generalData.blockWidth) || 0;\n  const buildingL = Number(blockData.generalData.blockLength) || 0;\n  const buildingH = Number(blockData.generalData.blockHeight) || 0;'
)

anchor = '''  const selectedMezzanine = useMemo(() => {\n    return mezzanines.find((m) => m.id === selectedId) || null;\n  }, [mezzanines, selectedId]);\n\n  // Экспорт наверх: Парсим строки в float и жестко гарантируем минимум 2 ряда опор'''
insert = '''  const selectedMezzanine = useMemo(() => {\n    return mezzanines.find((m) => m.id === selectedId) || null;\n  }, [mezzanines, selectedId]);\n\n  const validateMezzanine = (m) => {\n    const errors = [];\n    const num = (v) => v !== "" && v !== null && v !== undefined && Number.isFinite(Number(v));\n    const elevation = Number(m.elevation);\n    const width = Number(m.width);\n    const length = Number(m.length);\n    const x = Number(m.offsetX);\n    const y = Number(m.offsetY);\n    const colsX = Number(m.colsX);\n    const colsY = Number(m.colsY);\n\n    if (!num(m.elevation) || elevation <= 0) errors.push("Отметка пола должна быть больше 0 м.");\n    if (buildingH > 0 && num(m.elevation) && elevation >= buildingH) errors.push(`Отметка пола должна быть ниже высоты здания +${buildingH} м.`);\n    if (!num(m.width) || width <= 0) errors.push("Ширина антресоли должна быть больше 0 м.");\n    if (!num(m.length) || length <= 0) errors.push("Длина антресоли должна быть больше 0 м.");\n    if (!num(m.offsetX) || x < 0) errors.push("Смещение X должно быть 0 или больше.");\n    if (!num(m.offsetY) || y < 0) errors.push("Смещение Y должно быть 0 или больше.");\n    if (num(m.width) && num(m.offsetX) && x + width > buildingW + 1e-9) errors.push(`Антресоль выходит за ширину здания ${buildingW} м.`);\n    if (num(m.length) && num(m.offsetY) && y + length > buildingL + 1e-9) errors.push(`Антресоль выходит за длину здания ${buildingL} м.`);\n    if (!Number.isInteger(colsX) || colsX < 2) errors.push("Количество рядов колонн по X — целое число не меньше 2.");\n    if (!Number.isInteger(colsY) || colsY < 2) errors.push("Количество рядов колонн по Y — целое число не меньше 2.");\n\n    const floorCheck = validateMezzanineFloorStructure(m.floorStructure || {\n      type: "custom_floor",\n      thickness: m.thickness,\n      deadLoad: m.loadDead,\n      liveLoad: m.loadLive,\n      partitionsLoad: m.loadPartitions,\n      safetyFactor: m.safetyFactor,\n      responsibilityFactor: m.responsibilityFactor,\n      customLayers: [],\n    });\n    errors.push(...floorCheck.errors);\n    return { isValid: errors.length === 0, errors };\n  };\n\n  const validationById = useMemo(() => {\n    const map = new Map();\n    mezzanines.forEach((m) => map.set(m.id, validateMezzanine(m)));\n    return map;\n  }, [mezzanines, buildingW, buildingL, buildingH]);\n  const selectedValidation = selectedMezzanine\n    ? (validationById.get(selectedMezzanine.id) || { isValid: true, errors: [] })\n    : { isValid: true, errors: [] };\n\n  // Экспорт наверх: Парсим строки в float и жестко гарантируем минимум 2 ряда опор'''
assert anchor in s
s = s.replace(anchor, insert)

old = '''  const handleBackWithData = () => {\n    const formattedMezzanines = mezzanines.map(m => ({'''
new = '''  const handleBackWithData = () => {\n    const firstInvalid = mezzanines.find((m) => !(validationById.get(m.id)?.isValid ?? true));\n    if (firstInvalid) {\n      setSelectedId(firstInvalid.id);\n      const errs = validationById.get(firstInvalid.id)?.errors || [];\n      alert(`Исправьте ошибки в «${firstInvalid.name || "антресоли"}»:\n\n${errs.join("\n")}`);\n      return;\n    }\n    const formattedMezzanines = mezzanines.map(m => ({'''
assert old in s
s = s.replace(old, new)

# remove obsolete isOutOfBounds memo
start = s.find('  // Валидация выхода антресоли за контуры основного здания\n  const isOutOfBounds = useMemo(() => {')
if start != -1:
    end = s.find('\n\n  return (', start)
    assert end != -1
    s = s[:start] + '  // Проверки геометрии, сетки колонн и перекрытия выполняются перед сохранением.\n' + s[end:]

old = '''            {isOutOfBounds && (\n              <div style={{\n                padding: "10px", \n                backgroundColor: "#ffebe6", \n                border: "1px solid #ffc0b0", \n                color: "#d90000", \n                borderRadius: "6px", \n                marginBottom: "15px",\n                fontWeight: "bold",\n                fontSize: "0.9em"\n              }}>\n                ⚠️ Внимание: Контур антресоли выходит за габариты здания ({buildingW}х{buildingL}м)! Проверьте смещения или размеры.\n              </div>\n            )}'''
new = '''            {!selectedValidation.isValid && (\n              <div style={{\n                padding: "10px",\n                backgroundColor: "#fef2f2",\n                border: "1px solid #fecaca",\n                color: "#b91c1c",\n                borderRadius: "6px",\n                marginBottom: "15px",\n                fontSize: "0.86em"\n              }}>\n                <strong>⚠️ Исправьте ошибки перед сохранением:</strong>\n                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>\n                  {selectedValidation.errors.map((err, idx) => <li key={idx}>{err}</li>)}\n                </ul>\n              </div>\n            )}'''
assert old in s
s = s.replace(old, new)

p.write_text(s)
print('patched MezzanineEditor.js')
