import { test } from "node:test";
import assert from "node:assert/strict";
import { getAnnouncements } from "./announcements.js";

test("getAnnouncements falls back to a non-empty seed", async () => {
  const { source, items } = await getAnnouncements();
  assert.ok(items.length >= 3);
  assert.ok(["live", "seed"].includes(source));
  assert.ok(items.every((a) => a.title && a.deadline && a.url));
});
