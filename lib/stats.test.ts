import { describe, expect, it } from "vitest";
import { computeStats, todayInSaoPaulo, weekStart } from "./stats";

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-11-11")).toBe("2026-11-09"); // Wednesday → Monday
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday stays
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday → previous Monday
  });
});

describe("todayInSaoPaulo", () => {
  it("uses the São Paulo date, not UTC", () => {
    // 01:30 UTC on Nov 12 is still 22:30 on Nov 11 in São Paulo
    expect(todayInSaoPaulo(new Date("2026-11-12T01:30:00Z"))).toBe("2026-11-11");
  });
});

describe("computeStats", () => {
  it("handles a user with no data (empty state) without NaN", () => {
    const s = computeStats([], [], "2026-11-11");
    expect(s.total).toBe(0);
    expect(s.interviewRate).toBeNull();
    expect(s.perWeek).toHaveLength(12);
    expect(s.perWeek.every((w) => w.count === 0)).toBe(true);
  });

  it("counts KPIs, statuses, weeks and overdue tasks", () => {
    const s = computeStats(
      [
        { status: "applied", application_date: "2026-11-10" },
        { status: "interviewing", application_date: "2026-11-03" },
        { status: "offered", application_date: "2026-11-03" },
        { status: "rejected", application_date: "2026-01-01" }, // outside the 12 weeks
      ],
      [
        { done: false, due_date: "2026-11-01" }, // overdue
        { done: false, due_date: "2026-11-20" },
        { done: false, due_date: null },
        { done: true, due_date: "2026-10-01" }, // done: never overdue
      ],
      "2026-11-11",
    );
    expect(s.total).toBe(4);
    expect(s.active).toBe(2);
    expect(s.offers).toBe(1);
    expect(s.interviewRate).toBe(0.5);
    expect(s.byStatus.find((b) => b.status === "rejected")?.count).toBe(1);
    expect(s.perWeek.at(-1)).toEqual({ weekStart: "2026-11-09", count: 1 });
    expect(s.perWeek.at(-2)).toEqual({ weekStart: "2026-11-02", count: 2 });
    expect(s.openTasks).toBe(3);
    expect(s.overdueTasks).toBe(1);
    expect(s.doneTasks).toBe(1);
  });
});
