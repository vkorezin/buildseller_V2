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
    thicknessRange: [115, 200],
    thicknessPresets: [115, 120, 130, 140, 150, 160, 180],
    isConstantThickness: false,
    deckProfile: "Н75-750-0.8",
    corrugationHeight: 75,
    corrugationVolumePerM2: 0.042, // м³/м² бетон в гофрах
    deadLoad: 280, // кг/м² (бетон B25 над гофрами + бетон в гофрах Н75 + сетка + профлист Н75-750 + балки)
    beamSpacing: "2.5 – 3.2 м",
    fireRating: "REI 60 – REI 90",
    features:
      "Сталебетонное перекрытие по оцинкованному профлисту Н75-750-0.8. Бетон полностью заполняет гофры листа (объем в ребрах ~0.042 м³/м² или 103 кг/м²), формируя надежную ребристую плиту со сплошным слоем бетона над полкой гофр.",
    color: "#2563eb",
    layers: [
      { name: "Чистовое износостойкое полимерное покрытие / топпинг", thickness: 5, weight: 15 },
      { name: "Монолитный бетон B25 над гофрами профлиста (hc = 45 мм)", thickness: 45, weight: 110, isVariableConcrete: true },
      { name: "Бетон B25 в гофрах профлиста Н75 (объем 0.042 м³/м²)", thickness: 75, weight: 103, isCorrugationConcrete: true },
      { name: "Профилированный оцинкованный лист Н75-750-0.8 (ГОСТ 24045)", thickness: 75, weight: 13 },
      { name: "Стальные второстепенные балки (шаг 2.5–3.0 м)", thickness: 200, weight: 30 },
      { name: "Перегородки и подвесные инженерные сети", thickness: 0, weight: 50 },
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
      { name: "Выравнивающая армированная стяжка М150", thickness: 40, weight: 75 },
      { name: "Сборные преднапряженные многопустотные плиты ПБ-220", thickness: 220, weight: 230 },
      { name: "Замоноличивание швов бетоном B20", thickness: 0, weight: 15 },
      { name: "Главные стальные балки перекрытия", thickness: 350, weight: 45 },
      { name: "Перегородки и инженерные коммуникации", thickness: 0, weight: 50 },
    ],
  },
  {
    id: "monolithic_slab",
    name: "Монолитная железобетонная плита по съемной опалубке (140–250 мм)",
    shortName: "Монолитная ж/б плита",
    category: "reinforced_concrete",
    standard: "СП 63.13330.2018",
    defaultThickness: 180,
    thicknessRange: [140, 250],
    thicknessPresets: [140, 160, 180, 200, 220, 250],
    isConstantThickness: false,
    deadLoad: 460, // кг/м²
    beamSpacing: "4.0 – 6.0 м",
    fireRating: "REI 90 – REI 150",
    features:
      "Сплошная плита тяжелого бетона B25 с двухслойным армированием. Обладает максимальной несущей способностью и вибростойкостью под тяжелые станки и погрузчики.",
    color: "#475569",
    layers: [
      { name: "Топпинг пола / обеспыливающая пропитка", thickness: 10, weight: 25 },
      { name: "Монолитная железобетонная плита B25 (двойная арматура)", thickness: 180, weight: 450 },
      { name: "Главные стальные ригели каркаса", thickness: 400, weight: 50 },
      { name: "Перегородки и подвесное оборудование", thickness: 0, weight: 50 },
    ],
  },
  {
    id: "precast_block_composite",
    name: "Сборно-монолитное часторебристое перекрытие (балочно-блочное)",
    shortName: "Сборно-монолитное",
    category: "composite",
    standard: "ТУ 5858-001, СП 266.1325800",
    defaultThickness: 200,
    thicknessRange: [150, 250],
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
    thicknessRange: [25, 60],
    thicknessPresets: [25, 30, 35, 40, 50],
    isConstantThickness: false,
    deadLoad: 55, // кг/м²
    beamSpacing: "1.0 – 1.8 м",
    fireRating: "R 15 (требуется конструктивная огнезащита)",
    features:
      "Промышленное перекрытие для технологических площадок, насосных, котельных, цеховых антресолей и галерей обслуживания. Минимальный собственный вес.",
    color: "#059669",
    layers: [
      { name: "Стальной рифленый лист t=6мм или сварная решетка SP", thickness: 6, weight: 48 },
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
    thicknessRange: [50, 120],
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
      { name: "Двойной черновой настил из плит ЦСП 16мм + OSB-3 12мм", thickness: 28, weight: 28 },
      { name: "Деревянные антисептированные лаги с базальтовой ватой", thickness: 100, weight: 18 },
      { name: "Второстепенные стальные балки перекрытия", thickness: 180, weight: 24 },
    ],
  },
  {
    id: "knauf_dry_floor",
    name: "Сборная сухая стяжка по профлисту (KNAUF Суперпол / ГВЛВ)",
    shortName: "Сухая стяжка KNAUF",
    category: "dry_screed",
    standard: "СП 29.13330.2011, Серия 1.031.9-2.07",
    defaultThickness: 70,
    thicknessRange: [50, 110],
    thicknessPresets: [50, 60, 70, 80, 100],
    isConstantThickness: false,
    deadLoad: 95, // кг/м²
    beamSpacing: "1.5 – 2.5 м",
    fireRating: "REI 45",
    features:
      "Монтаж без бетонных работ: несущий профнастил, жесткие звукоизоляционные маты ФЛОР БАТТС, керамзитовая подсыпка и влагостойкие гипсоволокнистые элементы пола KNAUF.",
    color: "#7c3aed",
    layers: [
      { name: "Элементы пола КНАУФ Суперпол (ГВЛВ 20 мм)", thickness: 20, weight: 24 },
      { name: "Звукоизоляционные плиты Rockwool ФЛОР БАТТС", thickness: 25, weight: 8 },
      { name: "Сухая керамзитовая засыпка Компэвит", thickness: 25, weight: 22 },
      { name: "Несущий профилированный лист Н57/Н75", thickness: 75, weight: 11 },
      { name: "Стальные балки перекрытия (шаг 1.5–2.5 м)", thickness: 200, weight: 30 },
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
  deadLoad: 280, // кг/м²
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
};

/**
 * Расчет собственного веса перекрытия (кг/м²) в зависимости от типа и толщины.
 * Учитывает бетон в гофрах профлиста Н75 согласно СП 266.1325800.2016.
 */
export function calculateDeadLoadForType(typeId, t) {
  const thick = Number(t) || 120;
  switch (typeId) {
    case "precast_hollow_core":
      // Сборные многопустотные плиты ПК/ПБ - постоянная заводская толщина 220 мм и масса 330 кг/м²
      return 330;
    case "monolithic_deck": {
      // Профнастил Н75-750-0.8 (ГОСТ 24045-2016, СП 266.1325800.2016):
      // Высота гофры h_g = 75 мм.
      // Объем бетона, заполняющего гофры (ребра): V_cor = 0.042 м³/м².
      // При плотности тяжелого бетона 2450 кг/м³ масса бетона в гофрах = 0.042 * 2450 = 103 кг/м².
      // Высота сплошной полки бетона над гофрами: hc = max(35, thick - 75) мм.
      // Масса бетона над гофрами: (hc / 1000) * 2450 = hc * 2.45 кг/м².
      // Профлист Н75-750-0.8: 13 кг/м².
      // Арматурная сетка в полке и стержни в ребрах: 8 кг/м².
      // Топпинг / чистовой слой (5 мм): 15 кг/м².
      // Второстепенные стальные балки: 30 кг/м².
      // Постоянная составляющая (гофры + лист + арматура + топпинг + балки) = 103 + 13 + 8 + 15 + 30 = 169 кг/м².
      // Переменная составляющая от слоя бетона над гофрами: hc * 2.45 кг/м².
      // Итого собственный вес: 169 + hc * 2.45 (при t=120: 169 + 45*2.45 = 279.25 ≈ 280 кг/м²).
      const hc = Math.max(35, thick - 75);
      return Math.round(169 + hc * 2.45);
    }
    case "monolithic_slab":
      // Монолитная плита тяжелого бетона B25 (при t=180мм -> 460 кг/м²)
      // Плотность бетона 2500 кг/м³ -> thick * 2.5 + топпинг (25) + ригели (50)
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
      return 280;
  }
}

/**
 * Динамический расчет состава слоев пирога перекрытия при изменении толщины.
 * Обновляет толщину бетона над гофрами профлиста Н75, массу бетона и настилов.
 */
export function getLayersForTypeAndThickness(typeInfo, t) {
  if (!typeInfo) return [];
  const thick = Number(t) || typeInfo.defaultThickness || 120;

  if (typeInfo.id === "monolithic_deck") {
    const hc = Math.max(35, thick - 75);
    const weightAbove = Math.round(hc * 2.45);
    const totalConcreteVol = (0.042 + hc / 1000).toFixed(3);
    return [
      {
        name: "Чистовое износостойкое полимерное покрытие / топпинг",
        thickness: 5,
        weight: 15,
      },
      {
        name: `Монолитный бетон B25 над гофрами (hc = t - 75 = ${hc} мм)`,
        thickness: hc,
        weight: weightAbove,
        highlight: true,
      },
      {
        name: "Бетон B25 в гофрах профлиста Н75 (объем 0.042 м³/м²)",
        thickness: 75,
        weight: 103,
        highlight: true,
        note: `Общий объем бетона: ${totalConcreteVol} м³/м² (${103 + weightAbove} кг/м²)`,
      },
      {
        name: "Профилированный оцинкованный лист Н75-750-0.8 (ГОСТ 24045)",
        thickness: 75,
        weight: 13,
      },
      {
        name: "Стальные второстепенные балки (шаг 2.5–3.0 м)",
        thickness: 200,
        weight: 30,
      },
      {
        name: "Перегородки и подвесные инженерные сети",
        thickness: 0,
        weight: 50,
      },
    ];
  }

  if (typeInfo.id === "monolithic_slab") {
    const slabWeight = Math.round(thick * 2.5);
    return [
      {
        name: "Топпинг пола / обеспыливающая пропитка",
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
      {
        name: "Перегородки и подвесное оборудование",
        thickness: 0,
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
      {
        name: "Перегородки и подвесные сети",
        thickness: 0,
        weight: 50,
      },
    ];
  }

  if (typeInfo.id === "timber_deck") {
    const timberWeight = Math.round(16 + thick * 0.4);
    return [
      {
        name: `Настил из шпунтованной доски / бруса (${thick} мм)`,
        thickness: thick,
        weight: timberWeight,
        highlight: true,
      },
      {
        name: "Деревянные / стальные балки перекрытия",
        thickness: 200,
        weight: 25,
      },
      {
        name: "Перегородки и подвесные сети",
        thickness: 0,
        weight: 40,
      },
    ];
  }

  if (typeInfo.id === "knauf_dry_floor") {
    const backfillH = Math.max(20, thick - 20);
    const backfillWeight = Math.round(backfillH * 1.04);
    return [
      {
        name: "Сборные гипсоволокнистые элементы пола KNAUF КНАУФ-суперпол",
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
        name: "Профлист или сплошное основание",
        thickness: 60,
        weight: 18,
      },
      {
        name: "Стальные несущие балки",
        thickness: 200,
        weight: 30,
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
 * 1. Первый этаж всегда на отметке 0.000 м.
 * 2. Отметка каждого этажа не выше низа несущих конструкций (height) и отметки пола следующего этажа.
 * 3. Отметки строго возрастают: 0 < h_2 < h_3 < ... <= height.
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

  if (!Array.isArray(customElevations) || customElevations.length !== n - 1) {
    return defaultElevations;
  }

  const validated = [];
  let prevElevation = 0;

  for (let i = 0; i < n - 1; i++) {
    let val = parseFloat(customElevations[i]);
    const remainingFloors = (n - 1) - i; // текущий этаж и этажи выше него
    const minStep = 0.5; // минимальный строительный шаг между перекрытиями 0.5 м

    // Максимально допустимая отметка для текущего этажа:
    // оставляет место для вышележащих этажей до отметки низа конструкций H
    const maxAllowedForThis = Math.round((H - (remainingFloors - 1) * minStep) * 100) / 100;
    const minAllowedForThis = Math.round((prevElevation + minStep) * 100) / 100;

    if (isNaN(val)) {
      val = defaultElevations[i];
    }

    if (val < minAllowedForThis) {
      val = minAllowedForThis;
    }
    if (val > maxAllowedForThis) {
      val = Math.max(minAllowedForThis, maxAllowedForThis);
    }

    val = Math.round(val * 100) / 100;
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


