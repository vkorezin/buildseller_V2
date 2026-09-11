from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match in {path}, found {count}\n---OLD---\n{old}")
    p.write_text(text.replace(old, new, 1))


# 1) Centralized load formula: q_design = q_base * gamma_n
replace_once(
    "src/floorStructureConstants.js",
    '''/**
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
''',
    '''/**
 * Единая формула расчетной эквивалентной нагрузки q на перекрытие (кг/м²):
 * qBase = deadLoad * 1.1 + partitionsLoad * 1.2 + liveLoad * safetyFactor
 * qDesign = qBase * responsibilityFactor (γn)
 * Разрешает partitionsLoad = 0 и liveLoad = 0 (ноль допустим).
 * Имя функции сохранено для обратной совместимости; возвращается итоговая qDesign.
 * Принимает объект { deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor }.
 */
export function calculateMezzanineQBase(params = {}) {
  let deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor;
  if (typeof params === "object" && params !== null) {
    ({ deadLoad, partitionsLoad, liveLoad, safetyFactor, responsibilityFactor } = params);
  } else {
    deadLoad = arguments[0];
    partitionsLoad = arguments[1];
    liveLoad = arguments[2];
    safetyFactor = arguments[3];
    responsibilityFactor = arguments[4];
  }
'''
)

replace_once(
    "src/floorStructureConstants.js",
    '''  const sf =
    safetyFactor !== undefined && safetyFactor !== null && safetyFactor !== "" && !isNaN(Number(safetyFactor))
      ? Number(safetyFactor)
      : 1.2;

  return Math.round((g_dead * 1.1 + p_part * 1.2 + p_live * sf) * 10) / 10;
''',
    '''  const sf =
    safetyFactor !== undefined && safetyFactor !== null && safetyFactor !== "" && !isNaN(Number(safetyFactor))
      ? Number(safetyFactor)
      : 1.2;
  const gamma_n =
    responsibilityFactor !== undefined &&
    responsibilityFactor !== null &&
    responsibilityFactor !== "" &&
    !isNaN(Number(responsibilityFactor)) &&
    Number(responsibilityFactor) > 0
      ? Number(responsibilityFactor)
      : 1.0;

  const qBase = g_dead * 1.1 + p_part * 1.2 + p_live * sf;
  return Math.round(qBase * gamma_n * 10) / 10;
'''
)

# 2) Mezzanine steel model: feed gamma_n into the central formula
replace_once(
    "src/MezzanineCoefficientsEditor.js",
    '''  // 1. Расчетная нагрузка q по СП 20: g_dead * 1.1 + p_partitions * 1.2 + p_live * safetyFactor
''',
    '''  // 1. Расчетная нагрузка q: (g_dead * 1.1 + p_partitions * 1.2 + p_live * safetyFactor) * responsibilityFactor (γn)
'''
)

replace_once(
    "src/MezzanineCoefficientsEditor.js",
    '''  const safetyFactor =
    floorStructure?.safetyFactor !== "" &&
    floorStructure?.safetyFactor != null &&
    !isNaN(Number(floorStructure.safetyFactor))
      ? Number(floorStructure.safetyFactor)
      : 1.2;
  const q = Math.max(
''',
    '''  const safetyFactor =
    floorStructure?.safetyFactor !== "" &&
    floorStructure?.safetyFactor != null &&
    !isNaN(Number(floorStructure.safetyFactor))
      ? Number(floorStructure.safetyFactor)
      : 1.2;
  const responsibilityFactor =
    floorStructure?.responsibilityFactor !== "" &&
    floorStructure?.responsibilityFactor != null &&
    !isNaN(Number(floorStructure.responsibilityFactor)) &&
    Number(floorStructure.responsibilityFactor) > 0
      ? Number(floorStructure.responsibilityFactor)
      : 1.0;
  const q = Math.max(
'''
)

replace_once(
    "src/MezzanineCoefficientsEditor.js",
    '''      liveLoad: p_live,
      safetyFactor: safetyFactor,
    })
''',
    '''      liveLoad: p_live,
      safetyFactor: safetyFactor,
      responsibilityFactor: responsibilityFactor,
    })
'''
)

# 3) Floor modal preview + persisted designLoadKg use the same gamma_n-aware formula
replace_once(
    "src/FloorStructureModal.js",
    '''      liveLoad: p_live,
      safetyFactor: gamma_f,
    });
''',
    '''      liveLoad: p_live,
      safetyFactor: gamma_f,
      responsibilityFactor: gamma_n,
    });
'''
)

replace_once(
    "src/FloorStructureModal.js",
    '''      liveLoad: safeLiveLoad,
      safetyFactor: safeSafetyFactor,
    });
''',
    '''      liveLoad: safeLiveLoad,
      safetyFactor: safeSafetyFactor,
      responsibilityFactor: safeResponsibilityFactor,
    });
'''
)

print("Task 6.17 gamma_n patch applied")
