import React, { useState, useMemo } from "react";
import {
  FLOOR_TYPES,
  LIVE_LOAD_PRESETS,
  SAFETY_FACTOR_PRESETS,
  RESPONSIBILITY_FACTORS,
  DEFAULT_FLOOR_STRUCTURE,
  calculateDeadLoadForType,
  getAutoColumnSpans,
  getLayersForTypeAndThickness,
  getValidFloorElevations,
} from "./floorStructureConstants";

export default function FloorStructureModal({
  isOpen,
  onClose,
  initialStructure,
  onSave,
  storiesCount = 2,
  spanWidth = 18,
  height = 6,
}) {
  const [selectedType, setSelectedType] = useState(() => {
    return initialStructure?.type || DEFAULT_FLOOR_STRUCTURE.type;
  });

  const [thickness, setThickness] = useState(() => {
    return initialStructure?.thickness ?? DEFAULT_FLOOR_STRUCTURE.thickness;
  });

  const [deadLoad, setDeadLoad] = useState(() => {
    return initialStructure?.deadLoad ?? DEFAULT_FLOOR_STRUCTURE.deadLoad;
  });

  const [partitionsLoad, setPartitionsLoad] = useState(() => {
    return initialStructure?.partitionsLoad ?? DEFAULT_FLOOR_STRUCTURE.partitionsLoad;
  });

  const [liveLoad, setLiveLoad] = useState(() => {
    return initialStructure?.liveLoad ?? DEFAULT_FLOOR_STRUCTURE.liveLoad;
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

  const currentTypeInfo = useMemo(() => {
    return (
      FLOOR_TYPES.find((t) => t.id === selectedType) || FLOOR_TYPES[0]
    );
  }, [selectedType]);

  // Динамический расчет слоев пирога с учетом толщины бетона
  const dynamicLayers = useMemo(() => {
    return getLayersForTypeAndThickness(currentTypeInfo, thickness);
  }, [currentTypeInfo, thickness]);

  // Валидированные отметки этажей с учетом низа конструкций покрытия height
  const validElevations = useMemo(() => {
    return getValidFloorElevations(storiesCount, height, storyElevations);
  }, [storiesCount, height, storyElevations]);

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
    const info = FLOOR_TYPES.find((t) => t.id === typeId);
    if (info) {
      if (info.isConstantThickness) {
        setThickness(220);
        setDeadLoad(330);
      } else {
        setThickness(info.defaultThickness);
        const computedWeight = calculateDeadLoadForType(typeId, info.defaultThickness);
        setDeadLoad(computedWeight);
      }
    }
  };

  // При изменении толщины перекрытия (вес пересчитывается автоматически, кроме пустотных плит)
  const handleThicknessChange = (newThickness) => {
    const val = Number(newThickness) || 0;
    setThickness(val);
    if (!currentTypeInfo.isConstantThickness) {
      const computedWeight = calculateDeadLoadForType(selectedType, val);
      setDeadLoad(computedWeight);
    }
  };

  // Выбор пресета полезной нагрузки
  const handleLiveLoadPreset = (preset) => {
    setLiveLoad(preset.value);
    if (preset.factor) {
      setSafetyFactor(preset.factor);
    }
  };

  // Инженерный расчет нагрузок (без расчета расхода стали на антресоль)
  const calcResults = useMemo(() => {
    const g_dead = Number(deadLoad) || 0;
    const g_part = Number(partitionsLoad) || 0;
    const g_tot = g_dead + g_part; // постоянная нормативная нагрузка

    const p_live = Number(liveLoad) || 0; // полезная нормативная нагрузка
    const q_norm = g_tot + p_live; // полная нормативная кг/м²

    const gamma_f = Number(safetyFactor) || 1.2;
    const gamma_n = Number(responsibilityFactor) || 1.0;
    const gamma_g = 1.1; // усредненный по СП 20.13330 для собственного веса

    // Полная расчетная нагрузка кг/м²
    const q_design = Math.round((g_tot * gamma_g + p_live * gamma_f) * gamma_n);

    // В кН/м² (1 кПа = 100 кг/м²)
    const q_norm_kpa = (q_norm / 100).toFixed(2);
    const q_design_kpa = (q_design / 100).toFixed(2);

    // Расчетная нагрузка на промежуточную стойку от грузовой площади (шаг рам 6 м)
    const numSubSpans = Math.max(1, (effectiveSpans || []).length);
    const avgSubBay = (Number(spanWidth) || 18) / numSubSpans;
    const tribArea = avgSubBay * 6.0; // м² грузовой площади на промежуточную стойку
    const colLoadTon =
      numSubSpans > 1 ? ((q_design * tribArea) / 1000).toFixed(1) : "—";

    return {
      g_tot,
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
  }, [
    deadLoad,
    partitionsLoad,
    liveLoad,
    safetyFactor,
    responsibilityFactor,
    spanWidth,
    effectiveSpans,
  ]);

  const handleSave = () => {
    const result = {
      type: currentTypeInfo.id,
      typeName: currentTypeInfo.name,
      shortName: currentTypeInfo.shortName,
      thickness: currentTypeInfo.isConstantThickness
        ? 220
        : Number(thickness) || currentTypeInfo.defaultThickness,
      deadLoad: currentTypeInfo.isConstantThickness
        ? 330
        : Number(deadLoad) || currentTypeInfo.deadLoad,
      partitionsLoad: Number(partitionsLoad) || 50,
      liveLoad: Number(liveLoad) || 400,
      safetyFactor: Number(safetyFactor) || 1.2,
      responsibilityFactor: Number(responsibilityFactor) || 1.0,
      standard: currentTypeInfo.standard,
      codeRef: "СП 20.13330.2016 (п. 8.2.2), ГОСТ 27751-2014",
      designLoadKg: calcResults.q_design,
      normLoadKg: calcResults.q_norm,
      columnSpansMode,
      columnSpans: effectiveSpans,
      deckProfile: "Н75-750-0.8",
      storyElevations: validElevations,
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

              {/* Слои перекрытия (динамический пересчет толщины и массы) */}
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
                      {idx + 1}. {layer.name}
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
              </div>

              {/* Поясняющая плашка учета бетона в гофрах профлиста Н75 */}
              {selectedType === "monolithic_deck" && (
                <div
                  style={{
                    marginBottom: "14px",
                    padding: "10px 12px",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #93c5fd",
                    borderRadius: "6px",
                    fontSize: "0.78em",
                    color: "#1e3a8a",
                    lineHeight: 1.45,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>ℹ️</span>
                    <span>
                      Учет бетона в гофрах профлиста Н75 (СП 266.1325800.2016, ГОСТ 24045-2016):
                    </span>
                  </div>
                  <div style={{ marginLeft: "4px" }}>
                    <div>
                      • <strong>Бетон в гофрах:</strong> объем заполнения трапеций гофр Н75 составляет <strong>0.042 м³/м²</strong> (масса <strong>103 кг/м²</strong>).
                    </div>
                    <div>
                      • <strong>Бетон над гофрами:</strong> сплошной слой над гребнем профлиста <strong>hc = {Math.max(35, thickness - 75)} мм</strong> ({Math.round(Math.max(35, thickness - 75) * 2.45)} кг/м²).
                    </div>
                    <div>
                      • <strong>Полный объем бетона:</strong> {(0.042 + Math.max(35, thickness - 75) / 1000).toFixed(3)} м³/м² (общая масса бетона с арматурой: {103 + Math.round(Math.max(35, thickness - 75) * 2.45)} кг/м²).
                    </div>
                  </div>
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
                    Толщина перекрытия (мм):
                  </label>

                  {currentTypeInfo.isConstantThickness ? (
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
                        <strong>Постоянная заводская толщина 220 мм</strong>{" "}
                        (ГОСТ 9561-2016 для сборных многопустотных плит ПК/ПБ).
                        Собственный вес зафиксирован: <strong>330 кг/м²</strong>.
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
                              onClick={() => handleThicknessChange(tPreset)}
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
                        💡 При изменении толщины собственный вес перекрытия пересчитывается автоматически:{" "}
                        <strong>{deadLoad} кг/м²</strong>.
                      </div>
                    </div>
                  )}
                </div>

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
                        color: "#475569",
                        marginBottom: "4px",
                      }}
                    >
                      Толщина плиты / настила (мм):
                    </label>
                    <input
                      type="number"
                      disabled={currentTypeInfo.isConstantThickness}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85em",
                        boxSizing: "border-box",
                        backgroundColor: currentTypeInfo.isConstantThickness
                          ? "#f1f5f9"
                          : "#ffffff",
                        color: currentTypeInfo.isConstantThickness
                          ? "#64748b"
                          : "#0f172a",
                      }}
                      value={thickness}
                      onChange={(e) => handleThicknessChange(e.target.value)}
                    />
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
                      Собственный вес конструкции (кг/м²):
                    </label>
                    <input
                      type="number"
                      disabled={currentTypeInfo.isConstantThickness}
                      style={{
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85em",
                        boxSizing: "border-box",
                        backgroundColor: currentTypeInfo.isConstantThickness
                          ? "#f1f5f9"
                          : "#ffffff",
                        color: currentTypeInfo.isConstantThickness
                          ? "#64748b"
                          : "#0f172a",
                      }}
                      value={deadLoad}
                      onChange={(e) => setDeadLoad(Number(e.target.value))}
                    />
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
                  onChange={(e) => setLiveLoad(Number(e.target.value))}
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

          {/* Section 6: Инженерный сводный расчет нагрузок */}
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
              <span>📊 Инженерная сводка нагрузок</span>
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
            <strong>{thickness} мм</strong>, полезная {liveLoad} кг/м²
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
              onClick={handleSave}
              style={{
                padding: "8px 20px",
                backgroundColor: "#28a745",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.85em",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(40,167,69,0.3)",
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
