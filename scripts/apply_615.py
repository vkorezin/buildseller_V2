from pathlib import Path


def replace_between(text, start_marker, end_marker, replacement, label):
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"{label}: start marker not found")
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f"{label}: end marker not found")
    return text[:start] + replacement + text[end:]


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"{label}: source fragment not found")
    return text.replace(old, new, 1)


# -----------------------------------------------------------------------------
# floorStructureConstants.js
# -----------------------------------------------------------------------------
constants_path = Path("src/floorStructureConstants.js")
c = constants_path.read_text(encoding="utf-8")

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
c = replace_between(
    c,
    '  {\n    id: "precast_hollow_core",',
    '  {\n    id: "monolithic_slab",',
    pb_block,
    "PB type block",
)

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
c = replace_between(
    c,
    '  {\n    id: "monolithic_slab",',
    '  {\n    id: "precast_block_composite",',
    slab_block,
    "monolithic slab type block",
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
    return Math.max(225, Math.round(thick * 2.5 + 50));
  }
  return calculateDeadLoadForType(typeId, thick, 0, options);
}

'''
c = replace_between(
    c,
    'export function calculateStructuralDeadLoadForType(typeId, t, options = {}) {',
    '/**\n * Суммирование слоев состава пола.',
    structural_fn,
    "structural dead-load function",
)

pb_case = '''    case "precast_hollow_core": {
      const structural = 280;
      const finish =
        floorFinishLoad !== undefined && floorFinishLoad !== null && !isNaN(Number(floorFinishLoad))
          ? Number(floorFinishLoad)
          : 50;
      return Math.round((structural + finish) * 1000) / 1000;
    }
'''
c = replace_between(
    c,
    '    case "precast_hollow_core":',
    '    case "monolithic_deck":',
    pb_case,
    "PB deadLoad case",
)

slab_case = '''    case "monolithic_slab": {
      const structural = Math.max(225, Math.round(thick * 2.5 + 50));
      const finish =
        floorFinishLoad !== undefined && floorFinishLoad !== null && !isNaN(Number(floorFinishLoad))
          ? Number(floorFinishLoad)
          : 25;
      return Math.round((structural + finish) * 1000) / 1000;
    }
'''
c = replace_between(
    c,
    '    case "monolithic_slab":',
    '    case "precast_block_composite":',
    slab_case,
    "slab deadLoad case",
)

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
slab_layers = '''  if (typeInfo.id === "monolithic_slab") {
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

'''
c = replace_between(
    c,
    '  if (typeInfo.id === "monolithic_slab") {',
    '  if (typeInfo.id === "steel_grating") {',
    pb_layers + slab_layers,
    "RC dynamic layers",
)

constants_path.write_text(c, encoding="utf-8")


# -----------------------------------------------------------------------------
# FloorStructureModal.js
# -----------------------------------------------------------------------------
modal_path = Path("src/FloorStructureModal.js")
m = modal_path.read_text(encoding="utf-8")

helper = '''  const typesWithSeparateFloorFinish = [
    "monolithic_deck",
    "precast_hollow_core",
    "monolithic_slab",
  ];

'''
m = replace_once(
    m,
    '  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {',
    helper + '  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {',
    "insert separate-finish type list",
)

finish_state = '''  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {
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
m = replace_between(
    m,
    '  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {',
    '  const [deadLoad, setDeadLoad] = useState(() => {',
    finish_state,
    "floor finish state",
)

use_effect = '''  // Синхронизация состояния при каждом открытии модального окна
  useEffect(() => {
    if (isOpen) {
      const init = initialStructure || DEFAULT_FLOOR_STRUCTURE;
      const typeId = init.type || DEFAULT_FLOOR_STRUCTURE.type;
      const typeInfo = FLOOR_TYPES.find((t) => t.id === typeId) || FLOOR_TYPES[0];

      setSelectedType(typeId);
      const initDensity = normalizeKnaufFillDensity(init.knaufFillDensity);
      const initGratingProfile = getSteelGratingProfile(init.gratingProfileId);
      setKnaufFillDensity(initDensity);
      setGratingProfileId(initGratingProfile.id);

      const th = typeId === "steel_grating"
        ? initGratingProfile.height
        : typeInfo.isConstantThickness
        ? typeInfo.defaultThickness
        : (init.thickness ?? typeInfo.defaultThickness);
      setThickness(th);
      setLastValidThickness(th);
      setIsThicknessBlurred(false);

      const defaultFinishLayers = Array.isArray(typeInfo.defaultFloorFinishLayers)
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
      } else if (typeId === "monolithic_deck") {
        const sComp = getMonolithicDeckStructuralComponents(th);
        setDeadLoad(Math.round((sComp.structuralDeadLoad + initFloorFinishLoad) * 1000) / 1000);
      } else if (typeId === "monolithic_slab") {
        setDeadLoad(calculateDeadLoadForType(typeId, th, initFloorFinishLoad));
      } else if (typeId === "knauf_dry_floor") {
        setDeadLoad(
          calculateDeadLoadForType(typeId, th, undefined, {
            knaufFillDensity: initDensity,
          })
        );
      } else if (typeId === "steel_grating") {
        setDeadLoad(
          calculateDeadLoadForType(typeId, initGratingProfile.height, undefined, {
            gratingProfileId: initGratingProfile.id,
          })
        );
      } else if (typeInfo.isConstantThickness) {
        setDeadLoad(typeInfo.deadLoad);
      } else {
        setDeadLoad(
          init.deadLoad != null
            ? init.deadLoad
            : calculateDeadLoadForType(typeId, th)
        );
      }

      setPartitionsLoad(
        init.partitionsLoad !== undefined &&
        init.partitionsLoad !== null &&
        !isNaN(Number(init.partitionsLoad))
          ? Number(init.partitionsLoad)
          : DEFAULT_FLOOR_STRUCTURE.partitionsLoad
      );
      setLiveLoad(
        init.liveLoad !== undefined &&
        init.liveLoad !== null &&
        init.liveLoad !== "" &&
        !isNaN(Number(init.liveLoad))
          ? Number(init.liveLoad)
          : DEFAULT_FLOOR_STRUCTURE.liveLoad
      );
      setSafetyFactor(init.safetyFactor ?? DEFAULT_FLOOR_STRUCTURE.safetyFactor);
      setResponsibilityFactor(
        init.responsibilityFactor ?? DEFAULT_FLOOR_STRUCTURE.responsibilityFactor
      );
      setStoryElevations(
        getValidFloorElevations(storiesCount, height, init.storyElevations)
      );
      setColumnSpansMode(init.columnSpansMode || "auto");
      setCustomSpans(
        Array.isArray(init.columnSpans) && init.columnSpans.length > 0
          ? init.columnSpans
          : getAutoColumnSpans(spanWidth)
      );
      setMezzanineWidth(
        init.mezzanineWidth != null ? init.mezzanineWidth : null
      );
      setMezzanineLength(
        init.mezzanineLength != null ? init.mezzanineLength : null
      );
    }
  }, [isOpen, initialStructure, storiesCount, height, spanWidth]);

'''
m = replace_between(
    m,
    '  // Синхронизация состояния при каждом открытии модального окна\n  useEffect(() => {',
    '  const currentTypeInfo = useMemo(() => {',
    use_effect,
    "modal open synchronization",
)

computed_block = '''    const isDeadLoadComputed =
      currentTypeInfo.isConstantThickness ||
      selectedType === "monolithic_deck" ||
      selectedType === "monolithic_slab" ||
      selectedType === "knauf_dry_floor" ||
      selectedType === "steel_grating";

'''
m = replace_between(
    m,
    '    const isDeadLoadComputed =',
    '  // Валидация толщины перекрытия',
    computed_block,
    "computed deadLoad flag",
)

structural_memo = '''  // Собственный вес несущей конструкции перекрытия (без пола и перегородок)
  const structuralDeadLoad = useMemo(() => {
    if (typesWithSeparateFloorFinish.includes(selectedType)) {
      return calculateStructuralDeadLoadForType(selectedType, lastValidThickness, {
        knaufFillDensity,
        gratingProfileId,
      });
    }
    return Number(deadLoad) || 0;
  }, [
    selectedType,
    lastValidThickness,
    deadLoad,
    knaufFillDensity,
    gratingProfileId,
  ]);

'''
m = replace_between(
    m,
    '  // Собственный вес несущей конструкции перекрытия (без пола и перегородок)',
    '  // Динамический расчет слоев пирога',
    structural_memo,
    "structural deadLoad memo",
)

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
m = replace_once(
    m,
    '  // Изменение нагрузки отдельного слоя чистового пола\n',
    recalc_helper + '  // Изменение нагрузки отдельного слоя чистового пола\n',
    "insert finish recalculation helper",
)

load_handler = '''  const handleFloorFinishLayerLoadChange = (idx, rawVal) => {
    const nextLayers = floorFinishLayers.map((layer, i) => {
      if (i === idx) {
        return {
          ...layer,
          load: rawVal === "" ? "" : Number(rawVal),
        };
      }
      return layer;
    });
    setFloorFinishLayers(nextLayers);
    recalculateDeadLoadWithFloorFinish(nextLayers);
  };

'''
m = replace_between(
    m,
    '  const handleFloorFinishLayerLoadChange = (idx, rawVal) => {',
    '  // Изменение названия слоя чистового пола',
    load_handler,
    "finish load handler",
)

add_handler = '''  const handleAddFloorFinishLayer = () => {
    const nextLayers = [
      ...floorFinishLayers,
      { name: "Стяжка / плитка / покрытие", load: 20 },
    ];
    setFloorFinishLayers(nextLayers);
    recalculateDeadLoadWithFloorFinish(nextLayers);
  };

'''
m = replace_between(
    m,
    '  const handleAddFloorFinishLayer = () => {',
    '  // Удаление слоя чистового пола',
    add_handler,
    "add finish layer handler",
)

remove_handler = '''  const handleRemoveFloorFinishLayer = (idx) => {
    if (floorFinishLayers.length <= 1) return;
    const nextLayers = floorFinishLayers.filter((_, i) => i !== idx);
    setFloorFinishLayers(nextLayers);
    recalculateDeadLoadWithFloorFinish(nextLayers);
  };

'''
m = replace_between(
    m,
    '  const handleRemoveFloorFinishLayer = (idx) => {',
    '  // Изменение отметки пола конкретного этажа',
    remove_handler,
    "remove finish layer handler",
)

handle_type_select = '''  const handleTypeSelect = (typeId) => {
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
m = replace_between(
    m,
    '  const handleTypeSelect = (typeId) => {',
    '  // При изменении толщины перекрытия:',
    handle_type_select,
    "type select handler",
)

thickness_handler = '''  // При изменении толщины перекрытия:
  // Если толщина некорректна — НЕ вызывать calculateDeadLoadForType, getMonolithicDeckStructuralComponents!
  // Последнее корректное значение нагрузки остается до исправления ошибки.
  const handleThicknessChange = (newThickness) => {
    if (selectedType === "steel_grating") return;
    setThickness(newThickness);
    if (currentTypeInfo.isConstantThickness) return;
    if (newThickness === "" || newThickness === null || newThickness === undefined) return;

    const numVal = Number(newThickness);
    const [minT, maxT] = currentTypeInfo.thicknessRange || [0, 9999];
    if (isNaN(numVal) || numVal < minT || numVal > maxT) return;

    setLastValidThickness(numVal);
    if (selectedType === "monolithic_deck") {
      const sComp = getMonolithicDeckStructuralComponents(numVal);
      setDeadLoad(Math.round((sComp.structuralDeadLoad + floorFinishLoad) * 1000) / 1000);
    } else if (selectedType === "knauf_dry_floor") {
      setDeadLoad(calculateDeadLoadForType(selectedType, numVal, undefined, { knaufFillDensity }));
    } else if (selectedType === "monolithic_slab") {
      setDeadLoad(calculateDeadLoadForType(selectedType, numVal, floorFinishLoad));
    } else {
      setDeadLoad(calculateDeadLoadForType(selectedType, numVal));
    }
  };

'''
m = replace_between(
    m,
    '  // При изменении толщины перекрытия:',
    '    const handleKnaufFillDensityChange = (value) => {',
    thickness_handler,
    "thickness change handler",
)

save_handler = '''  const handleSave = () => {
    if (!isThicknessValid) return;

    let finalThick = selectedType === "steel_grating"
      ? selectedGratingProfile.height
      : currentTypeInfo.isConstantThickness
      ? currentTypeInfo.defaultThickness
      : Number(thickness);

    const floorCalcOptions = {
      knaufFillDensity: normalizeKnaufFillDensity(knaufFillDensity),
      gratingProfileId: selectedGratingProfile.id,
    };

    const hasSeparateFloorFinish = typesWithSeparateFloorFinish.includes(currentTypeInfo.id);
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

    const safePartitionsLoad =
      partitionsLoad !== "" && partitionsLoad != null && !isNaN(Number(partitionsLoad))
        ? Number(partitionsLoad)
        : 50;

    const safeLiveLoad =
      liveLoad !== undefined && liveLoad !== null && liveLoad !== "" && !isNaN(Number(liveLoad))
        ? Number(liveLoad)
        : 400;
    const safeSafetyFactor = Number(safetyFactor) || 1.2;
    const safeResponsibilityFactor = Number(responsibilityFactor) || 1.0;
    const unifiedDesignLoadKg = calculateMezzanineQBase({
      deadLoad: calculatedDL,
      partitionsLoad: safePartitionsLoad,
      liveLoad: safeLiveLoad,
      safetyFactor: safeSafetyFactor,
    });

    const result = {
      type: currentTypeInfo.id,
      typeName: currentTypeInfo.name,
      shortName: currentTypeInfo.shortName,
      name: currentTypeInfo.name,
      thickness: finalThick,
      structuralDeadLoad: calculatedStructuralDL,
      floorFinishLayers: hasSeparateFloorFinish ? floorFinishLayers : [],
      floorFinishLoad: currentFloorFinishLoad,
      deadLoad: calculatedDL,
      partitionsLoad: safePartitionsLoad,
      liveLoad: safeLiveLoad,
      safetyFactor: safeSafetyFactor,
      responsibilityFactor: safeResponsibilityFactor,
      ...(currentTypeInfo.id === "knauf_dry_floor"
        ? { knaufFillDensity: floorCalcOptions.knaufFillDensity }
        : {}),
      ...(currentTypeInfo.id === "steel_grating"
        ? {
            gratingProfileId: selectedGratingProfile.id,
            gratingProfileName: selectedGratingProfile.name,
            gratingWeight: selectedGratingProfile.gratingWeight,
          }
        : {}),
      standard: currentTypeInfo.standard,
      codeRef: "СП 20.13330.2016 (п. 8.2.2), ГОСТ 27751-2014",
      designLoadKg: unifiedDesignLoadKg,
      normLoadKg: calculatedDL + safePartitionsLoad + safeLiveLoad,
      columnSpansMode,
      columnSpans: effectiveSpans,
      deckProfile: currentTypeInfo.id === "monolithic_deck" ? "Н75-750-0.8" : null,
      storyElevations: validElevations,
      mezzanineWidth:
        mezzanineWidth != null && !isNaN(Number(mezzanineWidth)) && Number(mezzanineWidth) > 0
          ? Number(mezzanineWidth)
          : null,
      mezzanineLength:
        mezzanineLength != null && !isNaN(Number(mezzanineLength)) && Number(mezzanineLength) > 0
          ? Number(mezzanineLength)
          : null,
    };
    onSave(result);
    onClose();
  };

'''
m = replace_between(
    m,
    '  const handleSave = () => {',
    '  if (!isOpen) return null;',
    save_handler,
    "save handler",
)

ui_anchor = '              {/* Выбор толщины и массы перекрытия */}'
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
m = replace_once(m, ui_anchor, ui_note + ui_anchor, "finish-load UI note")

m = replace_once(
    m,
    '''                      {selectedType === "monolithic_deck"
                        ? "Постоянная нагрузка deadLoad (кг/м²):"
                        : "Собственный вес конструкции (кг/м²):"}''',
    '''                      {typesWithSeparateFloorFinish.includes(selectedType)
                        ? "Постоянная нагрузка deadLoad (кг/м²):"
                        : "Собственный вес конструкции (кг/м²):"}''',
    "deadLoad field label",
)

modal_path.write_text(m, encoding="utf-8")

print("Task 6.15 source patch applied")
