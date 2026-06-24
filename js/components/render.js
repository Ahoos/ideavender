export function renderThemes(container, themes, activeKey) {
  container.innerHTML = Object.entries(themes)
    .map(([key, theme]) => {
      const activeClass = key === activeKey ? " is-active" : "";
      return `<button class="theme-button${activeClass}" type="button" data-action="select-theme" data-theme="${key}">
        <strong>${theme.label}</strong>
        <span>${theme.hint}</span>
      </button>`;
    })
    .join("");
}

export function renderSlots(container, combination) {
  container.innerHTML = combination
    .map((item) => {
      const rollingClass = item.rolling ? " is-rolling" : "";
      return `<article class="slot-card${rollingClass}">
        <small>${item.label}</small>
        <strong>${item.value}</strong>
      </article>`;
    })
    .join("");
}
