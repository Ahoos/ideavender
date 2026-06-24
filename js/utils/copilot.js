export function createDraft(theme, combination, memo) {
  const values = Object.fromEntries(combination.map((item) => [item.label, item.value]));
  const note = memo.trim() || "아직 메모가 없으므로 키워드 조합을 중심으로 확장합니다.";

  if (theme.draftType === "reels") {
    return reelsDraft(values, note);
  }

  if (theme.draftType === "spec") {
    return specDraft(values, note);
  }

  return synopsisDraft(values, note);
}

function synopsisDraft(values, note) {
  return `# 시놉시스 초안

## 로그라인
${values.세계관 || values.장르}에서 ${values.인물 || values.클리셰}가 "${values.사건 || values.반전}"라는 균열을 마주하며, 자신의 약점을 무기로 바꾸는 이야기.

## 핵심 메모
${note}

## 3막 구조
1. 도입: 주인공은 익숙한 질서 안에서 안전하게 버티지만, 작은 이상 징후가 반복된다.
2. 전개: 키워드 조합이 충돌하며 선택지가 좁아지고, 주인공은 가장 피하고 싶은 방식으로 문제를 해결해야 한다.
3. 결말: 사건의 진짜 의미가 드러나고, 주인공은 처음과 다른 규칙으로 세계를 다시 바라본다.

## 차별화 포인트
- 낯선 배경과 익숙한 감정선을 결합해 진입 장벽을 낮춘다.
- 반전은 충격보다 캐릭터의 선택을 선명하게 만드는 장치로 사용한다.`;
}

function reelsDraft(values, note) {
  return `# 릴스 영상 기획 초안

## 콘셉트
"${values.훅}"을 시작점으로 ${values.포맷} 형식을 사용하고, 마지막에는 ${values.행동} 방식으로 시청자 반응을 유도한다.

## 한 줄 메모
${note}

## 20초 스크립트
0-3초: 가장 강한 결과 장면 또는 실패 장면을 먼저 보여준다.
4-10초: 왜 이런 상황이 생겼는지 짧은 자막과 컷 전환으로 압축한다.
11-17초: 핵심 행동을 직접 실행하며 시청자가 따라 할 수 있는 단서를 남긴다.
18-20초: 댓글 선택지나 다음 편 예고로 저장, 공유, 댓글을 유도한다.

## 제작 체크리스트
- 첫 컷은 무음 상태에서도 이해되게 만든다.
- 자막은 한 화면에 14자 안팎으로 쪼갠다.
- 마지막 2초에 명확한 행동 요청을 넣는다.`;
}

function specDraft(values, note) {
  return `# 서비스 기능 명세 초안

## 문제 정의
${values.사용자}는 "${values.문제}" 문제 때문에 시작은 하지만 지속적인 관리와 실행에서 병목을 겪는다.

## 제안 솔루션
${values.기능}을 중심 기능으로 제공해 사용자가 다음 행동을 바로 선택할 수 있게 만든다.

## 사용자 메모
${note}

## MVP 범위
1. 사용자가 문제 상황을 빠르게 입력한다.
2. 시스템이 입력을 분류하고 ${values.기능} 결과를 제안한다.
3. 사용자는 제안을 저장, 수정, 완료 처리할 수 있다.

## 성공 지표
- 첫 결과 생성까지 30초 이하
- 7일 재방문율 25% 이상
- 사용자가 직접 수정한 제안의 저장률 40% 이상`;
}
