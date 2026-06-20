import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Task = {
  id: number;
  title: string;
  priority: string;
  status: string;
  due: string | null;
  created_at: string;
};
export type EventRow = {
  id: number;
  title: string;
  start: string;
  end: string | null;
  notes: string | null;
  created_at: string;
};
export type Draft = {
  id: number;
  subject: string;
  body: string;
  to: string | null;
  created_at: string;
};
export type UpdateContent = {
  tldr: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
  lowlights: string[];
  asks: string[];
  next: string;
};
export type InvestorUpdate = {
  id: number;
  period: string;
  content: UpdateContent;
  created_at: string;
};
export type Profile = { industry: string; stage: string; interests: string };
export type BriefingPick = {
  title: string;
  agency: string;
  deadline: string;
  fit_reason: string;
  url: string;
};
export type Briefing = {
  id: number;
  content: { picks: BriefingPick[] };
  created_at: string;
};

export function initDb(path = "data.db") {
  if (path !== ":memory:") {
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      /* dir may already exist */
    }
  }
  const db = new Database(path);
  // On Azure Files (SMB), WAL needs shared memory which SMB doesn't support.
  // We run a single replica (no concurrent writers), so a journal mode that
  // works over network shares is the safe choice. Allow override via env.
  const journal = process.env.SQLITE_JOURNAL_MODE ?? (path.startsWith("/data") ? "DELETE" : "WAL");
  db.pragma(`journal_mode = ${journal}`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks(
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      due TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS drafts(
      id INTEGER PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      "to" TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS memories(
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL,
      text TEXT NOT NULL,
      vector TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS updates(
      id INTEGER PRIMARY KEY,
      period TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS profile(
      id INTEGER PRIMARY KEY CHECK (id = 1),
      industry TEXT DEFAULT '',
      stage TEXT DEFAULT '',
      interests TEXT DEFAULT ''
    );
    INSERT OR IGNORE INTO profile(id, industry, stage, interests) VALUES (1, '', '', '');
    CREATE TABLE IF NOT EXISTS briefings(
      id INTEGER PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function addTask(
  db: Database.Database,
  i: { title: string; priority?: string; due?: string },
): Task {
  const r = db
    .prepare(`INSERT INTO tasks(title,priority,due) VALUES(?,?,?)`)
    .run(i.title, i.priority ?? "medium", i.due ?? null);
  return db.prepare(`SELECT * FROM tasks WHERE id=?`).get(r.lastInsertRowid) as Task;
}

export function listTasks(db: Database.Database): Task[] {
  return db.prepare(`SELECT * FROM tasks ORDER BY id DESC`).all() as Task[];
}

export function addEvent(
  db: Database.Database,
  i: { title: string; start: string; end?: string; notes?: string },
): EventRow {
  const r = db
    .prepare(`INSERT INTO events(title,start,end,notes) VALUES(?,?,?,?)`)
    .run(i.title, i.start, i.end ?? null, i.notes ?? null);
  return db.prepare(`SELECT * FROM events WHERE id=?`).get(r.lastInsertRowid) as EventRow;
}

export function listEvents(db: Database.Database): EventRow[] {
  return db.prepare(`SELECT * FROM events ORDER BY start ASC`).all() as EventRow[];
}

export function addDraft(
  db: Database.Database,
  i: { subject: string; body: string; to?: string },
): Draft {
  const r = db
    .prepare(`INSERT INTO drafts(subject,body,"to") VALUES(?,?,?)`)
    .run(i.subject, i.body, i.to ?? null);
  return db.prepare(`SELECT * FROM drafts WHERE id=?`).get(r.lastInsertRowid) as Draft;
}

export function listDrafts(db: Database.Database): Draft[] {
  return db.prepare(`SELECT * FROM drafts ORDER BY id DESC`).all() as Draft[];
}

export function setTaskStatus(
  db: Database.Database,
  id: number,
  status: string,
): Task | undefined {
  db.prepare(`UPDATE tasks SET status=? WHERE id=?`).run(status, id);
  return db.prepare(`SELECT * FROM tasks WHERE id=?`).get(id) as Task | undefined;
}

export function deleteTask(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM tasks WHERE id=?`).run(id);
}

export function deleteEvent(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM events WHERE id=?`).run(id);
}

export function deleteDraft(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM drafts WHERE id=?`).run(id);
}

function normalizeContent(c: Partial<UpdateContent> | undefined): UpdateContent {
  return {
    tldr: c?.tldr ?? "",
    highlights: Array.isArray(c?.highlights) ? c!.highlights : [],
    metrics: Array.isArray(c?.metrics) ? c!.metrics : [],
    lowlights: Array.isArray(c?.lowlights) ? c!.lowlights : [],
    asks: Array.isArray(c?.asks) ? c!.asks : [],
    next: c?.next ?? "",
  };
}

export function addUpdate(
  db: Database.Database,
  period: string,
  content: Partial<UpdateContent>,
): InvestorUpdate {
  const normalized = normalizeContent(content);
  const r = db
    .prepare(`INSERT INTO updates(period, content) VALUES(?,?)`)
    .run(period || "", JSON.stringify(normalized));
  return rowToUpdate(
    db.prepare(`SELECT * FROM updates WHERE id=?`).get(r.lastInsertRowid) as any,
  );
}

function rowToUpdate(row: { id: number; period: string; content: string; created_at: string }): InvestorUpdate {
  let parsed: Partial<UpdateContent> = {};
  try {
    parsed = JSON.parse(row.content);
  } catch {
    /* keep defaults */
  }
  return {
    id: row.id,
    period: row.period,
    content: normalizeContent(parsed),
    created_at: row.created_at,
  };
}

export function listUpdates(db: Database.Database): InvestorUpdate[] {
  const rows = db.prepare(`SELECT * FROM updates ORDER BY id DESC`).all() as any[];
  return rows.map(rowToUpdate);
}

export function deleteUpdate(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM updates WHERE id=?`).run(id);
}

export function getProfile(db: Database.Database): Profile {
  const row = db.prepare(`SELECT industry, stage, interests FROM profile WHERE id=1`).get() as
    | Profile
    | undefined;
  return row ?? { industry: "", stage: "", interests: "" };
}

export function setProfile(db: Database.Database, p: Profile): Profile {
  db.prepare(`UPDATE profile SET industry=?, stage=?, interests=? WHERE id=1`).run(
    p.industry ?? "",
    p.stage ?? "",
    p.interests ?? "",
  );
  return getProfile(db);
}

export function addBriefing(
  db: Database.Database,
  picks: BriefingPick[],
): Briefing {
  const content = { picks: Array.isArray(picks) ? picks : [] };
  const r = db.prepare(`INSERT INTO briefings(content) VALUES(?)`).run(JSON.stringify(content));
  return rowToBriefing(db.prepare(`SELECT * FROM briefings WHERE id=?`).get(r.lastInsertRowid) as any);
}

function rowToBriefing(row: { id: number; content: string; created_at: string }): Briefing {
  let picks: BriefingPick[] = [];
  try {
    const parsed = JSON.parse(row.content);
    if (Array.isArray(parsed?.picks)) picks = parsed.picks;
  } catch {
    /* keep empty */
  }
  return { id: row.id, content: { picks }, created_at: row.created_at };
}

export function listBriefings(db: Database.Database): Briefing[] {
  const rows = db.prepare(`SELECT * FROM briefings ORDER BY id DESC`).all() as any[];
  return rows.map(rowToBriefing);
}

export function deleteBriefing(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM briefings WHERE id=?`).run(id);
}
