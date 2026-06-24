export function pickCombination(theme) {
  return theme.columns.map((column) => ({
    label: column.name,
    value: pickRandom(column.items),
  }));
}

export function spinPreview(theme) {
  return theme.columns.map((column) => ({
    label: column.name,
    value: pickRandom(column.items),
    rolling: true,
  }));
}

function pickRandom(items) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}
