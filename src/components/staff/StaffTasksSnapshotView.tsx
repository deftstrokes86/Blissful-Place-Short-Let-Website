"use client";

import type { AdminWorkerTask } from "@/lib/admin-inventory-api";
import {
  formatWorkerTaskStatus,
  formatWorkerTaskType,
  formatWorkerTaskUrgency,
  getPrimaryTaskAction,
  normalizeWorkerTaskStatus,
} from "../tasks/worker-task-view-model";

interface StaffTasksSnapshotViewProps {
  tasks: AdminWorkerTask[] | null | undefined;
  selectedFlatName: string | null | undefined;
  isSubmittingTaskId: string | null;
  onRunPrimaryAction: (task: AdminWorkerTask, status: AdminWorkerTask["status"]) => Promise<void>;
  onMarkBlocked: (task: AdminWorkerTask) => Promise<void>;
}

export function StaffTasksSnapshotView({
  tasks: inputTasks,
  selectedFlatName,
  isSubmittingTaskId,
  onRunPrimaryAction,
  onMarkBlocked,
}: StaffTasksSnapshotViewProps) {
  const tasks = Array.isArray(inputTasks) ? inputTasks : [];
  const flatLabel = typeof selectedFlatName === "string" && selectedFlatName.trim().length > 0
    ? selectedFlatName.trim()
    : "Unassigned flat";

  return (
    <section className="admin-bookings-section" aria-labelledby="worker-task-home-heading">
      <div className="admin-bookings-section-header">
        <h3 id="worker-task-home-heading" className="heading-sm" style={{ margin: 0 }}>
          Task List
        </h3>
        <span className="admin-count-pill">{tasks.length} tasks</span>
      </div>

      <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
        Simple actions only: start, finish, or flag cannot-complete.
      </p>

      {tasks.length === 0 ? (
        <p className="text-secondary">No tasks in your queue right now.</p>
      ) : (
        <div className="admin-bookings-list">
          {tasks.map((task, index) => {
            const primaryAction = getPrimaryTaskAction(task.status);
            const normalizedStatus = normalizeWorkerTaskStatus(task.status);
            const canMarkBlocked = normalizedStatus === "pending" || normalizedStatus === "in_progress";
            const instruction = task.description?.trim() || task.title || "Task instructions pending.";
            const taskTitle = task.title?.trim() || `Task ${index + 1}`;
            const taskKey = task.id?.trim() || `worker-task-${index}`;

            return (
              <article key={taskKey} className="admin-bookings-card">
                <div className="admin-bookings-card-header">
                  <p className="admin-card-title">{formatWorkerTaskType(task.taskType)}</p>
                  <span className="admin-status-pill">{formatWorkerTaskStatus(task.status)}</span>
                </div>

                <div className="admin-notifications-meta-grid">
                  <div>
                    <p className="admin-meta-label">Flat</p>
                    <p>{flatLabel}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Task Type</p>
                    <p>{formatWorkerTaskType(task.taskType)}</p>
                  </div>
                  <div>
                    <p className="admin-meta-label">Urgency</p>
                    <p>{formatWorkerTaskUrgency(task.priority)}</p>
                  </div>
                </div>

                <p className="admin-meta-label">Instruction</p>
                <p className="admin-card-title" style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                  {taskTitle}
                </p>
                <p className="admin-notification-summary">{instruction}</p>

                <div className="admin-bookings-actions-row">
                  {primaryAction ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isSubmittingTaskId === task.id}
                      onClick={() => void onRunPrimaryAction(task, primaryAction.nextStatus)}
                    >
                      {isSubmittingTaskId === task.id ? "Updating..." : primaryAction.label}
                    </button>
                  ) : null}

                  {canMarkBlocked ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={isSubmittingTaskId === task.id}
                      onClick={() => void onMarkBlocked(task)}
                    >
                      Cannot Complete
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
