// Утилиты для парсинга специфических CSV файлов (TDSheet)
export const parseProjectFile = (fileContent, fileName) => {
  const lines = fileContent.split(/\r\n|\n/);

  const projectData = {
    id: Date.now() + Math.random(),
    name: fileName.replace(".csv", "").replace(".xlsx - TDSheet", ""),
    date: "",

    // --- 1. ГЕОМЕТРИЯ ---
    width: 0, // Ширина
    length: 0, // Длина
    height: 0, // Высота
    stories: 1, // Этажность

    // Второстепенная геометрия
    slope: 10,
    roofShape: "Gable",

    // --- 2. МАССА (ДЕТАЛИЗАЦИЯ) ---
    mass: 0, // ВсегоФакт (Итоговая)
    massProfiles: 0, // МассаПрофильФакт
    massRolled: 0, // МассаФактПрокатнаяБалка
    massWelded: 0, // МассаФактСварнаяБалка
    massBlackPlate: 0, // МассаФактФасонкаЧерная
    massZnPlate: 0, // МассаФактФасонкаZn
    massPipe: 0, // МассаФактТруба

    specificWeight: 0, // Расчетное кг/м2

    // --- 3. ОПЦИИ ---
    columnStep: 0,
    hasCrane: false,
    craneCapacity: 0,
    hasMezzanine: false,

    // Стены
    wallType: "Не определено",
    wallThick: 0,
    wallInsulation: "",

    // Инфо
    snowRegion: 3,
    address: "",
  };

  const parseRuFloat = (str) => {
    if (!str) return 0;
    const cleanStr = str.replace(/\s/g, "").replace(",", ".");
    const res = parseFloat(cleanStr);
    return isNaN(res) ? 0 : res;
  };

  lines.forEach((line) => {
    // Делим строку, учитывая кавычки
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (!parts || parts.length < 2) return;

    const clean = (s) =>
      s ? s.trim().replace(/^"|"$/g, "").replace(/""/g, '"') : "";

    const key = clean(parts[0]); // Параметр
    const valueStr = clean(parts[1]); // Значение
    const valNum = parseRuFloat(valueStr);

    const keyLower = key.toLowerCase();
    const valLower = valueStr.toLowerCase();

    // === ПАРСИНГ ПО ВАШЕЙ ИНСТРУКЦИИ ===

    // 1. ГЕОМЕТРИЯ
    if (key === "Ширина") projectData.width = valNum;
    else if (key === "Длина") projectData.length = valNum;
    else if (key === "Высота") projectData.height = valNum;
    else if (key === "Этажность") {
      projectData.stories = valNum;
      if (valNum > 1) projectData.hasMezzanine = true;
    }

    // 2. МАССА (СТРОГОЕ СООТВЕТСТВИЕ)
    else if (key === "ВсегоФакт") projectData.mass = valNum;
    else if (key === "МассаПрофильФакт") projectData.massProfiles = valNum;
    else if (key === "МассаФактПрокатнаяБалка") projectData.massRolled = valNum;
    else if (key === "МассаФактСварнаяБалка") projectData.massWelded = valNum;
    else if (key === "МассаФактФасонкаЧерная")
      projectData.massBlackPlate = valNum;
    else if (key === "МассаФактФасонкаZn") projectData.massZnPlate = valNum;
    else if (key === "МассаФактТруба") projectData.massPipe = valNum;
    // --- ДОПОЛНИТЕЛЬНЫЕ ПАРАМЕТРЫ (из предыдущего опыта) ---
    else if (key === "Адрес") projectData.address = valueStr;
    else if (key === "Дата") projectData.date = valueStr;
    else if (key === "КровляУклон") projectData.slope = valNum;
    // Краны (поиск по ключевым словам, если нет прямого параметра "Кран")
    else if (key.includes("ГПМ") || key.includes("Кран")) {
      if (
        valLower !== "нет" &&
        valLower !== "no" &&
        valueStr !== "" &&
        valueStr !== "0"
      ) {
        projectData.hasCrane = true;
        if (
          key.includes("Грузоподъемность") &&
          valNum > projectData.craneCapacity
        ) {
          projectData.craneCapacity = valNum;
        }
      }
    }

    // Стены (ОК.1)
    else if (key.includes("ТипОбшивки") && key.includes("ОК.1")) {
      if (valLower.includes("сэндвич")) projectData.wallType = "Сэндвич";
      else if (valLower.includes("проф")) projectData.wallType = "Профлист";
    } else if (key.includes("ТолщинаУтеплителя") && key.includes("ОК.1")) {
      if (valNum > 0) projectData.wallThick = valNum;
    } else if (key.includes("Утеплитель") && !key.includes("Толщина")) {
      if (valLower.includes("пир")) projectData.wallInsulation = "PIR";
      else if (valLower.includes("ват")) projectData.wallInsulation = "MW";
    }
  });

  // Расчет удельного веса (кг/м2)
  if (projectData.width && projectData.length && projectData.mass) {
    const area = projectData.width * projectData.length;
    projectData.specificWeight = (projectData.mass * 1000) / area;
  }

  return projectData;
};
