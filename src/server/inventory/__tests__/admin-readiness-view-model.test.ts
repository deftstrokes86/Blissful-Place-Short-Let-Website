import assert from "node:assert/strict";

import {
  isCreateIssueDisabled,
  isUpdateIssueDisabled,
} from "../../../components/admin/readiness/admin-readiness-view-model";

async function testCreateIssueFormFlowGuardrails(): Promise<void> {
  assert.equal(
    isCreateIssueDisabled({
      isSubmitting: false,
      flatId: "mayfair",
      title: "Leak in bathroom",
      severity: "important",
    }),
    false
  );

  assert.equal(
    isCreateIssueDisabled({
      isSubmitting: false,
      flatId: "",
      title: "Leak in bathroom",
      severity: "important",
    }),
    true
  );

  assert.equal(
    isCreateIssueDisabled({
      isSubmitting: true,
      flatId: "mayfair",
      title: "Leak in bathroom",
      severity: "important",
    }),
    true
  );
}

async function testUpdateIssueFormFlowGuardrails(): Promise<void> {
  assert.equal(
    isUpdateIssueDisabled({
      isSubmitting: false,
      issueId: "issue_1",
      status: "resolved",
    }),
    false
  );

  assert.equal(
    isUpdateIssueDisabled({
      isSubmitting: false,
      issueId: "",
      status: "resolved",
    }),
    true
  );

  assert.equal(
    isUpdateIssueDisabled({
      isSubmitting: true,
      issueId: "issue_1",
      status: "resolved",
    }),
    true
  );
}

async function run(): Promise<void> {
  await testCreateIssueFormFlowGuardrails();
  await testUpdateIssueFormFlowGuardrails();

  console.log("admin-readiness-view-model: ok");
}

void run();
