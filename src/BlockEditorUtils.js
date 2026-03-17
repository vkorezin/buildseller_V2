// --- ГЕНЕРАТОР БУКВЕННЫХ ОСЕЙ ---
const AXIS_ALPHABET = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ж",
  "И",
  "К",
  "Л",
  "М",
  "Н",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Э",
  "Ю",
  "Я",
];
const ALPHABET_LEN = AXIS_ALPHABET.length;

export function getAxisLabel(index) {
  if (index < ALPHABET_LEN) {
    return AXIS_ALPHABET[index];
  } else {
    const firstLetterIdx = Math.floor(index / ALPHABET_LEN) - 1;
    const secondLetterIdx = index % ALPHABET_LEN;
    if (firstLetterIdx >= ALPHABET_LEN) return "ERR";
    return AXIS_ALPHABET[firstLetterIdx] + AXIS_ALPHABET[secondLetterIdx];
  }
}

// (Сюда можно будет добавлять другие общие функции)
