import { createDatabaseId } from "../db/database-identifiers";
import { prismaInventoryOperationsRepository } from "./prisma-inventory-operations-repository";
import { WorkerTaskService } from "./worker-task-service";

let sharedWorkerTaskService: WorkerTaskService | null = null;

export function getSharedWorkerTaskService(): WorkerTaskService {
  if (sharedWorkerTaskService) {
    return sharedWorkerTaskService;
  }

  sharedWorkerTaskService = new WorkerTaskService({
    repository: prismaInventoryOperationsRepository,
    createId: () => createDatabaseId("worker_task"),
  });

  return sharedWorkerTaskService;
}

