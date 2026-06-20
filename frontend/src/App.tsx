import { useEffect, useRef, useState } from "react";
import type { Plan, Task, EventRow, Draft, AgentEvent } from "./types";
import {
  sendCommand,
  subscribe,
  approve,
  reject,
  getTasks,
  getEvents,
  getDrafts,
} from "./api";

const EXAMPLES = [
  "Schedule an investor meeting next Tuesday at 2pm and create a high-priority task to prepare the pitch deck.",
  "Draft a follow-up email to Jane about the demo and add a task to send it tomorrow.",
  "Plan my product launch: add 3 tasks and schedule a kickoff call Friday morning.",
];

function priorityClass(p: string) {
  if (p === "high") return "pill pill-high";
  if (p === "low") return "pill pill-low";
  return "pill pill-med";
}

export default function App() {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [stream, setStream] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

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
      setError("Voice input is not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
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
            <h1>AI Chief of Staff</h1>
            <p>
              Tell me a goal — I'll plan tasks, events &amp; email drafts on Azure OpenAI. You approve
              before anything is saved.
            </p>
          </div>
        </div>
      </header>

      <section className="command">
        <div className="command-row">
          <textarea
            value={text}
            placeholder="e.g. Schedule an investor meeting next Tuesday at 2pm and draft a follow-up email…"
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
              {listening ? "● Rec" : "🎤"}
            </button>
            <button className="run" disabled={running || !text.trim()} onClick={() => run(text)}>
              {running ? "Thinking…" : "Run ⌘↵"}
            </button>
          </div>
        </div>
        <div className="examples">
          {EXAMPLES.map((ex, i) => (
            <button key={i} className="chip" onClick={() => setText(ex)} disabled={running}>
              {ex.length > 48 ? ex.slice(0, 48) + "…" : ex}
            </button>
          ))}
        </div>
      </section>

      {(running || stream || plan || error) && (
        <section className="activity">
          <div className="activity-head">
            <span className="dot" data-on={running} /> Agent activity
          </div>
          {error && <div className="err">⚠ {error}</div>}
          {stream && <pre className="stream">{stream}</pre>}
          {plan && (
            <div className="plan">
              <div className="plan-summary">{plan.summary}</div>
              <ul className="plan-actions">
                {plan.actions.map((a, i) => (
                  <li key={i}>
                    <span className="atype">{a.type.replace("_", " ")}</span>
                    <span className="adesc">
                      {a.type === "create_task" && (a.data as any).title}
                      {a.type === "schedule_event" &&
                        `${(a.data as any).title} — ${(a.data as any).start}`}
                      {a.type === "draft_email" &&
                        `${(a.data as any).subject} → ${(a.data as any).to ?? "(no recipient)"}`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="plan-buttons">
                <button className="approve" onClick={onApprove}>
                  ✓ Approve &amp; apply
                </button>
                <button className="rejectbtn" onClick={onReject}>
                  ✕ Discard
                </button>
              </div>
              <div className="guard">🔒 Nothing is saved until you approve.</div>
            </div>
          )}
        </section>
      )}

      <section className="panels">
        <Panel title="Tasks" count={tasks.length}>
          {tasks.map((t) => (
            <div className="card" key={t.id}>
              <div className="card-top">
                <span className={priorityClass(t.priority)}>{t.priority}</span>
                {t.due && <span className="due">{t.due}</span>}
              </div>
              <div className="card-title">{t.title}</div>
            </div>
          ))}
          {!tasks.length && <Empty />}
        </Panel>

        <Panel title="Calendar" count={events.length}>
          {events.map((e) => (
            <div className="card" key={e.id}>
              <div className="card-time">{e.start}</div>
              <div className="card-title">{e.title}</div>
              {e.notes && <div className="card-notes">{e.notes}</div>}
            </div>
          ))}
          {!events.length && <Empty />}
        </Panel>

        <Panel title="Email Drafts" count={drafts.length}>
          {drafts.map((d) => (
            <div className="card" key={d.id}>
              <div className="card-top">
                <span className="to">{d.to ?? "(no recipient)"}</span>
              </div>
              <div className="card-title">{d.subject}</div>
              <div className="card-body">{d.body}</div>
            </div>
          ))}
          {!drafts.length && <Empty />}
        </Panel>
      </section>

      <footer className="footer">
        Powered by GitHub Copilot SDK · Azure OpenAI (gpt-4.1-mini) · deployed on Azure Container Apps
      </footer>
    </div>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="badge">{count}</span>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="empty">Nothing yet</div>;
}
