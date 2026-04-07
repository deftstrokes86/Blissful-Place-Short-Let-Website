"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  fetchInventoryWorkerTasks,
  submitUpdateInventoryWorkerTaskStatus,
  type AdminWorkerTask,
} from "@/lib/admin-inventory-api";
import { StaffTasksSnapshotView } from "@/components/staff/StaffTasksSnapshotView";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load worker tasks.";
}

export function StaffTasksPanel() {
  const [flatOptions, setFlatOptions] = useState<Array<{ id: "windsor" | "kensington" | "mayfair"; name: string }>>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<"windsor" | "kensington" | "mayfair">("mayfair");
  const [tasks, setTasks] = useState<AdminWorkerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingTaskId, setIsSubmittingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTasks = useCallback(async (flatId: "windsor" | "kensington" | "mayfair") => {
    setIsLoading(true);

    try {
      const [overview, loadedTasks] = await Promise.all([
        fetchAdminInventoryOverview(),
        fetchInventoryWorkerTasks({ flatId, sync: true, openOnly: true }),
      ]);

      const nextFlats = Array.isArray(overview?.flats) ? overview.flats : [];
      const safeTasks = Array.isArray(loadedTasks) ? loadedTasks : [];

      setFlatOptions(nextFlats);
      setTasks(safeTasks);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks(selectedFlatId);
  }, [loadTasks, selectedFlatId]);

  const selectedFlatName = useMemo(() => {
    return flatOptions.find((flat) => flat.id === selectedFlatId)?.name ?? selectedFlatId;
  }, [flatOptions, selectedFlatId]);

  async function updateTask(task: AdminWorkerTask, status: AdminWorkerTask["status"]): Promise<void> {
    setIsSubmittingTaskId(task.id);

    try {
      await submitUpdateInventoryWorkerTaskStatus({
        taskId: task.id,
        status,
        assignedTo: task.assignedTo,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-worker-task"),
      });

      await loadTasks(selectedFlatId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmittingTaskId(null);
    }
  }

  return (
    <div className="admin-readiness-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Worker Task Queue
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Plain-language task queue for shift execution.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <label className="admin-label" htmlFor="staff-task-flat-filter">
            Flat
          </label>
          <select
            id="staff-task-flat-filter"
            className="standard-input admin-compact-input"
            value={selectedFlatId}
            onChange={(event) => setSelectedFlatId(event.target.value as "windsor" | "kensington" | "mayfair")}
            disabled={isLoading || isSubmittingTaskId !== null}
          >
            {flatOptions.map((flat) => (
              <option key={flat.id} value={flat.id}>
                {flat.name}
              </option>
            ))}
          </select>
          <span className="admin-count-pill">{tasks.length} active</span>
        </div>
      </section>

      {errorMessage ? <div className="booking-inline-note booking-inline-note-muted">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="booking-inline-note booking-inline-note-soft">Loading worker task queue...</div>
      ) : (
        <StaffTasksSnapshotView
          tasks={tasks}
          selectedFlatName={selectedFlatName}
          isSubmittingTaskId={isSubmittingTaskId}
          onRunPrimaryAction={async (task, status) => updateTask(task, status)}
          onMarkBlocked={async (task) => updateTask(task, "blocked")}
        />
      )}
    </div>
  );
}
