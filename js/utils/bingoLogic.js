import { hobbyLabels } from "./bingoData.js";

export function createReport(bingo) {
  if (!bingo) return "빙고를 만들면 회고가 여기에 표시됩니다.";
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

export function getCompletedLineKeys(bingo) {
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

export function isFullBingo(bingo) {
  return bingo.cells.every((cell) => cell.completed);
}

export function normalizeBingo(bingo) {
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

export function formatPeriod(bingo) {
  return `${bingo.startDate || "시작일 없음"} ~ ${bingo.endDate || "진행 중"}`;
}

function range(size) {
  return Array.from({ length: size }, (_, index) => index);
}
