import assert from "node:assert/strict";
import test from "node:test";
import { curveBetween, cubicPoint } from "./paint.ts";
import {
  CHAPTERS,
  DURATION,
  LANES,
  WINNER,
  chapterAt,
  frameAt,
  typed,
} from "./timeline.ts";

test("chapters cover the film in order", () => {
  assert.equal(chapterAt(0).id, "request");
  assert.equal(chapterAt(6.4).id, "request");
  assert.equal(chapterAt(8.2).id, "parallel");
  assert.equal(chapterAt(17).id, "select");
  assert.equal(chapterAt(26.2).id, "return");
  assert.equal(chapterAt(32.4).id, "composite");
  assert.equal(chapterAt(DURATION).id, "composite");
  assert.deepEqual(
    CHAPTERS.map((chapter) => chapter.id),
    ["request", "parallel", "select", "return", "composite"],
  );
});

test("request beat types one prompt and keeps lanes quiet", () => {
  const frame = frameAt(CHAPTERS[0].hero);
  assert.equal(frame.promptText, "Plan a safe rollback for a payments deploy.");
  assert.ok(frame.hubOpacity > 0.9);
  assert.ok(frame.beams.request > 0.8);
  for (const lane of frame.lanes) {
    assert.equal(lane.opacity, 0);
    assert.equal(lane.text, "");
  }
  assert.ok(frame.end < 0.01);
});

test("parallel beat finishes every stand-in answer", () => {
  const frame = frameAt(CHAPTERS[1].hero);
  assert.equal(frame.chapter.id, "parallel");
  frame.lanes.forEach((lane, index) => {
    assert.equal(lane.text, LANES[index].text);
    assert.ok(lane.opacity > 0.95);
    assert.equal(lane.dim, 0);
  });
  assert.ok(frame.bracket > 0.9);
  assert.ok(frame.beams.split > 0.9);
});

test("select beat keeps lane B and dims the rest", () => {
  const frame = frameAt(CHAPTERS[2].hero);
  const winner = frame.lanes.find((lane) => lane.id === "B");
  assert.ok(winner);
  assert.equal(winner.score, 92);
  assert.ok(winner.lock > 0.95);
  assert.equal(winner.dim, 0);
  assert.ok(winner.criteria.every((criterion) => criterion.on && criterion.shown > 0.9));
  for (const lane of frame.lanes) {
    if (lane.id === "B") continue;
    assert.ok(lane.dim > 0.9);
    assert.equal(lane.lock, 0);
    assert.ok(lane.score < winner.score);
  }
});

test("return beat sends only the winning answer back", () => {
  const frame = frameAt(CHAPTERS[3].hero);
  assert.equal(frame.responseText, WINNER.text);
  assert.ok(frame.responseLive > 0.95);
  assert.ok(frame.beams.ret > 0.9);
  assert.equal(frame.responseText.includes("Freeze traffic"), true);
});

test("end card is fully present before the clock stops", () => {
  const frame = frameAt(CHAPTERS[4].hero);
  assert.ok(frame.end > 0.95);
  assert.ok(frame.boardOpacity < 0.2);
  assert.ok(frame.captionOpacity < 0.05);
  assert.equal(frame.chapter.caption, "A composite, not a router.");
});

test("typed text is a stable prefix", () => {
  assert.equal(typed("abcd", 0), "");
  assert.equal(typed("abcd", 0.5), "ab");
  assert.equal(typed("abcd", 1), "abcd");
});

test("curves leave one anchor and arrive at the next", () => {
  const curve = curveBetween(
    { cx: 10, cy: 10, left: 0, right: 20, top: 0, bottom: 20 },
    { cx: 110, cy: 10, left: 100, right: 120, top: 0, bottom: 20 },
  );
  assert.ok(curve);
  assert.deepEqual(cubicPoint(curve, 0), curve.from);
  const end = cubicPoint(curve, 1);
  assert.ok(Math.abs(end.x - curve.to.x) < 0.001);
  assert.ok(Math.abs(end.y - curve.to.y) < 0.001);
  assert.equal(curve.from.x, 20);
  assert.equal(curve.to.x, 100);
});
