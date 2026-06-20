import { useEffect, useRef, useState } from "react";
import type { Plan, Task, EventRow, Draft, AgentEvent } from "./types";
import { STRINGS, actionLabel, type Lang } from "./i18n";
import {
  sendCommand,
  subscribe,
  approve,
  reject,
  getTasks,
  getEvents,
  getDrafts,
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const recognitionRef = useRef<any>(null);

  async function refresh() {
    const [t, e, d] = await Promise.all([getTasks(), getEvents(), getDrafts()]);
    setTasks(t);
    setEvents(e);
    setDrafts(d);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function run(cmd: string) {
    if (!cmd.trim() || running) return;
    setRunning(true);
    setStream("");
    setPlan(null);
    setError(null);
    setRunId(null);
    try {
      const id = await sendCommand(cmd);
      setRunId(id);
      const unsub = subscribe(id, (ev: AgentEvent) => {
        if (ev.type === "delta") setStream((s) => s + ev.data);
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
    const res = await approve(runId);
    if (res.tasks) {
      setTasks(res.tasks);
      setEvents(res.events);
      setDrafts(res.drafts);
    } else {
      await refresh();
    }
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
          <button className="lang" onClick={() => setShowGuide(true)}>
            ❔ {t.guideButton}
          </button>
          <button className="lang" onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
            {t.langButton}
          </button>
        </div>
      </header>

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

      {(running || stream || plan || error) && (
        <section className="activity">
          <div className="activity-head">
            <span className="dot" data-on={running} /> {t.activity}
          </div>
          {error && <div className="err">⚠ {error}</div>}
          {stream && <pre className="stream">{stream}</pre>}
          {plan && (
            <div className="plan">
              <div className="plan-summary">{plan.summary}</div>
              <ul className="plan-actions">
                {plan.actions.map((a, i) => (
                  <li key={i}>
                    <span className="atype">{actionLabel[lang][a.type] ?? a.type}</span>
                    <span className="adesc">
                      {a.type === "create_task" && (a.data as any).title}
                      {a.type === "schedule_event" &&
                        `${(a.data as any).title} — ${(a.data as any).start}`}
                      {a.type === "draft_email" &&
                        `${(a.data as any).subject} → ${(a.data as any).to ?? t.noRecipient}`}
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
            </div>
          )}
        </section>
      )}

      <section className="panels">
        <Panel title={t.tasks} count={tasks.length} empty={t.empty}>
          {tasks.map((tk) => (
            <div className="card" key={tk.id}>
              <div className="card-top">
                <span className={priorityClass(tk.priority)}>{tk.priority}</span>
                {tk.due && <span className="due">{tk.due}</span>}
              </div>
              <div className="card-title">{tk.title}</div>
            </div>
          ))}
        </Panel>

        <Panel title={t.calendar} count={events.length} empty={t.empty}>
          {events.map((e) => (
            <div className="card" key={e.id}>
              <div className="card-time">{e.start}</div>
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
              </div>
              <div className="card-title">{d.subject}</div>
              <div className="card-body">{d.body}</div>
            </div>
          ))}
        </Panel>
      </section>

      <footer className="footer">{t.footer}</footer>
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

        <div className="modal-foot">
          <button className="approve" onClick={onClose}>
            {t.guide.close}
          </button>
        </div>
      </div>
    </div>
  );
}
