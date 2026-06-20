import type Database from "better-sqlite3";
import { cosineSimilarity } from "./embeddings.js";

export type Memory = {
  id: number;
  kind: string;
  text: string;
  created_at: string;
};

export type RecalledMemory = Memory & { score: number };

export function addMemory(
  db: Database.Database,
  kind: string,
  text: string,
  vector: number[],
): Memory {
  const r = db
    .prepare(`INSERT INTO memories(kind, text, vector) VALUES(?,?,?)`)
    .run(kind, text, JSON.stringify(vector));
  return db.prepare(`SELECT id, kind, text, created_at FROM memories WHERE id=?`).get(
    r.lastInsertRowid,
  ) as Memory;
}

export function countMemories(db: Database.Database): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM memories`).get() as { n: number };
  return row.n;
}

/**
 * Return the top-k memories most semantically similar to `queryVector`,
 * filtered by a minimum similarity so we only surface genuinely relevant ones.
 */
export function searchMemories(
  db: Database.Database,
  queryVector: number[],
  k = 3,
  minScore = 0.3,
): RecalledMemory[] {
  const rows = db
    .prepare(`SELECT id, kind, text, vector, created_at FROM memories`)
    .all() as Array<Memory & { vector: string }>;
  const scored: RecalledMemory[] = [];
  for (const row of rows) {
    let vec: number[];
    try {
      vec = JSON.parse(row.vector);
    } catch {
      continue;
    }
    const score = cosineSimilarity(queryVector, vec);
    if (score >= minScore) {
      scored.push({ id: row.id, kind: row.kind, text: row.text, created_at: row.created_at, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
