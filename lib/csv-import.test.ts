// Tests written BEFORE the code (TDD). They are the specification.
// Statuses below are the ones of THIS app (see lib/types.ts and the
// check constraint in supabase/migrations/001_initial_schema.sql).
import { describe, expect, it } from "vitest";
import { isDuplicate, parseCSVRow, validateRow } from "./csv-import";

const goodRow = {
  company: "Nubank",
  position: "Product Manager",
  status: "applied",
  application_date: "2026-09-15",
  notes: null,
};

describe("parseCSVRow", () => {
  it("turns a CSV row into an application object", () => {
    expect(
      parseCSVRow({
        company: "iFood",
        position: "APM",
        status: "interviewing",
        application_date: "2026-08-25",
        notes: "Case interview, next week",
      }),
    ).toEqual({
      company: "iFood",
      position: "APM",
      status: "interviewing",
      application_date: "2026-08-25",
      notes: "Case interview, next week",
    });
  });

  it("trims spaces and lowercases the status", () => {
    expect(
      parseCSVRow({
        company: "  Stone ",
        position: " Product Owner",
        status: " Interviewing ",
        application_date: " 2026-09-01 ",
        notes: "  ",
      }),
    ).toEqual({
      company: "Stone",
      position: "Product Owner",
      status: "interviewing",
      application_date: "2026-09-01",
      notes: null,
    });
  });

  it("accepts headers with different case or spaces", () => {
    const row = parseCSVRow({
      " Company": "Loft",
      POSITION: "PM",
      Status: "applied",
      "Application_Date ": "2026-10-14",
    });
    expect(row.company).toBe("Loft");
    expect(row.position).toBe("PM");
    expect(row.application_date).toBe("2026-10-14");
  });

  it("uses empty strings for missing columns and null for missing notes", () => {
    expect(parseCSVRow({ company: "VTEX" })).toEqual({
      company: "VTEX",
      position: "",
      status: "",
      application_date: "",
      notes: null,
    });
  });
});

describe("validateRow", () => {
  it("returns no errors for a valid row", () => {
    expect(validateRow(goodRow)).toEqual([]);
  });

  it("returns an error when company is missing", () => {
    expect(validateRow({ ...goodRow, company: "" })).toContain("Missing company");
  });

  it("returns an error when position is missing", () => {
    expect(validateRow({ ...goodRow, position: "" })).toContain("Missing position");
  });

  it("returns an error when the status is not one of the app's statuses", () => {
    const errors = validateRow({ ...goodRow, status: "offer" });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Invalid status "offer"/);
  });

  it("returns an error when the status is empty", () => {
    expect(validateRow({ ...goodRow, status: "" })[0]).toMatch(/Invalid status/);
  });

  it("accepts every status of the app", () => {
    for (const status of ["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"]) {
      expect(validateRow({ ...goodRow, status })).toEqual([]);
    }
  });

  it.each([
    ["15/09/2026", "Brazilian format"],
    ["2026-02-30", "day that does not exist"],
    ["2026-13-01", "month 13"],
    ["", "empty"],
    ["yesterday", "not a date"],
  ])('returns an error for the date "%s" (%s)', (application_date) => {
    expect(validateRow({ ...goodRow, application_date })[0]).toMatch(/Invalid date/);
  });

  it("returns all errors of a row at once", () => {
    expect(
      validateRow({ company: "", position: "", status: "x", application_date: "", notes: null }),
    ).toHaveLength(4);
  });
});

describe("isDuplicate", () => {
  const existing = [
    { company: "Nubank", position: "Product Manager", application_date: "2026-09-15" },
    { company: "iFood", position: "APM", application_date: "2026-08-25" },
  ];

  it("is true when company + position + date match an existing record", () => {
    expect(isDuplicate(goodRow, existing)).toBe(true);
  });

  it("is false when the date is different", () => {
    expect(isDuplicate({ ...goodRow, application_date: "2026-09-16" }, existing)).toBe(false);
  });

  it("is false when the position is different", () => {
    expect(isDuplicate({ ...goodRow, position: "Senior PM" }, existing)).toBe(false);
  });

  it("is false when there are no existing records", () => {
    expect(isDuplicate(goodRow, [])).toBe(false);
  });

  // Product decision (ours): "Le Wagon" and "le wagon " are the same company.
  it("ignores upper/lower case and extra spaces", () => {
    expect(
      isDuplicate({ ...goodRow, company: " nubank ", position: "product  manager" }, existing),
    ).toBe(true);
  });
});
