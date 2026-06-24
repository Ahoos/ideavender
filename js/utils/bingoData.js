export const hobbyLabels = {
  movie: "영화",
  book: "독서",
  music: "음악",
  exhibit: "전시",
  workout: "운동",
};

const missions = {
  movie: [
    "흑백 영화 보기",
    "3시간 넘는 영화 보기",
    "아카데미 작품상 수상작 보기",
    "감독 데뷔작 보기",
    "같은 배우 출연작 2편 보기",
    "다큐멘터리 한 편 보기",
    "1990년대 이전 영화 보기",
    "처음 보는 국가의 영화 보기",
    "영화 OST만 따로 들어보기",
    "엔딩 크레딧 끝까지 보기",
    "극장에서 독립영화 보기",
    "원작이 있는 영화 보기",
    "평소 안 보던 장르 보기",
    "친구에게 영화 추천받기",
    "한 장면을 글로 묘사하기",
    "포스터만 보고 고른 영화 보기",
    "여성 감독 영화 보기",
    "애니메이션 장편 보기",
    "리메이크작과 원작 비교하기",
    "별점 없이 감상문 쓰기",
    "영화 속 음식 따라 먹기",
    "대사 하나 필사하기",
    "시리즈 중간편만 보기",
    "무자막으로 10분 보기",
    "개봉 첫 주 영화 보기",
  ],
  book: [
    "100쪽 이하 책 읽기",
    "번역서 읽기",
    "출간 10년 넘은 책 읽기",
    "처음 읽는 작가의 책 읽기",
    "한 문장 필사하기",
    "도서관에서 빌린 책 읽기",
    "시집 한 권 읽기",
    "목차만 보고 기대 적기",
    "책 속 장소 찾아보기",
    "전자책으로 완독하기",
    "친구에게 책 추천받기",
    "작가 인터뷰 찾아보기",
    "비문학 한 권 읽기",
    "하루 20쪽씩 읽기",
    "책 표지 감상 남기기",
    "읽다 만 책 다시 시작하기",
    "동네 서점에서 고르기",
    "마지막 문장 먼저 읽기",
    "책갈피 사진 남기기",
    "소리 내어 한 페이지 읽기",
    "어려운 단어 5개 찾기",
    "같은 주제 책 2권 비교하기",
    "등장인물에게 편지 쓰기",
    "읽은 책 한 줄 추천 쓰기",
    "베스트셀러 아닌 책 읽기",
  ],
  music: [
    "앨범 처음부터 끝까지 듣기",
    "가사 한 줄 필사하기",
    "처음 듣는 장르 듣기",
    "라이브 영상 보기",
    "추천 플레이리스트 만들기",
    "10년 전 노래 듣기",
    "악기 하나에 집중해서 듣기",
    "친구 추천곡 듣기",
    "같은 곡 다른 버전 비교하기",
    "산책하며 앨범 듣기",
  ],
  exhibit: [
    "무료 전시 방문하기",
    "작품 하나 5분 보기",
    "전시 설명문 읽기",
    "굿즈샵 둘러보기",
    "가장 좋았던 작품 기록하기",
    "전시 포스터 사진 남기기",
    "작가 이름 검색하기",
    "도슨트 프로그램 확인하기",
    "혼자 전시 보기",
    "동네 갤러리 방문하기",
  ],
  workout: [
    "20분 산책하기",
    "새 운동 루틴 시도하기",
    "스트레칭 10분 하기",
    "운동 전후 기분 기록하기",
    "친구와 같이 운동하기",
    "계단 이용하기",
    "러닝 경로 바꿔보기",
    "휴식일 기록하기",
    "운동 음악 플레이리스트 만들기",
    "가벼운 근력 운동 하기",
  ],
};

export function createMissions(hobby, count, customText = "") {
  const custom = customText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (custom.length) {
    return fillMissions(custom, count);
  }

  return fillMissions(shuffle(missions[hobby] || missions.movie), count);
}

export function createCells(hobby, size, customText = "") {
  return createMissions(hobby, size * size, customText).map((mission, index) => ({
    id: crypto.randomUUID(),
    index,
    mission,
    completed: false,
    completedAt: "",
    note: "",
  }));
}

function fillMissions(source, count) {
  const output = [];

  while (output.length < count) {
    output.push(...shuffle(source));
  }

  return output.slice(0, count);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
