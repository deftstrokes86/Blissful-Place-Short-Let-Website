import type { BookingStepLabels } from "@/types/booking";

interface BookingProgressProps {
  stepLabels: BookingStepLabels;
  stepIndex: number;
}

export function BookingProgress({ stepLabels, stepIndex }: BookingProgressProps) {
  return (
    <div className="booking-progress" role="list" aria-label="Booking flow progress">
      {stepLabels.map((label, index) => {
        const isActive = index === stepIndex;
        const isCompleted = index < stepIndex;
        const stateClass = isActive ? "is-active" : isCompleted ? "is-completed" : "is-upcoming";

        return (
          <div
            key={`${label}-${index}`}
            className={`booking-progress-item ${stateClass}`}
            role="listitem"
            aria-current={isActive ? "step" : undefined}
          >
            <span className="booking-progress-index">{isCompleted ? "\u2713" : index + 1}</span>
            <span className="booking-progress-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
