import { test } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity } from "./embeddings.js";
import { initDb } from "./db.js";
import { addMemory, searchMemories, countMemories } from "./memory.js";

test("cosineSimilarity is 1 for identical and ~0 for orthogonal vectors", () => {
  assert.ok(Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-9);
});

test("searchMemories ranks the most similar memory first", () => {
  const db = initDb(":memory:");
  addMemory(db, "task", "투자자 김대표 미팅 준비", [1, 0, 0]);
  addMemory(db, "task", "장보기 목록 작성", [0, 1, 0]);
  addMemory(db, "draft", "디자인 리뷰 메모", [0, 0, 1]);
  assert.equal(countMemories(db), 3);
  const hits = searchMemories(db, [0.9, 0.1, 0], 2, 0.1);
  assert.equal(hits[0].text, "투자자 김대표 미팅 준비");
  assert.ok(hits[0].score > hits[1].score);
});
