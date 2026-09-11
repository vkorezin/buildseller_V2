import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FLOOR_TYPES,
  STEEL_GRATING_PROFILES,
  DEFAULT_STEEL_GRATING_PROFILE_ID,
  KNAUF_FILL_DENSITY_PRESETS,
  DEFAULT_KNAUF_FILL_DENSITY,
  normalizeKnaufFillDensity,
  getSteelGratingProfile,
  LIVE_LOAD_PRESETS,
  SAFETY_FACTOR_PRESETS,
  RESPONSIBILITY_FACTORS,
  DEFAULT_FLOOR_STRUCTURE,
  calculateDeadLoadForType,
  calculateStructuralDeadLoadForType,
  getMonolithicDeckStructuralComponents,
  calculateFloorFinishLoad,
  calculateMezzanineQBase,
  getAutoColumnSpans,
  getLayersForTypeAndThickness,
  getValidFloorElevations,
  validateFloorThickness,
} from "./floorStructureConstants";

export default function FloorStructureModal({
  isOpen,
  onClose,
  initialStructure,
  onSave,
  storiesCount = 2,
  spanWidth = 18,
  spansCount = 1,
  buildingLength = 36,
  height = 6,
}) {
  const totalBldgWidth = (Number(spansCount) || 1) * (Number(spanWidth) || 18);
  const totalBldgLength = Number(buildingLength) || 36;

  const [mezzanineWidth, setMezzanineWidth] = useState(() => {
    return initialStructure?.mezzanineWidth != null ? initialStructure.mezzanineWidth : null;
  });

  const [mezzanineLength, setMezzanineLength] = useState(() => {
    return initialStructure?.mezzanineLength != null ? initialStructure.mezzanineLength : null;
  });

  const [selectedType, setSelectedType] = useState(() => {
    return initialStructure?.type || DEFAULT_FLOOR_STRUCTURE.type;
  });

  const [thickness, setThickness] = useState(() => {
    const init = initialStructure || DEFAULT_FLOOR_STRUCTURE;
    const typeId = init.type || DEFAULT_FLOOR_STRUCTURE.type;
    const typeInfo = FLOOR_TYPES.find((t) => t.id === typeId) || FLOOR_TYPES[0];
    return typeInfo.isConstantThickness
      ? typeInfo.defaultThickness
      : (init.thickness ?? typeInfo.defaultThickness);
  });

  const [lastValidThickness, setLastValidThickness] = useState(() => {
    const init = initialStructure || DEFAULT_FLOOR_STRUCTURE;
    const typeId = init.type || DEFAULT_FLOOR_STRUCTURE.type;
    const typeInfo = FLOOR_TYPES.find((t) => t.id === typeId) || FLOOR_TYPES[0];
    return typeInfo.isConstantThickness
      ? typeInfo.defaultThickness
      : (init.thickness ?? typeInfo.defaultThickness);
  });

  const [isThicknessBlurred, setIsThicknessBlurred] = useState(false);

    const [knaufFillDensity, setKnaufFillDensity] = useState(() =>
      normalizeKnaufFillDensity(initialStructure?.knaufFillDensity)
    );
    const [gratingProfileId, setGratingProfileId] = useState(() =>
      getSteelGratingProfile(initialStructure?.gratingProfileId).id
    );

  const typesWithSeparateFloorFinish = [
    "monolithic_deck",
    "precast_hollow_core",
    "monolithic_slab",
  ];

  const [floorFinishLayers, setFloorFinishLayers] = useState(() => {
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

  const [deadLoad, setDeadLoad] = useState(() => {
    return initialStructure?.deadLoad ?? DEFAULT_FLOOR_STRUCTURE.deadLoad;
  });

  const [partitionsLoad, setPartitionsLoad] = useState(() => {
    return initialStructure?.partitionsLoad ?? DEFAULT_FLOOR_STRUCTURE.partitionsLoad;
  });

  const [liveLoad, setLiveLoad] = useState(() => {
    return initialStructure?.liveLoad !== undefined &&
      initialStructure?.liveLoad !== null &&
      initialStructure?.liveLoad !== "" &&
      !isNaN(Number(initialStructure.liveLoad))
      ? Number(initialStructure.liveLoad)
      : DEFAULT_FLOOR_STRUCTURE.liveLoad;
  });

  const [safetyFactor, setSafetyFactor] = useState(() => {
    return initialStructure?.safetyFactor ?? DEFAULT_FLOOR_STRUCTURE.safetyFactor;
  });

  const [responsibilityFactor, setResponsibilityFactor] = useState(() => {
    return (
      initialStructure?.responsibilityFactor ??
      DEFAULT_FLOOR_STRUCTURE.responsibilityFactor
    );
  });

  // Отметки пола этажей (м)
  const [storyElevations, setStoryElevations] = useState(() => {
    return getValidFloorElevations(
      storiesCount,
      height,
      initialStructure?.storyElevations
    );
  });

  // Режим пролетов для промежуточных стоек
  const [columnSpansMode, setColumnSpansMode] = useState(() => {
    return initialStructure?.columnSpansMode || "auto";
  });

  const [customSpans, setCustomSpans] = useState(() => {
    if (
      Array.isArray(initialStructure?.columnSpans) &&
      initialStructure.columnSpans.length > 0
    ) {
      return initialStructure.columnSpans;
    }
    return getAutoColumnSpans(spanWidth);
  });

  // Синхронизация состояния при каждом открытии модального окна
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

  const currentTypeInfo = useMemo(() => {
      return (
        FLOOR_TYPES.find((t) => t.id === selectedType) || FLOOR_TYPES[0]
      );
    }, [selectedType]);

    const selectedGratingProfile = useMemo(
      () => getSteelGratingProfile(gratingProfileId),
      [gratingProfileId]
    );

    const isDeadLoadComputed =
      currentTypeInfo.isConstantThickness ||
      selectedType === "monolithic_deck" ||
      selectedType === "monolithic_slab" ||
      selectedType === "knauf_dry_floor" ||
      selectedType === "steel_grating";

  // Валидация толщины перекрытия (источник истины — thicknessRange текущего типа)
  const { isThicknessValid, thicknessErrorMessage } = useMemo(() => {
    if (selectedType === "steel_grating") {
      return { isThicknessValid: true, thicknessErrorMessage: null };
    }
    if (currentTypeInfo.isConstantThickness) {
      return { isThicknessValid: true, thicknessErrorMessage: null };
    }
    const [minT, maxT] = currentTypeInfo.thicknessRange || [0, 9999];
    if (thickness === "" || thickness === null || thickness === undefined) {
      return {
        isThicknessValid: false,
        thicknessErrorMessage: isThicknessBlurred
          ? `Толщина должна быть от ${minT} до ${maxT} мм.`
          : null,
      };
    }
    const numT = Number(thickness);
    if (isNaN(numT) || numT < minT || numT > maxT) {
      return {
        isThicknessValid: false,
        thicknessErrorMessage: `Толщина должна быть от ${minT} до ${maxT} мм.`,
      };
    }
    return { isThicknessValid: true, thicknessErrorMessage: null };
  }, [currentTypeInfo, selectedType, thickness, isThicknessBlurred]);

  const hasThicknessError = Boolean(thicknessErrorMessage);

  // Расчет слоев чистового пола (топпинг, стяжка и т.д.)
  const floorFinishLoad = useMemo(() => {
    if (!Array.isArray(floorFinishLayers) || floorFinishLayers.length === 0) {
      return 0;
    }
    return calculateFloorFinishLoad(floorFinishLayers);
  }, [floorFinishLayers]);

  // Компоненты несущей конструкции для Н75 (по последней валидной толщине)
  const monoDeckComponents = useMemo(() => {
    return getMonolithicDeckStructuralComponents(lastValidThickness);
  }, [lastValidThickness]);

  // Собственный вес несущей конструкции перекрытия (без пола и перегородок)
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

  // Динамический расчет слоев пирога с учетом толщины бетона (по последней валидной толщине)
  const dynamicLayers = useMemo(() => {
      return getLayersForTypeAndThickness(currentTypeInfo, lastValidThickness, {
        knaufFillDensity,
        gratingProfileId,
      });
    }, [currentTypeInfo, lastValidThickness, knaufFillDensity, gratingProfileId]);

  // Валидированные отметки этажей с учетом низа конструкций покрытия height
  const validElevations = useMemo(() => {
    return getValidFloorElevations(storiesCount, height, storyElevations);
  }, [storiesCount, height, storyElevations]);

  const recalculateDeadLoadWithFloorFinish = (layers) => {
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

  // Изменение нагрузки отдельного слоя чистового пола
  const handleFloorFinishLayerLoadChange = (idx, rawVal) => {
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

  // Изменение названия слоя чистового пола
  const handleFloorFinishLayerNameChange = (idx, newName) => {
    const nextLayers = floorFinishLayers.map((layer, i) => {
      if (i === idx) {
        return { ...layer, name: newName };
      }
      return layer;
    });
    setFloorFinishLayers(nextLayers);
  };

  // Добавление слоя чистового пола
  const handleAddFloorFinishLayer = () => {
    const nextLayers = [
      ...floorFinishLayers,
      { name: "Стяжка / плитка / покрытие", load: 20 },
    ];
    setFloorFinishLayers(nextLayers);
    recalculateDeadLoadWithFloorFinish(nextLayers);
  };

  // Удаление слоя чистового пола
  const handleRemoveFloorFinishLayer = (idx) => {
    if (floorFinishLayers.length <= 1) return;
    const nextLayers = floorFinishLayers.filter((_, i) => i !== idx);
    setFloorFinishLayers(nextLayers);
    recalculateDeadLoadWithFloorFinish(nextLayers);
  };

  // Изменение отметки пола конкретного этажа
  const handleFloorElevationChange = (idx, rawVal) => {
    const val = parseFloat(rawVal);
    const next = [...validElevations];
    const prevH = idx === 0 ? 0 : next[idx - 1];
    const nextH = idx === next.length - 1 ? Number(height) : next[idx + 1];

    // Должна быть строго выше предыдущего этажа (+0.2м) и не выше следующего этажа / низа конструкций
    const minH = Math.round((prevH + 0.2) * 100) / 100;
    const maxH = Math.round(nextH * 100) / 100;

    if (!isNaN(val)) {
      next[idx] = Math.max(minH, Math.min(maxH, Math.round(val * 100) / 100));
      setStoryElevations(next);
    }
  };

  // Сброс отметок этажей на равномерный шаг
  const handleResetUniformElevations = () => {
    setStoryElevations(getValidFloorElevations(storiesCount, height, null));
  };

  // Автоматические пролеты по правилу 9 м
  const autoSpans = useMemo(() => {
    return getAutoColumnSpans(spanWidth);
  }, [spanWidth]);

  // Эффективные пролеты
  const effectiveSpans = useMemo(() => {
    if (columnSpansMode === "manual") {
      return customSpans && customSpans.length > 0 ? customSpans : autoSpans;
    }
    return autoSpans;
  }, [columnSpansMode, customSpans, autoSpans]);

  const sumSpans = useMemo(() => {
    return (
      Math.round(
        (effectiveSpans || []).reduce((acc, v) => acc + (Number(v) || 0), 0) * 100
      ) / 100
    );
  }, [effectiveSpans]);

  const isSpansSumMatch = Math.abs(sumSpans - Number(spanWidth)) < 0.05;

  // При смене типа перекрытия
  const handleTypeSelect = (typeId) => {
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

  // При изменении толщины перекрытия:
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

    const handleKnaufFillDensityChange = (value) => {
      const density = normalizeKnaufFillDensity(value);
      setKnaufFillDensity(density);
      if (selectedType === "knauf_dry_floor") {
        const thick = Number(lastValidThickness) || currentTypeInfo.defaultThickness || 70;
        setDeadLoad(calculateDeadLoadForType("knauf_dry_floor", thick, undefined, { knaufFillDensity: density }));
      }
    };

    const handleGratingProfileChange = (profileId) => {
      const profile = getSteelGratingProfile(profileId);
      setGratingProfileId(profile.id);
      setThickness(profile.height);
      setLastValidThickness(profile.height);
      setIsThicknessBlurred(false);
      setDeadLoad(calculateDeadLoadForType("steel_grating", profile.height, undefined, { gratingProfileId: profile.id }));
    };

    // Выбор пресета полезной нагрузки
  const handleLiveLoadPreset = (preset) => {
    setLiveLoad(preset.value);
    if (preset.factor) {
      setSafetyFactor(preset.factor);
    }
  };

  const lastValidCalcResultsRef = useRef(null);

  // Инженерный расчет нагрузок (без расчета расхода стали на антресоль)
  // Если толщина некорректна — calculateMezzanineQBase не вызывается, отображается последнее корректное значение
  const calcResults = useMemo(() => {
    if (!isThicknessValid && lastValidCalcResultsRef.current) {
      return lastValidCalcResultsRef.current;
    }

    const g_dead = Number(deadLoad) || 0;
    const g_part =
      partitionsLoad !== "" && partitionsLoad != null && !isNaN(Number(partitionsLoad))
        ? Number(partitionsLoad)
        : 0;
    const g_tot = g_dead + g_part; // постоянная нормативная нагрузка

    const p_live =
      liveLoad !== undefined && liveLoad !== null && liveLoad !== "" && !isNaN(Number(liveLoad))
        ? Number(liveLoad)
        : 0; // полезная нормативная нагрузка
    const q_norm = g_tot + p_live; // полная нормативная кг/м²

    const gamma_f = Number(safetyFactor) || 1.2;
    const gamma_n = Number(responsibilityFactor) || 1.0;

    // Полная расчетная нагрузка кг/м² с использованием единой формулы calculateMezzanineQBase
    const q_design = calculateMezzanineQBase({
      deadLoad: g_dead,
      partitionsLoad: g_part,
      liveLoad: p_live,
      safetyFactor: gamma_f,
      responsibilityFactor: gamma_n,
    });

    // В кН/м² (1 кПа = 100 кг/м²)
    const q_norm_kpa = (q_norm / 100).toFixed(2);
    const q_design_kpa = (q_design / 100).toFixed(2);

    // Расчетная нагрузка на промежуточную стойку от грузовой площади (шаг рам 6 м)
    const numSubSpans = Math.max(1, (effectiveSpans || []).length);
    const avgSubBay = (Number(spanWidth) || 18) / numSubSpans;
    const tribArea = avgSubBay * 6.0; // м² грузовой площади на промежуточную стойку
    const colLoadTon =
      numSubSpans > 1 ? ((q_design * tribArea) / 1000).toFixed(1) : "—";

    const res = {
      g_tot,
      g_dead,
      g_part,
      p_live,
      q_norm,
      q_norm_kpa,
      q_design,
      q_design_kpa,
      avgSubBay: avgSubBay.toFixed(1),
      tribArea: tribArea.toFixed(1),
      colLoadTon,
      numSubSpans,
    };

    lastValidCalcResultsRef.current = res;
    return res;
  }, [
    isThicknessValid,
    deadLoad,
    partitionsLoad,
    liveLoad,
    safetyFactor,
    responsibilityFactor,
    spanWidth,
    effectiveSpans,
  ]);

  const handleSave = () => {
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
      responsibilityFactor: safeResponsibilityFactor,
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.2em",
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🏢 Конструкция межэтажного перекрытия и колонны</span>
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.82em",
                color: "#64748b",
              }}
            >
              Выбор состава перекрытия, расчет нагрузок по СП 20.13330.2016 и расстановка колонн 1-го этажа
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5em",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
              borderRadius: "4px",
            }}
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Section 1: Выбор типа перекрытия */}
          <div>
            <div
              style={{
                fontSize: "0.95em",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>1. Тип несущего перекрытия</span>
              <span
                style={{
                  fontSize: "0.8em",
                  fontWeight: "normal",
                  color: "#64748b",
                  backgroundColor: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                Всего вариантов: {FLOOR_TYPES.length}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "10px",
              }}
            >
              {FLOOR_TYPES.map((ft) => {
                const isSelected = ft.id === selectedType;
                return (
                  <div
                    key={ft.id}
                    onClick={() => handleTypeSelect(ft.id)}
                    style={{
                      border: isSelected
                        ? "2px solid #0969da"
                        : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px",
                      backgroundColor: isSelected ? "#f0f7ff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.88em",
                            color: isSelected ? "#0969da" : "#1e293b",
                          }}
                        >
                          {ft.shortName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.72em",
                            color: "#059669",
                            backgroundColor: "#ecfdf5",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600,
                          }}
                        >
                          {ft.fireRating}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.76em",
                          color: "#475569",
                          marginBottom: "6px",
                          lineHeight: 1.3,
                        }}
                      >
                        {ft.name}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.74em",
                        color: "#64748b",
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "6px",
                        marginTop: "6px",
                      }}
                    >
                      <span>
                        Вес: <strong>{ft.deadLoad} кг/м²</strong>
                      </span>
                      <span>
                        Шаг балок: <strong>{ft.beamSpacing}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Карточка выбранного типа с пирогом и выбором толщины */}
            <div
              style={{
                marginTop: "12px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.9em", color: "#0f172a" }}>
                    Состав пирога: {currentTypeInfo.name}
                  </strong>
                  <div style={{ fontSize: "0.75em", color: "#64748b" }}>
                    Нормативная база: {currentTypeInfo.standard}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.75em",
                    color: "#0369a1",
                    backgroundColor: "#e0f2fe",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Рекомендуемый шаг несущих балок: {currentTypeInfo.beamSpacing}
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.78em",
                  color: "#475569",
                  marginBottom: "10px",
                  lineHeight: 1.4,
                }}
              >
                {currentTypeInfo.features}
              </div>

              {/* Слои перекрытия */}
              {selectedType === "monolithic_deck" ? (
                <div>
                  {/* 1. Несущая конструкция перекрытия */}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85em",
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🏗️</span>
                        <span>Несущая конструкция перекрытия</span>
                        <span style={{ fontSize: "0.8em", color: "#64748b", fontWeight: 400 }}>
                          (СП 266.1325800.2016, ГОСТ 24045-2016)
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.85em",
                          fontWeight: 700,
                          color: "#1d4ed8",
                          backgroundColor: "#eff6ff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Итого: {monoDeckComponents.structuralDeadLoad} кг/м²
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.78em" }}>
                      {/* 1. Бетон */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "6px 8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            1. Монолитный тяжелый бетон B25 (ρ = 2450 кг/м³)
                          </span>
                          <div style={{ color: "#64748b", fontSize: "0.92em", marginTop: "2px", lineHeight: 1.35 }}>
                            • В гофрах профлиста Н75: 0.0291 м³/м² (71.3 кг/м²)<br />
                            • Над гофрами (hc = {monoDeckComponents.hc} мм, min ≥ 40 мм): {monoDeckComponents.aboveVolume.toFixed(4)} м³/м² ({monoDeckComponents.aboveConcreteLoad} кг/м²)<br />
                            • Суммарный объем бетона: <strong>{monoDeckComponents.totalVolume} м³/м²</strong>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: "#1e40af", whiteSpace: "nowrap", marginLeft: "8px" }}>
                          {monoDeckComponents.concreteLoad} кг/м²
                        </span>
                      </div>

                      {/* 2. Профлист */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            2. Профилированный оцинкованный лист Н75-750-0.8 (ГОСТ 24045-2016)
                          </span>
                          <div style={{ color: "#64748b", fontSize: "0.92em" }}>
                            Несъемная опалубка с высотой трапециевидной гофры 75 мм
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                          {monoDeckComponents.profileSheetLoad} кг/м²
                        </span>
                      </div>

                      {/* 3. Арматура */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            3. Арматурная сетка в полке и стержни в ребрах
                          </span>
                          <div style={{ color: "#64748b", fontSize: "0.92em" }}>
                            Расчетное и конструктивное армирование полки плиты и гофр
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                          {monoDeckComponents.reinforcementLoad} кг/м²
                        </span>
                      </div>

                      {/* 4. Балки */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>
                            4. Стальные второстепенные балки (шаг 2.5–3.0 м)
                          </span>
                          <div style={{ color: "#64748b", fontSize: "0.92em" }}>
                            Опирание сталебетонной плиты на балочную клетку
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                          {monoDeckComponents.secondaryBeamsLoad} кг/м²
                        </span>
                      </div>

                      {/* Итого несущая */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          backgroundColor: "#eff6ff",
                          borderRadius: "6px",
                          border: "1px solid #bfdbfe",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ color: "#1e3a8a" }}>
                          Итого несущая конструкция (structuralDeadLoad):
                        </span>
                        <span style={{ color: "#1d4ed8", fontSize: "1.05em" }}>
                          {monoDeckComponents.structuralDeadLoad} кг/м²
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Состав пола */}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85em",
                        fontWeight: 700,
                        color: "#0f172a",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🪵</span>
                        <span>Состав пола (чистовые покрытия и стяжки)</span>
                        <span
                          style={{
                            fontSize: "0.8em",
                            color: "#059669",
                            backgroundColor: "#ecfdf5",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 500,
                          }}
                        >
                          Считается отдельно от несущей конструкции
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.85em",
                          fontWeight: 700,
                          color: "#059669",
                          backgroundColor: "#ecfdf5",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Итого: {floorFinishLoad} кг/м²
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.78em" }}>
                      {floorFinishLayers.map((layer, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            backgroundColor: "#ffffff",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ color: "#64748b", fontWeight: 600, minWidth: "16px" }}>
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={layer.name}
                            onChange={(e) => handleFloorFinishLayerNameChange(idx, e.target.value)}
                            placeholder="Название слоя пола"
                            style={{
                              flex: 1,
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.95em",
                              color: "#0f172a",
                            }}
                          />
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={layer.load}
                              onChange={(e) => handleFloorFinishLayerLoadChange(idx, e.target.value)}
                              style={{
                                width: "65px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.95em",
                                fontWeight: 700,
                                textAlign: "right",
                                color: "#0f172a",
                              }}
                            />
                            <span style={{ color: "#64748b", fontWeight: 600 }}>кг/м²</span>
                          </div>
                          {floorFinishLayers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFloorFinishLayer(idx)}
                              style={{
                                padding: "3px 6px",
                                borderRadius: "4px",
                                border: "1px solid #fca5a5",
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: "0.9em",
                              }}
                              title="Удалить слой пола"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "2px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleAddFloorFinishLayer}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px dashed #0969da",
                            backgroundColor: "#f0f7ff",
                            color: "#0969da",
                            fontSize: "0.82em",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          + Добавить слой пола
                        </button>
                        <span style={{ color: "#64748b", fontSize: "0.82em" }}>
                          Стандартный топпинг/покрытие: <strong>15 кг/м²</strong>
                        </span>
                      </div>

                      {/* Итого состав пола */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          backgroundColor: "#f0fdf4",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ color: "#166534" }}>
                          Итого состав пола (floorFinishLoad):
                        </span>
                        <span style={{ color: "#15803d", fontSize: "1.05em" }}>
                          {floorFinishLoad} кг/м²
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Итого постоянная нагрузка перекрытия */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1.5px solid #0969da",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.84em", color: "#0f172a" }}>
                        Итого постоянная нагрузка (deadLoad):
                      </div>
                      <div style={{ fontSize: "0.74em", color: "#475569" }}>
                        structuralDeadLoad ({monoDeckComponents.structuralDeadLoad}) + floorFinishLoad ({floorFinishLoad})
                      </div>
                    </div>
                    <div style={{ fontSize: "1.15em", fontWeight: 800, color: "#0969da" }}>
                      {deadLoad} кг/м²
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "14px",
                  }}
                >
                  {dynamicLayers.map((layer, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.78em",
                        padding: "5px 8px",
                        backgroundColor: layer.highlight
                          ? "#eff6ff"
                          : idx % 2 === 0
                          ? "#ffffff"
                          : "transparent",
                        borderRadius: "4px",
                        border: layer.highlight ? "1px solid #bfdbfe" : "none",
                      }}
                    >
                      <span
                        style={{
                          color: layer.highlight ? "#1d4ed8" : "#334155",
                          fontWeight: layer.highlight ? 600 : 400,
                        }}
                      >
                        {dynamicLayers.length > 1 ? `${idx + 1}. ` : ""}{layer.name}
                      </span>
                      <span
                        style={{
                          color: layer.highlight ? "#1e40af" : "#64748b",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {layer.thickness > 0 ? `${layer.thickness} мм • ` : ""}
                        {layer.weight} кг/м²
                      </span>
                    </div>
                  ))}
                  {dynamicLayers.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.8em",
                        padding: "6px 8px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "4px",
                        borderTop: "1px solid #cbd5e1",
                        fontWeight: 700,
                        marginTop: "2px",
                      }}
                    >
                      <span style={{ color: "#334155" }}>
                        Итого расчетный собственный вес слоев:
                      </span>
                      <span style={{ color: "#0969da" }}>
                        {dynamicLayers.reduce((s, l) => s + (Number(l.weight) || 0), 0)} кг/м²
                      </span>
                    </div>
                  )}
                </div>
              )}

              {["precast_hollow_core", "monolithic_slab"].includes(selectedType) && (
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

              {/* Выбор толщины и массы перекрытия */}
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "12px",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8em",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    {selectedType === "steel_grating" ? "Тип решётчатого настила:" : "Толщина перекрытия (мм):"}
                  </label>

                  {selectedType === "steel_grating" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <select
              value={gratingProfileId}
              onChange={(e) => handleGratingProfileChange(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #94a3b8", backgroundColor: "#ffffff", color: "#0f172a", fontSize: "0.85em", fontWeight: 600 }}
            >
              {STEEL_GRATING_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} — h={profile.height} мм, {profile.gratingWeight} кг/м²
                </option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", padding: "8px 10px", borderRadius: "6px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: "0.78em", color: "#065f46" }}>
              <span>Высота несущей полосы: <strong>{selectedGratingProfile.height} мм</strong></span>
              <span>Масса решётки: <strong>{selectedGratingProfile.gratingWeight} кг/м²</strong></span>
              <span>Второстепенные балки: <strong>22 кг/м²</strong></span>
              <span>Итого deadLoad: <strong>{deadLoad} кг/м²</strong></span>
            </div>
          </div>
        ) : currentTypeInfo.isConstantThickness ? (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "0.82em",
                        color: "#334155",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "1.1em" }}>🔒</span>
                      <span>
                        <strong>Постоянная толщина {currentTypeInfo.defaultThickness} мм</strong>{" "}
                        ({currentTypeInfo.constantThicknessNote || currentTypeInfo.name}).
                        Собственный вес зафиксирован: <strong>{currentTypeInfo.deadLoad} кг/м²</strong>.
                      </span>
                    </div>
                  ) : (
                    <div>
                      {/* Быстрые кнопки пресетов толщины */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        {(currentTypeInfo.thicknessPresets || []).map((tPreset) => {
                          const isAct = Number(thickness) === tPreset;
                          return (
                            <button
                              key={tPreset}
                              type="button"
                              onClick={() => {
                                setIsThicknessBlurred(false);
                                handleThicknessChange(tPreset);
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "0.78em",
                                border: isAct
                                  ? "1.5px solid #0969da"
                                  : "1px solid #cbd5e1",
                                backgroundColor: isAct ? "#eff6ff" : "#ffffff",
                                color: isAct ? "#0969da" : "#334155",
                                fontWeight: isAct ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {tPreset} мм{" "}
                              {tPreset === currentTypeInfo.defaultThickness
                                ? " (стандарт)"
                                : ""}
                            </button>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          fontSize: "0.75em",
                          color: "#059669",
                          marginBottom: "8px",
                          fontWeight: 500,
                        }}
                      >
                        {selectedType === "monolithic_deck" ? (
                          <span>
                            💡 При изменении толщины пересчитывается несущая конструкция:{" "}
                            <strong>{monoDeckComponents.structuralDeadLoad} кг/м²</strong>. Состав пола:{" "}
                            <strong>{floorFinishLoad} кг/м²</strong>. Итого deadLoad:{" "}
                            <strong>{deadLoad} кг/м²</strong>.
                          </span>
                        ) : (
                          <span>
                            💡 При изменении толщины собственный вес перекрытия пересчитывается автоматически:{" "}
                            <strong>{deadLoad} кг/м²</strong>.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedType === "knauf_dry_floor" && (
        <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #c4b5fd", backgroundColor: "#faf5ff" }}>
          <div style={{ fontSize: "0.8em", fontWeight: 700, color: "#5b21b6", marginBottom: "7px" }}>
            Расчётная плотность сухой засыпки
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
            {KNAUF_FILL_DENSITY_PRESETS.map((density) => {
              const isActive = Number(knaufFillDensity) === density;
              return (
                <button
                  key={density}
                  type="button"
                  onClick={() => handleKnaufFillDensityChange(density)}
                  style={{ padding: "5px 12px", borderRadius: "5px", border: isActive ? "1.5px solid #7c3aed" : "1px solid #cbd5e1", backgroundColor: isActive ? "#ede9fe" : "#ffffff", color: isActive ? "#6d28d9" : "#334155", fontWeight: isActive ? 700 : 500, cursor: "pointer" }}
                >
                  {density} кг/м³{density === DEFAULT_KNAUF_FILL_DENSITY ? " (по умолчанию)" : ""}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: "0.75em", color: "#6b21a8" }}>
            Элемент пола 20 мм: <strong>24 кг/м²</strong> · засыпка {Math.max(0, Number(lastValidThickness) - 20)} мм · профлист: <strong>18 кг/м²</strong> · итог: <strong>{deadLoad} кг/м²</strong>
          </div>
        </div>
      )}

      {/* Поля точной корректировки */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.76em",
                        fontWeight: 600,
                        color: hasThicknessError ? "#dc2626" : "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      {selectedType === "steel_grating" ? "Высота несущей полосы (мм):" : "Толщина плиты / настила (мм):"}
                    </label>
                    <input
                      type="number"
                      disabled={currentTypeInfo.isConstantThickness || selectedType === "steel_grating"}
                      readOnly={currentTypeInfo.isConstantThickness || selectedType === "steel_grating"}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: hasThicknessError
                          ? "1.5px solid #dc2626"
                          : "1px solid #cbd5e1",
                        fontSize: "0.85em",
                        boxSizing: "border-box",
                        backgroundColor: currentTypeInfo.isConstantThickness
                          ? "#f1f5f9"
                          : hasThicknessError
                          ? "#fef2f2"
                          : "#ffffff",
                        color: currentTypeInfo.isConstantThickness
                          ? "#64748b"
                          : hasThicknessError
                          ? "#991b1b"
                          : "#0f172a",
                        cursor: currentTypeInfo.isConstantThickness
                          ? "not-allowed"
                          : "text",
                        outline: "none",
                      }}
                      value={thickness}
                      onChange={(e) => handleThicknessChange(e.target.value)}
                      onBlur={() => setIsThicknessBlurred(true)}
                    />
                    {hasThicknessError && (
                      <div
                        style={{
                          fontSize: "0.78em",
                          color: "#dc2626",
                          marginTop: "4px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>⚠️</span>
                        <span>{thicknessErrorMessage}</span>
                      </div>
                    )}
                    {currentTypeInfo.isConstantThickness && (
                      <div style={{ fontSize: "0.72em", color: "#64748b", marginTop: "3px" }}>
                        Фиксированная заводская толщина (не редактируется)
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.76em",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      {typesWithSeparateFloorFinish.includes(selectedType)
                        ? "Постоянная нагрузка deadLoad (кг/м²):"
                        : "Собственный вес конструкции (кг/м²):"}
                    </label>
                    <input
                      type="number"
                      disabled={isDeadLoadComputed}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85em",
                        boxSizing: "border-box",
                        backgroundColor:
                          currentTypeInfo.isConstantThickness || selectedType === "monolithic_deck"
                            ? "#f1f5f9"
                            : "#ffffff",
                        color:
                          currentTypeInfo.isConstantThickness || selectedType === "monolithic_deck"
                            ? "#0f172a"
                            : "#0f172a",
                        fontWeight: selectedType === "monolithic_deck" ? 700 : 400,
                      }}
                      value={deadLoad}
                      onChange={(e) => setDeadLoad(Number(e.target.value))}
                    />
                    {selectedType === "monolithic_deck" && (
                      <div style={{ fontSize: "0.72em", color: "#64748b", marginTop: "3px" }}>
                        Несущая ({monoDeckComponents.structuralDeadLoad}) + Пол ({floorFinishLoad})
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.76em",
                        fontWeight: 600,
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Перегородки и сети (кг/м²):
                    </label>
                    <input
                      type="number"
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85em",
                        boxSizing: "border-box",
                        backgroundColor: "#ffffff",
                      }}
                      value={partitionsLoad}
                      onChange={(e) => setPartitionsLoad(Number(e.target.value))}
                    />
                    <div style={{ fontSize: "0.72em", color: "#64748b", marginTop: "3px" }}>
                      СП 20.13330 (в deadLoad и состав пола не входит)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Полезная нагрузка */}
          <div>
            <div
              style={{
                fontSize: "0.95em",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>2. Полезная нагрузка на перекрытие pₙ</span>
              <span
                style={{
                  fontSize: "0.8em",
                  fontWeight: "normal",
                  color: "#0969da",
                  backgroundColor: "#eff6ff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                СП 20.13330.2016 (Таблица 8.3)
              </span>
            </div>

            {/* Быстрые кнопки пресетов */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              {LIVE_LOAD_PRESETS.map((preset) => {
                const isSelected = Number(liveLoad) === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleLiveLoadPreset(preset)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: isSelected
                        ? "1.5px solid #0969da"
                        : "1px solid #cbd5e1",
                      backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                      color: isSelected ? "#0969da" : "#334155",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.78em",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <strong>{preset.title}</strong> — {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Ручной ввод полезной нагрузки */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "0.82em",
                  fontWeight: 600,
                  color: "#334155",
                  whiteSpace: "nowrap",
                }}
              >
                Полезная нагрузка (вручную):
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  style={{
                    width: "100px",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88em",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                  value={liveLoad}
                  onChange={(e) => setLiveLoad(e.target.value === "" ? "" : Number(e.target.value))}
                />
                <span style={{ fontSize: "0.8em", color: "#64748b" }}>
                  кг/м² ≈ {(Number(liveLoad) / 100).toFixed(1)} кПа (кН/м²)
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Коэффициенты надежности */}
          <div>
            <div
              style={{
                fontSize: "0.95em",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>3. Коэффициенты запаса и надежности по ответственности</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {/* Коэффициент надежности по полезной нагрузке gamma_f */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78em",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  Коэффициент надежности по нагрузке γf:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {SAFETY_FACTOR_PRESETS.map((sf) => {
                    const isSelected = Number(safetyFactor) === sf.value;
                    return (
                      <div
                        key={sf.value}
                        onClick={() => setSafetyFactor(sf.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: isSelected
                            ? "1.5px solid #0969da"
                            : "1px solid #cbd5e1",
                          backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.82em",
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? "#0969da" : "#1e293b",
                          }}
                        >
                          {sf.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72em",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {sf.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Коэффициент ответственности ГОСТ 27751 */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78em",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "6px",
                  }}
                >
                  Коэффициент надежности по ответственности здания γn:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {RESPONSIBILITY_FACTORS.map((rf) => {
                    const isSelected = Number(responsibilityFactor) === rf.value;
                    return (
                      <div
                        key={rf.value}
                        onClick={() => setResponsibilityFactor(rf.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: isSelected
                            ? "1.5px solid #10b981"
                            : "1px solid #cbd5e1",
                          backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.82em",
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? "#047857" : "#1e293b",
                          }}
                        >
                          {rf.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72em",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {rf.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Пролеты для промежуточных колонн этажа */}
          <div>
            <div
              style={{
                fontSize: "0.95em",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span>4. Пролеты для промежуточных колонн 1-го этажа</span>
              <span
                style={{
                  fontSize: "0.8em",
                  color: "#0369a1",
                  backgroundColor: "#e0f2fe",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                }}
              >
                Ширина пролета здания: {spanWidth} м
              </span>
            </div>

            {/* Переключатель режимов: авто / вручную */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setColumnSpansMode("auto")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.82em",
                  border:
                    columnSpansMode === "auto"
                      ? "1.5px solid #0969da"
                      : "1px solid #cbd5e1",
                  backgroundColor:
                    columnSpansMode === "auto" ? "#eff6ff" : "#ffffff",
                  color: columnSpansMode === "auto" ? "#0969da" : "#334155",
                  fontWeight: columnSpansMode === "auto" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                ⚙️ Автоматически (правило ≤ 9 м)
              </button>

              <button
                type="button"
                onClick={() => {
                  setColumnSpansMode("manual");
                  if (!customSpans || customSpans.length === 0) {
                    setCustomSpans(getAutoColumnSpans(spanWidth));
                  }
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.82em",
                  border:
                    columnSpansMode === "manual"
                      ? "1.5px solid #0969da"
                      : "1px solid #cbd5e1",
                  backgroundColor:
                    columnSpansMode === "manual" ? "#eff6ff" : "#ffffff",
                  color: columnSpansMode === "manual" ? "#0969da" : "#334155",
                  fontWeight: columnSpansMode === "manual" ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                ✏️ Вручную (задать пролеты стоек)
              </button>
            </div>

            {columnSpansMode === "auto" ? (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "0.82em",
                  color: "#475569",
                  lineHeight: 1.4,
                }}
              >
                {spanWidth < 9 ? (
                  <div>
                    ℹ️ При ширине пролета <strong>{spanWidth} м</strong> (&lt; 9 м)
                    промежуточные стойки не требуются. Перекрытие перекрывает пролет
                    одним шагом <strong>{spanWidth} м</strong> без внутренних опор.
                  </div>
                ) : (
                  <div>
                    ℹ️ Согласно нормативному шагу (при ширине ≥ 9 м делим пополам и каждые
                    следующие 9 м), пролет здания <strong>{spanWidth} м</strong> автоматически
                    разделен на <strong>{autoSpans.length}</strong> равных пролета по{" "}
                    <strong>{autoSpans[0]} м</strong> (устанавливается{" "}
                    <strong>{autoSpans.length - 1}</strong> промежуточная стойка в каждом пролете).
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                {/* Быстрые пресеты для ручного режима */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "12px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.76em",
                      color: "#64748b",
                      marginRight: "4px",
                    }}
                  >
                    Быстрый выбор:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomSpans([Number(spanWidth)])}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.76em",
                      border: "1px solid #cbd5e1",
                      backgroundColor:
                        customSpans.length === 1 ? "#eff6ff" : "#ffffff",
                      color:
                        customSpans.length === 1 ? "#0969da" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    Без стоек (1 × {spanWidth} м)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round((spanWidth / 2) * 100) / 100;
                      setCustomSpans([
                        half,
                        Math.round((spanWidth - half) * 100) / 100,
                      ]);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.76em",
                      border: "1px solid #cbd5e1",
                      backgroundColor:
                        customSpans.length === 2 ? "#eff6ff" : "#ffffff",
                      color:
                        customSpans.length === 2 ? "#0969da" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    2 пролета по {(spanWidth / 2).toFixed(1)} м
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const third = Math.round((spanWidth / 3) * 100) / 100;
                      setCustomSpans([
                        third,
                        third,
                        Math.round((spanWidth - 2 * third) * 100) / 100,
                      ]);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.76em",
                      border: "1px solid #cbd5e1",
                      backgroundColor:
                        customSpans.length === 3 ? "#eff6ff" : "#ffffff",
                      color:
                        customSpans.length === 3 ? "#0969da" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    3 пролета по {(spanWidth / 3).toFixed(1)} м
                  </button>

                  {spanWidth >= 12 && (
                    <button
                      type="button"
                      onClick={() => {
                        const count = Math.max(2, Math.round(spanWidth / 6));
                        const step = Math.round((spanWidth / count) * 100) / 100;
                        const res = [];
                        let rem = spanWidth;
                        for (let i = 0; i < count; i++) {
                          if (i === count - 1) {
                            res.push(Math.round(rem * 100) / 100);
                          } else {
                            res.push(step);
                            rem -= step;
                          }
                        }
                        setCustomSpans(res);
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.76em",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      Шаг ~6 м ({Math.max(2, Math.round(spanWidth / 6))} прол.)
                    </button>
                  )}
                </div>

                {/* Поля ввода для каждого пролета */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  {customSpans.map((sp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#ffffff",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.76em",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Пролет {idx + 1}:
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max={spanWidth}
                        value={sp}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const next = [...customSpans];
                          next[idx] = val;
                          setCustomSpans(next);
                        }}
                        style={{
                          width: "60px",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.85em",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      />
                      <span style={{ fontSize: "0.76em", color: "#64748b" }}>
                        м
                      </span>

                      {customSpans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = customSpans.filter((_, i) => i !== idx);
                            setCustomSpans(next);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.85em",
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                          title="Удалить пролет"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const next = [...customSpans, 6.0];
                      setCustomSpans(next);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px dashed #0969da",
                      borderRadius: "6px",
                      color: "#0969da",
                      fontSize: "0.78em",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Добавить пролет
                  </button>
                </div>

                {/* Контроль соответствия суммарной ширины */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    fontSize: "0.8em",
                    paddingTop: "10px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Сумма пролетов:</span>
                    <strong
                      style={{
                        color: isSpansSumMatch ? "#15803d" : "#b45309",
                        fontSize: "1.05em",
                      }}
                    >
                      {sumSpans.toFixed(2)} м
                    </strong>
                    <span>
                      (ширина здания: <strong>{spanWidth} м</strong>)
                    </span>
                    {isSpansSumMatch ? (
                      <span style={{ color: "#15803d", fontWeight: 700 }}>
                        ✅ Совпадает
                      </span>
                    ) : (
                      <span style={{ color: "#b45309", fontWeight: 600 }}>
                        ⚠️ Не совпадает (разница:{" "}
                        {(spanWidth - sumSpans).toFixed(2)} м)
                      </span>
                    )}
                  </div>

                  {!isSpansSumMatch && (
                    <button
                      type="button"
                      onClick={() => {
                        if (customSpans.length === 1) {
                          setCustomSpans([Number(spanWidth)]);
                        } else {
                          const sumOthers = customSpans
                            .slice(0, -1)
                            .reduce((a, b) => a + (Number(b) || 0), 0);
                          const last = Math.max(
                            0.5,
                            Math.round((spanWidth - sumOthers) * 100) / 100
                          );
                          setCustomSpans([...customSpans.slice(0, -1), last]);
                        }
                      }}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#fef3c7",
                        border: "1px solid #f59e0b",
                        color: "#92400e",
                        borderRadius: "4px",
                        fontSize: "0.78em",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ⚖️ Выровнять последний пролет под {spanWidth} м
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Высотные отметки этажей (отметки пола) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.95em", color: "#0f172a" }}>
                  5. Высотные отметки пола этажей
                </strong>
                <div style={{ fontSize: "0.76em", color: "#64748b", marginTop: "2px" }}>
                  Низ несущих конструкций покрытия: <strong>+{Number(height).toFixed(2)} м</strong>.
                  Отметка каждого этажа не может превышать низ балок и отметку пола следующего этажа.
                </div>
              </div>

              {storiesCount > 1 && (
                <button
                  type="button"
                  onClick={handleResetUniformElevations}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "0.78em",
                    border: "1px solid #93c5fd",
                    backgroundColor: "#eff6ff",
                    color: "#0284c7",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Разделить высоту здания поровну между всеми этажами"
                >
                  ⚡ Равномерный шаг этажей
                </button>
              )}
            </div>

            {storiesCount <= 1 ? (
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "0.82em",
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                Здание запроектировано 1-этажным (пол 1-го этажа на базовой отметке <strong>±0.000 м</strong>).
                Чтобы настроить отметки межэтажных перекрытий, укажите количество этажей 2 или более в параметрах быстрого расчета.
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  {/* 1 этаж (всегда 0.000) */}
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.75em", color: "#64748b", marginBottom: "3px" }}>
                      1 этаж (уровень земли)
                    </div>
                    <div style={{ fontSize: "1.15em", fontWeight: 700, color: "#1e293b" }}>
                      ± 0.000 м
                    </div>
                    <div style={{ fontSize: "0.72em", color: "#94a3b8", marginTop: "3px" }}>
                      Базовый чистый пол
                    </div>
                  </div>

                  {/* Промежуточные этажи */}
                  {validElevations.map((elev, idx) => {
                    const floorNum = idx + 2;
                    const prevH = idx === 0 ? 0 : validElevations[idx - 1];
                    const nextH =
                      idx === validElevations.length - 1
                        ? Number(height)
                        : validElevations[idx + 1];
                    const floorClearH = (elev - prevH).toFixed(2);
                    const maxAllowed = nextH;
                    const minAllowed = (prevH + 0.2).toFixed(2);

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 12px",
                          backgroundColor: "#ffffff",
                          border: "1.5px solid #3b82f6",
                          borderRadius: "8px",
                          boxShadow: "0 1px 3px rgba(59,130,246,0.12)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "5px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8em",
                              fontWeight: 700,
                              color: "#1d4ed8",
                            }}
                          >
                            {floorNum} этаж (пол)
                          </span>
                          <span
                            style={{
                              fontSize: "0.72em",
                              color: "#059669",
                              backgroundColor: "#ecfdf5",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            h = {floorClearH} м
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "0.95em",
                              fontWeight: 700,
                              color: "#1e293b",
                            }}
                          >
                            +
                          </span>
                          <input
                            type="number"
                            step="0.05"
                            min={minAllowed}
                            max={maxAllowed}
                            value={elev}
                            onChange={(e) => handleFloorElevationChange(idx, e.target.value)}
                            style={{
                              width: "100%",
                              padding: "5px 8px",
                              borderRadius: "5px",
                              border: "1px solid #93c5fd",
                              fontSize: "0.95em",
                              fontWeight: 700,
                              color: "#0f172a",
                              boxSizing: "border-box",
                              textAlign: "center",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.82em",
                              fontWeight: 600,
                              color: "#64748b",
                            }}
                          >
                            м
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "0.7em",
                            color: "#64748b",
                            marginTop: "5px",
                            lineHeight: 1.3,
                          }}
                        >
                          Пределы: от <strong>+{minAllowed} м</strong> до{" "}
                          <strong>+{Number(maxAllowed).toFixed(2)} м</strong>{" "}
                          {floorNum === storiesCount
                            ? "(низ балок)"
                            : `(${floorNum + 1} эт)`}
                        </div>
                      </div>
                    );
                  })}

                  {/* Верхний предел: Низ несущих конструкций */}
                  <div
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #86efac",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ fontSize: "0.75em", color: "#166534", marginBottom: "3px" }}>
                      Низ конструкций покрытия
                    </div>
                    <div style={{ fontSize: "1.15em", fontWeight: 700, color: "#15803d" }}>
                      + {Number(height).toFixed(2)} м
                    </div>
                    <div style={{ fontSize: "0.72em", color: "#166534", marginTop: "3px" }}>
                      Верхний предел отметок
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "0.75em",
                    color: "#0369a1",
                    backgroundColor: "#f0f9ff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  💡 <strong>Правило СП:</strong> Отметка пола каждого этажа не может быть выше низа несущих конструкций покрытия (+{Number(height).toFixed(2)} м) и отметки пола следующего вышележащего этажа.
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Габариты антресоли (ширина и длина перекрытия) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid #bfdbfe",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.95em", color: "#1e3a8a" }}>
                  6. Габариты антресоли (ширина и длина перекрытия)
                </strong>
                <div style={{ fontSize: "0.76em", color: "#64748b", marginTop: "2px" }}>
                  Возможность сделать перекрытие не на весь пролет (частичная антресоль) или не на всю длину здания.
                </div>
              </div>

              {(() => {
                const effW =
                  mezzanineWidth != null && Number(mezzanineWidth) > 0
                    ? Math.min(totalBldgWidth, Number(mezzanineWidth))
                    : totalBldgWidth;
                const effL =
                  mezzanineLength != null && Number(mezzanineLength) > 0
                    ? Math.min(totalBldgLength, Number(mezzanineLength))
                    : totalBldgLength;
                const isPartW = effW < totalBldgWidth - 0.05;
                const isPartL = effL < totalBldgLength - 0.05;
                const area = Math.round(effW * effL * 10) / 10;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.78em",
                        backgroundColor: isPartW || isPartL ? "#fef3c7" : "#dbeafe",
                        color: isPartW || isPartL ? "#92400e" : "#1e40af",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontWeight: 600,
                      }}
                    >
                      {isPartW || isPartL
                        ? `Частичная (${effW} × ${effL} м = ${area} м²)`
                        : `На все здание (${effW} × ${effL} м = ${area} м²)`}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "14px",
              }}
            >
              {/* Ширина перекрытия */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "0.85em", fontWeight: 700, color: "#334155" }}>
                    Ширина антресоли (пролет)
                  </span>
                  <span style={{ fontSize: "0.75em", color: "#64748b" }}>
                    здание: {totalBldgWidth} м
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setMezzanineWidth(null)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      fontSize: "0.78em",
                      fontWeight: mezzanineWidth == null ? 700 : 500,
                      border: mezzanineWidth == null ? "1px solid #2563eb" : "1px solid #cbd5e1",
                      backgroundColor: mezzanineWidth == null ? "#eff6ff" : "#ffffff",
                      color: mezzanineWidth == null ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Вся ({totalBldgWidth}м)
                  </button>

                  {Number(spansCount) > 1 && (
                    <button
                      type="button"
                      onClick={() => setMezzanineWidth(Number(spanWidth))}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "5px",
                        fontSize: "0.78em",
                        fontWeight: Number(mezzanineWidth) === Number(spanWidth) ? 700 : 500,
                        border: Number(mezzanineWidth) === Number(spanWidth) ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: Number(mezzanineWidth) === Number(spanWidth) ? "#eff6ff" : "#ffffff",
                        color: Number(mezzanineWidth) === Number(spanWidth) ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      1 пролет ({spanWidth}м)
                    </button>
                  )}

                  {Number(spanWidth) >= 10 && (
                    <button
                      type="button"
                      onClick={() => setMezzanineWidth(Math.round(Number(spanWidth) / 2))}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "5px",
                        fontSize: "0.78em",
                        fontWeight: Number(mezzanineWidth) === Math.round(Number(spanWidth) / 2) ? 700 : 500,
                        border: Number(mezzanineWidth) === Math.round(Number(spanWidth) / 2) ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: Number(mezzanineWidth) === Math.round(Number(spanWidth) / 2) ? "#eff6ff" : "#ffffff",
                        color: Number(mezzanineWidth) === Math.round(Number(spanWidth) / 2) ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      1/2 пролета ({Math.round(Number(spanWidth) / 2)}м)
                    </button>
                  )}

                  {[6, 9, 12].filter(w => w < totalBldgWidth && w !== Number(spanWidth) && w !== Math.round(Number(spanWidth) / 2)).map(w => (
                    <button
                      key={`m-modal-w-${w}`}
                      type="button"
                      onClick={() => setMezzanineWidth(w)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "5px",
                        fontSize: "0.78em",
                        fontWeight: Number(mezzanineWidth) === w ? 700 : 500,
                        border: Number(mezzanineWidth) === w ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: Number(mezzanineWidth) === w ? "#eff6ff" : "#ffffff",
                        color: Number(mezzanineWidth) === w ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {w}м
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.8em", color: "#64748b" }}>Точная ширина:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={totalBldgWidth}
                    value={mezzanineWidth != null ? mezzanineWidth : ""}
                    placeholder={String(totalBldgWidth)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") setMezzanineWidth(null);
                      else {
                        const num = parseFloat(v);
                        if (!isNaN(num)) setMezzanineWidth(Math.max(1, Math.min(totalBldgWidth, num)));
                      }
                    }}
                    style={{
                      width: "70px",
                      padding: "4px 8px",
                      borderRadius: "5px",
                      border: "1px solid #94a3b8",
                      fontSize: "0.9em",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "0.8em", color: "#64748b" }}>м</span>
                  {mezzanineWidth != null && Number(mezzanineWidth) < totalBldgWidth && (
                    <span style={{ fontSize: "0.75em", color: "#d97706", marginLeft: "auto" }}>
                      ⚠️ Не на весь пролет
                    </span>
                  )}
                </div>
              </div>

              {/* Длина перекрытия */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "0.85em", fontWeight: 700, color: "#334155" }}>
                    Длина антресоли (вдоль здания)
                  </span>
                  <span style={{ fontSize: "0.75em", color: "#64748b" }}>
                    здание: {totalBldgLength} м
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setMezzanineLength(null)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "5px",
                      fontSize: "0.78em",
                      fontWeight: mezzanineLength == null ? 700 : 500,
                      border: mezzanineLength == null ? "1px solid #2563eb" : "1px solid #cbd5e1",
                      backgroundColor: mezzanineLength == null ? "#eff6ff" : "#ffffff",
                      color: mezzanineLength == null ? "#1d4ed8" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Вся ({totalBldgLength}м)
                  </button>

                  {[6, 12, 18, 24, 30, 36, 48].filter(l => l < totalBldgLength).map(l => (
                    <button
                      key={`m-modal-l-${l}`}
                      type="button"
                      onClick={() => setMezzanineLength(l)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "5px",
                        fontSize: "0.78em",
                        fontWeight: Number(mezzanineLength) === l ? 700 : 500,
                        border: Number(mezzanineLength) === l ? "1px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: Number(mezzanineLength) === l ? "#eff6ff" : "#ffffff",
                        color: Number(mezzanineLength) === l ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {l}м
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.8em", color: "#64748b" }}>Точная длина:</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={totalBldgLength}
                    value={mezzanineLength != null ? mezzanineLength : ""}
                    placeholder={String(totalBldgLength)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") setMezzanineLength(null);
                      else {
                        const num = parseFloat(v);
                        if (!isNaN(num)) setMezzanineLength(Math.max(1, Math.min(totalBldgLength, num)));
                      }
                    }}
                    style={{
                      width: "70px",
                      padding: "4px 8px",
                      borderRadius: "5px",
                      border: "1px solid #94a3b8",
                      fontSize: "0.9em",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "0.8em", color: "#64748b" }}>м</span>
                  {mezzanineLength != null && Number(mezzanineLength) < totalBldgLength && (
                    <span style={{ fontSize: "0.75em", color: "#d97706", marginLeft: "auto" }}>
                      ⚠️ Часть длины
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: Инженерный сводный расчет нагрузок */}
          <div
            style={{
              backgroundColor: "#f1f5f9",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid #cbd5e1",
            }}
          >
            <div
              style={{
                fontSize: "0.9em",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📊 7. Инженерная сводка нагрузок</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "0.75em", color: "#64748b" }}>
                  Постоянная нагрузка gₙ:
                </div>
                <div
                  style={{
                    fontSize: "1.1em",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  {calcResults.g_tot} кг/м²
                </div>
                <div style={{ fontSize: "0.7em", color: "#94a3b8" }}>
                  Плита ({deadLoad}) + перегородки ({partitionsLoad})
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "0.75em", color: "#64748b" }}>
                  Полезная нагрузка pₙ:
                </div>
                <div
                  style={{
                    fontSize: "1.1em",
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                >
                  {calcResults.p_live} кг/м²
                </div>
                <div style={{ fontSize: "0.7em", color: "#94a3b8" }}>
                  {(calcResults.p_live / 100).toFixed(1)} кПа (кН/м²)
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1.5px solid #0969da",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75em",
                    color: "#0969da",
                    fontWeight: 600,
                  }}
                >
                  Расчетная нагрузка qрасч:
                </div>
                <div
                  style={{
                    fontSize: "1.25em",
                    fontWeight: 800,
                    color: "#0969da",
                  }}
                >
                  {calcResults.q_design} кг/м²
                </div>
                <div style={{ fontSize: "0.72em", color: "#64748b" }}>
                  {calcResults.q_design_kpa} кН/м² (с учетом γf и γn)
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "0.75em", color: "#64748b" }}>
                  Нагрузка на стойку 1-го эт.:
                </div>
                <div
                  style={{
                    fontSize: "1.1em",
                    fontWeight: 700,
                    color: "#047857",
                  }}
                >
                  {calcResults.colLoadTon !== "—"
                    ? `≈ ${calcResults.colLoadTon} тн`
                    : "Без стоек"}
                </div>
                <div style={{ fontSize: "0.7em", color: "#94a3b8" }}>
                  {calcResults.colLoadTon !== "—"
                    ? `Грузовая площадь ~${calcResults.tribArea} м²`
                    : "Опирание только по краям"}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.78em",
                color: "#475569",
                lineHeight: 1.4,
                backgroundColor: "#ffffff",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px dashed #cbd5e1",
              }}
            >
              ℹ️ <strong>Промежуточные колонны первого этажа:</strong>{" "}
              {calcResults.numSubSpans > 1 ? (
                <>
                  Пролет здания разделен на <strong>{calcResults.numSubSpans}</strong>{" "}
                  пролета со стойками (средний шаг ~
                  <strong>{calcResults.avgSubBay} м</strong>).
                </>
              ) : (
                <>
                  Без промежуточных стоек (перекрытие перекрывает полный пролет{" "}
                  <strong>{spanWidth} м</strong>).
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "0.82em", color: "#64748b" }}>
            Выбрано: <strong>{currentTypeInfo.shortName}</strong>, толщина{" "}
            {isThicknessValid ? (
              <strong>{thickness} мм</strong>
            ) : (
              <strong style={{ color: "#dc2626" }}>
                {thickness ? `${thickness} мм (недопустимо)` : "не указана"}
              </strong>
            )}
            , полезная {liveLoad} кг/м²
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e2e8f0",
                color: "#334155",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.85em",
                cursor: "pointer",
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={!isThicknessValid}
              onClick={handleSave}
              style={{
                padding: "8px 20px",
                backgroundColor: isThicknessValid ? "#28a745" : "#94a3b8",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.85em",
                cursor: isThicknessValid ? "pointer" : "not-allowed",
                opacity: isThicknessValid ? 1 : 0.65,
                boxShadow: isThicknessValid ? "0 2px 4px rgba(40,167,69,0.3)" : "none",
              }}
            >
              ✅ Применить к расчету
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
