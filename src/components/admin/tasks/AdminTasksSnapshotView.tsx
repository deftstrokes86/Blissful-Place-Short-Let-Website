import type { AdminWorkerTask } from "@/lib/admin-inventory-api";
import {
  formatWorkerTaskStatus,
  formatWorkerTaskType,
  formatWorkerTaskUrgency,
  getTaskVisibilityLabel,
} from "../../tasks/worker-task-view-model";

interface AdminTasksSnapshotViewProps {
  tasks: AdminWorkerTask[];
  isSubmitting: boolean;
  onQuickStatusUpdate: (task: AdminWorkerTask, status: AdminWorkerTask["status"]) => Promise<void>;
}

export function AdminTasksSnapshotView({ tasks, isSubmitting, onQuickStatusUpdate }: AdminTasksSnapshotViewProps) {
  return (
    <section className="admin-bookings-section" aria-labelledby="admin-operational-task-queue-heading">
      <div className="admin-bookings-section-header">
        <h3 id="admin-operational-task-queue-heading" className="heading-sm" style={{ margin: 0 }}>
          Operational Task Queue
        </h3>
        <span className="admin-count-pill">{tasks.length} total</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-secondary">No tasks available for this flat.</p>
      ) : (
        <div className="admin-bookings-list">
          {tasks.map((task) => (
            <article key={task.id} className="admin-bookings-card">
              <div className="admin-bookings-card-header">
                <p className="admin-card-title">{task.title}</p>
                <span className="admin-status-pill">{formatWorkerTaskStatus(task.status)}</span>
              </div>

              <div className="admin-notifications-meta-grid">
                <div>
                  <p className="admin-meta-label">Flat</p>
                  <p>{task.flatId}</p>
                </div>
                <div>
                  <p className="admin-meta-label">Task Type</p>
                  <p>{formatWorkerTaskType(task.taskType)}</p>
                </div>
                <div>
                  <p className="admin-meta-label">Urgency</p>
                  <p>{formatWorkerTaskUrgency(task.priority)}</p>
                </div>
                <div>
                  <p className="admin-meta-label">Status</p>
                  <p>{formatWorkerTaskStatus(task.status)}</p>
                </div>
                <div>
                  <p className="admin-meta-label">Visibility</p>
                  <p>{getTaskVisibilityLabel(task)}</p>
                </div>
              </div>

              <p className="admin-notification-summary">{task.description?.trim() || "No description."}</p>

              <div className="admin-bookings-actions-row">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={isSubmitting}
                  onClick={() => void onQuickStatusUpdate(task, "in_progress")}
                >
                  Set In Progress
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  onClick={() => void onQuickStatusUpdate(task, "completed")}
                >
                  Set Completed
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={isSubmitting}
                  onClick={() => void onQuickStatusUpdate(task, "blocked")}
                >
                  Set Blocked
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
