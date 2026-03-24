"use client";

import { useEffect, useState } from "react";

import {
  createAdminInventoryIdempotencyKey,
  fetchInventoryWorkerTasks,
  submitUpdateInventoryWorkerTaskStatus,
  type AdminWorkerTask,
} from "@/lib/admin-inventory-api";
import type { FlatId } from "@/types/booking";

interface StaffTaskListPanelProps {
  title: string;
  description: string;
  filterTaskTypes: AdminWorkerTask["taskType"][];
  flatId?: FlatId;
}

export function StaffTaskListPanel({ title, description, filterTaskTypes, flatId }: StaffTaskListPanelProps) {
  const [tasks, setTasks] = useState<AdminWorkerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inFlightTaskId, setInFlightTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);

      try {
        const loaded = await fetchInventoryWorkerTasks({
          flatId,
          sync: true,
          openOnly: true,
        });

        if (!cancelled) {
          setTasks(loaded.filter((task) => filterTaskTypes.includes(task.taskType)));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load tasks.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [filterTaskTypes, flatId]);

  async function markCompleted(task: AdminWorkerTask): Promise<void> {
    setInFlightTaskId(task.id);

    try {
      await submitUpdateInventoryWorkerTaskStatus({
        taskId: task.id,
        status: "completed",
        assignedTo: task.assignedTo,
        idempotencyKey: createAdminInventoryIdempotencyKey("staff-task-complete"),
      });

      setTasks((current) => current.filter((entry) => entry.id !== task.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update task.");
    } finally {
      setInFlightTaskId(null);
    }
  }

  return (
    <section className="admin-bookings-section" aria-labelledby="staff-task-list-heading">
      <div className="admin-bookings-section-header">
        <h2 id="staff-task-list-heading" className="heading-sm" style={{ margin: 0 }}>
          {title}
        </h2>
        <span className="admin-count-pill">{tasks.length} open</span>
      </div>

      <p className="text-secondary" style={{ fontSize: "0.9rem" }}>
        {description}
      </p>

      {errorMessage ? <div className="booking-inline-note booking-inline-note-muted">{errorMessage}</div> : null}

      {isLoading ? (
        <p className="text-secondary">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-secondary">No tasks in this queue.</p>
      ) : (
        <div className="admin-bookings-list">
          {tasks.map((task) => (
            <article key={task.id} className="admin-bookings-card">
              <p className="admin-card-title">{task.title}</p>
              <p className="admin-notification-summary">{task.description ?? "No details."}</p>
              <p className="text-secondary" style={{ fontSize: "0.82rem" }}>
                {task.flatId} | {task.priority}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void markCompleted(task)}
                disabled={inFlightTaskId === task.id}
              >
                {inFlightTaskId === task.id ? "Updating..." : "Mark Complete"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
