import * as XLSX from "xlsx";

/**
 * Форматирование значения для 1С:
 * - Пустые, null, undefined возвращают пустую строку (для последующей фильтрации)
 * - Числовые значения форматируются с запятой (например: 26,14)
 * - Строки очищаются от лишних пробелов
 */
export function format1CValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") {
    if (isNaN(val)) return "";
    if (Number.isInteger(val)) return String(val);
    const rounded = Math.round(val * 100) / 100;
    return String(rounded).replace(".", ",");
  }
  const str = String(val).trim();
  if (!str) return "";
  // Если строка является числом с точкой (например "26.14")
  if (/^-?\d+\.\d+$/.test(str)) {
    return str.replace(".", ",");
  }
  return str;
}

/**
 * Формирование полного списка параметров с разбивкой по категориям
 * и строгим соблюдением маппинга параметров QuickEstimator -> 1С.
 */
export function get1CParameters(data = {}) {
  const {
    spanWidth = 18,
    spansCount = 1,
    length = 48,
    height = 6,
    roofShape = "gable",
    slope = 10,
    stories = 1,
    floorStructure = null,
    cranes = [],
    snowLoad = "180",
    windLoad = "38",
    frameType = "beam",
    useSandwich = true,
    layoutMode = "horizontal",
    aperturesList = [],
    estimation = {}
  } = data;

  const W = Number(spanWidth) || 0;
  const N = Number(spansCount) || 1;
  const L = Number(length) || 0;
  const H = Number(height) || 0;
  const totalWidth = W * N;

  const rows = [];

  // 1. Общие параметры здания
  rows.push({
    category: "Общие параметры здания",
    param: "Ширина",
    value: format1CValue(totalWidth),
    name: "Ширина, м"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "Длина",
    value: format1CValue(L),
    name: "Длина, м"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "Высота",
    value: format1CValue(H),
    name: "Высота, м"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "ВысотаОтметка",
    value: "до низа несущих конструкций",
    name: "Отметка высоты"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "Этажность",
    value: format1CValue(stories),
    name: "Этажность здания"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "КровляФорма",
    value: roofShape === "single" ? "Односкатная" : "Двускатная",
    name: "Форма кровли"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "КровляУклон",
    value: `${format1CValue(slope)}%`,
    name: "Уклон кровли"
  });
  rows.push({
    category: "Общие параметры здания",
    param: "Колонны.1.ШагРам",
    value: "6",
    name: "Шаг рам, м"
  });

  // 2. Нагрузки
  rows.push({
    category: "Климатические нагрузки",
    param: "РегионСнег",
    value: `${format1CValue(snowLoad)} кг/м²`,
    name: "Снег"
  });
  rows.push({
    category: "Климатические нагрузки",
    param: "РегионВетер",
    value: `${format1CValue(windLoad)} кг/м²`,
    name: "Ветер"
  });

  // 3. Массы и площади (по расчету estimation)
  if (estimation) {
    rows.push({
      category: "Массы и площади каркаса",
      param: "ПлощадьМК",
      value: format1CValue(estimation.floorArea),
      name: "Площадь здания общая (кв.м)"
    });
    rows.push({
      category: "Массы и площади каркаса",
      param: "МассаМК",
      value: format1CValue(estimation.metalWeight),
      name: "Масса здания общая (тн)"
    });
    rows.push({
      category: "Массы и площади каркаса",
      param: "МассаЧерняга",
      value: format1CValue(estimation.framesWeight),
      name: "Масса расч. черн.мет, тн"
    });
    rows.push({
      category: "Массы и площади каркаса",
      param: "МассаПрофиль",
      value: format1CValue(estimation.purlinsWeight),
      name: "Масса расч. профилей, тн"
    });
    rows.push({
      category: "Массы и площади каркаса",
      param: "МассаФасонина",
      value: format1CValue(estimation.tiesWeight),
      name: "Масса расч. фасонки, тн"
    });
  }

  // 4. Ограждающие конструкции (ОК) — только если useSandwich === true
  if (useSandwich) {
    const wallArea = parseFloat(estimation?.wallAreaBox || 0);
    const roofArea = parseFloat(estimation?.roofArea || 0);
    const totalOKArea = wallArea + roofArea;

    rows.push({
      category: "Ограждающие конструкции",
      param: "ПлощадьОК",
      value: format1CValue(totalOKArea > 0 ? totalOKArea.toFixed(1) : ""),
      name: "Площадь ограждающих конструкций (кв.м)"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Тип",
      value: "Стены",
      name: "Тип ОК 1"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Тип.ТипОбшивки",
      value: "Сэндвич-панель стеновая",
      name: "Тип обшивки стен"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Тип.Утеплитель",
      value: floorStructure?.wallInsulation || "мин.ватн.волокно, 105 кг/куб.м.",
      name: "Утеплитель стеновых панелей"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Тип.ТолщинаУтеплителя",
      value: format1CValue(floorStructure?.wallThickness || "100"),
      name: "Толщина утеплителя стен (мм)"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Тип.Раскладка",
      value: layoutMode === "vertical" ? "Вертикальная" : "Горизонтальная",
      name: "Раскладка стеновых панелей"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.1.Поставляется",
      value: "Да",
      name: "Поставка стеновых панелей"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.2.Тип",
      value: "Кровля",
      name: "Тип ОК 2"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.2.Тип.ТипОбшивки",
      value: "Сэндвич-панель кровельная",
      name: "Тип обшивки кровли"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.2.Тип.Утеплитель",
      value: floorStructure?.roofInsulation || "мин.ватн.волокно, 105 кг/куб.м.",
      name: "Утеплитель кровельных панелей"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.2.Тип.ТолщинаУтеплителя",
      value: format1CValue(floorStructure?.roofThickness || "120"),
      name: "Толщина утеплителя кровли (мм)"
    });
    rows.push({
      category: "Ограждающие конструкции",
      param: "ОК.2.Поставляется",
      value: "Да",
      name: "Поставка кровельных панелей"
    });
  }

  // 5, 6, 7. Элементы строения (Табличная часть 1С: ЭлементыСтроения.{k})
  let elemIndex = 1;

  // 5. Оконные, воротные и дверные проемы (aperturesList)
  if (Array.isArray(aperturesList) && aperturesList.length > 0) {
    aperturesList.forEach((ap) => {
      const k = elemIndex++;
      const apType = (ap.type || "").toLowerCase();

      if (apType === "window" || apType === "окно") {
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип`,
          value: "Окно",
          name: `Элемент ${k}: Тип`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.Тип`,
          value: "Окно ПВХ",
          name: `Элемент ${k}: Конструкция окна`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ШиринаПроема`,
          value: format1CValue(ap.width),
          name: `Элемент ${k}: Ширина проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ВысотаПроема`,
          value: format1CValue(ap.height),
          name: `Элемент ${k}: Высота проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ОтметкаНиза`,
          value: format1CValue(ap.eBot !== undefined && ap.eBot !== null ? ap.eBot : "0"),
          name: `Элемент ${k}: Отметка низа (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Количество`,
          value: format1CValue(ap.count || "1"),
          name: `Элемент ${k}: Количество`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Разрабатывается`,
          value: "Да",
          name: `Элемент ${k}: Разрабатывается`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Поставляется`,
          value: "Да",
          name: `Элемент ${k}: Поставляется`
        });
      } else if (apType === "gate" || apType === "ворота") {
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип`,
          value: "Ворота",
          name: `Элемент ${k}: Тип`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.Тип`,
          value: "Ворота подъемно-секционные",
          name: `Элемент ${k}: Конструкция ворот`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ШиринаПроема`,
          value: format1CValue(ap.width),
          name: `Элемент ${k}: Ширина проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ВысотаПроема`,
          value: format1CValue(ap.height),
          name: `Элемент ${k}: Высота проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Количество`,
          value: format1CValue(ap.count || "1"),
          name: `Элемент ${k}: Количество`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Разрабатывается`,
          value: "Да",
          name: `Элемент ${k}: Разрабатывается`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Поставляется`,
          value: "Да",
          name: `Элемент ${k}: Поставляется`
        });
      } else if (apType === "door" || apType === "дверь") {
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип`,
          value: "Дверь",
          name: `Элемент ${k}: Тип`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.Тип`,
          value: "Дверной блок металлический",
          name: `Элемент ${k}: Конструкция двери`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ШиринаПроема`,
          value: format1CValue(ap.width),
          name: `Элемент ${k}: Ширина проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Тип.ВысотаПроема`,
          value: format1CValue(ap.height),
          name: `Элемент ${k}: Высота проема (м)`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Количество`,
          value: format1CValue(ap.count || "1"),
          name: `Элемент ${k}: Количество`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Разрабатывается`,
          value: "Да",
          name: `Элемент ${k}: Разрабатывается`
        });
        rows.push({
          category: "Инженерные проемы",
          param: `ЭлементыСтроения.${k}.Поставляется`,
          value: "Да",
          name: `Элемент ${k}: Поставляется`
        });
      }
    });
  }

  // 6. Крановое оборудование — ТОЛЬКО если есть активные краны
  const activeCranes = (cranes || []).filter((c) => parseFloat(c.cap || 0) > 0);
  if (activeCranes.length > 0) {
    activeCranes.forEach((crane) => {
      const k = elemIndex++;
      const craneName =
        crane.type === "suspension" ? "Кран подвесной" : "Кран мостовой опорный";
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Тип`,
        value: craneName,
        name: `Элемент ${k}: Тип крана`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Тип.Грузоподъемность`,
        value: format1CValue(crane.cap),
        name: `Элемент ${k}: Грузоподъемность крана (т)`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Тип.ТипРельса`,
        value: crane.type === "suspension" ? "тип М (монорельс)" : "тип КР (крановый)",
        name: `Элемент ${k}: Тип рельса`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Тип.ПролетКрана`,
        value: format1CValue(W),
        name: `Элемент ${k}: Пролет крана (м)`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Количество`,
        value: "1",
        name: `Элемент ${k}: Количество кранов`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Разрабатывается`,
        value: "Да",
        name: `Элемент ${k}: Разрабатывается`
      });
      rows.push({
        category: "Крановое оборудование",
        param: `ЭлементыСтроения.${k}.Поставляется`,
        value: "Да",
        name: `Элемент ${k}: Поставляется`
      });
    });
  }

  // 7. Междуэтажное перекрытие / Антресоль — ТОЛЬКО если stories > 1
  if (Number(stories) > 1) {
    const k = elemIndex++;
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип`,
      value: "Антресоль",
      name: `Элемент ${k}: Тип`
    });
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип.Площадь`,
      value: format1CValue(estimation?.mezzanineArea),
      name: `Элемент ${k}: Площадь антресоли (кв.м)`
    });
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип.ТипПерекрытия`,
      value: floorStructure?.name || "Монолитный ЖБ по профлисту",
      name: `Элемент ${k}: Тип перекрытия`
    });
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип.ТолщинаПерекрытия`,
      value: format1CValue(floorStructure?.thickness || "120"),
      name: `Элемент ${k}: Толщина перекрытия (мм)`
    });
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип.НормативнаяНагрузкаАнтресоль`,
      value: format1CValue(floorStructure?.liveLoad || "400"),
      name: `Элемент ${k}: Нормативная нагрузка (кг/м²)`
    });
    rows.push({
      category: "Междуэтажные перекрытия",
      param: `ЭлементыСтроения.${k}.Тип.МассаПрофиль`,
      value: format1CValue(estimation?.mezzanineWeight),
      name: `Элемент ${k}: Масса металлокаркаса антресоли (тн)`
    });
    const numStories = Number(stories) || 1;
    const elevs = Array.isArray(floorStructure?.storyElevations)
      ? floorStructure.storyElevations.map(Number).filter((v) => v > 0)
      : [];

    for (let tier = 1; tier <= numStories - 1; tier++) {
      const floorNum = tier + 1;
      rows.push({
        category: "Междуэтажные перекрытия",
        param: `ЭтажностьЗдания.${tier}.НомерЭтажа`,
        value: String(floorNum),
        name: `Этаж ${floorNum}: Номер этажа`
      });
      rows.push({
        category: "Междуэтажные перекрытия",
        param: `ЭтажностьЗдания.${tier}.ТипПерекрытия`,
        value: floorStructure?.name || "Монолитный ЖБ по профлисту",
        name: `Этаж ${floorNum}: Тип перекрытия`
      });
      rows.push({
        category: "Междуэтажные перекрытия",
        param: `ЭтажностьЗдания.${tier}.ТолщинаПерекрытия`,
        value: format1CValue(floorStructure?.thickness || "120"),
        name: `Этаж ${floorNum}: Толщина перекрытия (мм)`
      });
      rows.push({
        category: "Междуэтажные перекрытия",
        param: `ЭтажностьЗдания.${tier}.ПолезнаяНагрузкаНаПерекрытия`,
        value: format1CValue(floorStructure?.liveLoad || "400"),
        name: `Этаж ${floorNum}: Полезная нагрузка (кг/м²)`
      });
      if (elevs[tier - 1] !== undefined && elevs[tier - 1] !== null) {
        rows.push({
          category: "Междуэтажные перекрытия",
          param: `ЭтажностьЗдания.${tier}.ОтметкаВерхаБалокПерекрытия`,
          value: format1CValue(elevs[tier - 1]),
          name: `Этаж ${floorNum}: Отметка верха балок (м)`
        });
      }
    }
  }

  return rows;
}

/**
 * Получение строго отфильтрованного списка строк для 1С:
 * Исключаются пустые, null, undefined значения.
 */
export function generate1CRows(data = {}) {
  const allRows = get1CParameters(data);
  return allRows
    .filter((r) => {
      if (r.value === null || r.value === undefined) return false;
      const strVal = String(r.value).trim();
      return strVal.length > 0 && strVal !== "NaN" && strVal !== "NaN кг/м²";
    })
    .map((r) => ({
      Параметр: r.param,
      Значение: r.value,
      Название: r.name
    }));
}

/**
 * Экспорт сформированного ТЗ в файл Excel (.xlsx) для 1С
 */
export function exportTo1CExcel(data = {}, customFilename = null) {
  const filteredRows = generate1CRows(data);

  if (!filteredRows || filteredRows.length === 0) {
    console.warn("Нет данных для выгрузки в 1С");
    return false;
  }

  // Создаем лист с 3-мя колонками: Параметр, Значение, Название
  const worksheet = XLSX.utils.json_to_sheet(filteredRows, {
    header: ["Параметр", "Значение", "Название"]
  });

  // Задаем удобную ширину колонок в Excel
  worksheet["!cols"] = [
    { wch: 42 }, // Колонка A: Параметр
    { wch: 32 }, // Колонка B: Значение
    { wch: 45 }  // Колонка C: Название
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Лист1");

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const filename = customFilename || `TZ_1C_${(Number(data.spanWidth) || 18) * (Number(data.spansCount) || 1)}x${data.length || 48}_${dateStr}.xlsx`;

  try {
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (err) {
    console.error("XLSX.writeFile error, falling back to manual blob download:", err);
    try {
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error("Manual blob download failed:", e);
      return false;
    }
  }
}
