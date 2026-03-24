import assert from "node:assert/strict";

import {
  isAddTemplateItemDisabled,
  isApplyTemplateDisabled,
  isCreateTemplateDisabled,
  isRemoveTemplateItemDisabled,
  isUpdateTemplateItemQuantityDisabled,
} from "../../../components/admin/inventory/templates/admin-template-editor-view-model";

async function testTemplateCreateGuardrails(): Promise<void> {
  assert.equal(
    isCreateTemplateDisabled({
      isSubmitting: false,
      name: "Executive Standard",
    }),
    false
  );

  assert.equal(
    isCreateTemplateDisabled({
      isSubmitting: false,
      name: "",
    }),
    true
  );
}

async function testTemplateItemAddAndEditGuardrails(): Promise<void> {
  assert.equal(
    isAddTemplateItemDisabled({
      isSubmitting: false,
      templateId: "template_1",
      inventoryItemId: "item_tv",
      expectedQuantity: 2,
    }),
    false
  );

  assert.equal(
    isAddTemplateItemDisabled({
      isSubmitting: false,
      templateId: "template_1",
      inventoryItemId: "item_tv",
      expectedQuantity: 0,
    }),
    true
  );

  assert.equal(
    isUpdateTemplateItemQuantityDisabled({
      isSubmitting: false,
      templateItemId: "template_item_1",
      expectedQuantity: 3,
    }),
    false
  );

  assert.equal(
    isUpdateTemplateItemQuantityDisabled({
      isSubmitting: false,
      templateItemId: "template_item_1",
      expectedQuantity: -1,
    }),
    true
  );
}

async function testTemplateItemRemoveAndApplyGuardrails(): Promise<void> {
  assert.equal(
    isRemoveTemplateItemDisabled({
      isSubmitting: false,
      templateItemId: "template_item_1",
    }),
    false
  );

  assert.equal(
    isRemoveTemplateItemDisabled({
      isSubmitting: false,
      templateItemId: "",
    }),
    true
  );

  assert.equal(
    isApplyTemplateDisabled({
      isSubmitting: false,
      templateId: "template_1",
      flatId: "mayfair",
    }),
    false
  );

  assert.equal(
    isApplyTemplateDisabled({
      isSubmitting: false,
      templateId: "template_1",
      flatId: "",
    }),
    true
  );
}

async function run(): Promise<void> {
  await testTemplateCreateGuardrails();
  await testTemplateItemAddAndEditGuardrails();
  await testTemplateItemRemoveAndApplyGuardrails();

  console.log("admin-template-editor-view-model: ok");
}

void run();
