from pathlib import Path
import re


def sub1(text, pattern, replacement, label, flags=re.S):
    result, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return result


constants_path = Path("src/floorStructureConstants.js")
c = constants_path.read_text(encoding="utf-8")

# 1) ПК/ПБ: отделяем несущую часть от состава пола, не меняя итог 330 кг/м².
pb_block = '''  {
    id: "precast_hollow_core",
    name: "Сборные многопустотные железобетонные плиты (ПК / ПБ 220 мм)",
    shortName: "Плиты ПК / ПБ",
    category: "reinforced_concrete",
    standard: "ГОСТ 9561-2016, СП 63.13330.2018",
    defaultThickness: 220,
    thicknessRange: [220, 220],
    thicknessPresets: [220],
    isConstantThickness: true,
    constantThicknessNote: "Постоянная стандартная заводская толщина 220 мм (ГОСТ 9561-2016)",
    structuralDeadLoad: 280, // кг/м²: плита 230 + замоноличивание 15 + главные стальные балки 35
    defaultFloorFinishLayers: [
      { name: "Выравнивающая армированная стяжка М150 (30 мм)", load: 50 },
    ],
    floorFinishLoad: 50,
    deadLoad: 330, // кг/м² = structuralDeadLoad 280 + floorFinishLoad 50
    beamSpacing: "4.5 – 7.2 м",
    fireRating: "REI 60 – REI 120",
    features:
      "Заводские предварительно напряженные плиты ПБ-22 или ПК. Укладываются по верхним полкам стальных ригелей. Не требуют мокрых монолитных работ на стройплощадке.",
    color: "#0284c7",
    layers: [
      { name: "Сборные преднапряженные многопустотные плиты ПБ-220", thickness: 220, weight: 230 },
      { name: "Замоноличивание швов бетоном B20", thickness: 0, weight: 15 },
      { name: "Главные стальные балки перекрытия", thickness: 350, weight: 35 },
    ],
  },
'''
c = sub1(
    c,
    r'  \{\n    id: "precast_hollow_core",.*?\n  \},\n(?=  \{\n    id: "monolithic_slab")',
    pb_block,
    "replace precast_hollow_core block",
)

# 2) Монолитная плита: 500 несущая + 25 состав пола при t=180, итог по-прежнему 525.
slab_block = '''  {
    id: "monolithic_slab",
    name: "Монолитная железобетонная плита по съемной опалубке (140–500 мм)",
    shortName: "Монолитная ж/б плита",
    category: "reinforced_concrete",
    standard: "СП 63.13330.2018",
    defaultThickness: 180,
    thicknessRange: [140, 500],
    thicknessPresets: [140, 160, 180, 200, 220, 250],
    isConstantThickness: false,
    structuralDeadLoad: 500, // кг/м² при t=180 мм: плита 450 + главные стальные ригели 50
    defaultFloorFinishLayers: [
      { name: "Топпинг пола / обеспыливающая пропитка (10 мм)", load: 25 },
    ],
    floorFinishLoad: 25,
    deadLoad: 525, // кг/м² = structuralDeadLoad 500 + floorFinishLoad 25
    beamSpacing: "4.0 – 6.0 м",
    fireRating: "REI 90 – REI 150",
    features:
      "Сплошная плита тяжелого бетона B25 с двухслойным армированием. Обладает максимальной несущей способностью и вибростойкостью под тяжелые станки и погрузчики.",
    color: "#475569",
    layers: [
      { name: "Монолитная железобетонная плита B25 (двойная арматура)", thickness: 180, weight: 450 },
      { name: "Главные стальные ригели каркаса", thickness: 400, weight: 50 },
    ],
  },
'''
c = sub1(
    c,
    r'  \{\n    id: "monolithic_slab",.*?\n  \},\n(?=  \{\n    id: "precast_block_composite")',
    slab_block,
    "replace monolithic_slab block",
)

structural_fn = '''export function calculateStructuralDeadLoadForType(typeId, t, options = {}) {
  const thick = Number(t) || 120;
  if (typeId === "monolithic_deck") {
    return getMonolithicDeckStructuralComponents(thick).structuralDeadLoad;
  }
  if (typeId === "precast_hollow_core") {
    return 280;
  }
  if (typeId === "monolithic_slab") {
    // Плита тяжелого бетона 2.5 кг/м² на 1 мм + главные стальные ригели 50 кг/м².
    return Math.max(225, Math.round(thick * 2.5 + 50));
  }
  return calculateDeadLoadForType(typeId, thick, 0, options);
}
'''
c = sub1(
    c,
    r'export function calculateStructuralDeadLoadForType\(typeId, t, options = \{\}\) \{.*?\n\}',
    structural_fn.rstrip(),
    "replace calculateStructuralDeadLoadForType",
)

# 3) Полный deadLoad = structural + floorFinish для ПК/ПБ и монолитной плиты.
c = sub1(
    c,
    r'    case "precast_hollow_core":\n(?:      .*\n)*?      return 330;',
    '''    case "precast_hollow_core": {
      const structural = 280;
      const finish =
        floorFinishLoad !== undefined && floorFinishLoad !== null && !isNaN(Number(floorFinishLoad))
          ? Number(floorFinishLoad)
          : 50;
      return Math.round((structural + finish) * 1000) / 1000;
    }''',
    "replace PB deadLoad case",
)
c = sub1(
    c,
    r'    case "monolithic_slab":\n(?:      .*\n)*?      return Math\.max\(250, Math\.round\(thick \* 2\.5 \+ 75\)\);',
    '''    case "monolithic_slab": {
      const structural = Math.max(225, Math.round(thick * 2.5 + 50));
      const finish =
        floorFinishLoad !== undefined && floorFinishLoad !== null && !isNaN(Number(floorFinishLoad))
          ? Number(floorFinishLoad)
          : 25;
      return Math.round((structural + finish) * 1000) / 1000;
    }''',
    "replace slab deadLoad case",
)

# 4) Dynamic layers теперь отражают только несущую часть; состав пола хранится отдельно.
pb_layers = '''  if (typeInfo.id === "precast_hollow_core") {
    return [
      {
        name: "Сборные преднапряженные многопустотные плиты ПБ-220",
        thickness: 220,
        weight: 230,
        highlight: true,
      },
      {
        name: "Замоноличивание швов бетоном B20",
        thickness: 0,
        weight: 15,
      },
      {
        name: "Главные стальные балки перекрытия",
        thickness: 350,
        weight: 35,
      },
    ];
  }

'''
needle = '  if (typeInfo.id === "monolithic_slab") {'
if needle not in c:
    raise SystemExit("insert PB layers: monolithic_slab branch not found")
c = c.replace(needle, pb_layers + needle, 1)

c = sub1(
    c,
    r'  if \(typeInfo\.id === "monolithic_slab"\) \{.*?\n  \}\n\n  if \(typeInfo\.id === "steel_grating"\)',
    '''  if (typeInfo.id === "monolithic_slab") {
    const slabWeight = Math.round(thick * 2.5);
    return [
      {
        name: `Монолитная железобетонная плита B25 (толщина ${thick} мм)`,
        thickness: thick,
        weight: slabWeight,
        highlight: true,
      },
      {
        name: "Главные стальные ригели каркаса",
        thickness: 400,
        weight: 50,
      },
    ];
  }

  if (typeInfo.id === "steel_grating")''',
    "replace slab dynamic layers",
)

constants_path.write_text(c, encoding="utf-8")


modal_path = Path("src/FloorStructureModal.js")
m = modal_path.read_text(encoding="utf-8")

# Типы, где состав пола отделен от несущей конструкции.
anchor = '  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {'
if anchor not in m:
    raise SystemExit("modal: floorFinishLayers state anchor not found")
helper = '''  const typesWithSeparateFloorFinish = [
    "monolithic_deck",
    "precast_hollow_core",
    "monolithic_slab",
  ];

'''
m = m.replace(anchor, helper + anchor, 1)

# Инициализация состава пола с legacy-миграцией: старый non-H75 floorFinishLoad=0 не имеет приоритета.
state_init = '''  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {
    const init = initialStructure || DEFAULT_FLOOR_STRUCTURE;
    const typeId = init.type || DEFAULT_FLOOR_STRUCTURE.type;
    const typeInfo = FLOOR_TYPES.find((t) => t.id === typeId) || FLOOR_TYPES[0];
    if (Array.isArray(init.floorFinishLayers) && init.floorFinishLayers.length > 0) {
      return init.floorFinishLayers;
    }
    if (
      typeId === "monolithic_deck" &&
      init.floorFinishLoad !== undefined &&
      init.floorFinishLoad !== null
    ) {
      return [{ name: "Топпинг / покрытие пола", load: Number(init.floorFinishLoad) || 0 }];
    }
    if (Array.isArray(typeInfo.defaultFloorFinishLayers)) {
      return typeInfo.defaultFloorFinishLayers.map((layer) => ({ ...layer }));
    }
    return [];
  });
'''
m = sub1(
    m,
    r'  const \[floorFinishLayers, setFloorFinishLayers\] = useState\(\(\) => \{.*?\n  \}\);',
    state_init.rstrip(),
    "replace floorFinishLayers state init",
)

# useEffect: defaults/migration and recalculation on open.
effect_finish = '''    const defaultFinishLayers = Array.isArray(typeInfo.defaultFloorFinishLayers)
      ? typeInfo.defaultFloorFinishLayers.map((layer) => ({ ...layer }))
      : [];
    const hasSavedFinishLayers =
      Array.isArray(init.floorFinishLayers) && init.floorFinishLayers.length > 0;
    const initFinishLayers = hasSavedFinishLayers
      ? init.floorFinishLayers
      : typeId === "monolithic_deck" &&
        init.floorFinishLoad !== undefined &&
        init.floorFinishLoad !== null
      ? [{ name: "Топпинг / покрытие пола", load: Number(init.floorFinishLoad) || 0 }]
      : defaultFinishLayers;
    setFloorFinishLayers(initFinishLayers);
    const initFloorFinishLoad = initFinishLayers.reduce(
      (sum, layer) => sum + (Number(layer?.load) || 0),
      0
    );

    if (typeId === "precast_hollow_core") {
      setDeadLoad(calculateDeadLoadForType(typeId, th, initFloorFinishLoad));
    } else if (typeId === "monolithic_deck") {'''
m = sub1(
    m,
    r'    const initFinishLayers =.*?\n      if \(typeInfo\.isConstantThickness\) \{\n      setDeadLoad\(typeInfo\.deadLoad\);\n    \} else if \(typeId === "monolithic_deck"\) \{',
    effect_finish,
    "replace useEffect finish init/constant branch",
)

# H75 branch currently recomputes finishSum: use already calculated initFloorFinishLoad.
m = sub1(
    m,
    r'      const finishSum = initFinishLayers\.reduce\(\n        \(sum, l\) => sum \+ \(Number\(l\?\.load\) \|\| 0\),\n        0\n      \);\n      const sComp = getMonolithicDeckStructuralComponents\(th\);\n      setDeadLoad\(Math\.round\(\(sComp\.structuralDeadLoad \+ finishSum\) \* 1000\) / 1000\);',
    '''      const sComp = getMonolithicDeckStructuralComponents(th);
      setDeadLoad(Math.round((sComp.structuralDeadLoad + initFloorFinishLoad) * 1000) / 1000);''',
    "simplify H75 init finish",
)

# Добавить монолитную плиту в open-recalc до KNAUF.
m = m.replace(
    '    } else if (typeId === "knauf_dry_floor") {',
    '''    } else if (typeId === "monolithic_slab") {
      setDeadLoad(calculateDeadLoadForType(typeId, th, initFloorFinishLoad));
    } else if (typeId === "knauf_dry_floor") {''',
    1,
)

# deadLoad вычисляемый для монолитной плиты тоже нельзя редактировать вручную.
m = m.replace(
    '      selectedType === "monolithic_deck" ||\n      selectedType === "knauf_dry_floor" ||',
    '      selectedType === "monolithic_deck" ||\n      selectedType === "monolithic_slab" ||\n      selectedType === "knauf_dry_floor" ||',
    1,
)

# Универсальный пересчет при изменении слоев состава пола.
recalc_helper_anchor = '  // Изменение нагрузки отдельного слоя чистового пола\n'
if recalc_helper_anchor not in m:
    raise SystemExit("modal: finish handlers anchor not found")
recalc_helper = '''  const recalculateDeadLoadWithFloorFinish = (layers) => {
    const finishLoad = layers.reduce(
      (sum, layer) => sum + (Number(layer?.load) || 0),
      0
    );
    if (!typesWithSeparateFloorFinish.includes(selectedType)) return;
    setDeadLoad(
      calculateDeadLoadForType(
        selectedType,
        lastValidThickness,
        finishLoad,
        { knaufFillDensity, gratingProfileId }
      )
    );
  };

'''
m = m.replace(recalc_helper_anchor, recalc_helper + recalc_helper_anchor, 1)

# Три handler-а больше не привязаны только к H75.
m = sub1(
    m,
    r'    const nextFinishLoad = nextLayers\.reduce\(\(sum, l\) => sum \+ \(Number\(l\?\.load\) \|\| 0\), 0\);\n    const sComp = getMonolithicDeckStructuralComponents\(lastValidThickness\);\n    setDeadLoad\(Math\.round\(\(sComp\.structuralDeadLoad \+ nextFinishLoad\) \* 1000\) / 1000\);',
    '    recalculateDeadLoadWithFloorFinish(nextLayers);',
    "finish layer load handler",
)
m = sub1(
    m,
    r'    const nextFinishLoad = nextLayers\.reduce\(\(sum, l\) => sum \+ \(Number\(l\?\.load\) \|\| 0\), 0\);\n    const sComp = getMonolithicDeckStructuralComponents\(lastValidThickness\);\n    setDeadLoad\(Math\.round\(\(sComp\.structuralDeadLoad \+ nextFinishLoad\) \* 1000\) / 1000\);',
    '    recalculateDeadLoadWithFloorFinish(nextLayers);',
    "add finish layer handler",
)
m = sub1(
    m,
    r'    const nextFinishLoad = nextLayers\.reduce\(\(sum, l\) => sum \+ \(Number\(l\?\.load\) \|\| 0\), 0\);\n    const sComp = getMonolithicDeckStructuralComponents\(lastValidThickness\);\n    setDeadLoad\(Math\.round\(\(sComp\.structuralDeadLoad \+ nextFinishLoad\) \* 1000\) / 1000\);',
    '    recalculateDeadLoadWithFloorFinish(nextLayers);',
    "remove finish layer handler",
)

# При выборе типа загружаем его собственный defaultFloorFinishLayers.
type_select = '''  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setIsThicknessBlurred(false);
    const info = FLOOR_TYPES.find((t) => t.id === typeId);
    if (info) {
      const nextFinishLayers = Array.isArray(info.defaultFloorFinishLayers)
        ? info.defaultFloorFinishLayers.map((layer) => ({ ...layer }))
        : [];
      const nextFinishLoad = nextFinishLayers.reduce(
        (sum, layer) => sum + (Number(layer?.load) || 0),
        0
      );
      setFloorFinishLayers(nextFinishLayers);

      if (typeId === "precast_hollow_core") {
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        setDeadLoad(calculateDeadLoadForType(typeId, info.defaultThickness, nextFinishLoad));
      } else if (info.isConstantThickness) {
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        setDeadLoad(info.deadLoad);
      } else if (typeId === "monolithic_deck") {
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        const sComp = getMonolithicDeckStructuralComponents(info.defaultThickness);
        setDeadLoad(Math.round((sComp.structuralDeadLoad + nextFinishLoad) * 1000) / 1000);
      } else if (typeId === "monolithic_slab") {
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        setDeadLoad(calculateDeadLoadForType(typeId, info.defaultThickness, nextFinishLoad));
      } else if (typeId === "knauf_dry_floor") {
        const density = normalizeKnaufFillDensity(knaufFillDensity);
        setKnaufFillDensity(density);
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        setDeadLoad(calculateDeadLoadForType(typeId, info.defaultThickness, undefined, { knaufFillDensity: density }));
      } else if (typeId === "steel_grating") {
        const profile = getSteelGratingProfile(gratingProfileId);
        setGratingProfileId(profile.id);
        setThickness(profile.height);
        setLastValidThickness(profile.height);
        setDeadLoad(calculateDeadLoadForType(typeId, profile.height, undefined, { gratingProfileId: profile.id }));
      } else {
        setThickness(info.defaultThickness);
        setLastValidThickness(info.defaultThickness);
        setDeadLoad(calculateDeadLoadForType(typeId, info.defaultThickness));
      }
    }
  };
'''
m = sub1(
    m,
    r'  const handleTypeSelect = \(typeId\) => \{.*?\n    \};\n\n    // При изменении толщины перекрытия:',
    type_select.rstrip() + '\n\n  // При изменении толщины перекрытия:',
    "replace handleTypeSelect",
)

# При изменении толщины монолитной плиты учитываем отдельный floorFinishLoad.
m = m.replace(
    '''      } else if (selectedType === "knauf_dry_floor") {
        setDeadLoad(calculateDeadLoadForType(selectedType, numVal, undefined, { knaufFillDensity }));
      } else {''',
    '''      } else if (selectedType === "knauf_dry_floor") {
        setDeadLoad(calculateDeadLoadForType(selectedType, numVal, undefined, { knaufFillDensity }));
      } else if (selectedType === "monolithic_slab") {
        setDeadLoad(calculateDeadLoadForType(selectedType, numVal, floorFinishLoad));
      } else {''',
    1,
)

# Сохранение: три RC-типа используют structuralDeadLoad + floorFinishLoad.
save_calc = '''    const hasSeparateFloorFinish = typesWithSeparateFloorFinish.includes(currentTypeInfo.id);
    const currentFloorFinishLoad = hasSeparateFloorFinish
      ? floorFinishLayers.reduce((sum, l) => sum + (Number(l?.load) || 0), 0)
      : 0;

    const calculatedStructuralDL = hasSeparateFloorFinish
      ? calculateStructuralDeadLoadForType(currentTypeInfo.id, finalThick, floorCalcOptions)
      : currentTypeInfo.isConstantThickness
      ? currentTypeInfo.deadLoad
      : calculateDeadLoadForType(currentTypeInfo.id, finalThick, undefined, floorCalcOptions);

    const calculatedDL = hasSeparateFloorFinish
      ? calculateDeadLoadForType(
          currentTypeInfo.id,
          finalThick,
          currentFloorFinishLoad,
          floorCalcOptions
        )
      : currentTypeInfo.isConstantThickness
      ? currentTypeInfo.deadLoad
      : calculateDeadLoadForType(currentTypeInfo.id, finalThick, undefined, floorCalcOptions);
'''
m = sub1(
    m,
    r'    const calculatedStructuralDL =.*?\n\n    const calculatedDL =.*?;\n',
    save_calc,
    "replace save load calculations",
)

m = m.replace(
    '      floorFinishLayers: currentTypeInfo.id === "monolithic_deck" ? floorFinishLayers : [],',
    '      floorFinishLayers: hasSeparateFloorFinish ? floorFinishLayers : [],',
    1,
)

# Для ПК/ПБ и монолитной плиты показываем, что состав пола уже учтен отдельно.
ui_anchor = '              {/* Выбор толщины и массы перекрытия */}'
if ui_anchor not in m:
    raise SystemExit("modal: UI thickness anchor not found")
ui_note = '''              {["precast_hollow_core", "monolithic_slab"].includes(selectedType) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    marginBottom: "12px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "6px",
                    fontSize: "0.8em",
                  }}
                >
                  <span style={{ color: "#065f46", fontWeight: 600 }}>
                    Состав пола учитывается отдельно от несущей конструкции
                  </span>
                  <span style={{ color: "#047857", fontWeight: 700 }}>
                    {floorFinishLoad} кг/м²
                  </span>
                </div>
              )}

'''
m = m.replace(ui_anchor, ui_note + ui_anchor, 1)

# Корректная подпись total deadLoad для всех типов с отдельным составом пола.
m = m.replace(
    '''                      {selectedType === "monolithic_deck"
                        ? "Постоянная нагрузка deadLoad (кг/м²):"
                        : "Собственный вес конструкции (кг/м²):"}''',
    '''                      {typesWithSeparateFloorFinish.includes(selectedType)
                        ? "Постоянная нагрузка deadLoad (кг/м²):"
                        : "Собственный вес конструкции (кг/м²):"}''',
    1,
)

modal_path.write_text(m, encoding="utf-8")

print("Task 6.15 source patch applied")
