export type Announcement = {
  id: string;
  title: string;
  agency: string;
  category: string;
  target: string;
  deadline: string; // YYYY-MM-DD
  url: string;
  summary: string;
};

// Curated seed based on real Korean government startup-support programs.
// Used as a reliable fallback (and demo source) when a live fetch is unavailable.
const SEED: Announcement[] = [
  {
    id: "pre-startup-2026",
    title: "예비창업패키지 예비창업자 모집",
    agency: "창업진흥원 (중소벤처기업부)",
    category: "사업화 자금",
    target: "예비창업자 (사업자등록 전)",
    deadline: "2026-07-15",
    url: "https://www.k-startup.go.kr",
    summary:
      "사업화 자금 최대 1억원(평균 0.5억) + 창업교육·멘토링·BM 고도화 지원. 사업자등록 이력이 없는 예비창업자 대상.",
  },
  {
    id: "early-startup-2026",
    title: "초기창업패키지 (창업 3년 이내) 모집",
    agency: "창업진흥원 (중소벤처기업부)",
    category: "사업화 자금",
    target: "업력 3년 이내 초기창업기업",
    deadline: "2026-07-31",
    url: "https://www.k-startup.go.kr",
    summary: "초기 창업기업의 사업 안정화·성장을 위한 사업화 자금 최대 1억원과 아이템 검증 프로그램 지원.",
  },
  {
    id: "tips-2026",
    title: "TIPS(민간투자주도형 기술창업) 창업팀 모집",
    agency: "TIPS 운영사 / 중소벤처기업부",
    category: "R&D · 투자연계",
    target: "기술창업 초기기업 (투자유치 단계)",
    deadline: "2026-08-10",
    url: "https://www.jointips.or.kr",
    summary: "운영사 투자(1~2억)와 연계해 R&D 자금 최대 5억원 + 사업화·해외마케팅 지원. 딥테크/기술창업 우대.",
  },
  {
    id: "youth-academy-2026",
    title: "청년창업사관학교 입교생 모집",
    agency: "중소벤처기업진흥공단",
    category: "사업화 · 보육",
    target: "만 39세 이하, 창업 3년 이내 청년 창업가",
    deadline: "2026-07-04",
    url: "https://start.kosmes.or.kr",
    summary: "사업화 자금 최대 1억원 + 입주공간·전담코칭·제품개발 지원. 청년 창업가 집중 보육 프로그램.",
  },
  {
    id: "global-voucher-2026",
    title: "글로벌 진출(해외마케팅) 바우처 지원",
    agency: "창업진흥원",
    category: "바우처",
    target: "해외 진출 준비 중인 창업기업",
    deadline: "2026-07-22",
    url: "https://www.k-startup.go.kr",
    summary: "해외 시장조사·현지화·온라인 마케팅·전시참가 비용을 바우처 형태로 지원(자부담 일부).",
  },
  {
    id: "rd-voucher-2026",
    title: "창업성장기술개발(R&D) 디딤돌 과제 공고",
    agency: "중소기업기술정보진흥원 (TIPA)",
    category: "R&D",
    target: "창업 7년 이내 중소기업",
    deadline: "2026-08-05",
    url: "https://www.smtech.go.kr",
    summary: "첫 정부 R&D 도전 기업을 위한 디딤돌 과제. 최대 1.2억원, 1년 이내 기술개발 자금 지원.",
  },
  {
    id: "women-startup-2026",
    title: "여성창업경진대회 / 여성기업 지원사업",
    agency: "여성기업종합지원센터",
    category: "경진대회 · 사업화",
    target: "여성 예비·초기 창업가",
    deadline: "2026-07-18",
    url: "https://www.wbiz.or.kr",
    summary: "여성 창업가 대상 사업화 자금·상금·판로개척·멘토링 연계 지원.",
  },
];

async function fetchLive(timeoutMs = 2500): Promise<Announcement[] | null> {
  // Best-effort live fetch. Public 공고 sources typically require an API key or
  // are unstable, so this is wrapped defensively and falls back to the seed.
  const url = process.env.ANNOUNCEMENTS_FEED_URL;
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!Array.isArray(json)) return null;
    // Expect items already in Announcement shape; ignore otherwise.
    return json.filter((a) => a && a.title && a.deadline) as Announcement[];
  } catch {
    return null;
  }
}

export async function getAnnouncements(): Promise<{
  source: "live" | "seed";
  items: Announcement[];
}> {
  const live = await fetchLive();
  if (live && live.length) return { source: "live", items: live };
  return { source: "seed", items: SEED };
}
