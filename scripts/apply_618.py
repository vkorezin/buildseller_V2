from pathlib import Path

p = Path('src/MezzanineEditor.js')
s = p.read_text()

s = s.replace(
'import React, { useState, useMemo, memo } from "react";\n',
'import React, { useState, useMemo, memo } from "react";\nimport MezzanineFloorEditor, {\n  createDefaultMezzanineFloorStructure,\n  normalizeMezzanineFloor,\n} from "./MezzanineFloorEditor";\n'
)

s = s.replace(
'  const [mezzanines, setMezzanines] = useState(initialMezzanines || []);',
'  const [mezzanines, setMezzanines] = useState(() =>\n    (initialMezzanines || []).map((m) =>\n      normalizeMezzanineFloor(m, blockData?.floorStructure || null)\n    )\n  );'
)

old_add = '''    const newMz = {\n      id: newId,\n      name: `Антресоль ${mezzanines.length + 1}`,\n      elevation: "3.0",\n      width: "6.0",\n      length: "6.0",\n      offsetX: "0.0",\n      offsetY: "0.0",\n      thickness: "120",\n      loadLive: "200",\n      loadPartitions: "50",\n      loadDead: "150",\n      safetyFactor: "1.2",\n      colsX: "2",\n      colsY: "2",\n    };'''
new_add = '''    const floorStructure = createDefaultMezzanineFloorStructure();\n    const newMz = {\n      id: newId,\n      name: `Антресоль ${mezzanines.length + 1}`,\n      elevation: "3.0",\n      width: "6.0",\n      length: "6.0",\n      offsetX: "0.0",\n      offsetY: "0.0",\n      thickness: floorStructure.thickness,\n      loadLive: floorStructure.liveLoad,\n      loadPartitions: floorStructure.partitionsLoad,\n      loadDead: floorStructure.deadLoad,\n      safetyFactor: floorStructure.safetyFactor,\n      responsibilityFactor: floorStructure.responsibilityFactor,\n      floorStructure,\n      colsX: "2",\n      colsY: "2",\n    };'''
assert old_add in s
s = s.replace(old_add, new_add)

anchor = '''  const handleChange = (field, value) => {\n    setMezzanines((prev) =>\n      prev.map((m) => {\n        if (m.id !== selectedId) return m;\n        return { ...m, [field]: value };\n      })\n    );\n  };\n'''
addition = anchor + '''\n  const handlePatch = (patch) => {\n    setMezzanines((prev) =>\n      prev.map((m) => (m.id === selectedId ? { ...m, ...patch } : m))\n    );\n  };\n'''
assert anchor in s
s = s.replace(anchor, addition)

s = s.replace(
'      safetyFactor: parseFloat(m.safetyFactor) || 1.0,\n',
'      safetyFactor: parseFloat(m.safetyFactor) || 1.0,\n      responsibilityFactor: parseFloat(m.responsibilityFactor) || 1.0,\n'
)

old_total = '''  const totalDesignLoad = useMemo(() => {\n    if (!selectedMezzanine) return 0;\n    const p = parseFloat(selectedMezzanine.loadLive) || 0;\n    const g = parseFloat(selectedMezzanine.loadPartitions) || 0;\n    const d = parseFloat(selectedMezzanine.loadDead) || 0;\n    const f = parseFloat(selectedMezzanine.safetyFactor) || 1.0;\n    return Math.round((p + g + d) * f);\n  }, [selectedMezzanine]);\n\n'''
assert old_total in s
s = s.replace(old_total, '')

old_thickness = '''                <div>\n                  <label style={styles.label}>Толщина плиты (мм):</label>\n                  <input\n                    type="number"\n                    style={styles.input}\n                    value={selectedMezzanine.thickness}\n                    onChange={(e) => handleChange("thickness", e.target.value)}\n                  />\n                </div>'''
new_name = '''                <div>\n                  <label style={styles.label}>Название антресоли:</label>\n                  <input\n                    type="text"\n                    style={styles.input}\n                    value={selectedMezzanine.name}\n                    onChange={(e) => handleChange("name", e.target.value)}\n                  />\n                </div>'''
assert old_thickness in s
s = s.replace(old_thickness, new_name)

start = s.index('            {/* НАГРУЗКИ */}')
end_marker = '            </div>\n          </div>\n        ) : ('
end = s.index(end_marker, start)
old_section = s[start:end]
new_section = '''            {/* ПЕРЕКРЫТИЕ И НАГРУЗКИ */}\n            <div style={styles.section}>\n              <MezzanineFloorEditor\n                mezzanine={selectedMezzanine}\n                onPatch={handlePatch}\n              />\n            </div>\n'''
s = s[:start] + new_section + s[end:]

p.write_text(s)
print('patched MezzanineEditor.js')
