import assert from "node:assert/strict";

import {
  handleCreateResumableDraftRequest,
  handleLoadResumableDraftRequest,
  handleSaveResumableDraftRequest,
  type ResumableDraftHttpInterface,
} from "../resumable-draft-http";
import type { ResumableDraftSession } from "../resumable-draft-service";

class StubResumableDraftService implements ResumableDraftHttpInterface {
  createCalls = 0;
  saveCalls = 0;
  loadCalls = 0;

  lastCreateInput: unknown = null;
  lastSaveInput: { token: string; input: unknown } | null = null;
  lastLoadToken: string | null = null;

  async createResumableDraft(input: unknown): Promise<ResumableDraftSession> {
    this.createCalls += 1;
    this.lastCreateInput = input;

    return createSession("token_create", "draft");
  }

  async updateResumableDraft(token: string, input: unknown): Promise<ResumableDraftSession> {
    this.saveCalls += 1;
    this.lastSaveInput = { token, input };

    return createSession(token, "draft");
  }

  async loadResumableDraft(token: string): Promise<ResumableDraftSession> {
    this.loadCalls += 1;
    this.lastLoadToken = token;

    return createSession(token, "draft");
  }
}

function createSession(token: string, status: "draft"): ResumableDraftSession {
  return {
    resumeToken: token,
    reservation: {
      id: "res_1",
      token,
      status,
      paymentMethod: "transfer",
      stay: {
        flatId: "mayfair",
        checkIn: "2026-10-10",
        checkOut: "2026-10-13",
        guests: 2,
        extraIds: ["airport"],
      },
      guest: {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        phone: "+23400000000",
        specialRequests: "Quiet floor",
      },
      pricing: {
        currency: "NGN",
        nightlyRate: 250000,
        nights: 3,
        staySubtotal: 750000,
        extrasSubtotal: 65000,
        estimatedTotal: 815000,
      },
      progressContext: {
        currentStep: 3,
        activeBranch: "transfer",
      },
      transferHoldStartedAt: null,
      transferHoldExpiresAt: null,
      inventoryReopenedAt: null,
      lastAvailabilityResult: null,
      confirmedAt: null,
      cancelledAt: null,
      createdAt: "2026-10-01T09:00:00.000Z",
      updatedAt: "2026-10-01T09:10:00.000Z",
      lastTouchedAt: "2026-10-01T09:10:00.000Z",
    },
    branchContext: {
      resolvedPaymentMethod: "transfer",
      resumeStepIndex: 2,
      savedProgressStep: 3,
      stepLabels: [
        "Stay Details",
        "Guest Details",
        "Payment Method",
        "Review Reservation",
        "Transfer Details",
        "Awaiting Payment Confirmation",
      ],
      stayReady: true,
      guestReady: true,
    },
    availabilityRevalidationNeeds: {
      createBranchRequest: true,
      onlinePaymentHandoff: false,
      transferConfirmation: false,
      posConfirmation: false,
      requiredCheckpoints: ["pre_hold_request"],
    },
  };
}

async function testCreateDraftHandlerDelegates(): Promise<void> {
  const service = new StubResumableDraftService();

  const result = await handleCreateResumableDraftRequest(service, {
    stay: {
      flatId: "mayfair",
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
      guests: 2,
      extraIds: ["airport"],
    },
    guest: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+23400000000",
      specialRequests: "",
    },
    paymentMethod: "transfer",
    progressContext: {
      currentStep: 3,
      activeBranch: "transfer",
    },
  });

  assert.equal(service.createCalls, 1);
  assert.equal(result.resumeToken, "token_create");
}

async function testSaveDraftHandlerDelegates(): Promise<void> {
  const service = new StubResumableDraftService();

  const result = await handleSaveResumableDraftRequest(service, {
    token: " token_save ",
    body: {
      guest: {
        firstName: "Grace",
      },
      progressContext: {
        currentStep: 2,
        activeBranch: "transfer",
      },
    },
  });

  assert.equal(service.saveCalls, 1);
  assert.equal(service.lastSaveInput?.token, "token_save");
  assert.equal(result.resumeToken, "token_save");
}

async function testResumeDraftHandlerDelegates(): Promise<void> {
  const service = new StubResumableDraftService();

  const result = await handleLoadResumableDraftRequest(service, {
    token: " token_resume ",
  });

  assert.equal(service.loadCalls, 1);
  assert.equal(service.lastLoadToken, "token_resume");
  assert.equal(result.resumeToken, "token_resume");
}

async function testInvalidTokenHandling(): Promise<void> {
  const service = new StubResumableDraftService();

  await assert.rejects(
    async () => {
      await handleLoadResumableDraftRequest(service, {
        token: "   ",
      });
    },
    /Reservation token is required/
  );

  await assert.rejects(
    async () => {
      await handleSaveResumableDraftRequest(service, {
        token: null,
        body: {
          paymentMethod: "website",
        },
      });
    },
    /Reservation token is required/
  );

  await assert.rejects(
    async () => {
      await handleLoadResumableDraftRequest(service, {
        token: "bad token with spaces",
      });
    },
    /Invalid reservation token format/
  );
}

async function testInvalidPayloadRejection(): Promise<void> {
  const service = new StubResumableDraftService();

  await assert.rejects(
    async () => {
      await handleCreateResumableDraftRequest(service, {
        paymentMethod: "invalid-method",
      });
    },
    /Invalid payment method/
  );

  await assert.rejects(
    async () => {
      await handleSaveResumableDraftRequest(service, {
        token: "token_1",
        body: {
          progressContext: {
            currentStep: 99,
          },
        },
      });
    },
    /Invalid progressContext.currentStep/
  );
}

async function run(): Promise<void> {
  await testCreateDraftHandlerDelegates();
  await testSaveDraftHandlerDelegates();
  await testResumeDraftHandlerDelegates();
  await testInvalidTokenHandling();
  await testInvalidPayloadRejection();

  console.log("resumable-draft-http: ok");
}

void run();


