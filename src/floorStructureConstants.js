/**
 * Библиотека конструкций межэтажных перекрытий, нагрузок и коэффициентов надежности
 * в соответствии с СП 20.13330.2016 «Нагрузки и воздействия» и ГОСТ 27751-2014.
 */

export const FLOOR_TYPES = [
  {
    id: "monolithic_deck",
    name: "Монолитный ж/б по несъемной опалубке из профлиста Н75",
    shortName: "Ж/б по профлисту Н75",
    category: "reinforced_concrete",
    standard: "СП 266.1325800.2016, ГОСТ 24045-2016",
    defaultThickness: 120,
    thicknessRange: [115, 500],
    thicknessPresets: [115, 120, 130, 140, 150, 160, 180],
    isConstantThickness: false,
    deckProfile: "Н75-750-0.8",
    corrugationHeight: 75,
    corrugationVolumePerM2: 0.0291, // м³/м² бетон в гофрах (точные геометрические характеристики Н75-750-0.8)
    structuralDeadLoad: 230.745, // кг/м² собственный вес несущей конструкции при t=120мм (СП 266, ГОСТ 24045)
    defaultFloorFinishLayers: [
      { name: "Топпинг / покрытие пола", load: 15 },
    ],
    floorFinishLoad: 15, // кг/м² состав пола
    deadLoad: 245.745, // кг/м² при t=120мм (structuralDeadLoad 230.745 + floorFinishLoad 15)
    beamSpacing: "2.5 – 3.2 м",
    fireRating: "REI 60 – REI 90",
    features:
      "Сталебетонное перекрытие по оцинкованному профлисту Н75-750-0.8 (масса 11.2 кг/м²). Бетон заполняет гофры листа (объем в ребрах 0.0291 м³/м² или ~71.3 кг/м²), формируя надежную ребристую плиту с полкой бетона hc = t - 75 мм (min hc >= 40 мм).",
    color: "#2563eb",
    layers: [
      { name: "Монолитный бетон B25 над гофрами профлиста (hc = 45 мм)", thickness: 45, weight: 110.25, isVariableConcrete: true },
      { name: "Бетон B25 в гофрах профлиста Н75 (объем 0.0291 м³/м²)", thickness: 75, weight: 71.3, isCorrugationConcrete: true },
      { name: "Профилированный оцинкованный лист Н75-750-0.8 (ГОСТ 24045)", thickness: 75, weight: 11.2 },
      { name: "Арматурная сетка в полке и стержни в ребрах", thickness: 10, weight: 8 },
      { name: "Стальные второстепенные балки (шаг 2.5–3.0 м)", thickness: 200, weight: 30 },
    ],
  },
  {
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
    deadLoad: 330, // кг/м²
    beamSpacing: "4.5 – 7.2 м",
    fireRating: "REI 60 – REI 120",
    features:
      "Заводские предварительно напряженные плиты ПБ-22 или ПК. Укладываются по верхним полкам стальных ригелей. Не требуют мокрых монолитных работ на стройплощадке.",
    color: "#0284c7",
    layers: [
      { name: "Выравнивающая армированная стяжка М150 (30 мм)", thickness: 30, weight: 50 },
      { name: "Сборные преднапряженные многопустотные плиты ПБ-220", thickness: 220, weight: 230 },
      { name: "Замоноличивание швов бетоном B20", thickness: 0, weight: 15 },
      { name: "Главные стальные балки перекрытия", thickness: 350, weight: 35 },
    ],
  },
  {
    id: "monolithic_slab",
    name: "Монолитная железобетонная плита по съемной опалубке (140–500 мм)",
    shortName: "Монолитная ж/б плита",
    category: "reinforced_concrete",
    standard: "СП 63.13330.2018",
    defaultThickness: 180,
    thicknessRange: [140, 500],
    thicknessPresets: [140, 160, 180, 200, 220, 250],
    isConstantThickness: false,
    deadLoad: 525, // кг/м² (при t=180мм: 180*2.5 + 25 топпинг + 50 ригели = 525)
    beamSpacing: "4.0 – 6.0 м",
    fireRating: "REI 90 – REI 150",
    features:
      "Сплошная плита тяжелого бетона B25 с двухслойным армированием. Обладает максимальной несущей способностью и вибростойкостью под тяжелые станки и погрузчики.",
    color: "#475569",
    layers: [
      { name: "Топпинг пола / обеспыливающая пропитка (10 мм)", thickness: 10, weight: 25 },
      { name: "Монолитная железобетонная плита B25 (двойная арматура)", thickness: 180, weight: 450 },
      { name: "Главные стальные ригели каркаса", thickness: 400, weight: 50 },
    ],
  },
  {
    id: "precast_block_composite",
    name: "Сборно-монолитное часторебристое перекрытие (балочно-блочное)",
    shortName: "Сборно-монолитное",
    category: "composite",
    standard: "ТУ 5858-001, СП 266.1325800",
    defaultThickness: 200,
    thicknessRange: [150, 500],
    thicknessPresets: [150, 180, 200, 220, 250],
    isConstantThickness: false,
    deadLoad: 220, // кг/м²
    beamSpacing: "3.0 – 5.0 м",
    fireRating: "REI 60",
    features:
      "Облегченное перекрытие: сборные балки с заполнением блоками из газобетона или полистиролбетона и тонким распределительным бетонным слоем 50 мм.",
    color: "#d97706",
    layers: [
      { name: "Армированная бетонная стяжка B20", thickness: 50, weight: 115 },
      { name: "Легкие блоки-вкладыши (газобетон D500)", thickness: 150, weight: 65 },
      { name: "Несущие стальные/ж/б балочные ребра", thickness: 200, weight: 40 },
    ],
  },
  {
    id: "steel_grating",
    name: "Стальной рифленый лист (чечевица 4–8 мм) или решетчатый настил SP/PR",
    shortName: "Стальной настил",
    category: "steel",
    standard: "ГОСТ 8568-77, ГОСТ 23120-2016",
    defaultThickness: 35,
    thicknessRange: [25, 500],
    thicknessPresets: [25, 30, 35, 40, 50],
    isConstantThickness: false,
    deadLoad: 57, // кг/м² (35 + 22)
    beamSpacing: "1.0 – 1.8 м",
    fireRating: "R 15 (требуется конструктивная огнезащита)",
    features:
      "Промышленное перекрытие для технологических площадок, насосных, котельных, цеховых антресолей и галерей обслуживания. Минимальный собственный вес.",
    color: "#059669",
    layers: [
      { name: "Стальной рифленый лист t=6мм или сварная решетка SP", thickness: 35, weight: 35 },
      { name: "Второстепенные прогоны из швеллера / профильной трубы", thickness: 120, weight: 22 },
    ],
  },
  {
    id: "timber_deck",
    name: "Деревянный настил по стальным балкам (двойной настил ЦСП / OSB-3)",
    shortName: "Деревянный настил",
    category: "timber",
    standard: "СП 64.13330.2017 «Деревянные конструкции»",
    defaultThickness: 80,
    thicknessRange: [50, 500],
    thicknessPresets: [50, 60, 80, 100, 120],
    isConstantThickness: false,
    deadLoad: 48, // кг/м²
    beamSpacing: "1.2 – 1.8 м",
    fireRating: "REI 30 – REI 45 (при обработке огнебиозащитой)",
    features:
      "Облегченная конструкция для административно-бытовых зон, офисов и сухих складов: лаги 50×100 мм, негорючая минплита и черновой настил из ЦСП 16-20 мм или OSB-3 22 мм.",
    color: "#b45309",
    layers: [
      { name: "Чистовое покрытие (ламинат / износостойкий линолеум)", thickness: 8, weight: 8 },
      { name: "Двойной черновой настил из плит ЦСП 16мм + OSB-3 12мм", thickness: 28, weight: 20 },
      { name: "Деревянные антисептированные лаги с базальтовой ватой", thickness: 100, weight: 10 },
      { name: "Второстепенные стальные балки перекрытия", thickness: 180, weight: 10 },
    ],
  },
  {
    id: "knauf_dry_floor",
    name: "Сборная сухая стяжка по профлисту (KNAUF Суперпол / ГВЛВ)",
    shortName: "Сухая стяжка KNAUF",
    category: "dry_screed",
    standard: "СП 29.13330.2011, Серия 1.031.9-2.07",
    defaultThickness: 70,
    thicknessRange: [50, 500],
    thicknessPresets: [50, 60, 70, 80, 100],
    isConstantThickness: false,
    deadLoad: 95, // кг/м²
    beamSpacing: "1.5 – 2.5 м",
    fireRating: "REI 45",
    features:
      "Монтаж без бетонных работ: несущий профнастил, жесткие звукоизоляционные маты ФЛОР БАТТС, керамзитовая подсыпка и влагостойкие гипсоволокнистые элементы пола KNAUF.",
    color: "#7c3aed",
    layers: [
      { name: "Элементы пола КНАУФ Суперпол (ГВЛВ 20 мм)", thickness: 20, weight: 25 },
      { name: "Сухая керамзитовая засыпка Компэвит (50 мм)", thickness: 50, weight: 52 },
      { name: "Несущий профилированный лист Н57/Н75", thickness: 75, weight: 18 },
    ],
  },
];

export const LIVE_LOAD_PRESETS = [
  {
    value: 150,
    title: "150 кг/м²",
    label: "Жилые, спальные и бытовые комнаты",
    code: "СП 20.13330.2016, Табл. 8.3, поз. 1",
    factor: 1.3,
  },
  {
    value: 200,
    title: "200 кг/м²",
    label: "Офисные и служебные кабинеты, АБК",
    code: "СП 20.13330.2016, Табл. 8.3, поз. 2",
    factor: 1.2,
  },
  {
    value: 300,
    title: "300 кг/м²",
    label: "Кафе, рестораны, вестибюли, холлы",
    code: "СП 20.13330.2016, Табл. 8.3, поз. 4",
    factor: 1.2,
  },
  {
    value: 400,
    title: "400 кг/м²",
    label: "Торговые залы, выставочные павильоны",
    code: "СП 20.13330.2016, Табл. 8.3, поз. 5",
    factor: 1.2,
  },
  {
    value: 500,
    title: "500 кг/м²",
    label: "Архивы, библиотеки, легкие склады штучных грузов",
    code: "СП 20.13330.2016, Табл. 8.3, поз. 9",
    factor: 1.2,
  },
  {
    value: 800,
    title: "800 кг/м²",
    label: "Складские мезонины, участки легких станков",
    code: "СП 20.13330.2016, разд. 8",
    factor: 1.2,
  },
  {
    value: 1000,
    title: "1000 кг/м²",
    label: "Склады со стеллажами и легкими роклами",
    code: "СП 20.13330.2016, разд. 8",
    factor: 1.2,
  },
  {
    value: 1500,
    title: "1500 кг/м²",
    label: "Тяжелые склады, участки металлообработки",
    code: "СП 20.13330.2016, разд. 8",
    factor: 1.2,
  },
  {
    value: 2000,
    title: "2000 кг/м²",
    label: "Сверхтяжелые технологические площадки, автостоянки",
    code: "СП 20.13330.2016, разд. 8",
    factor: 1.2,
  },
];

export const SAFETY_FACTOR_PRESETS = [
  {
    value: 1.2,
    label: "1.20 — Норма СП 20.13330.2016 (п. 8.2.2 при p ≥ 200 кг/м²)",
    desc: "Базовый нормативный коэффициент надежности для большинства коммерческих нагрузок",
  },
  {
    value: 1.25,
    label: "1.25 — Складской стандарт с эксплуатационным запасом",
    desc: "Рекомендуемый коэффициент для складских зон с роклами и ручными тележками",
  },
  {
    value: 1.3,
    label: "1.30 — Норма СП 20.13330.2016 (п. 8.2.2 при p < 200 кг/м²)",
    desc: "Повышенный коэффициент по нормам для легких нагрузок и жилых помещений",
  },
  {
    value: 1.35,
    label: "1.35 — Динамический запас (складская механизация / толчки)",
    desc: "Учет динамического воздействия колесной техники и локальных ударов",
  },
  {
    value: 1.4,
    label: "1.40 — Промышленный усиленный запас (тяжелые станки / вибрация)",
    desc: "Максимальный уровень надежности для производственных технологических этажерок",
  },
];

export const RESPONSIBILITY_FACTORS = [
  {
    value: 0.8,
    label: "Класс КС-1 (γn = 0.8) — Пониженный уровень (ГОСТ 27751-2014)",
    desc: "Временные здания, сезонные склады без постоянного пребывания людей",
  },
  {
    value: 1.0,
    label: "Класс КС-2 (γn = 1.0) — Нормальный уровень (ГОСТ 27751-2014)",
    desc: "Массовое гражданское, складское и промышленное строительство (основной класс)",
  },
  {
    value: 1.1,
    label: "Класс КС-3 (γn = 1.1) — Повышенный уровень (ГОСТ 27751-2014)",
    desc: "Крупные торгово-развлекательные центры, здания с массовым пребыванием людей",
  },
];

export const DEFAULT_FLOOR_STRUCTURE = {
  type: "monolithic_deck",
  typeName: "Монолитный ж/б по несъемной опалубке из профлиста Н75",
  shortName: "Ж/б по профлисту Н75",
  thickness: 120, // мм
  structuralDeadLoad: 230.745, // кг/м² несущая конструкция (бетон 181.545 + лист 11.2 + арматура 8 + балки 30)
  floorFinishLayers: [
    {
      name: "Топпинг / покрытие пола",
      load: 15,
    },
  ],
  floorFinishLoad: 15, // кг/м² состав пола
  deadLoad: 245.745, // кг/м² (structuralDeadLoad 230.745 + floorFinishLoad 15)
  partitionsLoad: 50, // кг/м²
  liveLoad: 400, // кг/м²
  liveLoadCategory: "Торговые залы, выставочные павильоны",
  safetyFactor: 1.2, // gamma_f
  responsibilityFactor: 1.0, // gamma_n (ГОСТ 27751)
  codeRef: "СП 20.13330.2016 (п. 8.2.2, Табл. 8.3), ГОСТ 27751-2014",
  columnSpansMode: "auto", // "auto" | "manual"
  columnSpans: null, // массив пролетов стоек, например [6, 6, 6]
  deckProfile: "Н75-750-0.8",
  storyElevations: null, // массив отметок перекрытий [3.6, 7.2], null = равномерный шаг
  mezzanineWidth: null, // null = во всю ширину здания, либо число в метрах (например, 6, 9, 12)
  mezzanineLength: null, // null = на всю длину здания, либо число в метрах (например, 12, 18, 24)
};

/**
 * Единая формула расчета расчетной эквивалентной нагрузки q на перекрытие (кг/м²) по СП 20.13330:
 * qBase = deadLoad * 1.1 + partitionsLoad * 1.2 + liveLoad * safetyFactor
 * Разрешает partitionsLoad = 0 (ноль допустим).
 * Принимает объект { deadLoad, partitionsLoad, liveLoad, safetyFactor }.
 */
export function calculateMezzanineQBase(params = {}) {
  let deadLoad, partitionsLoad, liveLoad, safetyFactor;
  if (typeof params === "object" && params !== null) {
    ({ deadLoad, partitionsLoad, liveLoad, safetyFactor } = params);
  } else {
    deadLoad = arguments[0];
    partitionsLoad = arguments[1];
    liveLoad = arguments[2];
    safetyFactor = arguments[3];
  }

  const g_dead =
    deadLoad !== undefined && deadLoad !== null && deadLoad !== "" && !isNaN(Number(deadLoad))
      ? Number(deadLoad)
      : 246;
  const p_part =
    partitionsLoad !== undefined && partitionsLoad !== null && partitionsLoad !== "" && !isNaN(Number(partitionsLoad))
      ? Number(partitionsLoad)
      : 0;
  const p_live =
    liveLoad !== undefined && liveLoad !== null && liveLoad !== "" && !isNaN(Number(liveLoad))
      ? Number(liveLoad)
      : 400;
  const sf =
    safetyFactor !== undefined && safetyFactor !== null && safetyFactor !== "" && !isNaN(Number(safetyFactor))
      ? Number(safetyFactor)
      : 1.2;

  return Math.round((g_dead * 1.1 + p_part * 1.2 + p_live * sf) * 10) / 10;
}

/**
 * Расчет эффективных размеров и площади антресоли
 */
export function getEffectiveMezzanineDimensions(floorStructure, totalBuildingWidth, buildingLength) {
  const bW = Number(totalBuildingWidth) > 0 ? Number(totalBuildingWidth) : 18;
  const bL = Number(buildingLength) > 0 ? Number(buildingLength) : 36;

  const rawW = floorStructure?.mezzanineWidth != null && !isNaN(Number(floorStructure.mezzanineWidth))
    ? Number(floorStructure.mezzanineWidth)
    : null;
  const rawL = floorStructure?.mezzanineLength != null && !isNaN(Number(floorStructure.mezzanineLength))
    ? Number(floorStructure.mezzanineLength)
    : null;

  const isCustomWidth = rawW !== null && rawW > 0 && rawW < bW;
  const isCustomLength = rawL !== null && rawL > 0 && rawL < bL;

  const width = isCustomWidth ? Math.max(1, Math.min(bW, Math.round(rawW * 10) / 10)) : bW;
  const length = isCustomLength ? Math.max(1, Math.min(bL, Math.round(rawL * 10) / 10)) : bL;

  return {
    width,
    length,
    area: Math.round(width * length * 10) / 10,
    isCustomWidth,
    isCustomLength,
    isPartial: isCustomWidth || isCustomLength,
  };
}

/**
 * Детальный расчет компонентов несущей конструкции перекрытия по профлисту Н75-750-0.8.
 * СП 266.1325800.2016, ГОСТ 24045-2016:
 * - объем бетона в гофрах: 0.0291 м³/м²
 * - плотность тяжелого бетона: 2450 кг/м³
 * - масса профлиста: 11.2 кг/м²
 * - арматура: 8 кг/м²
 * - второстепенные стальные балки: 30 кг/м²
 * - hc = max(40, thick - 75) мм
 * - Vconcrete = 0.0291 + hc / 1000
 * - concreteLoad = Vconcrete * 2450
 * - structuralDeadLoad = concreteLoad + 11.2 + 8 + 30
 */
export function getMonolithicDeckStructuralComponents(t) {
  const thick = Number(t) || 120;
  const hc = Math.max(40, thick - 75);
  const corrugationVolume = 0.0291; // м³/м²
  const aboveVolume = hc / 1000; // м³/м²
  const totalVolume = Math.round((corrugationVolume + aboveVolume) * 10000) / 10000;
  const corrugationConcreteLoad = Math.round(corrugationVolume * 2450 * 1000) / 1000; // 71.295 кг/м² (~71.3)
  const aboveConcreteLoad = Math.round(aboveVolume * 2450 * 1000) / 1000; // 45 * 2.45 = 110.25 кг/м²
  const concreteLoad = Math.round(totalVolume * 2450 * 1000) / 1000; // 181.545 кг/м² при t=120
  const profileSheetLoad = 11.2; // кг/м²
  const reinforcementLoad = 8; // кг/м²
  const secondaryBeamsLoad = 30; // кг/м²
  const structuralDeadLoad =
    Math.round(
      (concreteLoad + profileSheetLoad + reinforcementLoad + secondaryBeamsLoad) *
        1000
    ) / 1000; // 230.745 кг/м² при t=120

  return {
    thickness: thick,
    hc,
    corrugationVolume,
    aboveVolume,
    totalVolume,
    corrugationConcreteLoad,
    aboveConcreteLoad,
    concreteLoad,
    profileSheetLoad,
    reinforcementLoad,
    secondaryBeamsLoad,
    structuralDeadLoad,
  };
}

/**
 * Расчет собственного веса несущей конструкции перекрытия structuralDeadLoad (кг/м²).
 * Без состава пола и без перегородок.
 */
export function calculateStructuralDeadLoadForType(typeId, t) {
  const thick = Number(t) || 120;
  if (typeId === "monolithic_deck") {
    return getMonolithicDeckStructuralComponents(thick).structuralDeadLoad;
  }
  return calculateDeadLoadForType(typeId, thick, 0);
}

/**
 * Суммирование слоев состава пола.
 */
export function calculateFloorFinishLoad(layers) {
  if (!Array.isArray(layers) || layers.length === 0) return 0;
  return layers.reduce((sum, layer) => {
    const val = Number(layer?.load);
    return sum + (!isNaN(val) ? val : 0);
  }, 0);
}

/**
 * Расчет собственного веса перекрытия (кг/м²) в зависимости от типа и толщины.
 * Для Н75: deadLoad = structuralDeadLoad + floorFinishLoad.
 */
export function calculateDeadLoadForType(typeId, t, floorFinishLoad) {
  const thick = Number(t) || 120;
  switch (typeId) {
    case "precast_hollow_core":
      // Сборные многопустотные плиты ПК/ПБ - постоянная заводская толщина 220 мм и масса 330 кг/м²
      return 330;
    case "monolithic_deck": {
      const structural = getMonolithicDeckStructuralComponents(thick).structuralDeadLoad;
      const finish =
        floorFinishLoad !== undefined && floorFinishLoad !== null && !isNaN(Number(floorFinishLoad))
          ? Number(floorFinishLoad)
          : 15;
      return Math.round((structural + finish) * 1000) / 1000;
    }
    case "monolithic_slab":
      // Монолитная плита тяжелого бетона B25 (при t=180мм -> 525 кг/м²: 180*2.5 + 25 топпинг + 50 ригели)
      return Math.max(250, Math.round(thick * 2.5 + 75));
    case "precast_block_composite":
      // Сборно-монолитное (при t=200мм -> 220 кг/м²)
      return Math.max(120, Math.round(thick * 1.1));
    case "steel_grating":
      // Стальной настил: лист или решетка толщиной thick мм + балки/прогоны 22 кг/м²
      return Math.max(30, Math.round(22 + thick * 1.0));
    case "timber_deck":
      // Деревянный настил
      return Math.max(25, Math.round(16 + thick * 0.4));
    case "knauf_dry_floor":
      // Сухая стяжка KNAUF: ГВЛВ 20 мм (25 кг/м²) + керамзитовая засыпка
      return Math.max(50, Math.round(43 + Math.max(0, thick - 20) * 1.04));
    default:
      return 245.745;
  }
}

/**
 * Динамический расчет состава слоев пирога перекрытия при изменении толщины.
 * Обновляет толщину бетона над гофрами профлиста Н75, массу бетона и настилов.
 * В слои входят исключительно элементы конструкции перекрытия (deadLoad).
 * Нагрузка от перегородок вынесена в отдельную позицию.
 */
export function getLayersForTypeAndThickness(typeInfo, t) {
  if (!typeInfo) return [];
  const thick = Number(t) || typeInfo.defaultThickness || 120;

  if (typeInfo.id === "monolithic_deck") {
    const comp = getMonolithicDeckStructuralComponents(thick);
    return [
      {
        name: `Монолитный бетон B25 над гофрами (hc = t - 75 = ${comp.hc} мм, min hc >= 40 мм)`,
        thickness: comp.hc,
        weight: comp.aboveConcreteLoad,
        highlight: true,
      },
      {
        name: "Бетон B25 в гофрах профлиста Н75 (объем 0.0291 м³/м²)",
        thickness: 75,
        weight: 71.3,
        highlight: true,
        note: `Суммарный объем бетона: ${comp.totalVolume} м³/м² (${comp.concreteLoad} кг/м²)`,
      },
      {
        name: "Профилированный оцинкованный лист Н75-750-0.8 (ГОСТ 24045)",
        thickness: 75,
        weight: comp.profileSheetLoad,
      },
      {
        name: "Арматурная сетка в полке и стержни в ребрах",
        thickness: 10,
        weight: comp.reinforcementLoad,
      },
      {
        name: "Стальные второстепенные балки (шаг 2.5–3.0 м)",
        thickness: 200,
        weight: comp.secondaryBeamsLoad,
      },
    ];
  }

  if (typeInfo.id === "monolithic_slab") {
    const slabWeight = Math.round(thick * 2.5);
    return [
      {
        name: "Топпинг пола / обеспыливающая пропитка (10 мм)",
        thickness: 10,
        weight: 25,
      },
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

  if (typeInfo.id === "steel_grating") {
    const sheetWeight = Math.round(thick * 1.0);
    return [
      {
        name: `Стальной рифленый лист / решетка SP (толщина ${thick} мм)`,
        thickness: thick,
        weight: sheetWeight,
        highlight: true,
      },
      {
        name: "Второстепенные прогоны из швеллера / профильной трубы",
        thickness: 120,
        weight: 22,
      },
    ];
  }

  if (typeInfo.id === "timber_deck") {
    const timberWeight = Math.round(16 + thick * 0.4);
    return [
      {
        name: "Чистовое покрытие (ламинат / износостойкий линолеум)",
        thickness: 8,
        weight: 8,
      },
      {
        name: `Двойной настил из плит ЦСП / OSB (${thick} мм)`,
        thickness: thick,
        weight: timberWeight,
        highlight: true,
      },
      {
        name: "Деревянные антисептированные лаги с базальтовой ватой",
        thickness: 100,
        weight: 10,
      },
      {
        name: "Второстепенные стальные балки перекрытия",
        thickness: 180,
        weight: 10,
      },
    ];
  }

  if (typeInfo.id === "knauf_dry_floor") {
    const backfillH = Math.max(20, thick - 20);
    const backfillWeight = Math.round(backfillH * 1.04);
    return [
      {
        name: "Сборные гипсоволокнистые элементы пола KNAUF КНАУФ-суперпол (20 мм)",
        thickness: 20,
        weight: 25,
      },
      {
        name: `Керамзитовая засыпка мелкой фракции (${backfillH} мм)`,
        thickness: backfillH,
        weight: backfillWeight,
        highlight: true,
      },
      {
        name: "Несущий профлист Н57/Н75",
        thickness: 75,
        weight: 18,
      },
    ];
  }

  return typeInfo.layers || [];
}

/**
 * Расчет и валидация отметок пола этажей (м).
 * - storiesCount: общее количество этажей здания (1, 2, 3...)
 * - height: высота здания до низа несущих конструкций покрытия (м)
 * - customElevations: массив отметок пола [h_2, h_3, ...] для этажей выше 1-го
 *
 * Требования ТЗ:
 * 1. Для здания с stories = N существует ровно N - 1 межэтажных перекрытий. При N = 1 -> [].
 * 2. Первый этаж всегда на отметке 0.000 м.
 * 3. Отметки строго возрастают: 0 < h_2 < h_3 < ... < height.
 * 4. Ни одна отметка не должна быть >= height (height - отметка низа конструкций покрытия).
 * 5. При уменьшении этажности лишние отметки удаляются.
 * 6. При увеличении этажности существующие корректные отметки сохраняются,
 *    а новые формируются по логике автоматических отметок.
 */
export function getValidFloorElevations(storiesCount, height, customElevations = null) {
  const n = Math.max(1, parseInt(storiesCount, 10) || 1);
  const H = Math.max(2.0, parseFloat(height) || 6.0);

  if (n <= 1) return [];

  // Дефолтные отметки с равномерным шагом
  const defaultElevations = [];
  for (let f = 1; f < n; f++) {
    defaultElevations.push(Math.round((f * H / n) * 100) / 100);
  }

  const validated = [];
  let prevElevation = 0;
  const minStep = 0.5; // минимальный строительный шаг между перекрытиями 0.5 м

  for (let i = 0; i < n - 1; i++) {
    const remainingFloors = (n - 1) - i; // текущий этаж и этажи выше него

    let val;
    if (
      Array.isArray(customElevations) &&
      i < customElevations.length &&
      customElevations[i] !== null &&
      customElevations[i] !== undefined &&
      !isNaN(parseFloat(customElevations[i]))
    ) {
      val = parseFloat(customElevations[i]);
    } else {
      // Новая отметка формируется на основе дефолтных отметок проекта
      const rawDefault = defaultElevations[i];
      if (rawDefault > prevElevation) {
        val = rawDefault;
      } else {
        const remainingSteps = n - i;
        val = Math.round((prevElevation + (H - prevElevation) / remainingSteps) * 100) / 100;
      }
    }

    if (isNaN(val)) {
      val = defaultElevations[i];
    }

    // Максимально допустимая отметка для текущего этажа:
    // оставляет место для вышележащих этажей и покрытия на отметке H (отметка строго < H)
    let maxAllowedForThis = Math.round((H - remainingFloors * minStep) * 100) / 100;
    let minAllowedForThis = Math.round((prevElevation + minStep) * 100) / 100;

    // Защита от малой высоты H, когда minStep 0.5м не помещается
    if (maxAllowedForThis < minAllowedForThis) {
      val = defaultElevations[i];
      if (val <= prevElevation) {
        val = Math.round(((prevElevation + H) / 2) * 100) / 100;
      }
      if (val >= H) {
        val = Math.round((H - 0.1) * 100) / 100;
      }
    } else {
      if (val < minAllowedForThis) {
        val = minAllowedForThis;
      }
      if (val > maxAllowedForThis) {
        val = maxAllowedForThis;
      }
    }

    val = Math.round(val * 100) / 100;
    // Финальная гарантия: 0 < val < H и val > prevElevation
    if (val >= H) {
      val = Math.round((H - 0.05) * 100) / 100;
    }
    if (val <= prevElevation && prevElevation < H) {
      val = Math.round(((prevElevation + H) / 2) * 100) / 100;
    }

    validated.push(val);
    prevElevation = val;
  }

  return validated;
}

/**
 * Автоматический расчет пролетов для колонн этажа по правилу 9 метров.
 * При W < 9м — 1 пролет W (без промежуточных стоек).
 * При W >= 9м — деление на равные подпролеты не более 9м.
 */
export function getAutoColumnSpans(spanWidth) {
  const W = Number(spanWidth) || 18;
  if (W <= 0) return [18];
  const kSubSpans = W >= 9 ? Math.floor(W / 9) + 1 : 1;
  const subBay = Math.round((W / kSubSpans) * 100) / 100;
  const spans = [];
  let rem = W;
  for (let i = 0; i < kSubSpans; i++) {
    if (i === kSubSpans - 1) {
      spans.push(Math.round(rem * 100) / 100);
    } else {
      spans.push(subBay);
      rem -= subBay;
    }
  }
  return spans;
}

/**
 * Валидация толщины перекрытия по диапазону thicknessRange типа перекрытия.
 * Источником истины является thicknessRange конкретного типа перекрытия.
 * Возвращает { isValid: boolean, error: string | null }.
 */
export function validateFloorThickness(typeInfo, thickness) {
  if (!typeInfo) return { isValid: true, error: null };
  if (typeInfo.isConstantThickness) {
    return { isValid: true, error: null };
  }
  const [minT, maxT] = typeInfo.thicknessRange || [0, 9999];
  if (thickness === "" || thickness === null || thickness === undefined) {
    return {
      isValid: false,
      error: `Толщина должна быть от ${minT} до ${maxT} мм.`,
    };
  }
  const num = Number(thickness);
  if (isNaN(num) || num < minT || num > maxT) {
    return {
      isValid: false,
      error: `Толщина должна быть от ${minT} до ${maxT} мм.`,
    };
  }
  return { isValid: true, error: null };
}

/**
 * ЗАДАЧА 6.1: Строгая валидация количества пролётов (spansCount).
 * Требования:
 * - только целое число
 * - минимум 1, максимум 10
 * - без Math.round/Math.floor/Math.ceil для авто-исправления
 */
export function validateSpansCount(val) {
  if (val === "" || val === null || val === undefined) {
    return { isValid: false, error: "Количество пролётов: укажите целое число от 1 до 10" };
  }
  if (typeof val === "string" && val.trim() === "") {
    return { isValid: false, error: "Количество пролётов: укажите целое число от 1 до 10" };
  }
  const num = Number(val);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { isValid: false, error: "Количество пролётов должно быть целым числом (от 1 до 10)" };
  }
  if (num < 1 || num > 10) {
    return { isValid: false, error: "Допустимое количество пролётов: от 1 до 10" };
  }
  return { isValid: true, value: num, error: null };
}

/**
 * ЗАДАЧА 6.1: Строгая валидация этажности (stories).
 * Требования:
 * - только целое число
 * - минимум 1, максимум 5
 * - без Math.round/Math.floor/Math.ceil для авто-исправления
 */
export function validateStories(val) {
  if (val === "" || val === null || val === undefined) {
    return { isValid: false, error: "Количество этажей: укажите целое число от 1 до 5" };
  }
  if (typeof val === "string" && val.trim() === "") {
    return { isValid: false, error: "Количество этажей: укажите целое число от 1 до 5" };
  }
  const num = Number(val);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { isValid: false, error: "Количество этажей должно быть целым числом (от 1 до 5)" };
  }
  if (num < 1 || num > 5) {
    return { isValid: false, error: "Допустимое количество этажей: от 1 до 5" };
  }
  return { isValid: true, value: num, error: null };
}

/**
 * ЗАДАЧА 6.12 БЛОК A: Строгая валидация геометрических параметров здания в QuickEstimator.
 * Требования:
 * - spanWidth > 0
 * - length > 0
 * - height > 0
 * - slope >= 0 (0% обязательно допустим)
 * Все значения должны быть конечными числами.
 * Пустая строка, NaN, Infinity, отрицательная ширина/длина/высота — невалидны.
 */
export function validateQuickEstimatorGeometry({ spanWidth, length, height, slope } = {}) {
  const isFiniteNumber = (v) =>
    v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));

  const errors = [];

  const wNum = Number(spanWidth);
  if (!isFiniteNumber(spanWidth) || wNum <= 0) {
    errors.push("ширина пролёта должна быть больше 0.");
  }

  const lNum = Number(length);
  if (!isFiniteNumber(length) || lNum <= 0) {
    errors.push("длина здания должна быть больше 0.");
  }

  const hNum = Number(height);
  if (!isFiniteNumber(height) || hNum <= 0) {
    errors.push("высота здания должна быть больше 0.");
  }

  const sNum = Number(slope);
  if (!isFiniteNumber(slope) || sNum < 0) {
    errors.push("уклон кровли не может быть отрицательным.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    error: errors.length > 0 ? `Некорректная геометрия: ${errors[0]}` : null,
  };
}



