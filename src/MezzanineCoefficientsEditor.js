import React, { useState, useEffect } from "react";
import PinProtectedSection from "./PinProtectedSection";

export const DEFAULT_MEZZANINE_COEFFS = {
  // 1. Базовые константы (эталонная точка)
  m_beam_base: 24.3, // кг/м² — удельный вес балок при эталоне
  m_col_base: 7.7, // кг/м² — удельный вес стоек при эталоне
  base_load_q0: 840, // кг/м² — эталонная расчетная нагрузка (600 пост. + 240 врем.)
  base_grid_b: 6.0, // м — эталонный шаг/пролет по ширине B0
  base_grid_l: 6.0, // м — эталонный шаг рам/главных балок L0
  base_height_h0: 3.0, // м — эталонная высота этажа (стойки) H0

  // 2. Степенные коэффициенты интерполяции
  p_load: 0.72, // показатель степени по нагрузке (q / q0)^p_load
  p_main_L: 1.40, // влияние пролёта главного ригеля (L_span / 6.0)^p_main_L
  p_main_B: 0.60, // влияние грузовой ширины ригеля (B_span / 6.0)^p_main_B
  p_sec_B: 1.35, // влияние пролёта второстепенных балок (B_span / 6.0)^p_sec_B
  share_main: 0.55, // доля главных балок в массе клеток
  p_col_grid: 0.25, // влияние сетки на вес стоек ((B0*L0)/(B*L))^p_col_grid
  p_height: 1.12, // влияние высоты этажа на стойки (H_floor / 3.0)^p_height
  tier_coeff: 1.0, // коэффициент ярусности стоек
  bldg_col_add: 0.04, // добавка к основным колоннам каркаса

  // 3. Таблица коэффициентов типов настила k_deck
  deck_coeffs: {
    monolithic_deck: 1.00, // Ж/б по профлисту Н75
    precast_hollow_core: 0.68, // Плиты ПК/ПБ
    monolithic_slab: 0.92, // Монолитная ж/б плита
    steel_grating: 1.22, // Стальной настил / решётка
    timber_deck: 1.12, // Деревянный настил
    knauf_dry_floor: 1.08, // Сухая стяжка KNAUF
    precast_block_composite: 1.00, // Сборно-монолитное
  },
};

export const DECK_TYPE_LABELS = {
  monolithic_deck: {
    name: "Монолитный ж/б по профлисту Н75",
    desc: "Сталебетонное перекрытие. Стандартный шаг балок 2.5–3.0 м (базовый эталон).",
  },
  precast_hollow_core: {
    name: "Сборные плиты ПК / ПБ (220 мм)",
    desc: "Плиты перекрывают пролет без второстепенных балок, опираясь сразу на ригели.",
  },
  monolithic_slab: {
    name: "Монолитная ж/б плита по съемной опалубке",
    desc: "Сплошная тяжелая плита, увеличенный шаг балок клетчатой структуры.",
  },
  steel_grating: {
    name: "Стальной настил / решётка (ПВЛ / прессованный)",
    desc: "Промышленный настил малой жесткости, требует частого шага балок 1.0–1.5 м.",
  },
  timber_deck: {
    name: "Деревянный настил по стальным балкам",
    desc: "Брус и дощатый щит, пониженная жесткость настила требует частого шага балок.",
  },
  knauf_dry_floor: {
    name: "Сухая сборная стяжка KNAUF по профлисту",
    desc: "Легкое перекрытие, средний шаг распределительных балок под листы ГВЛВ.",
  },
  precast_block_composite: {
    name: "Сборно-монолитное часторебристое перекрытие",
    desc: "Часторебристая система с мелкими блоками-вкладышами, опирание на главные ригели.",
  },
};

/**
 * Расчет металлоемкости антресоли по физической модели интерполяции балочной клетки
 */
export function calculateMezzanineMetal({
  floorStructure,
  stories,
  spanWidth,
  spansCount,
  buildingLength,
  height,
  coeffs = DEFAULT_MEZZANINE_COEFFS,
}) {
  const c = {
    ...DEFAULT_MEZZANINE_COEFFS,
    ...coeffs,
    deck_coeffs: {
      ...DEFAULT_MEZZANINE_COEFFS.deck_coeffs,
      ...(coeffs?.deck_coeffs || {}),
    },
  };

  const nStories = Math.max(1, Number(stories) || 1);
  const W = Math.max(1, Number(spanWidth) || 18);
  const N = Math.max(1, Number(spansCount) || 1);
  const L = Math.max(1, Number(buildingLength) || 36);
  const H = Math.max(1, Number(height) || 6);

  const totalBuildingWidth = W * N;
  const totalBldgArea = totalBuildingWidth * L;

  if (nStories <= 1) {
    return {
      m_mezz: 0,
      beamWeightRate: 0,
      colWeightRate: 0,
      mezzanineWeightKg: 0,
      mezzanineWeightTons: 0,
      mezzanineRate: "0.0",
      kBldg: 1.0,
      effMW: 0,
      effML: 0,
      mezzanineArea: 0,
      q: 0,
      B_span: 6,
      L_span: 6,
      H_floor: 3,
      k_beams: 1,
      k_col_grid: 1,
      k_h: 1,
      k_tier: 1,
      k_deck: 1,
      loadFactor: 1,
    };
  }

  // 1. Расчетная нагрузка q по СП 20: q = g_dead * 1.1 + p_partitions * 1.2 + p_live * safetyFactor
  const g_dead = Number(floorStructure?.deadLoad ?? 280);
  const p_partitions = Number(floorStructure?.partitionsLoad ?? 50);
  const p_live = Number(floorStructure?.liveLoad ?? 400);
  const safetyFactor = Number(floorStructure?.safetyFactor ?? 1.2);
  const q = Math.max(100, g_dead * 1.1 + p_partitions * 1.2 + p_live * safetyFactor);

  // 2. Геометрия шага балочной клетки:
  // Если задана ручная раскладка columnSpans — берем максимальный шаг, иначе W / kSubSpans (правило 9 м)
  let B_span = 6.0;
  if (
    floorStructure?.columnSpansMode === "manual" &&
    Array.isArray(floorStructure?.columnSpans) &&
    floorStructure.columnSpans.length > 0
  ) {
    const validSpans = floorStructure.columnSpans
      .map(Number)
      .filter((v) => v > 0);
    if (validSpans.length > 0) {
      B_span = Math.max(...validSpans);
    }
  } else {
    const kSubSpans = W >= 9 ? Math.floor(W / 9) + 1 : 1;
    B_span = W / kSubSpans;
  }
  if (B_span <= 0) B_span = 6.0;

  // L_span = шаг рам здания (эталон 6.0 м)
  const L_span = Number(c.base_grid_l) || 6.0;

  // H_floor = средняя высота этажа
  let H_floor = H / nStories;
  if (
    Array.isArray(floorStructure?.storyElevations) &&
    floorStructure.storyElevations.length > 0
  ) {
    const validElevs = floorStructure.storyElevations
      .map(Number)
      .filter((v) => v > 0);
    if (validElevs.length > 0) {
      H_floor = validElevs[0];
    }
  }
  if (H_floor <= 0) H_floor = 3.0;

  // 3. Коэффициенты интерполяции
  const baseL0 = Number(c.base_grid_l) || 6.0;
  const baseB0 = Number(c.base_grid_b) || 6.0;
  const baseH0 = Number(c.base_height_h0) || 3.0;
  const baseQ0 = Number(c.base_load_q0) || 840.0;

  // Влияние пролета балок:
  // k_beams = share_main * ((L_span / 6.0)^p_main_L * (B_span / 6.0)^p_main_B) + (1 - share_main) * ((B_span / 6.0)^p_sec_B)
  const termMain =
    Math.pow(Math.max(0.2, L_span / baseL0), c.p_main_L) *
    Math.pow(Math.max(0.2, B_span / baseB0), c.p_main_B);
  const termSec = Math.pow(Math.max(0.2, B_span / baseB0), c.p_sec_B);
  const k_beams = c.share_main * termMain + (1 - c.share_main) * termSec;

  // Влияние сетки на вес промежуточных стоек:
  // k_col_grid = ((B0 * L0) / (B_span * L_span))^p_col_grid
  const k_col_grid = Math.pow(
    Math.max(0.1, (baseB0 * baseL0) / (B_span * L_span)),
    c.p_col_grid
  );

  // Влияние высоты этажа на стойки:
  // k_h = (H_floor / 3.0)^p_height
  const k_h = Math.pow(Math.max(0.3, H_floor / baseH0), c.p_height);

  // Влияние этажности на стойки (ярусность):
  // k_tier = (1 + (stories - 1) * tier_coeff) / 2
  const k_tier = (1 + (nStories - 1) * c.tier_coeff) / 2;

  // Влияние типа настила:
  const deckType = floorStructure?.type || "monolithic_deck";
  const k_deck = Number(c.deck_coeffs?.[deckType] ?? 1.0);

  // Влияние расчетной нагрузки:
  // loadFactor = (q / 840)^p_load
  const loadFactor = Math.pow(Math.max(0.1, q / baseQ0), c.p_load);

  // Удельный вес балочной клетки и стоек:
  const beamWeightRate = c.m_beam_base * k_beams * k_deck * loadFactor;
  const colWeightRate = c.m_col_base * k_h * k_col_grid * k_tier * loadFactor;
  const m_mezz = beamWeightRate + colWeightRate;

  // 4. Эффективные габариты антресоли
  const rawMW =
    floorStructure?.mezzanineWidth != null &&
    Number(floorStructure.mezzanineWidth) > 0
      ? Number(floorStructure.mezzanineWidth)
      : null;
  const rawML =
    floorStructure?.mezzanineLength != null &&
    Number(floorStructure.mezzanineLength) > 0
      ? Number(floorStructure.mezzanineLength)
      : null;

  const effMW =
    rawMW !== null ? Math.min(totalBuildingWidth, rawMW) : totalBuildingWidth;
  const effML = rawML !== null ? Math.min(L, rawML) : L;
  const mezzanineArea = effMW * effML;

  // Масса металла антресоли:
  // mezzanineWeightKg = m_mezz * effMW * effML * (stories - 1)
  const mezzanineWeightKg = m_mezz * mezzanineArea * (nStories - 1);

  // Влияние на основные колонны здания:
  // k_bldg = 1 + bldg_col_add * (stories - 1) * (q / 840) * (A_mezz / A_bldg)
  const areaRatio = totalBldgArea > 0 ? mezzanineArea / totalBldgArea : 1.0;
  const kBldg = 1 + c.bldg_col_add * (nStories - 1) * (q / baseQ0) * areaRatio;

  return {
    m_mezz,
    beamWeightRate,
    colWeightRate,
    mezzanineWeightKg,
    mezzanineWeightTons: mezzanineWeightKg / 1000,
    mezzanineRate: m_mezz.toFixed(1),
    kBldg,
    effMW,
    effML,
    mezzanineArea,
    q,
    B_span,
    L_span,
    H_floor,
    k_beams,
    k_col_grid,
    k_h,
    k_tier,
    k_deck,
    loadFactor,
  };
}

export default function MezzanineCoefficientsEditor({
  isOpen = true,
  onClose,
  onSave,
  currentStructure = null,
  stories = 2,
  spanWidth = 18,
  spansCount = 1,
  buildingLength = 36,
  height = 6,
}) {
  const [coeffs, setCoeffs] = useState(() => {
    try {
      const saved = localStorage.getItem("euroangar_mezzanine_coeffs");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_MEZZANINE_COEFFS,
          ...parsed,
          deck_coeffs: {
            ...DEFAULT_MEZZANINE_COEFFS.deck_coeffs,
            ...(parsed.deck_coeffs || {}),
          },
        };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_MEZZANINE_COEFFS;
  });

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("constants"); // 'constants' | 'powers' | 'decks' | 'simulation'

  useEffect(() => {
    const saved = localStorage.getItem("euroangar_mezzanine_coeffs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCoeffs({
          ...DEFAULT_MEZZANINE_COEFFS,
          ...parsed,
          deck_coeffs: {
            ...DEFAULT_MEZZANINE_COEFFS.deck_coeffs,
            ...(parsed.deck_coeffs || {}),
          },
        });
      } catch (e) {}
    }
  }, []);

  if (!isOpen) return null;

  const handleNumberChange = (field, value) => {
    const val = parseFloat(value);
    setCoeffs((prev) => ({
      ...prev,
      [field]: isNaN(val) ? 0 : val,
    }));
    setIsSaved(false);
  };

  const handleDeckChange = (typeKey, value) => {
    const val = parseFloat(value);
    setCoeffs((prev) => ({
      ...prev,
      deck_coeffs: {
        ...prev.deck_coeffs,
        [typeKey]: isNaN(val) ? 1.0 : val,
      },
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("euroangar_mezzanine_coeffs", JSON.stringify(coeffs));
    if (onSave) {
      onSave(coeffs);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  const handleReset = () => {
    if (window.confirm("Сбросить все коэффициенты антресоли к нормативным эталонным значениям?")) {
      setCoeffs(DEFAULT_MEZZANINE_COEFFS);
      localStorage.setItem(
        "euroangar_mezzanine_coeffs",
        JSON.stringify(DEFAULT_MEZZANINE_COEFFS)
      );
      if (onSave) {
        onSave(DEFAULT_MEZZANINE_COEFFS);
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  // Расчет эталонной точки (должно быть ровно 32.0 кг/м²)
  const benchmarkSim = calculateMezzanineMetal({
    floorStructure: {
      type: "monolithic_deck",
      deadLoad: 504.55, // (504.55 * 1.1 + 50 * 1.2 + 225) ~ 840
      partitionsLoad: 50,
      liveLoad: 225,
      safetyFactor: 1.0,
      columnSpansMode: "auto",
    },
    stories: 2,
    spanWidth: 6,
    spansCount: 1,
    buildingLength: 6,
    height: 6, // H_floor = 6 / 2 = 3.0 м
    coeffs,
  });

  // Расчет для текущего активного проекта
  const projectSim = calculateMezzanineMetal({
    floorStructure: currentStructure,
    stories,
    spanWidth,
    spansCount,
    buildingLength,
    height,
    coeffs,
  });

  if (!isOpen) return null;

  return (
    <PinProtectedSection
      expectedPin="215900!!"
      title="🔒 Доступ к коэффициентам антресоли"
      subtitle="Вкладка защищена: введите код доступа для входа в редактор"
      onCancel={onClose}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1050,
          padding: "16px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "920px",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
          }}
        >
        {/* Шапка */}
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
            <h3
              style={{
                margin: 0,
                color: "#1e293b",
                fontSize: "1.25em",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🏢</span>
              <span>Коэффициенты металлоемкости антресоли</span>
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.85em",
                color: "#64748b",
              }}
            >
              Физическая модель балочной клетки и промежуточных стоек (СП 20.13330 / СП 16.13330)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Вкладки навигации */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f1f5f9",
            padding: "0 16px",
          }}
        >
          {[
            { id: "constants", label: "1. Базовые константы (Эталон)" },
            { id: "powers", label: "2. Степенные коэффициенты" },
            { id: "decks", label: "3. Типы настилов (k_deck)" },
            { id: "simulation", label: "4. Живая симуляция модели" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "11px 16px",
                border: "none",
                background: "none",
                fontSize: "0.9em",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "#0284c7" : "#64748b",
                borderBottom:
                  activeTab === tab.id ? "3px solid #0284c7" : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Тело модального окна */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* ВКЛАДКА 1: БАЗОВЫЕ КОНСТАНТЫ */}
          {activeTab === "constants" && (
            <div>
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  borderLeft: "4px solid #3b82f6",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "0.88em",
                  color: "#1e40af",
                  lineHeight: 1.5,
                }}
              >
                <strong>Физическая база эталона:</strong> Расчет откалиброван по эталонной балочной клетке{" "}
                <strong>6.0 × 6.0 м</strong> при высоте стоек <strong>3.0 м</strong> и нормативной расчетной нагрузке{" "}
                <strong>840 кг/м² (8.4 кПа)</strong>. Эталонный удельный расход стали составляет{" "}
                <strong>32.0 кг/м²</strong> (24.3 кг/м² балки + 7.7 кг/м² стойки).
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Базовый вес балок <code>m_beam_base</code> (кг/м²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={coeffs.m_beam_base}
                    onChange={(e) => handleNumberChange("m_beam_base", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Главные ригели и второстепенные балки эталона 6×6 м (дефолт: 24.3)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Базовый вес стоек <code>m_col_base</code> (кг/м²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={coeffs.m_col_base}
                    onChange={(e) => handleNumberChange("m_col_base", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Стволы стоек, базы и оголовки при H=3м (дефолт: 7.7)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Эталонная нагрузка <code>base_load_q0</code> (кг/м²)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={coeffs.base_load_q0}
                    onChange={(e) => handleNumberChange("base_load_q0", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Сумма постоянной и полезной расчетной нагрузки q0 (дефолт: 840)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Эталонный шаг по ширине <code>base_grid_b</code> (м)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={coeffs.base_grid_b}
                    onChange={(e) => handleNumberChange("base_grid_b", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Пролет второстепенных балок / грузовая ширина ригеля B0 (дефолт: 6.0)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Эталонный шаг рам <code>base_grid_l</code> (м)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={coeffs.base_grid_l}
                    onChange={(e) => handleNumberChange("base_grid_l", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Пролет главных балок / шаг поперечных рам каркаса L0 (дефолт: 6.0)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Эталонная высота этажа <code>base_height_h0</code> (м)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={coeffs.base_height_h0}
                    onChange={(e) => handleNumberChange("base_height_h0", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Высота расчетной промежуточной стойки 1-го этажа H0 (дефолт: 3.0)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: СТЕПЕННЫЕ КОЭФФИЦИЕНТЫ */}
          {activeTab === "powers" && (
            <div>
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  borderLeft: "4px solid #22c55e",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "0.88em",
                  color: "#166534",
                  lineHeight: 1.5,
                }}
              >
                <strong>Степенные показатели масштабирования:</strong> Отражают нелинейный рост изгибающих моментов (M ~ q·L²) и подбор прокатных двутавров (W ~ M/Ry, масса балки растет как M^0.65).
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Показатель нагрузки <code>p_load</code>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={coeffs.p_load}
                    onChange={(e) => handleNumberChange("p_load", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Степень влияния (q / q0)^p_load. Стандартный сортамент: 0.72
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Пролёт главного ригеля <code>p_main_L</code>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={coeffs.p_main_L}
                    onChange={(e) => handleNumberChange("p_main_L", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Степень (L_span / 6.0)^p_main_L. Дефолт: 1.40
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Ширина сбора ригеля <code>p_main_B</code>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={coeffs.p_main_B}
                    onChange={(e) => handleNumberChange("p_main_B", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Степень (B_span / 6.0)^p_main_B. Дефолт: 0.60
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Пролёт втор. балок <code>p_sec_B</code>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={coeffs.p_sec_B}
                    onChange={(e) => handleNumberChange("p_sec_B", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Степень (B_span / 6.0)^p_sec_B. Дефолт: 1.35
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Доля главных балок <code>share_main</code>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={coeffs.share_main}
                    onChange={(e) => handleNumberChange("share_main", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Доля ригелей в общей массе балок (0.55 = 55% ригели, 45% второстепенные)
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Влияние сетки на стойки <code>p_col_grid</code>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={coeffs.p_col_grid}
                    onChange={(e) => handleNumberChange("p_col_grid", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    ((B0 · L0) / (B · L))^p_col_grid. Дефолт: 0.25
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Влияние высоты этажа <code>p_height</code>
                  </label>
                  <input
                    type="number"
                    step="0.02"
                    value={coeffs.p_height}
                    onChange={(e) => handleNumberChange("p_height", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    (H_floor / 3.0)^p_height с учетом гибкости стойки λ. Дефолт: 1.12
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Коэф. ярусности стоек <code>tier_coeff</code>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={coeffs.tier_coeff}
                    onChange={(e) => handleNumberChange("tier_coeff", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    (1 + (stories - 1) · tier) / 2. Дефолт: 1.0
                  </span>
                </div>

                <div style={fieldCardStyle}>
                  <label style={labelStyle}>
                    Добавка к основным колоннам <code>bldg_col_add</code>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={coeffs.bldg_col_add}
                    onChange={(e) => handleNumberChange("bldg_col_add", e.target.value)}
                    style={inputStyle}
                  />
                  <span style={hintStyle}>
                    Утяжеление колонн рам каркаса от реакции антресоли (дефолт: 0.04 = +4%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: ТАБЛИЦА ТИПОВ НАСТИЛА */}
          {activeTab === "decks" && (
            <div>
              <div
                style={{
                  backgroundColor: "#faf5ff",
                  borderLeft: "4px solid #a855f7",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "0.88em",
                  color: "#6b21a8",
                  lineHeight: 1.5,
                }}
              >
                <strong>Поправочный коэффициент балочной клетки k_deck:</strong> Зависит от конструктивного типа плиты. Например, сборные многопустотные плиты ПК/ПБ имеют собственный несущий пролет до 6–7 м, поэтому второстепенные балки настила исключаются (k_deck = 0.68).
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.88em",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", textAlign: "left" }}>
                      <th style={thStyle}>Конструкция перекрытия</th>
                      <th style={thStyle}>Особенности раскладки балок</th>
                      <th style={{ ...thStyle, width: "130px", textAlign: "center" }}>
                        Коэф. k_deck
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(coeffs.deck_coeffs || {}).map(([key, val]) => {
                      const meta = DECK_TYPE_LABELS[key] || {
                        name: key,
                        desc: "",
                      };
                      return (
                        <tr key={key} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={tdStyle}>
                            <strong>{meta.name}</strong>
                            <div style={{ fontSize: "0.82em", color: "#64748b" }}>
                              <code>{key}</code>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: "#475569" }}>{meta.desc}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <input
                              type="number"
                              step="0.01"
                              value={val}
                              onChange={(e) => handleDeckChange(key, e.target.value)}
                              style={{
                                width: "85px",
                                padding: "6px 8px",
                                textAlign: "center",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontWeight: "bold",
                                color: "#0f172a",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 4: ЖИВАЯ СИМУЛЯЦИЯ */}
          {activeTab === "simulation" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
                {/* Карточка 1: Проверка эталона */}
                <div
                  style={{
                    border: "1px solid #bfdbfe",
                    backgroundColor: "#f0f7ff",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h4 style={{ margin: 0, color: "#1e40af", fontSize: "1em" }}>
                      🎯 Проверка калибровки эталона
                    </h4>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor:
                          Math.abs(benchmarkSim.m_mezz - 32.0) < 0.1
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          Math.abs(benchmarkSim.m_mezz - 32.0) < 0.1
                            ? "#166534"
                            : "#991b1b",
                        fontSize: "0.8em",
                        fontWeight: 700,
                      }}
                    >
                      {Math.abs(benchmarkSim.m_mezz - 32.0) < 0.1
                        ? "Эталон 32.0 кг/м² ОК"
                        : `Отклонение: ${(benchmarkSim.m_mezz - 32.0).toFixed(2)} кг/м²`}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85em", color: "#334155", lineHeight: 1.6 }}>
                    <div>Сетка: 6.0 × 6.0 м, Высота: 3.0 м</div>
                    <div>Нагрузка q0: 840 кг/м² (q/q0 = 1.00)</div>
                    <div style={{ marginTop: "6px" }}>
                      • Балки клетки:{" "}
                      <strong>{benchmarkSim.beamWeightRate.toFixed(1)} кг/м²</strong> (эталон: 24.3)
                    </div>
                    <div>
                      • Стойки:{" "}
                      <strong>{benchmarkSim.colWeightRate.toFixed(1)} кг/м²</strong> (эталон: 7.7)
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #bfdbfe",
                        fontSize: "1.05em",
                        fontWeight: 700,
                        color: "#1e3a8a",
                      }}
                    >
                      Итого удельный вес m_mezz: {benchmarkSim.m_mezz.toFixed(1)} кг/м²
                    </div>
                  </div>
                </div>

                {/* Карточка 2: Текущее здание из проекта */}
                <div
                  style={{
                    border: "1px solid #bbf7d0",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h4 style={{ margin: 0, color: "#166534", fontSize: "1em" }}>
                      🏢 Расчет для текущего здания
                    </h4>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontSize: "0.8em",
                        fontWeight: 700,
                      }}
                    >
                      {stories} эт. ({stories - 1} ур. антресоли)
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85em", color: "#334155", lineHeight: 1.6 }}>
                    <div>
                      Пролет B_span: <strong>{projectSim.B_span.toFixed(1)} м</strong>, Шаг L_span:{" "}
                      <strong>{projectSim.L_span.toFixed(1)} м</strong>
                    </div>
                    <div>
                      Высота этажа H_floor: <strong>{projectSim.H_floor.toFixed(2)} м</strong>
                    </div>
                    <div>
                      Расчетная нагрузка q: <strong>{Math.round(projectSim.q)} кг/м²</strong> (
                      фактор: {projectSim.loadFactor.toFixed(2)})
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      • Удельный вес балок:{" "}
                      <strong>{projectSim.beamWeightRate.toFixed(1)} кг/м²</strong>
                    </div>
                    <div>
                      • Удельный вес стоек:{" "}
                      <strong>{projectSim.colWeightRate.toFixed(1)} кг/м²</strong>
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #bbf7d0",
                        fontSize: "1.05em",
                        fontWeight: 700,
                        color: "#14532d",
                      }}
                    >
                      Итого удельный вес m_mezz: {projectSim.m_mezz.toFixed(1)} кг/м²
                    </div>
                    <div style={{ fontSize: "0.95em", color: "#166534", marginTop: "4px" }}>
                      Масса металлоконструкций антресоли:{" "}
                      <strong>{projectSim.mezzanineWeightTons.toFixed(2)} т</strong> (S=
                      {projectSim.mezzanineArea.toFixed(1)} м²)
                    </div>
                    <div style={{ fontSize: "0.85em", color: "#047857" }}>
                      Поправка к основным колоннам k_bldg:{" "}
                      <strong>+{( (projectSim.kBldg - 1) * 100 ).toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Формула расчета */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "0.85em",
                  color: "#475569",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Формула удельного веса металла антресоли m_mezz (кг/м²):
                </div>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontFamily: "monospace",
                    fontSize: "1.05em",
                    color: "#0f172a",
                    marginBottom: "10px",
                  }}
                >
                  m_mezz = ( m_beam_base · k_beams · k_deck + m_col_base · k_h · k_col_grid · k_tier ) · ( q / 840 )^p_load
                </div>
                <div>
                  • <strong>k_beams</strong> = {coeffs.share_main} · ((L/{coeffs.base_grid_l})^{coeffs.p_main_L} · (B/{coeffs.base_grid_b})^{coeffs.p_main_B}) + (1 - {coeffs.share_main}) · ((B/{coeffs.base_grid_b})^{coeffs.p_sec_B}) ={" "}
                  <strong>{projectSim.k_beams.toFixed(3)}</strong>
                </div>
                <div>
                  • <strong>k_col_grid</strong> = ((6.0 · 6.0) / (B · L))^{coeffs.p_col_grid} ={" "}
                  <strong>{projectSim.k_col_grid.toFixed(3)}</strong>
                </div>
                <div>
                  • <strong>k_h</strong> = (H_floor / 3.0)^{coeffs.p_height} ={" "}
                  <strong>{projectSim.k_h.toFixed(3)}</strong>
                </div>
                <div>
                  • <strong>k_tier</strong> = (1 + ({stories} - 1) · {coeffs.tier_coeff}) / 2 ={" "}
                  <strong>{projectSim.k_tier.toFixed(2)}</strong>
                </div>
                <div>
                  • <strong>k_deck</strong> ={" "}
                  <strong>{projectSim.k_deck.toFixed(2)}</strong> ({currentStructure?.type || "monolithic_deck"})
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Подвал с кнопками */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleReset}
              style={{
                padding: "8px 14px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                color: "#475569",
                cursor: "pointer",
                fontSize: "0.88em",
                fontWeight: 600,
              }}
            >
              🔄 Сбросить по умолчанию
            </button>
            {isSaved && (
              <span
                style={{
                  color: "#166534",
                  fontSize: "0.88em",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ✓ Сохранено в localStorage!
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                color: "#475569",
                cursor: "pointer",
                fontSize: "0.9em",
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "9px 20px",
                backgroundColor: "#0284c7",
                border: "none",
                borderRadius: "6px",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "0.9em",
                fontWeight: 600,
                boxShadow: "0 1px 3px rgba(2, 132, 199, 0.3)",
              }}
            >
              💾 Сохранить коэффициенты
            </button>
          </div>
        </div>
      </div>
    </div>
  </PinProtectedSection>
  );
}

const fieldCardStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "0.85em",
  fontWeight: 600,
  color: "#334155",
  marginBottom: "6px",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "0.95em",
  color: "#0f172a",
  fontWeight: 600,
  backgroundColor: "#ffffff",
};

const hintStyle = {
  fontSize: "0.75em",
  color: "#64748b",
  marginTop: "5px",
  lineHeight: 1.3,
};

const thStyle = {
  padding: "10px 12px",
  fontWeight: 700,
  color: "#334155",
  borderBottom: "2px solid #cbd5e1",
};

const tdStyle = {
  padding: "10px 12px",
  verticalAlign: "middle",
};
