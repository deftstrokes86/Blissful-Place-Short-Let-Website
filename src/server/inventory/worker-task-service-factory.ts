import { createDatabaseId } from "../db/file-database";
import { fileInventoryOperationsRepository } from "./file-inventory-operations-repository";
import { WorkerTaskService } from "./worker-task-service";

let sharedWorkerTaskService: WorkerTaskService | null = null;

export function getSharedWorkerTaskService(): WorkerTaskService {
  if (sharedWorkerTaskService) {
    return sharedWorkerTaskService;
  }

  sharedWorkerTaskService = new WorkerTaskService({
    repository: fileInventoryOperationsRepository,
    createId: () => createDatabaseId("worker_task"),
  });

  return sharedWorkerTaskService;
}
