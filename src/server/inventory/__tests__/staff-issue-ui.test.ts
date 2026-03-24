import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { StaffIssueSnapshotView } from "../../../components/staff/StaffIssueSnapshotView";

async function testIssueFormRendersWorkerFriendlyFields(): Promise<void> {
  const html = renderToStaticMarkup(
    StaffIssueSnapshotView({
      flats: [
        { id: "mayfair", name: "Mayfair Suite" },
        { id: "windsor", name: "Windsor Loft" },
      ],
      form: {
        flatId: "mayfair",
        issueType: "supplies_missing",
        severity: "important",
        note: "Toilet paper is missing",
      },
      isSubmitting: false,
      onFormChange: () => undefined,
      onSubmit: async () => undefined,
    })
  );

  assert.ok(html.includes("Choose Flat"));
  assert.ok(html.includes("Issue Type"));
  assert.ok(html.includes("Severity"));
  assert.ok(html.includes("Short Note"));
  assert.ok(html.includes("Submit Issue"));
  assert.ok(html.includes("Supplies Missing"));
}

async function run(): Promise<void> {
  await testIssueFormRendersWorkerFriendlyFields();

  console.log("staff-issue-ui: ok");
}

void run();
