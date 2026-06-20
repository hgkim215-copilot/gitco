export type Lang = "ko" | "en";

export type Strings = {
  title: string;
  subtitle: string;
  placeholder: string;
  run: string;
  thinking: string;
  mic: string;
  rec: string;
  examples: string[];
  activity: string;
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
};

export const STRINGS: Record<Lang, Strings> = {
  ko: {
    title: "AI 비서실장",
    subtitle:
      "목표를 알려주시면 Azure OpenAI 위에서 할 일·일정·이메일 초안을 계획합니다. 저장하기 전에 직접 승인하세요.",
    placeholder: "예: 다음 주 화요일 오후 2시에 투자자 미팅을 잡고 후속 이메일 초안을 써줘…",
    run: "실행 ⌘↵",
    thinking: "생각 중…",
    mic: "🎤",
    rec: "● 녹음",
    examples: [
      "다음 주 화요일 오후 2시에 투자자 미팅을 잡고, 피치덱 준비 할 일을 높은 우선순위로 추가해줘.",
      "데모 관련 후속 이메일을 Jane에게 보내는 초안을 쓰고, 내일 보낼 할 일을 추가해줘.",
      "제품 출시를 계획해줘: 할 일 3개를 추가하고 금요일 오전에 킥오프 콜을 잡아줘.",
    ],
    activity: "에이전트 활동",
    approve: "✓ 승인하고 적용",
    discard: "✕ 취소",
    guard: "🔒 승인하기 전에는 아무것도 저장되지 않습니다.",
    tasks: "할 일",
    calendar: "캘린더",
    drafts: "이메일 초안",
    empty: "아직 없음",
    footer:
      "GitHub Copilot SDK · Azure OpenAI(gpt-4.1-mini) · Azure Container Apps 배포",
    voiceUnsupported: "이 브라우저에서는 음성 입력을 지원하지 않습니다.",
    noRecipient: "(받는 사람 없음)",
    langButton: "EN",
  },
  en: {
    title: "AI Chief of Staff",
    subtitle:
      "Tell me a goal — I'll plan tasks, events & email drafts on Azure OpenAI. You approve before anything is saved.",
    placeholder:
      "e.g. Schedule an investor meeting next Tuesday at 2pm and draft a follow-up email…",
    run: "Run ⌘↵",
    thinking: "Thinking…",
    mic: "🎤",
    rec: "● Rec",
    examples: [
      "Schedule an investor meeting next Tuesday at 2pm and create a high-priority task to prepare the pitch deck.",
      "Draft a follow-up email to Jane about the demo and add a task to send it tomorrow.",
      "Plan my product launch: add 3 tasks and schedule a kickoff call Friday morning.",
    ],
    activity: "Agent activity",
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
  },
};

export const actionLabel: Record<Lang, Record<string, string>> = {
  ko: {
    create_task: "할 일",
    schedule_event: "일정",
    draft_email: "이메일 초안",
  },
  en: {
    create_task: "create task",
    schedule_event: "schedule event",
    draft_email: "draft email",
  },
};
