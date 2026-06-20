import Database from "better-sqlite3";

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

export function initDb(path = "data.db") {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
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
