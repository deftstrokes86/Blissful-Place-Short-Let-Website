"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchAdminInventoryOverview,
  fetchInventoryWorkerTasks,
  submitCreateInventoryWorkerTask,
  submitUpdateInventoryWorkerTaskStatus,
  type AdminWorkerTask,
} from "@/lib/admin-inventory-api";
import { AdminTasksSnapshotView } from "@/components/admin/tasks/AdminTasksSnapshotView";
import { isActionableWorkerTaskStatus } from "@/components/tasks/worker-task-view-model";

interface NoticeState {
  tone: "ok" | "error";
  message: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to complete task operation right now.";
}

export function AdminTasksPanel() {
  const [flatOptions, setFlatOptions] = useState<Array<{ id: "windsor" | "kensington" | "mayfair"; name: string }>>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<"windsor" | "kensington" | "mayfair">("mayfair");
  const [tasks, setTasks] = useState<AdminWorkerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    taskType: "inspection" as AdminWorkerTask["taskType"],
    priority: "important" as AdminWorkerTask["priority"],
    assignedTo: "",
  });

  const [updateForm, setUpdateForm] = useState({
    taskId: "",
    status: "in_progress" as AdminWorkerTask["status"],
    assignedTo: "",
  });

  const loadData = useCallback(async (flatId: "windsor" | "kensington" | "mayfair") => {
    setIsLoading(true);

    try {
      const [overview, nextTasks] = await Promise.all([
        fetchAdminInventoryOverview(),
        fetchInventoryWorkerTasks({ flatId, sync: true }),
      ]);

      setFlatOptions(overview.flats);
      setTasks(nextTasks);
      setUpdateForm((current) => ({
        ...current,
        taskId: nextTasks[0]?.id ?? "",
      }));
      setNotice(null);
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(selectedFlatId);
  }, [loadData, selectedFlatId]);

  const openCount = useMemo(() => tasks.filter((task) => isActionableWorkerTaskStatus(task.status)).length, [tasks]);

  async function handleCreateTask(): Promise<void> {
    if (isSubmitting || createForm.title.trim().length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitCreateInventoryWorkerTask({
        flatId: selectedFlatId,
        title: createForm.title,
        description: createForm.description.trim() || null,
        taskType: createForm.taskType,
        priority: createForm.priority,
        assignedTo: createForm.assignedTo.trim() || null,
        idempotencyKey: createAdminInventoryIdempotencyKey("inventory-task-create"),
      });

      setCreateForm((current) => ({
        ...current,
        title: "",
        description: "",
      }));

      await loadData(selectedFlatId);
      setNotice({ tone: "ok", message: "Task created." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runStatusUpdate(taskId: string, status: AdminWorkerTask["status"], assignedTo: string | null): Promise<void> {
    setIsSubmitting(true);
    setNotice(null);

    try {
      await submitUpdateInventoryWorkerTaskStatus({
        taskId,
        status,
        assignedTo,
        idempotencyKey: createAdminInventoryIdempotencyKey("inventory-task-status"),
      });

      await loadData(selectedFlatId);
      setNotice({ tone: "ok", message: "Task updated." });
    } catch (error) {
      setNotice({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateTask(): Promise<void> {
    if (isSubmitting || updateForm.taskId.trim().length === 0) {
      return;
    }

    await runStatusUpdate(updateForm.taskId, updateForm.status, updateForm.assignedTo.trim() || null);
  }

  return (
    <div className="admin-readiness-panel">
      <section className="admin-bookings-toolbar">
        <div>
          <h2 className="heading-sm serif" style={{ marginBottom: "0.5rem" }}>
            Worker Task Control
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.92rem" }}>
            Track worker flow, unblock blocked tasks, and keep operations moving.
          </p>
        </div>

        <div className="admin-bookings-toolbar-controls">
          <label className="admin-label" htmlFor="admin-task-flat-filter">
            Flat
          </label>
          <select
            id="admin-task-flat-filter"
            className="standard-input admin-compact-input"
            value={selectedFlatId}
            onChange={(event) => setSelectedFlatId(event.target.value as "windsor" | "kensington" | "mayfair")}
            disabled={isLoading || isSubmitting}
          >
            {flatOptions.map((flat) => (
              <option key={flat.id} value={flat.id}>
                {flat.name}
              </option>
            ))}
          </select>
          <span className="admin-count-pill">{openCount} active</span>
        </div>
      </section>

      {notice ? (
        <div className={`booking-inline-note ${notice.tone === "ok" ? "booking-inline-note-ok" : "booking-inline-note-muted"}`}>
          {notice.message}
        </div>
      ) : null}

      <section className="admin-bookings-section" aria-labelledby="admin-task-actions-heading">
        <div className="admin-bookings-section-header">
          <h3 id="admin-task-actions-heading" className="heading-sm" style={{ margin: 0 }}>
            Task Actions
          </h3>
          <span className="admin-count-pill">Workflow</span>
        </div>

        <div className="admin-grid-two">
          <form
            className="admin-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateTask();
            }}
          >
            <p className="admin-meta-label">Create Manual Task</p>

            <input
              className="standard-input"
              value={createForm.title}
              onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Task title"
              disabled={isSubmitting}
            />

            <textarea
              className="standard-input"
              rows={3}
              value={createForm.description}
              onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short instruction"
              disabled={isSubmitting}
            />

            <select
              className="standard-input"
              value={createForm.taskType}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  taskType: event.target.value as AdminWorkerTask["taskType"],
                }))
              }
              disabled={isSubmitting}
            >
              <option value="inspection">Inspection</option>
              <option value="restock">Restock</option>
              <option value="maintenance">Maintenance</option>
              <option value="readiness">Cleaning</option>
            </select>

            <select
              className="standard-input"
              value={createForm.priority}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  priority: event.target.value as AdminWorkerTask["priority"],
                }))
              }
              disabled={isSubmitting}
            >
              <option value="critical">High</option>
              <option value="important">Medium</option>
              <option value="minor">Low</option>
            </select>

            <input
              className="standard-input"
              value={createForm.assignedTo}
              onChange={(event) => setCreateForm((current) => ({ ...current, assignedTo: event.target.value }))}
              placeholder="Assigned staff id (optional)"
              disabled={isSubmitting}
            />

            <button type="submit" className="btn btn-primary" disabled={isSubmitting || createForm.title.trim().length === 0}>
              {isSubmitting ? "Submitting..." : "Create Task"}
            </button>
          </form>

          <form
            className="admin-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void handleUpdateTask();
            }}
          >
            <p className="admin-meta-label">Quick Status Update</p>

            <select
              className="standard-input"
              value={updateForm.taskId}
              onChange={(event) => setUpdateForm((current) => ({ ...current, taskId: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <select
              className="standard-input"
              value={updateForm.status}
              onChange={(event) =>
                setUpdateForm((current) => ({
                  ...current,
                  status: event.target.value as AdminWorkerTask["status"],
                }))
              }
              disabled={isSubmitting}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="escalated">Escalated</option>
              <option value="completed">Completed</option>
            </select>

            <input
              className="standard-input"
              value={updateForm.assignedTo}
              onChange={(event) => setUpdateForm((current) => ({ ...current, assignedTo: event.target.value }))}
              placeholder="Assigned staff id"
              disabled={isSubmitting}
            />

            <button type="submit" className="btn btn-outline-primary" disabled={isSubmitting || updateForm.taskId.length === 0}>
              {isSubmitting ? "Updating..." : "Update Task"}
            </button>
          </form>
        </div>
      </section>

      {isLoading ? (
        <section className="admin-bookings-section">
          <p className="text-secondary">Loading tasks...</p>
        </section>
      ) : (
        <AdminTasksSnapshotView
          tasks={tasks}
          isSubmitting={isSubmitting}
          onQuickStatusUpdate={async (task, status) => runStatusUpdate(task.id, status, task.assignedTo)}
        />
      )}
    </div>
  );
}
