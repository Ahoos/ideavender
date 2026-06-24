import { createCells, createMissions, hobbyLabels } from "./utils/bingoData.js";

const STORAGE_KEY = "hobby-bingo-state-v1";
const themePalettes = {
  blue: { primary: "#2f6fed", accent: "#13a87e", soft: "#eef4ff" }, green: { primary: "#28745c", accent: "#b58b2b", soft: "#eef8f3" },
  rose: { primary: "#bd4964", accent: "#c98535", soft: "#fff1f4" }, mono: { primary: "#252a34", accent: "#777f8f", soft: "#f1f2f4" },
};

const state = {
  bingos: [],
  activeId: "",
  selectedCellId: "",
};

const elements = {
  app: document.querySelector("main"),
  form: document.querySelector('[data-role="bingo-form"]'),
  cellForm: document.querySelector('[data-role="cell-form"]'),
  cellEmpty: document.querySelector('[data-role="cell-empty"]'),
  cellFields: document.querySelector('[data-role="cell-fields"]'),
  bingoList: document.querySelector('[data-role="bingo-list"]'),
  board: document.querySelector('[data-role="bingo-board"]'),
  title: document.querySelector('[data-role="active-title"]'),
  period: document.querySelector('[data-role="active-period"]'),
  progressBar: document.querySelector('[data-role="progress-bar"]'),
  progressText: document.querySelector('[data-role="progress-text"]'),
  themeEditor: document.querySelector('[data-role="theme-editor"]'),
  report: document.querySelector('[data-role="report-output"]'),
  recordList: document.querySelector('[data-role="record-list"]'),
  celebration: document.querySelector('[data-role="celebration"]'),
  celebrationScreen: document.querySelector('[data-role="celebration-screen"]'),
  celebrationTitle: document.querySelector('[data-role="celebration-title"]'),
  celebrationDetail: document.querySelector('[data-role="celebration-detail"]'),
};

init();

function init() {
  loadState();
  elements.form.startDate.valueAsDate = new Date();
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  elements.form.addEventListener("submit", createBingo);
  elements.cellForm.addEventListener("submit", saveCell);
  render();
}

function handleChange(event) {
  if (event.target !== elements.themeEditor) return;
  const bingo = getActiveBingo();
  if (!bingo) return;
  bingo.theme = elements.themeEditor.value; saveState(); render();
}

function handleClick(event) {
  const actionElement = event.target.closest("[data-action]");
  const cellButton = event.target.closest("[data-cell-id]");

  if (!actionElement && cellButton) {
    selectCell(cellButton.dataset.cellId);
    return;
  }

  if (!actionElement) {
    return;
  }

  const actions = {
    "select-bingo": () => selectBingo(actionElement.dataset.bingoId),
    "close-celebration": closeBigCelebration,
    "reset-missions": resetMissions,
    "ai-cell": suggestCellMission,
    "refresh-report": render,
    "export-report": copyReport,
    "clear-history": clearHistory,
  };

  actions[actionElement.dataset.action]?.();
}

function createBingo(event) {
  event.preventDefault();
  const data = new FormData(elements.form);
  const size = Number(data.get("size"));
  const hobby = data.get("hobby");
  const bingo = {
    id: crypto.randomUUID(),
    title: data.get("title").trim(),
    hobby,
    theme: data.get("theme"),
    size,
    startDate: data.get("startDate"),
    endDate: data.get("endDate"),
    createdAt: new Date().toISOString(),
    celebratedLines: [],
    fullCelebrated: false,
    cells: createCells(hobby, size, data.get("customMissions")),
  };

  state.bingos.unshift(bingo);
  state.activeId = bingo.id;
  state.selectedCellId = "";
  elements.form.reset();
  elements.form.startDate.valueAsDate = new Date();
  saveState();
  showCelebration("새 빙고가 만들어졌어요", "빙고판을 하나씩 채워볼까요?");
  render();
}

function selectBingo(id) {
  state.activeId = id;
  state.selectedCellId = "";
  saveState();
  render();
}

function selectCell(id) {
  state.selectedCellId = id;
  toggleCell(id);
}

function toggleCell(id) {
  const bingo = getActiveBingo();
  const cell = getCell(id);

  if (!bingo || !cell) {
    return;
  }

  const before = getCompletedLineKeys(bingo);
  cell.completed = !cell.completed;
  cell.activityDate = cell.completed ? cell.activityDate || cell.completedAt || today() : "";
  cell.completedAt = cell.activityDate;

  const after = getCompletedLineKeys(bingo);
  const newLines = after.filter((key) => !before.includes(key));

  if (!cell.completed) {
    bingo.celebratedLines = bingo.celebratedLines.filter((key) => after.includes(key));
    bingo.fullCelebrated = false;
  }

  saveState();
  if (cell.completed) {
    showCelebration("칸 하나 완료!", "좋아요. 기록이 한 칸 더 쌓였어요.");
  }

  if (newLines.length) {
    bingo.celebratedLines.push(...newLines);
    saveState();
    window.setTimeout(() => showLineCelebration(bingo), 300);
  }

  if (isFullBingo(bingo) && !bingo.fullCelebrated) {
    bingo.fullCelebrated = true;
    saveState();
    window.setTimeout(() => {
      showBigCelebration("축하합니다! 빙고 전체를 완성했습니다!", "이번 취미 여정을 끝까지 채웠어요.");
    }, 700);
  }
  render();
}

function saveCell(event) {
  event.preventDefault();
  const bingo = getActiveBingo();
  const cell = getCell(state.selectedCellId);

  if (!bingo || !cell) {
    return;
  }

  const before = getCompletedLineKeys(bingo);
  const data = new FormData(elements.cellForm);
  cell.mission = data.get("mission").trim() || cell.mission;
  cell.completed = data.has("completed");
  cell.activityTitle = data.get("activityTitle").trim();
  cell.activityDate = cell.completed ? data.get("activityDate") || today() : data.get("activityDate");
  cell.completedAt = cell.activityDate;
  cell.activityNote = data.get("activityNote").trim();
  cell.note = cell.activityNote;

  const after = getCompletedLineKeys(bingo);
  const newLines = after.filter((key) => !before.includes(key));

  if (!cell.completed) {
    bingo.celebratedLines = bingo.celebratedLines.filter((key) => after.includes(key));
    bingo.fullCelebrated = false;
  }

  saveState();
  showCelebration("수정 저장 완료", "이 칸의 기록을 업데이트했어요.");
  if (newLines.length) {
    bingo.celebratedLines.push(...newLines);
    saveState();
    window.setTimeout(() => showLineCelebration(bingo), 300);
  }

  if (isFullBingo(bingo) && !bingo.fullCelebrated) {
    bingo.fullCelebrated = true;
    saveState();
    window.setTimeout(() => {
      showBigCelebration("축하합니다! 빙고 전체를 완성했습니다!", "마지막 칸까지 멋지게 채웠습니다.");
    }, 700);
  }
  render();
}

function resetMissions() {
  const bingo = getActiveBingo();

  if (!bingo) {
    return;
  }

  const next = createMissions(bingo.hobby, bingo.size * bingo.size);
  bingo.cells = bingo.cells.map((cell, index) => ({
    ...cell,
    mission: next[index],
    completed: false,
    completedAt: "",
    activityTitle: "",
    activityDate: "",
    activityNote: "",
    note: "",
  }));
  bingo.celebratedLines = [];
  bingo.fullCelebrated = false;
  state.selectedCellId = "";
  saveState();
  showCelebration("AI 미션 리셋 완료", "새로운 조합으로 다시 시작합니다.");
  render();
}

function suggestCellMission() {
  const bingo = getActiveBingo();
  const cell = getCell(state.selectedCellId);

  if (!bingo || !cell) {
    return;
  }

  cell.mission = createMissions(bingo.hobby, 1)[0];
  saveState();
  showCelebration("AI가 새 미션을 골랐어요", "마음에 안 들면 직접 고쳐도 됩니다.");
  render();
}

async function copyReport() {
  const text = createReport(getActiveBingo());

  try {
    await navigator.clipboard.writeText(text);
    showCelebration("회고 복사 완료", "문서나 SNS에 바로 붙여넣을 수 있어요.");
  } catch (error) {
    showCelebration("복사 권한이 막혔어요", "회고 영역의 텍스트를 직접 선택해 주세요.");
  }
}

function clearHistory() {
  if (!state.bingos.length || !window.confirm("모든 빙고 히스토리를 삭제할까요?")) {
    return;
  }

  state.bingos = [];
  state.activeId = "";
  state.selectedCellId = "";
  saveState();
  render();
}

function render() {
  const bingo = getActiveBingo();
  renderHistory();
  applyTheme(bingo);
  renderBoard(bingo);
  renderDetail();
  elements.report.textContent = createReport(bingo);
  renderRecords(bingo);
}

function renderHistory() {
  if (!state.bingos.length) {
    elements.bingoList.innerHTML = `<p class="empty-copy">아직 만든 빙고가 없습니다.</p>`;
    return;
  }

  elements.bingoList.innerHTML = state.bingos.map((bingo) => {
    const active = bingo.id === state.activeId ? " is-active" : "";
    const done = bingo.cells.filter((cell) => cell.completed).length;
    return `<button class="history-item${active}" type="button" data-action="select-bingo" data-bingo-id="${bingo.id}">
      <strong>${escapeHtml(bingo.title)}</strong>
      <span>${hobbyLabels[bingo.hobby]} · ${formatPeriod(bingo)} · ${done}/${bingo.cells.length}</span>
    </button>`;
  }).join("");
}

function renderBoard(bingo) {
  if (!bingo) {
    elements.title.textContent = "빙고를 만들어 시작하세요";
    elements.period.textContent = "기간을 설정해 주세요";
    elements.progressBar.style.width = "0%";
    elements.progressText.textContent = "0 / 0 완료";
    elements.board.innerHTML = `<p class="empty-copy">왼쪽에서 새 빙고를 만들면 미션판이 표시됩니다.</p>`;
    return;
  }

  const done = bingo.cells.filter((cell) => cell.completed).length;
  const total = bingo.cells.length;
  elements.title.textContent = bingo.title;
  elements.period.textContent = `${hobbyLabels[bingo.hobby]} · ${formatPeriod(bingo)}`;
  elements.progressBar.style.width = `${Math.round((done / total) * 100)}%`;
  elements.progressText.textContent = `${done} / ${total} 완료`;
  elements.themeEditor.value = bingo.theme || "blue";
  elements.board.style.setProperty("--board-size", bingo.size);
  elements.board.innerHTML = bingo.cells.map((cell) => renderCell(cell)).join("");
}

function renderCell(cell) {
  const selected = cell.id === state.selectedCellId ? " is-selected" : "";
  const completed = cell.completed ? " is-completed" : "";
  const activity = cell.activityTitle ? `<b>${escapeHtml(cell.activityTitle)}</b>` : "";
  return `<article class="bingo-cell${selected}${completed}" data-cell-id="${cell.id}" tabindex="0"><span class="cell-state">${cell.completed ? "완료" : "진행 전"}</span><p>${escapeHtml(cell.mission)}</p>${activity}<small>${cell.activityDate || cell.completedAt || "기록 없음"}</small></article>`;
}

function renderDetail() {
  const cell = getCell(state.selectedCellId);
  elements.cellEmpty.hidden = Boolean(cell);
  elements.cellFields.hidden = !cell;

  if (!cell) {
    elements.cellForm.reset();
    return;
  }

  elements.cellForm.mission.value = cell.mission;
  elements.cellForm.activityTitle.value = cell.activityTitle || "";
  elements.cellForm.activityDate.value = cell.activityDate || cell.completedAt || "";
  elements.cellForm.completed.checked = cell.completed;
  elements.cellForm.activityNote.value = cell.activityNote || cell.note || "";
}

function renderRecords(bingo) {
  if (!bingo) {
    elements.recordList.innerHTML = `<p class="empty-copy">아직 기록이 없습니다.</p>`;
    return;
  }

  const records = bingo.cells.filter((cell) => cell.activityTitle || cell.activityNote || cell.completed).sort((a, b) => (b.activityDate || "").localeCompare(a.activityDate || ""));

  if (!records.length) {
    elements.recordList.innerHTML = `<p class="empty-copy">칸을 완료하고 작품이나 활동 기록을 남겨보세요.</p>`;
    return;
  }

  elements.recordList.innerHTML = records.map((cell) => `<article class="record-item">
    <time>${cell.activityDate || "날짜 없음"}</time>
    <strong>${escapeHtml(cell.activityTitle || cell.mission)}</strong>
    <p>${escapeHtml(cell.activityNote || "후기를 기다리는 기록입니다.")}</p>
  </article>`).join("");
}

function createReport(bingo) {
  if (!bingo) {
    return "빙고를 만들면 회고가 여기에 표시됩니다.";
  }

  const doneCells = bingo.cells.filter((cell) => cell.completed);
  const percent = Math.round((doneCells.length / bingo.cells.length) * 100);
  const lines = getCompletedLineKeys(bingo).length;
  const recent = doneCells.slice(-3).map((cell) => `- ${cell.mission}${cell.activityTitle ? ` (${cell.activityTitle})` : ""}`).join("\n") || "- 아직 완료한 미션이 없습니다.";
  const open = bingo.cells.find((cell) => !cell.completed)?.mission || "모든 미션 완료";

  return `# ${bingo.title} 회고

기간: ${formatPeriod(bingo)}
취미: ${hobbyLabels[bingo.hobby]}
진행률: ${doneCells.length}/${bingo.cells.length} (${percent}%)
완성한 빙고 줄: ${lines}줄

최근 완료 미션
${recent}

다음 추천 미션
- ${open}

한 줄 회고
${percent >= 100 ? "빙고 전체를 완성하며 취미 루틴을 끝까지 밀어붙였습니다." : "완료한 칸의 메모를 바탕으로 다음 선택을 조금 더 가볍게 이어갈 수 있습니다."}`;
}

function getCompletedLineKeys(bingo) {
  const keys = [];
  const size = bingo.size;
  const done = new Set(bingo.cells.filter((cell) => cell.completed).map((cell) => cell.index));

  for (let row = 0; row < size; row += 1) {
    if (range(size).every((col) => done.has(row * size + col))) keys.push(`row-${row}`);
  }

  for (let col = 0; col < size; col += 1) {
    if (range(size).every((row) => done.has(row * size + col))) keys.push(`col-${col}`);
  }

  if (range(size).every((num) => done.has(num * size + num))) keys.push("diag-main");
  if (range(size).every((num) => done.has(num * size + (size - 1 - num)))) keys.push("diag-sub");

  return keys;
}

function isFullBingo(bingo) {
  return bingo.cells.every((cell) => cell.completed);
}

function getActiveBingo() {
  return state.bingos.find((bingo) => bingo.id === state.activeId) || state.bingos[0];
}

function getCell(id) {
  return getActiveBingo()?.cells.find((cell) => cell.id === id);
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  state.bingos = (saved.bingos || []).map(normalizeBingo);
  state.activeId = saved.activeId || state.bingos[0]?.id || "";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    bingos: state.bingos,
    activeId: state.activeId,
  }));
}

function showCelebration(title, detail) {
  elements.celebration.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
  elements.celebration.classList.remove("is-visible");
  window.requestAnimationFrame(() => elements.celebration.classList.add("is-visible"));
  window.setTimeout(() => elements.celebration.classList.remove("is-visible"), 2600);
}

function showLineCelebration(bingo) {
  const lineCount = getCompletedLineKeys(bingo).length;
  showBigCelebration(`축하합니다! 빙고 ${lineCount}줄을 완성했습니다!`, "취미가 기록으로, 기록이 흐름으로 이어지고 있어요.");
}

function showBigCelebration(title, detail) {
  elements.celebrationTitle.textContent = title;
  elements.celebrationDetail.textContent = detail;
  elements.celebrationScreen.hidden = false;
  window.requestAnimationFrame(() => elements.celebrationScreen.classList.add("is-visible"));
}

function closeBigCelebration() {
  elements.celebrationScreen.classList.remove("is-visible");
  window.setTimeout(() => { elements.celebrationScreen.hidden = true; }, 220);
}

function applyTheme(bingo) {
  const theme = themePalettes[bingo?.theme] || themePalettes.blue;
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--primary-dark", theme.primary);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--soft", theme.soft);
}

function normalizeBingo(bingo) {
  return {
    ...bingo,
    theme: bingo.theme || "blue",
    cells: bingo.cells.map((cell) => ({
      ...cell,
      activityTitle: cell.activityTitle || "",
      activityDate: cell.activityDate || cell.completedAt || "",
      activityNote: cell.activityNote || cell.note || "",
    })),
  };
}

function formatPeriod(bingo) {
  return `${bingo.startDate || "시작일 없음"} ~ ${bingo.endDate || "진행 중"}`;
}

function range(size) {
  return Array.from({ length: size }, (_, index) => index);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}
