export type Lang = "ko" | "en";

export type Scenario = { label: string; command: string };

export type Strings = {
  title: string;
  tagline: string;
  subtitle: string;
  placeholder: string;
  run: string;
  thinking: string;
  mic: string;
  rec: string;
  scenarios: Scenario[];
  activity: string;
  planning: string;
  rawToggle: string;
  briefing: string;
  iuButton: string;
  iuCommand: string;
  iuPanel: string;
  iuTldr: string;
  iuMetrics: string;
  iuHighlights: string;
  iuLowlights: string;
  iuAsks: string;
  iuNext: string;
  recalled: string;
  memBadge: string;
  copy: string;
  copied: string;
  del: string;
  approve: string;
  discard: string;
  guard: string;
  tasks: string;
  calendar: string;
  drafts: string;
  empty: string;
  footer: string;
  voiceUnsupported: string;
  noRecipient: string;
  langButton: string;
  guideButton: string;
  briefingCommand: string;
  guide: {
    title: string;
    intro: string;
    personaName: string;
    personaRole: string;
    personaPain: string;
    whenTitle: string;
    whyTitle: string;
    why: string[];
    memoryTitle: string;
    memoryDesc: string;
    memoryStep1: Scenario;
    memoryStep2: Scenario;
    memoryNote: string;
    tryHint: string;
    close: string;
  };
};

export const STRINGS: Record<Lang, Strings> = {
  ko: {
    title: "깃코",
    tagline: "1인 창업가를 위한 AI 비서",
    subtitle:
      "목표를 알려주시면 Azure OpenAI 위에서 할 일·일정·이메일 초안을 계획합니다. 저장하기 전에 직접 승인하세요.",
    placeholder: "예: 다음 주 화요일 오후 2시에 투자자 미팅을 잡고 후속 이메일 초안을 써줘…",
    run: "실행 ⌘↵",
    thinking: "생각 중…",
    mic: "🎤",
    rec: "● 녹음",
    scenarios: [
      {
        label: "🌅 하루 시작 정리",
        command:
          "오늘 인스타 릴스 1개 만들고, 신제품 샘플 발주하고, 어제 문의 온 고객에게 답장하는 할 일을 추가해줘.",
      },
      {
        label: "🤝 투자자 미팅 + 후속 메일",
        command:
          "다음 주 화요일 오후 2시에 투자자 미팅을 잡고, 끝나고 보낼 후속 이메일 초안도 써줘.",
      },
      {
        label: "💬 고객 클레임 대응",
        command:
          "배송 지연으로 화난 고객에게 사과하고 보상 쿠폰을 주는 메일 초안을 쓰고, 내일 재고를 확인하는 할 일을 추가해줘.",
      },
      {
        label: "🚀 신제품 출시 준비",
        command:
          "다음 달 신제품 출시를 준비해줘: 촬영, 상세페이지, 사전알림 메일 할 일을 추가하고 킥오프 회의는 금요일 오전에 잡아줘.",
      },
    ],
    activity: "에이전트 활동",
    planning: "깃코가 계획을 세우고 있어요…",
    rawToggle: "원문 보기",
    briefing: "✨ 오늘의 브리핑",
    iuButton: "📈 투자자 업데이트",
    iuCommand:
      "이번 달 투자자 업데이트를 만들어줘. 핵심 지표: MRR 1,200만원(전월 대비 +18%), 신규 고객 30명, 런웨이 9개월. 소식: 첫 기업 고객 계약. Ask: B2B 세일즈 인재 추천.",
    iuPanel: "📈 투자자 업데이트",
    iuTldr: "요약",
    iuMetrics: "핵심 지표",
    iuHighlights: "하이라이트",
    iuLowlights: "어려웠던 점",
    iuAsks: "요청 사항",
    iuNext: "다음 달 계획",
    recalled: "🧠 깃코가 기억을 떠올렸어요",
    memBadge: "기억",
    copy: "복사",
    copied: "복사됨",
    del: "삭제",
    approve: "✓ 승인하고 적용",
    discard: "✕ 취소",
    guard: "🔒 승인하기 전에는 아무것도 저장되지 않습니다.",
    tasks: "할 일",
    calendar: "캘린더",
    drafts: "이메일 초안",
    empty: "아직 없음",
    footer: "GitHub Copilot SDK · Azure OpenAI(gpt-4.1-mini) · Azure Container Apps 배포",
    voiceUnsupported: "이 브라우저에서는 음성 입력을 지원하지 않습니다.",
    noRecipient: "(받는 사람 없음)",
    langButton: "EN",
    guideButton: "사용 가이드",
    briefingCommand:
      "지금 등록된 할 일과 일정을 검토해서, 오늘 집중해야 할 우선순위를 정리하고 빠진 준비가 있으면 할 일로 추가해줘.",
    guide: {
      title: "이럴 때 써보세요",
      intro: "이 앱은 혼자 모든 걸 처리하는 1인 창업가를 위해 만들어졌습니다.",
      personaName: "김지원 · 32세 · 1인 D2C 창업가",
      personaRole:
        "친환경 홈카페 브랜드를 혼자 운영합니다. 마케팅, 고객응대, 발주, 투자유치까지 전부 직접 합니다.",
      personaPain:
        "“머릿속엔 할 일이 가득한데, 옮겨 적고 메일 쓰고 일정 잡는 잡무에 하루가 녹아요.” 아이디어는 휘발되고 후속 조치를 놓칩니다.",
      whenTitle: "추천 시나리오 (눌러서 바로 실행)",
      whyTitle: "왜 김지원에게 좋은가",
      why: [
        "승인 게이트 — 메일·일정은 항상 검토 후 반영되어 실수 걱정 없이 위임",
        "맥락 유지 — 현재 할 일·일정을 AI가 참고해 계획, 매번 설명할 필요 없음",
        "음성 입력 — 손이 바쁠 때 말로 던지면 끝",
      ],
      memoryTitle: "🧠 기억 활용하기",
      memoryDesc:
        "깃코는 승인한 할 일·일정·메일을 Azure 임베딩으로 기억해요. 아래 두 단계를 순서대로 눌러보세요. 2단계에서 깃코가 1단계의 기억을 떠올립니다.",
      memoryStep1: {
        label: "① 먼저 실행 — 기억 만들기",
        command: "그린컴퍼니 김민수 대표와 다음 주 수요일 오후 3시에 시리즈A 투자 미팅을 잡아줘.",
      },
      memoryStep2: {
        label: "② 그다음 실행 — 기억 떠올리기",
        command: "김민수 대표한테 보낼 투자 미팅 후속 감사 메일 초안을 써줘.",
      },
      memoryNote: "2단계 실행 시 활동 패널에 “🧠 깃코가 기억을 떠올렸어요”가 나타납니다.",
      tryHint: "시나리오를 누르면 입력창에 채워집니다. 실행만 누르세요.",
      close: "닫기",
    },
  },
  en: {
    title: "Gitco",
    tagline: "An AI secretary for solo founders",
    subtitle:
      "Tell it a goal — it plans tasks, events & email drafts on Azure OpenAI. You approve before anything is saved.",
    placeholder:
      "e.g. Schedule an investor meeting next Tuesday at 2pm and draft a follow-up email…",
    run: "Run ⌘↵",
    thinking: "Thinking…",
    mic: "🎤",
    rec: "● Rec",
    scenarios: [
      {
        label: "🌅 Start-of-day brain dump",
        command:
          "Add tasks to make one Instagram reel today, order new product samples, and reply to the customers who messaged yesterday.",
      },
      {
        label: "🤝 Investor meeting + follow-up",
        command:
          "Schedule an investor meeting next Tuesday at 2pm and draft the follow-up email to send afterwards.",
      },
      {
        label: "💬 Handle a customer complaint",
        command:
          "Draft an apology email offering a coupon to a customer upset about a shipping delay, and add a task to check stock tomorrow.",
      },
      {
        label: "🚀 Product launch prep",
        command:
          "Plan next month's product launch: add tasks for the photoshoot, product page, and pre-launch email, and schedule a kickoff Friday morning.",
      },
    ],
    activity: "Agent activity",
    planning: "Gitco is drafting a plan…",
    rawToggle: "Show raw",
    briefing: "✨ Today's briefing",
    iuButton: "📈 Investor update",
    iuCommand:
      "Create this month's investor update. Key metrics: MRR ₩12M (+18% MoM), 30 new customers, 9 months runway. News: signed our first enterprise customer. Ask: intros to B2B sales hires.",
    iuPanel: "📈 Investor Updates",
    iuTldr: "TL;DR",
    iuMetrics: "Key metrics",
    iuHighlights: "Highlights",
    iuLowlights: "Lowlights",
    iuAsks: "Asks",
    iuNext: "Next month",
    recalled: "🧠 Gitco recalled from memory",
    memBadge: "memories",
    copy: "Copy",
    copied: "Copied",
    del: "Delete",
    approve: "✓ Approve & apply",
    discard: "✕ Discard",
    guard: "🔒 Nothing is saved until you approve.",
    tasks: "Tasks",
    calendar: "Calendar",
    drafts: "Email Drafts",
    empty: "Nothing yet",
    footer:
      "Powered by GitHub Copilot SDK · Azure OpenAI (gpt-4.1-mini) · deployed on Azure Container Apps",
    voiceUnsupported: "Voice input is not supported in this browser.",
    noRecipient: "(no recipient)",
    langButton: "한국어",
    guideButton: "How to use",
    briefingCommand:
      "Review my current tasks and events, lay out today's top priorities, and add any missing prep as tasks.",
    guide: {
      title: "When to use this",
      intro: "Built for the solo founder who does everything alone.",
      personaName: "Jiwon Kim · 32 · solo D2C founder",
      personaRole:
        "Runs an eco-friendly home-cafe brand single-handedly — marketing, support, purchasing, and fundraising.",
      personaPain:
        "“My head is full of to-dos, but the busywork of writing them down, drafting emails, and scheduling eats my whole day.” Ideas evaporate and follow-ups slip.",
      whenTitle: "Suggested scenarios (tap to run)",
      whyTitle: "Why it works for Jiwon",
      why: [
        "Approval gate — emails and events apply only after review, so delegation feels safe",
        "Context-aware — the agent reads current tasks/events, no need to re-explain",
        "Voice input — just say it when your hands are busy",
      ],
      memoryTitle: "🧠 Using memory",
      memoryDesc:
        "Gitco remembers approved tasks, events, and emails via Azure embeddings. Run the two steps below in order — in step 2 Gitco recalls what you did in step 1.",
      memoryStep1: {
        label: "① Run first — create a memory",
        command: "Schedule a Series A investor meeting with CEO Minsu Kim of GreenCompany next Wednesday at 3pm.",
      },
      memoryStep2: {
        label: "② Then run — recall the memory",
        command: "Draft a follow-up thank-you email to Minsu Kim about the investor meeting.",
      },
      memoryNote: "On step 2, the activity panel shows “🧠 Gitco recalled from memory”.",
      tryHint: "Tap a scenario to fill the command box, then hit Run.",
      close: "Close",
    },
  },
};

export const actionLabel: Record<Lang, Record<string, string>> = {
  ko: {
    create_task: "할 일",
    schedule_event: "일정",
    draft_email: "이메일 초안",
    investor_update: "투자자 업데이트",
  },
  en: {
    create_task: "create task",
    schedule_event: "schedule event",
    draft_email: "draft email",
    investor_update: "investor update",
  },
};
