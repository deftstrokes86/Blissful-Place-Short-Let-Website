interface CreateTemplateDisabledInput {
  isSubmitting: boolean;
  name: string;
}

interface AddTemplateItemDisabledInput {
  isSubmitting: boolean;
  templateId: string;
  inventoryItemId: string;
  expectedQuantity: number;
}

interface UpdateTemplateItemQuantityDisabledInput {
  isSubmitting: boolean;
  templateItemId: string;
  expectedQuantity: number;
}

interface RemoveTemplateItemDisabledInput {
  isSubmitting: boolean;
  templateItemId: string;
}

interface ApplyTemplateDisabledInput {
  isSubmitting: boolean;
  templateId: string;
  flatId: string;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isCreateTemplateDisabled(input: CreateTemplateDisabledInput): boolean {
  if (input.isSubmitting) {
    return true;
  }

  return input.name.trim().length === 0;
}

export function isAddTemplateItemDisabled(input: AddTemplateItemDisabledInput): boolean {
  if (input.isSubmitting) {
    return true;
  }

  if (input.templateId.trim().length === 0 || input.inventoryItemId.trim().length === 0) {
    return true;
  }

  return !isPositiveInteger(input.expectedQuantity);
}

export function isUpdateTemplateItemQuantityDisabled(input: UpdateTemplateItemQuantityDisabledInput): boolean {
  if (input.isSubmitting) {
    return true;
  }

  if (input.templateItemId.trim().length === 0) {
    return true;
  }

  return !isPositiveInteger(input.expectedQuantity);
}

export function isRemoveTemplateItemDisabled(input: RemoveTemplateItemDisabledInput): boolean {
  if (input.isSubmitting) {
    return true;
  }

  return input.templateItemId.trim().length === 0;
}

export function isApplyTemplateDisabled(input: ApplyTemplateDisabledInput): boolean {
  if (input.isSubmitting) {
    return true;
  }

  return input.templateId.trim().length === 0 || input.flatId.trim().length === 0;
}
