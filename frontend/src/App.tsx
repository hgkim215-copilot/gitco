import { useEffect, useRef, useState } from "react";
import type { Plan, Task, EventRow, Draft, AgentEvent, RecalledMemory, InvestorUpdate, Profile, Briefing } from "./types";
import { STRINGS, actionLabel, type Lang } from "./i18n";
import {
  sendCommand,
  subscribe,
  approve,
  reject,
  getTasks,
  getEvents,
  getDrafts,
  toggleTask,
  deleteTask,
  deleteEvent,
  deleteDraft,
  getMemoryCount,
  getUpdates,
  deleteUpdate,
  getProfile,
  putProfile,
  getBriefings,
  deleteBriefing,
  createTask,
  getInfo,
  type Info,
  verifyAnnouncement,
  type VerifyResult,
} from "./api";

function priorityClass(p: string) {
  if (p === "high") return "pill pill-high";
  if (p === "low") return "pill pill-low";
  return "pill pill-med";
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ko");
  const t = STRINGS[lang];

  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [stream, setStream] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [recalled, setRecalled] = useState<RecalledMemory[]>([]);
  const [memCount, setMemCount] = useState(0);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [updates, setUpdates] = useState<InvestorUpdate[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [profile, setProfile] = useState<Profile>({ industry: "", stage: "", interests: "" });
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "workspace" | "updates" | "grants">("home");
  const [info, setInfo] = useState<Info | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [refineKey, setRefineKey] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});

  async function onVerify(key: string, url: string, title: string) {
    setVerifying(key);
    try {
      const r = await verifyAnnouncement(url, title, lang);
      setVerifyResults((prev) => ({ ...prev, [key]: r }));
    } catch {
      setVerifyResults((prev) => ({ ...prev, [key]: { ok: false, toolUsed: false } }));
    } finally {
      setVerifying(null);
    }
  }

  function refineDraft(d: Draft, opt: string) {
    setRefineKey(null);
    setActiveTab("workspace");
    run(
      `다음 이메일 초안을 "${opt}" 느낌으로 다시 써줘. 같은 목적과 핵심 내용은 유지해줘.\n제목: ${d.subject}\n받는 사람: ${d.to ?? "(미정)"}\n본문:\n${d.body}`,
    );
  }
  function refineUpdate(u: InvestorUpdate, opt: string) {
    setRefineKey(null);
    setActiveTab("updates");
    const c = u.content;
    run(
      `다음 투자자 업데이트를 "${opt}" 느낌으로 다시 작성해줘. 같은 지표와 사실은 유지해줘.\n기간: ${u.period}\nTL;DR: ${c.tldr}\n지표: ${c.metrics.map((m) => `${m.label} ${m.value}`).join(", ")}\n하이라이트: ${c.highlights.join("; ")}\nAsk: ${c.asks.join("; ")}`,
    );
  }

  function speak(id: string, text: string) {
    const synth = (window as any).speechSynthesis;
    if (!synth) return;
    if (speakingId === id) {
      synth.cancel();
      setSpeakingId(null);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "ko" ? "ko-KR" : "en-US";
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(u);
  }

  const recognitionRef = useRef<any>(null);

  async function refresh() {
    const [t, e, d, u, b] = await Promise.all([
      getTasks(),
      getEvents(),
      getDrafts(),
      getUpdates(),
      getBriefings(),
    ]);
    setTasks(t);
    setEvents(e);
    setDrafts(d);
    setUpdates(u);
    setBriefings(b);
  }

  useEffect(() => {
    refresh();
    getMemoryCount().then(setMemCount);
    getProfile().then(setProfile);
    getInfo().then(setInfo).catch(() => {});
  }, []);

  async function run(cmd: string, mode?: string) {
    if (!cmd.trim() || running) return;
    setRunning(true);
    setStream("");
    setPlan(null);
    setError(null);
    setRunId(null);
    setRecalled([]);
    try {
      const id = await sendCommand(cmd, mode);
      setRunId(id);
      const unsub = subscribe(id, (ev: AgentEvent) => {
        if (ev.type === "delta") setStream((s) => s + ev.data);
        else if (ev.type === "memory") setRecalled(ev.data);
        else if (ev.type === "plan") setPlan(ev.data.plan);
        else if (ev.type === "error") setError(ev.data);
        else if (ev.type === "done") {
          setRunning(false);
          unsub();
        }
      });
    } catch (err: any) {
      setError(String(err?.message ?? err));
      setRunning(false);
    }
  }

  async function onApprove() {
    if (!runId) return;
    const planActions = plan?.actions ?? [];
    const res = await approve(runId);
    if (res.tasks) {
      setTasks(res.tasks);
      setEvents(res.events);
      setDrafts(res.drafts);
      if ((res as any).updates) setUpdates((res as any).updates);
      if ((res as any).briefings) setBriefings((res as any).briefings);
    } else {
      await refresh();
    }
    if (typeof (res as any).memoryCount === "number") setMemCount((res as any).memoryCount);
    // Jump to the tab matching what was just produced.
    if (planActions.some((a) => a.type === "announcement_briefing")) setActiveTab("grants");
    else if (planActions.some((a) => a.type === "investor_update")) setActiveTab("updates");
    else setActiveTab("workspace");
    setPlan(null);
    setStream("");
    setRunId(null);
  }

  async function onReject() {
    if (runId) await reject(runId);
    setPlan(null);
    setStream("");
    setRunId(null);
  }

  async function onToggleTask(id: number) {
    const r = await toggleTask(id);
    if (r.tasks) setTasks(r.tasks);
  }
  async function onDeleteTask(id: number) {
    const r = await deleteTask(id);
    if (r.tasks) setTasks(r.tasks);
  }
  async function onDeleteEvent(id: number) {
    const r = await deleteEvent(id);
    if (r.events) setEvents(r.events);
  }
  async function onDeleteDraft(id: number) {
    const r = await deleteDraft(id);
    if (r.drafts) setDrafts(r.drafts);
  }
  async function onDeleteUpdate(id: number) {
    const r = await deleteUpdate(id);
    if (r.updates) setUpdates(r.updates);
  }
  async function onCopyUpdate(u: InvestorUpdate) {
    const c = u.content;
    const md = [
      `# 투자자 업데이트 — ${u.period}`,
      c.tldr,
      c.metrics.length ? "\n## 지표\n" + c.metrics.map((m) => `- ${m.label}: ${m.value}`).join("\n") : "",
      c.highlights.length ? "\n## 하이라이트\n" + c.highlights.map((h) => `- ${h}`).join("\n") : "",
      c.lowlights.length ? "\n## 어려웠던 점\n" + c.lowlights.map((l) => `- ${l}`).join("\n") : "",
      c.asks.length ? "\n## 요청\n" + c.asks.map((a) => `- ${a}`).join("\n") : "",
      c.next ? `\n## 다음 달\n${c.next}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(md);
      setCopiedId(-u.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }
  async function onCopyDraft(id: number, body: string, subject: string) {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function onDeleteBriefing(id: number) {
    const r = await deleteBriefing(id);
    if (r.briefings) setBriefings(r.briefings);
  }
  async function onAddDeadlineTask(pick: { title: string; deadline: string }) {
    const r = await createTask(`[지원] ${pick.title} 마감 준비`, pick.deadline, "high");
    if (r.tasks) setTasks(r.tasks);
  }
  async function onSaveProfile(p: Profile) {
    const saved = await putProfile(p);
    setProfile(saved);
    setShowProfile(false);
  }

  function dday(deadline: string): string {
    const d = new Date(deadline + "T00:00:00");
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (isNaN(diff)) return "";
    if (diff === 0) return "D-DAY";
    return diff > 0 ? `D-${diff}` : `D+${-diff}`;
  }

  function toggleVoice() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      setError(t.voiceUnsupported);
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = lang === "ko" ? "ko-KR" : "en-US";
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setText(txt);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="logo">◆</span>
          <div>
            <div className="eyebrow">{t.tagline}</div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="header-actions">
          {memCount > 0 && (
            <span className="mem-badge" title={t.recalled}>
              🧠 {memCount} {t.memBadge}
            </span>
          )}
          <button className="lang" onClick={() => setShowProfile(true)}>
            {t.profileButton}
          </button>
          <button className="lang" onClick={() => setShowGuide(true)}>
            ❔ {t.guideButton}
          </button>
          <button className="lang" onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
            {t.langButton}
          </button>
        </div>
      </header>

      {showProfile && (
        <ProfileModal t={t} profile={profile} onClose={() => setShowProfile(false)} onSave={onSaveProfile} />
      )}

      {showGuide && (
        <GuideModal
          t={t}
          onClose={() => setShowGuide(false)}
          onPick={(cmd) => {
            setText(cmd);
            setShowGuide(false);
          }}
        />
      )}

      <section className="command">
        <div className="command-row">
          <textarea
            value={text}
            placeholder={t.placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(text);
            }}
            rows={2}
          />
          <div className="command-actions">
            <button
              className={listening ? "mic mic-on" : "mic"}
              onClick={toggleVoice}
              title="Voice input"
            >
              {listening ? t.rec : t.mic}
            </button>
            <button className="run" disabled={running || !text.trim()} onClick={() => run(text)}>
              {running ? t.thinking : t.run}
            </button>
          </div>
        </div>
        <div className="examples">
          <button
            className="briefing-btn"
            onClick={() => run(t.briefingCommand)}
            disabled={running}
          >
            {t.briefing}
          </button>
          <button
            className="briefing-btn iu-btn"
            onClick={() => setText(t.iuCommand)}
            disabled={running}
          >
            {t.iuButton}
          </button>
          <button
            className="briefing-btn an-btn"
            onClick={() => run(t.anCommand, "announcements")}
            disabled={running}
          >
            {t.anButton}
          </button>
          {t.scenarios.map((s, i) => (
            <button
              key={i}
              className="chip"
              onClick={() => setText(s.command)}
              disabled={running}
              title={s.command}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {(running || plan || error || recalled.length > 0) && (
        <section className="activity">
          <div className="activity-head">
            <span className="dot" data-on={running} /> {t.activity}
          </div>
          {error && <div className="err">⚠ {error}</div>}
          {recalled.length > 0 && (
            <div className="recalled">
              <div className="recalled-head">{t.recalled}</div>
              <ul className="recalled-list">
                {recalled.map((m, i) => (
                  <li key={i} style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="recalled-text">{m.text}</span>
                    <span className="recalled-score">{Math.round(m.score * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {running && !plan && (
            <div className="planning">
              <span className="planning-avatar">🤖</span>
              <span className="planning-text">{t.planning}</span>
              <span className="typing">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
          )}
          {plan && (
            <div className="plan">
              <div className="plan-summary">
                <span>{plan.summary}</span>
                <button
                  className="speak-btn"
                  onClick={() => speak("plan", plan.summary)}
                >
                  {speakingId === "plan" ? t.stopSpeak : t.speak}
                </button>
              </div>
              <ul className="plan-actions">
                {plan.actions.map((a, i) => (
                  <li key={i} style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="atype">{actionLabel[lang][a.type] ?? a.type}</span>
                    <span className="adesc">
                      {a.type === "create_task" && (a.data as any).title}
                      {a.type === "schedule_event" &&
                        `${(a.data as any).title} — ${(a.data as any).start}`}
                      {a.type === "draft_email" &&
                        `${(a.data as any).subject} → ${(a.data as any).to ?? t.noRecipient}`}
                      {a.type === "investor_update" &&
                        `${(a.data as any).period} — ${(a.data as any).tldr}`}
                      {a.type === "announcement_briefing" &&
                        `${((a.data as any).picks ?? []).length}건 추천: ${((a.data as any).picks ?? []).map((p: any) => p.title).join(", ")}`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="plan-buttons">
                <button className="approve" onClick={onApprove}>
                  {t.approve}
                </button>
                <button className="rejectbtn" onClick={onReject}>
                  {t.discard}
                </button>
              </div>
              <div className="guard">{t.guard}</div>
              <div className="ai-note">
                <span className="ai-tag">{t.aiGenerated}</span>
                {info && (
                  <span className="ai-model">
                    {info.provider} · {info.model}
                  </span>
                )}
              </div>
            </div>
          )}
          {stream && (
            <div className="raw">
              <button className="raw-toggle" onClick={() => setShowRaw((v) => !v)}>
                {t.rawToggle} {showRaw ? "▲" : "▼"}
              </button>
              {showRaw && <pre className="stream">{stream}</pre>}
            </div>
          )}
        </section>
      )}

      <nav className="tabs">
        <button
          className={activeTab === "home" ? "tab tab-on" : "tab"}
          onClick={() => setActiveTab("home")}
        >
          {t.tabHome}
        </button>
        <button
          className={activeTab === "workspace" ? "tab tab-on" : "tab"}
          onClick={() => setActiveTab("workspace")}
        >
          {t.tabWorkspace}
          <span className="tab-count">{tasks.length + events.length + drafts.length}</span>
        </button>
        <button
          className={activeTab === "updates" ? "tab tab-on" : "tab"}
          onClick={() => setActiveTab("updates")}
        >
          {t.tabUpdates}
          <span className="tab-count">{updates.length}</span>
        </button>
        <button
          className={activeTab === "grants" ? "tab tab-on" : "tab"}
          onClick={() => setActiveTab("grants")}
        >
          {t.tabGrants}
          <span className="tab-count">{briefings.length}</span>
        </button>
      </nav>

      {activeTab === "home" && (
        <section className="home">
          <div className="home-greeting">{t.homeGreeting}</div>
          {(() => {
            const dueTasks = tasks
              .filter((tk) => tk.due && tk.status !== "done")
              .sort((a, b) => (a.due! < b.due! ? -1 : 1))
              .slice(0, 5);
            const upEvents = [...events].sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 5);
            const grantPicks = briefings
              .flatMap((b) => b.content.picks)
              .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
              .slice(0, 5);
            const empty = !dueTasks.length && !upEvents.length && !grantPicks.length;
            if (empty) return <div className="tab-empty">{t.homeAllClear}</div>;
            return (
              <div className="home-grid">
                <div className="home-card">
                  <div className="home-card-head">⏰ {t.homeDueTasks}</div>
                  {dueTasks.length ? (
                    dueTasks.map((tk) => (
                      <div className="home-row" key={tk.id}>
                        <span className="home-dday">{dday(tk.due!)}</span>
                        <span className="home-row-title">{tk.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="home-none">—</div>
                  )}
                </div>
                <div className="home-card">
                  <div className="home-card-head">📅 {t.homeTodayEvents}</div>
                  {upEvents.length ? (
                    upEvents.map((e) => (
                      <div className="home-row" key={e.id}>
                        <span className="home-time">{e.start.slice(0, 16).replace("T", " ")}</span>
                        <span className="home-row-title">{e.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="home-none">—</div>
                  )}
                </div>
                <div className="home-card">
                  <div className="home-card-head">📰 {t.homeImminentGrants}</div>
                  {grantPicks.length ? (
                    grantPicks.map((p, i) => (
                      <div className="home-row" key={i}>
                        <span className="home-dday">{dday(p.deadline)}</span>
                        <span className="home-row-title">{p.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="home-none">—</div>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {activeTab === "workspace" && (
      <section className="panels">
        <Panel title={t.tasks} count={tasks.length} empty={t.empty}>
          {tasks.map((tk) => (
            <div className={tk.status === "done" ? "card card-done" : "card"} key={tk.id}>
              <div className="card-top">
                <span className={priorityClass(tk.priority)}>{tk.priority}</span>
                <div className="card-actions">
                  {tk.due && <span className="due">{tk.due}</span>}
                  <button
                    className="icon-btn"
                    title={t.approve}
                    onClick={() => onToggleTask(tk.id)}
                  >
                    {tk.status === "done" ? "↺" : "✓"}
                  </button>
                  <button
                    className="icon-btn icon-danger"
                    title={t.del}
                    onClick={() => onDeleteTask(tk.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="card-title">{tk.title}</div>
            </div>
          ))}
        </Panel>

        <Panel title={t.calendar} count={events.length} empty={t.empty}>
          {events.map((e) => (
            <div className="card" key={e.id}>
              <div className="card-top">
                <span className="card-time">{e.start}</span>
                <button
                  className="icon-btn icon-danger"
                  title={t.del}
                  onClick={() => onDeleteEvent(e.id)}
                >
                  ✕
                </button>
              </div>
              <div className="card-title">{e.title}</div>
              {e.notes && <div className="card-notes">{e.notes}</div>}
            </div>
          ))}
        </Panel>

        <Panel title={t.drafts} count={drafts.length} empty={t.empty}>
          {drafts.map((d) => (
            <div className="card" key={d.id}>
              <div className="card-top">
                <span className="to">{d.to ?? t.noRecipient}</span>
                <div className="card-actions">
                  <button
                    className="icon-btn"
                    title={t.copy}
                    onClick={() => onCopyDraft(d.id, d.body, d.subject)}
                  >
                    {copiedId === d.id ? "✓" : "⧉"}
                  </button>
                  <button
                    className="icon-btn icon-danger"
                    title={t.del}
                    onClick={() => onDeleteDraft(d.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="card-title">{d.subject}</div>
              <div className="card-body">{d.body}</div>
              <div className="refine">
                <button
                  className="refine-btn"
                  onClick={() => setRefineKey(refineKey === `d${d.id}` ? null : `d${d.id}`)}
                  disabled={running}
                >
                  {t.refineBtn}
                </button>
                {refineKey === `d${d.id}` && (
                  <div className="refine-opts">
                    {t.refineOptions.map((opt) => (
                      <button key={opt} className="refine-opt" onClick={() => refineDraft(d, opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Panel>
      </section>
      )}

      {activeTab === "updates" && (
        updates.length > 0 ? (
        <section className="updates">
          <div className="updates-head">{t.iuPanel}</div>
          {updates.map((u) => (
            <div className="report" key={u.id}>
              <div className="report-head">
                <div className="report-period">📈 {u.period} <span className="ai-tag sm">{t.aiGenerated}</span></div>
                <div className="card-actions">
                  <button
                    className="icon-btn"
                    title={t.speak}
                    onClick={() =>
                      speak(
                        `u${u.id}`,
                        `${u.content.tldr}. ${u.content.metrics.map((m) => `${m.label} ${m.value}`).join(", ")}. ${u.content.highlights.join(". ")}`,
                      )
                    }
                  >
                    {speakingId === `u${u.id}` ? "⏹" : "🔊"}
                  </button>
                  <button
                    className="icon-btn"
                    title={t.copy}
                    onClick={() => onCopyUpdate(u)}
                  >
                    {copiedId === -u.id ? "✓" : "⧉"}
                  </button>
                  <button
                    className="icon-btn icon-danger"
                    title={t.del}
                    onClick={() => onDeleteUpdate(u.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {u.content.tldr && (
                <div className="report-block">
                  <div className="report-label">{t.iuTldr}</div>
                  <div className="report-tldr">{u.content.tldr}</div>
                </div>
              )}
              {u.content.metrics.length > 0 && (
                <div className="report-block">
                  <div className="report-label">{t.iuMetrics}</div>
                  <div className="metric-row">
                    {u.content.metrics.map((m, i) => (
                      <div className="metric" key={i}>
                        <div className="metric-value">{m.value}</div>
                        <div className="metric-label">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {u.content.highlights.length > 0 && (
                <ReportList label={t.iuHighlights} items={u.content.highlights} />
              )}
              {u.content.lowlights.length > 0 && (
                <ReportList label={t.iuLowlights} items={u.content.lowlights} />
              )}
              {u.content.asks.length > 0 && (
                <ReportList label={t.iuAsks} items={u.content.asks} />
              )}
              {u.content.next && (
                <div className="report-block">
                  <div className="report-label">{t.iuNext}</div>
                  <div className="report-tldr">{u.content.next}</div>
                </div>
              )}
              <div className="refine">
                <button
                  className="refine-btn"
                  onClick={() => setRefineKey(refineKey === `u${u.id}` ? null : `u${u.id}`)}
                  disabled={running}
                >
                  {t.refineBtn}
                </button>
                {refineKey === `u${u.id}` && (
                  <div className="refine-opts">
                    {t.refineOptions.map((opt) => (
                      <button key={opt} className="refine-opt" onClick={() => refineUpdate(u, opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
        ) : (
          <section className="updates">
            <div className="updates-head">{t.iuPanel}</div>
            <div className="tab-empty">{t.empty}</div>
          </section>
        )
      )}

      {activeTab === "grants" && (
        briefings.length > 0 ? (
        <section className="updates">
          <div className="updates-head">
            {t.anPanel}
            {info && (
              <span className={info.announcementsSource === "live" ? "src-badge src-live" : "src-badge"}>
                {info.announcementsSource === "live" ? t.sourceLive : t.sourceSeed}
              </span>
            )}
          </div>
          {briefings.map((b) => (
            <div className="report" key={b.id}>
              <div className="report-head">
                <div className="report-period">📰 {b.content.picks.length}</div>
                <div className="card-actions">
                  <button
                    className="icon-btn"
                    title={t.speak}
                    onClick={() =>
                      speak(
                        `b${b.id}`,
                        b.content.picks
                          .map((p) => `${p.title}, ${t.anDeadline} ${p.deadline}. ${p.fit_reason}`)
                          .join(". "),
                      )
                    }
                  >
                    {speakingId === `b${b.id}` ? "⏹" : "🔊"}
                  </button>
                  <button
                    className="icon-btn icon-danger"
                    title={t.del}
                    onClick={() => onDeleteBriefing(b.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="grant-list">
                {b.content.picks.map((p, i) => (
                  <div className="grant" key={i}>
                    <div className="grant-top">
                      <span className="grant-dday">{dday(p.deadline)}</span>
                      <span className="grant-deadline">
                        {t.anDeadline} {p.deadline}
                      </span>
                    </div>
                    <div className="grant-title">{p.title}</div>
                    <div className="grant-agency">{p.agency}</div>
                    <div className="grant-fit">
                      <b>{t.anFit}:</b> {p.fit_reason}
                    </div>
                    <div className="grant-actions">
                      <button
                        className="grant-btn"
                        onClick={() => onAddDeadlineTask({ title: p.title, deadline: p.deadline })}
                      >
                        {t.anAddTask}
                      </button>
                      {p.url && (
                        <button
                          className="grant-verify"
                          disabled={verifying === `${b.id}-${i}`}
                          onClick={() => onVerify(`${b.id}-${i}`, p.url, p.title)}
                        >
                          {verifying === `${b.id}-${i}` ? t.anVerifying : t.anVerify}
                        </button>
                      )}
                      {p.url && (
                        <a className="grant-link" href={p.url} target="_blank" rel="noreferrer">
                          {t.anLink} ↗
                        </a>
                      )}
                    </div>
                    {verifyResults[`${b.id}-${i}`] && (
                      <div
                        className={
                          verifyResults[`${b.id}-${i}`].ok ? "verify-box verify-ok" : "verify-box verify-fail"
                        }
                      >
                        <div className="verify-head">
                          {verifyResults[`${b.id}-${i}`].ok ? t.anVerifyOk : t.anVerifyFail}
                          {verifyResults[`${b.id}-${i}`].toolUsed && (
                            <span className="verify-tool">🌐 {t.anVerifyTool}</span>
                          )}
                        </div>
                        <div className="verify-body">
                          {verifyResults[`${b.id}-${i}`].ok
                            ? verifyResults[`${b.id}-${i}`].summary
                            : verifyResults[`${b.id}-${i}`].note}
                        </div>
                        {verifyResults[`${b.id}-${i}`].ok && verifyResults[`${b.id}-${i}`].deadline && (
                          <div className="verify-deadline">
                            {t.anDeadline}: {verifyResults[`${b.id}-${i}`].deadline}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        ) : (
          <section className="updates">
            <div className="updates-head">{t.anPanel}</div>
            <div className="tab-empty">{t.empty}</div>
          </section>
        )
      )}

      <footer className="footer">
        <div className="trust-note">🛡 {t.trustNote}</div>
        {info ? `${info.provider} · ${info.model} · ${info.embedModel}` : t.footer}
      </footer>
    </div>
  );
}

function Panel({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.some((c) => c);
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="badge">{count}</span>
      </div>
      <div className="panel-body">
        {hasItems ? children : <div className="empty">{empty}</div>}
      </div>
    </div>
  );
}

function ReportList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="report-block">
      <div className="report-label">{label}</div>
      <ul className="report-list">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function ProfileModal({
  t,
  profile,
  onClose,
  onSave,
}: {
  t: (typeof STRINGS)[Lang];
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile) => void;
}) {
  // Single-select: returns the chosen option, or "" plus an "other" text.
  function parseSingle(value: string, options: string[]) {
    if (options.includes(value)) return { sel: value, other: "" };
    return { sel: value ? t.otherLabel : "", other: value };
  }
  // Multi-select: split by comma, known -> chips, unknown -> other text.
  function parseMulti(value: string, options: string[]) {
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    const sel = parts.filter((p) => options.includes(p));
    const other = parts.filter((p) => !options.includes(p)).join(", ");
    return { sel, other };
  }

  const ind0 = parseSingle(profile.industry, t.industryOptions);
  const stg0 = parseSingle(profile.stage, t.stageOptions);
  const int0 = parseMulti(profile.interests, t.interestOptions);

  const [industry, setIndustry] = useState(ind0.sel);
  const [industryOther, setIndustryOther] = useState(ind0.other);
  const [stage, setStage] = useState(stg0.sel);
  const [stageOther, setStageOther] = useState(stg0.other);
  const [interests, setInterests] = useState<string[]>(int0.sel);
  const [interestsOther, setInterestsOther] = useState(int0.other);

  function toggleInterest(opt: string) {
    setInterests((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  }

  function save() {
    const industryVal = industry === t.otherLabel ? industryOther.trim() : industry;
    const stageVal = stage === t.otherLabel ? stageOther.trim() : stage;
    const interestVals = [
      ...interests,
      ...interestsOther.split(",").map((s) => s.trim()).filter(Boolean),
    ];
    onSave({
      industry: industryVal,
      stage: stageVal,
      interests: interestVals.join(", "),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t.profileTitle}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="field-label">{t.profileIndustry}</label>
        <div className="opt-row">
          {[...t.industryOptions, t.otherLabel].map((opt) => (
            <button
              key={opt}
              className={industry === opt ? "opt opt-on" : "opt"}
              onClick={() => setIndustry(industry === opt ? "" : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        {industry === t.otherLabel && (
          <input
            className="field"
            value={industryOther}
            onChange={(e) => setIndustryOther(e.target.value)}
            placeholder={t.otherPlaceholder}
          />
        )}

        <label className="field-label">{t.profileStage}</label>
        <div className="opt-row">
          {[...t.stageOptions, t.otherLabel].map((opt) => (
            <button
              key={opt}
              className={stage === opt ? "opt opt-on" : "opt"}
              onClick={() => setStage(stage === opt ? "" : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        {stage === t.otherLabel && (
          <input
            className="field"
            value={stageOther}
            onChange={(e) => setStageOther(e.target.value)}
            placeholder={t.otherPlaceholder}
          />
        )}

        <label className="field-label">{t.profileInterests}</label>
        <div className="opt-row">
          {t.interestOptions.map((opt) => (
            <button
              key={opt}
              className={interests.includes(opt) ? "opt opt-on" : "opt"}
              onClick={() => toggleInterest(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <input
          className="field"
          value={interestsOther}
          onChange={(e) => setInterestsOther(e.target.value)}
          placeholder={`${t.otherLabel} — ${t.otherPlaceholder}`}
        />

        <div className="modal-foot">
          <button className="approve" onClick={save}>
            {t.profileSave}
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideModal({
  t,
  onClose,
  onPick,
}: {
  t: (typeof STRINGS)[Lang];
  onClose: () => void;
  onPick: (cmd: string) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t.guide.title}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="modal-intro">{t.guide.intro}</p>

        <div className="persona">
          <div className="persona-avatar">👩‍💼</div>
          <div>
            <div className="persona-name">{t.guide.personaName}</div>
            <div className="persona-role">{t.guide.personaRole}</div>
            <div className="persona-pain">{t.guide.personaPain}</div>
          </div>
        </div>

        <div className="guide-section-title">{t.guide.whenTitle}</div>
        <div className="guide-scenarios">
          {t.scenarios.map((s, i) => (
            <button key={i} className="scenario-card" onClick={() => onPick(s.command)}>
              <span className="scenario-label">{s.label}</span>
              <span className="scenario-cmd">{s.command}</span>
            </button>
          ))}
        </div>
        <div className="guide-hint">{t.guide.tryHint}</div>

        <div className="guide-section-title">{t.guide.whyTitle}</div>
        <ul className="guide-why">
          {t.guide.why.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>

        <div className="guide-section-title">{t.guide.memoryTitle}</div>
        <div className="memory-guide">
          <p className="memory-desc">{t.guide.memoryDesc}</p>
          <button className="scenario-card step" onClick={() => onPick(t.guide.memoryStep1.command)}>
            <span className="scenario-label">{t.guide.memoryStep1.label}</span>
            <span className="scenario-cmd">{t.guide.memoryStep1.command}</span>
          </button>
          <button className="scenario-card step" onClick={() => onPick(t.guide.memoryStep2.command)}>
            <span className="scenario-label">{t.guide.memoryStep2.label}</span>
            <span className="scenario-cmd">{t.guide.memoryStep2.command}</span>
          </button>
          <div className="memory-note">{t.guide.memoryNote}</div>
        </div>

        <div className="modal-foot">
          <button className="approve" onClick={onClose}>
            {t.guide.close}
          </button>
        </div>
      </div>
    </div>
  );
}
