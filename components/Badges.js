import { STATUSES, PRIORITIES, EMP_STATUSES, labelOf } from '@/lib/constants';

export function StatusBadge({ status }) {
  return <span className={`badge st-${status}`}>{labelOf(STATUSES, status)}</span>;
}
export function PriorityBadge({ priority }) {
  const label = labelOf(PRIORITIES, priority);
  return <span className={`prio pr-${priority}`} aria-label={`Priority: ${label}`} title={label} />;
}
export function EmpStatusBadge({ status }) {
  return <span className={`badge emp-${status}`}>{labelOf(EMP_STATUSES, status)}</span>;
}
