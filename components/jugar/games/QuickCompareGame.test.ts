import { describe, expect, it } from "vitest";
import { BOX_COUNT, DOT_RADIUS, JITTER, PADDING, TIERS, dotPositions, generateTrial } from "./QuickCompareGame";

const VIEWBOX_SIZE = 100;

describe("PADDING", () => {
  it("stays well clear of the minimum needed to avoid clipping (radius + jitter)", () => {
    expect(PADDING).toBeGreaterThan(DOT_RADIUS + JITTER);
  });
});

describe("dotPositions", () => {
  it("returns exactly `count` positions for a range of counts", () => {
    for (const count of [1, 4, 7, 13, 18]) {
      expect(dotPositions(count)).toHaveLength(count);
    }
  });

  it("never places a dot close enough to the viewBox edge to clip", () => {
    for (const count of [1, 4, 7, 13, 18]) {
      for (const { x, y } of dotPositions(count)) {
        expect(x - DOT_RADIUS).toBeGreaterThanOrEqual(0);
        expect(y - DOT_RADIUS).toBeGreaterThanOrEqual(0);
        expect(x + DOT_RADIUS).toBeLessThanOrEqual(VIEWBOX_SIZE);
        expect(y + DOT_RADIUS).toBeLessThanOrEqual(VIEWBOX_SIZE);
      }
    }
  });

  it("never overlaps two dots in the same box, across repeated random draws", () => {
    const minSeparation = DOT_RADIUS * 2;
    for (let trial = 0; trial < 50; trial++) {
      for (const count of [4, 10, 18]) {
        const dots = dotPositions(count);
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            expect(distance).toBeGreaterThanOrEqual(minSeparation);
          }
        }
      }
    }
  });
});

describe("generateTrial", () => {
  it("always renders exactly BOX_COUNT boxes", () => {
    const trial = generateTrial(0);
    expect(trial.boxes).toHaveLength(BOX_COUNT);
  });

  it("correctIndex always points to the box with the strictly highest dot count, across repeated draws", () => {
    for (let trial = 0; trial < 100; trial++) {
      for (let level = 0; level < 20; level++) {
        const result = generateTrial(level);
        const counts = result.boxes.map((box) => box.length);
        const maxCount = Math.max(...counts);
        expect(counts[result.correctIndex]).toBe(maxCount);
        const rivalCounts = counts.filter((_, i) => i !== result.correctIndex);
        for (const rival of rivalCounts) {
          expect(rival).toBeLessThan(maxCount);
        }
      }
    }
  });

  it("clamps difficulty to the last tier for levels beyond the tier table", () => {
    const highLevelTrial = generateTrial(999);
    const lastTier = TIERS[TIERS.length - 1];
    const winnerCount = highLevelTrial.boxes[highLevelTrial.correctIndex].length;
    const maxPossibleWinner = Math.round(lastTier.baseRange[1] * lastTier.ratio) + 1;
    expect(winnerCount).toBeLessThanOrEqual(maxPossibleWinner);
  });
});
