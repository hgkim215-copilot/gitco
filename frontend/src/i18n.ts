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
  timeSaved: (n: number) => string;
  briefing: string;
  iuButton: string;
  iuCommand: string;
  anButton: string;
  anCommand: string;
  anPanel: string;
  anDeadline: string;
  anFit: string;
  anAddTask: string;
  anLink: string;
  anVerify: string;
  anVerifying: string;
  anVerifyOk: string;
  anVerifyFail: string;
  anVerifyTool: string;
  profileButton: string;
  profileTitle: string;
  profileIndustry: string;
  profileStage: string;
  profileInterests: string;
  profileSave: string;
  profileSaved: string;
  otherLabel: string;
  otherPlaceholder: string;
  industryOptions: string[];
  stageOptions: string[];
  interestOptions: string[];
  iuPanel: string;
  tabWorkspace: string;
  tabUpdates: string;
  tabGrants: string;
  tabHome: string;
  homeGreeting: string;
  homeDueTasks: string;
  homeTodayEvents: string;
  homeImminentGrants: string;
  homeAllClear: string;
  aiGenerated: string;
  trustNote: string;
  speak: string;
  stopSpeak: string;
  sourceLive: string;
  sourceSeed: string;
  poweredBy: string;
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
  refineBtn: string;
  refineOptions: string[];
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
  a11y: {
    closeModal: string;
    toggleComplete: string;
    undoComplete: string;
    deleteItem: string;
    copyItem: string;
    speakItem: string;
    stopSpeech: string;
    micStart: string;
    micStop: string;
    runCommand: string;
    openProfile: string;
    openGuide: string;
    switchLang: string;
    verifySource: string;
    deleteUpdate: string;
    deleteBriefing: string;
    deleteEvent: string;
    deleteDraft: string;
  };
  guide: {
    title: string;
    intro: string;
    personaName: string;
    personaRole: string;
    personaPain: string;
    featureTitle: string;
    features: { emoji: string; name: string; desc: string }[];
    whenTitle: string;
    whyTitle: string;
    why: string[];
    memoryTitle: string;
    memoryDesc: string;
    memoryStep1: Scenario;
    memoryStep2: Scenario;
    memoryNote: string;
    irTitle: string;
    irDesc: string;
    irStep: Scenario;
    grantTitle: string;
    grantDesc: string;
    grantStep: Scenario;
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
    timeSaved: (n: number) => `⚡ 직접 하면 약 ${n}분 — 깃코가 자동으로`,
    briefing: "✨ 오늘의 브리핑",
    iuButton: "📈 투자자 업데이트",
    iuCommand:
      "이번 달 투자자 업데이트를 만들어줘. 핵심 지표: MRR 1,200만원(전월 대비 +18%), 신규 고객 30명, 런웨이 9개월. 소식: 첫 기업 고객 계약. Ask: B2B 세일즈 인재 추천.",
    anButton: "📰 공고 확인",
    anCommand: "내게 맞는 정부 창업 지원사업 공고를 골라서 마감일과 적합한 이유와 함께 보고해줘.",
    anPanel: "📰 맞춤 공고 브리핑",
    anDeadline: "마감",
    anFit: "적합 이유",
    anAddTask: "📌 마감 할일 추가",
    anLink: "원문",
    anVerify: "🔎 원문 확인",
    anVerifying: "원문 확인 중…",
    anVerifyOk: "✅ 원문 확인됨",
    anVerifyFail: "⚠️ 확인 불가",
    anVerifyTool: "web_fetch로 실제 페이지를 읽었습니다",
    profileButton: "⚙️ 프로필",
    profileTitle: "창업가 프로필",
    profileIndustry: "업종",
    profileStage: "창업 단계",
    profileInterests: "관심 분야",
    profileSave: "저장",
    profileSaved: "저장됨 ✓",
    otherLabel: "기타",
    otherPlaceholder: "직접 입력 (쉼표로 구분)",
    industryOptions: [
      "B2B SaaS",
      "B2C 앱/플랫폼",
      "이커머스/D2C",
      "핀테크",
      "헬스케어/바이오",
      "AI/딥테크",
      "제조/하드웨어",
      "콘텐츠/미디어",
      "교육(에듀테크)",
      "게임",
    ],
    stageOptions: [
      "예비창업 (사업자등록 전)",
      "초기창업 (3년 이내)",
      "도약기 (3~7년)",
      "재창업",
    ],
    interestOptions: [
      "R&D 자금",
      "사업화 자금",
      "글로벌 진출",
      "TIPS/투자연계",
      "바우처",
      "보육/입주공간",
      "멘토링",
      "마케팅/판로",
      "인력 채용",
    ],
    iuPanel: "📈 투자자 업데이트",
    tabWorkspace: "🗂 워크스페이스",
    tabUpdates: "📈 투자자 업데이트",
    tabGrants: "📰 공고",
    tabHome: "🏠 오늘",
    homeGreeting: "오늘 깃코가 챙긴 것들이에요",
    homeDueTasks: "마감 임박 할 일",
    homeTodayEvents: "다가오는 일정",
    homeImminentGrants: "마감 임박 공고",
    homeAllClear: "임박한 항목이 없어요. 좋아요! 👍",
    aiGenerated: "🤖 AI 생성",
    trustNote: "AI가 생성한 초안입니다. 보내기·등록 전에 직접 검토하세요. 수치·사실은 한 번 더 확인해 주세요.",
    speak: "🔊 읽어주기",
    stopSpeak: "⏹ 정지",
    sourceLive: "실시간",
    sourceSeed: "샘플 데이터",
    poweredBy: "Azure OpenAI",
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
    refineBtn: "✏️ 다듬기",
    refineOptions: ["더 짧게", "더 정중하게", "더 캐주얼하게"],
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
    a11y: {
      closeModal: "모달 닫기",
      toggleComplete: "완료로 표시",
      undoComplete: "완료 취소",
      deleteItem: "삭제",
      copyItem: "클립보드에 복사",
      speakItem: "읽어주기",
      stopSpeech: "읽기 중지",
      micStart: "음성 입력 시작",
      micStop: "음성 입력 중지",
      runCommand: "명령 실행",
      openProfile: "프로필 설정 열기",
      openGuide: "사용 가이드 열기",
      switchLang: "영어로 전환",
      verifySource: "원문 링크 확인",
      deleteUpdate: "투자자 업데이트 삭제",
      deleteBriefing: "공고 브리핑 삭제",
      deleteEvent: "일정 삭제",
      deleteDraft: "이메일 초안 삭제",
    },
    guide: {
      title: "깃코 사용 가이드",
      intro: "혼자 모든 걸 처리하는 1인 창업가를 위한 AI 비서입니다. 아래 기능과 시나리오를 활용해보세요.",
      personaName: "김지원 · 32세 · 1인 D2C 창업가",
      personaRole:
        "친환경 홈카페 브랜드를 혼자 운영합니다. 마케팅, 고객응대, 발주, 투자유치까지 전부 직접 합니다.",
      personaPain:
        "“머릿속엔 할 일이 가득한데, 옮겨 적고 메일 쓰고 일정 잡는 잡무에 하루가 녹아요.” 아이디어는 휘발되고 후속 조치를 놓칩니다.",
      featureTitle: "✨ 깃코의 모든 기능",
      features: [
        { emoji: "💬", name: "자연어 명령", desc: "할 일·일정·메일 초안을 말 한마디로 생성. 승인해야만 저장됩니다." },
        { emoji: "🏠", name: "오늘 탭", desc: "마감 임박 할 일·오늘 일정·마감 임박 공고를 한눈에." },
        { emoji: "🧠", name: "기억 (Azure 임베딩)", desc: "승인한 항목을 AI가 기억해 다음 명령에 맥락으로 활용." },
        { emoji: "📈", name: "투자자 업데이트", desc: "수치·소식만 말하면 IR 리포트 자동 생성. 복사·다듬기 가능." },
        { emoji: "📰", name: "공고 브리핑", desc: "프로필 기반 맞춤 정부 지원사업 공고 선별. 마감 D-day·적합 이유 제공." },
        { emoji: "🔎", name: "원문 확인 (web_fetch)", desc: "공고 카드에서 원문 URL을 AI가 직접 읽어 내용·마감 확인." },
        { emoji: "✏️", name: "다시 다듬기", desc: "초안·업데이트를 더 짧게/정중하게/캐주얼하게 재생성." },
        { emoji: "🔊", name: "음성 읽기", desc: "계획·업데이트·공고를 소리내어 읽어줍니다." },
        { emoji: "🎤", name: "음성 입력", desc: "마이크 버튼으로 음성으로 명령 입력 가능 (브라우저 지원 시)." },
      ],
      whenTitle: "추천 시나리오 (눌러서 바로 실행)",
      whyTitle: "왜 깃코인가",
      why: [
        "승인 게이트 — 모든 변경은 사람이 확인 후 반영, 실수 걱정 없이 AI에 위임",
        "맥락 유지 — 현재 할 일·일정 + 과거 기억을 AI가 자동 참고, 매번 설명 불필요",
        "도메인 특화 — IR 업데이트, 정부 공고 매칭 등 1인 창업가 업무에 최적화",
        "음성 입력·출력 — 손이 바쁠 때 말로 던지고, 귀로 요약을 들을 수 있음",
      ],
      memoryTitle: "🧠 기억 기능 체험 (2단계)",
      memoryDesc:
        "깃코는 승인한 항목을 Azure 임베딩으로 기억합니다. 순서대로 눌러보세요 — 2단계에서 1단계의 기억을 떠올립니다.",
      memoryStep1: {
        label: "① 먼저 — 기억 만들기",
        command: "그린컴퍼니 김민수 대표와 다음 주 수요일 오후 3시에 시리즈A 투자 미팅을 잡아줘.",
      },
      memoryStep2: {
        label: "② 그다음 — 기억 떠올리기",
        command: "김민수 대표한테 보낼 투자 미팅 후속 감사 메일 초안을 써줘.",
      },
      memoryNote: "2단계 활동 패널에 '🧠 깃코가 기억을 떠올렸어요'가 나타납니다.",
      irTitle: "📈 투자자 업데이트 체험",
      irDesc: "수치와 소식을 말하면 깃코가 IR 리포트를 자동 작성합니다. 승인 후 '📈 탭'에서 확인하세요.",
      irStep: {
        label: "▶ 투자자 업데이트 만들기",
        command: "이번 달 투자자 업데이트를 만들어줘. 핵심 지표: MRR 1,200만원(+18%), 신규 고객 30명, 런웨이 9개월. 소식: 첫 기업 고객 계약. Ask: B2B 세일즈 인재 추천.",
      },
      grantTitle: "📰 공고 브리핑 체험",
      grantDesc: "⚙️ 프로필을 먼저 설정하세요. 그러면 깃코가 내 업종·단계에 맞는 공고만 선별합니다.",
      grantStep: {
        label: "▶ 맞춤 공고 확인",
        command: "내게 맞는 정부 창업 지원사업 공고를 골라서 마감일과 적합한 이유와 함께 보고해줘.",
      },
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
    timeSaved: (n: number) => `⚡ ~${n} min manually — Gitco did it automatically`,
    briefing: "✨ Today's briefing",
    iuButton: "📈 Investor update",
    iuCommand:
      "Create this month's investor update. Key metrics: MRR ₩12M (+18% MoM), 30 new customers, 9 months runway. News: signed our first enterprise customer. Ask: intros to B2B sales hires.",
    anButton: "📰 Find grants",
    anCommand: "Find the government startup-support announcements that fit me, with deadlines and why each fits.",
    anPanel: "📰 Matched grant briefing",
    anDeadline: "Deadline",
    anFit: "Why it fits",
    anAddTask: "📌 Add deadline task",
    anLink: "Source",
    anVerify: "🔎 Verify source",
    anVerifying: "Checking source…",
    anVerifyOk: "✅ Source verified",
    anVerifyFail: "⚠️ Couldn't verify",
    anVerifyTool: "Read the live page via web_fetch",
    profileButton: "⚙️ Profile",
    profileTitle: "Founder profile",
    profileIndustry: "Industry",
    profileStage: "Stage",
    profileInterests: "Interests",
    profileSave: "Save",
    profileSaved: "Saved ✓",
    otherLabel: "Other",
    otherPlaceholder: "Type here (comma-separated)",
    industryOptions: [
      "B2B SaaS",
      "Consumer app/platform",
      "E-commerce/D2C",
      "Fintech",
      "Healthcare/Bio",
      "AI/Deeptech",
      "Manufacturing/Hardware",
      "Content/Media",
      "Education (Edtech)",
      "Games",
    ],
    stageOptions: [
      "Pre-startup (before registration)",
      "Early (within 3 years)",
      "Growth (3-7 years)",
      "Re-founding",
    ],
    interestOptions: [
      "R&D funding",
      "Commercialization funding",
      "Global expansion",
      "TIPS/Investment-linked",
      "Vouchers",
      "Incubation/Office space",
      "Mentoring",
      "Marketing/Sales channels",
      "Hiring",
    ],
    iuPanel: "📈 Investor Updates",
    tabWorkspace: "🗂 Workspace",
    tabUpdates: "📈 Investor updates",
    tabGrants: "📰 Grants",
    tabHome: "🏠 Today",
    homeGreeting: "Here's what Gitco is watching for you today",
    homeDueTasks: "Tasks due soon",
    homeTodayEvents: "Upcoming events",
    homeImminentGrants: "Grants closing soon",
    homeAllClear: "Nothing urgent. Nice! 👍",
    aiGenerated: "🤖 AI-generated",
    trustNote: "These are AI-generated drafts. Review before sending or saving, and double-check figures and facts.",
    speak: "🔊 Read aloud",
    stopSpeak: "⏹ Stop",
    sourceLive: "live",
    sourceSeed: "sample data",
    poweredBy: "Azure OpenAI",
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
    refineBtn: "✏️ Refine",
    refineOptions: ["Shorter", "More formal", "More casual"],
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
    a11y: {
      closeModal: "Close modal",
      toggleComplete: "Mark as done",
      undoComplete: "Undo completion",
      deleteItem: "Delete",
      copyItem: "Copy to clipboard",
      speakItem: "Read aloud",
      stopSpeech: "Stop reading",
      micStart: "Start voice input",
      micStop: "Stop voice input",
      runCommand: "Run command",
      openProfile: "Open profile settings",
      openGuide: "Open usage guide",
      switchLang: "Switch to Korean",
      verifySource: "Verify source link",
      deleteUpdate: "Delete investor update",
      deleteBriefing: "Delete grant briefing",
      deleteEvent: "Delete event",
      deleteDraft: "Delete email draft",
    },
    guide: {
      title: "Gitco — Getting started",
      intro: "Your AI secretary built for the solo founder who does everything alone.",
      personaName: "Jiwon Kim · 32 · solo D2C founder",
      personaRole:
        "Runs an eco-friendly home-cafe brand single-handedly — marketing, support, purchasing, and fundraising.",
      personaPain:
        "“My head is full of to-dos, but the busywork of writing them down, drafting emails, and scheduling eats my whole day.” Ideas evaporate and follow-ups slip.",
      featureTitle: "✨ Everything Gitco can do",
      features: [
        { emoji: "💬", name: "Natural-language commands", desc: "Create tasks, events, and email drafts in plain language. Nothing is saved until you approve." },
        { emoji: "🏠", name: "Today tab", desc: "See urgent tasks, upcoming events, and imminent grants at a glance." },
        { emoji: "🧠", name: "Memory (Azure embeddings)", desc: "Gitco remembers what you approved and uses it as context in future commands." },
        { emoji: "📈", name: "Investor updates", desc: "Say your numbers and news — Gitco writes a full IR report. Copy or refine it." },
        { emoji: "📰", name: "Grant briefing", desc: "Personalized government startup-support grant picks with D-day, fit reasons, and source verification." },
        { emoji: "🔎", name: "Source verify (web_fetch)", desc: "Gitco reads the grant URL live and summarises the latest content." },
        { emoji: "✏️", name: "Refine drafts", desc: "Re-generate emails and investor updates as shorter, more formal, or more casual." },
        { emoji: "🔊", name: "Read aloud (TTS)", desc: "Gitco can read plans, updates, and briefings out loud." },
        { emoji: "🎤", name: "Voice input", desc: "Tap the mic to dictate commands (requires browser permission)." },
      ],
      whenTitle: "Suggested scenarios (tap to run)",
      whyTitle: "Why Gitco",
      why: [
        "Approval gate — every change is reviewed by you before it's applied, so delegation feels safe",
        "Context-aware — current tasks, events, and past memory are automatically injected, no need to re-explain",
        "Domain-focused — IR updates, grant matching, and other solo-founder workflows built in",
        "Voice input + output — say it when hands are busy; hear the summary read back",
      ],
      memoryTitle: "🧠 Try memory (2 steps)",
      memoryDesc:
        "Gitco remembers approved items via Azure embeddings. Run these in order — in step 2 Gitco recalls what happened in step 1.",
      memoryStep1: {
        label: "① First — create a memory",
        command: "Schedule a Series A investor meeting with CEO Minsu Kim of GreenCompany next Wednesday at 3pm.",
      },
      memoryStep2: {
        label: "② Then — trigger a recall",
        command: "Draft a follow-up thank-you email to Minsu Kim about the investor meeting.",
      },
      memoryNote: "On step 2, the activity panel shows '🧠 Gitco recalled from memory'.",
      irTitle: "📈 Try investor updates",
      irDesc: "Give Gitco your metrics and news — it writes a structured IR report. Approve, then check the 📈 tab.",
      irStep: {
        label: "▶ Create an investor update",
        command: "Create this month's investor update. Key metrics: MRR ₩12M (+18% MoM), 30 new customers, 9 months runway. News: signed our first enterprise customer. Ask: intros to B2B sales hires.",
      },
      grantTitle: "📰 Try grant briefing",
      grantDesc: "Set your ⚙️ Profile first. Gitco will then pick only the grants that fit your industry and stage.",
      grantStep: {
        label: "▶ Find matching grants",
        command: "Find the government startup-support announcements that fit me, with deadlines and why each fits.",
      },
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
    announcement_briefing: "공고 브리핑",
  },
  en: {
    create_task: "create task",
    schedule_event: "schedule event",
    draft_email: "draft email",
    investor_update: "investor update",
    announcement_briefing: "grant briefing",
  },
};
