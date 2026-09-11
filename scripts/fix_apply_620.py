from pathlib import Path
p = Path('scripts/apply_620.py')
s = p.read_text()
old = r'alert(`Исправьте ошибки в «${firstInvalid.name || "антресоли"}»:\n\n${errs.join("\n")}`);'
new = r'alert(`Исправьте ошибки в «${firstInvalid.name || "антресоли"}»:\\n\\n${errs.join("\\n")}`);'
assert old in s, 'alert source pattern not found'
p.write_text(s.replace(old, new))
print('fixed apply_620.py escaping')
