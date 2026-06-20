import { test } from "node:test";
import assert from "node:assert/strict";
import { initDb, addTask, listTasks, addEvent, listEvents, addDraft, listDrafts, setTaskStatus, deleteTask, deleteDraft } from "./db.js";

test("addTask then listTasks returns it", () => {
  const db = initDb(":memory:");
  const t = addTask(db, { title: "Email investor", priority: "high" });
  assert.equal(t.title, "Email investor");
  assert.equal(t.priority, "high");
  assert.equal(t.status, "open");
  const all = listTasks(db);
  assert.equal(all.length, 1);
  assert.equal(all[0].title, "Email investor");
});

test("addEvent then listEvents returns it ordered by start", () => {
  const db = initDb(":memory:");
  addEvent(db, { title: "Late", start: "2026-07-02T10:00:00" });
  addEvent(db, { title: "Early", start: "2026-07-01T10:00:00" });
  const all = listEvents(db);
  assert.equal(all.length, 2);
  assert.equal(all[0].title, "Early");
});

test("addDraft then listDrafts returns it", () => {
  const db = initDb(":memory:");
  const d = addDraft(db, { subject: "Hi", body: "Body", to: "jane@x.com" });
  assert.equal(d.subject, "Hi");
  assert.equal(d.to, "jane@x.com");
  assert.equal(listDrafts(db).length, 1);
});

test("setTaskStatus toggles status and deleteTask removes it", () => {
  const db = initDb(":memory:");
  const t = addTask(db, { title: "X" });
  assert.equal(t.status, "open");
  const done = setTaskStatus(db, t.id, "done");
  assert.equal(done?.status, "done");
  deleteTask(db, t.id);
  assert.equal(listTasks(db).length, 0);
});

test("deleteDraft removes a draft", () => {
  const db = initDb(":memory:");
  const d = addDraft(db, { subject: "S", body: "B" });
  deleteDraft(db, d.id);
  assert.equal(listDrafts(db).length, 0);
});
