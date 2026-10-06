import { StatusBadge, PriorityBadge } from './Badges';
import Icon from './Icon';
import { money, prettyDate, todayStr } from '@/lib/constants';

export default function TaskRow({ task, onClick }) {
  // tap the number to call, without opening the task
  function dial(e) {
    e.stopPropagation();
    window.location.href = `tel:${task.partyNumber.replace(/[^\d+]/g, '')}`;
  }
  const overdue = (task.status === 'pending' || task.status === 'in_progress') && task.dueDate < todayStr();
  return (
    <button type="button" className="task-row" onClick={onClick}>
      <span className="task-id">{task.invoiceNo}</span>
      <span className="task-main">
        <span className="task-party">{task.partyName}</span>
        <span className="task-meta">
          {task.partyNumber && (
            <span className="tel-link" role="link" onClick={dial} title={`Call ${task.partyNumber}`}>
              <Icon name="phone" size={13} /> {task.partyNumber}
            </span>
          )}
        </span>
        <span className="task-meta">
          {task.assigneeName}<span className="sep" />
          <span className={overdue ? 'overdue' : ''}>Due {prettyDate(task.dueDate)}</span>
        </span>
      </span>
      <span className="task-side">
        <span className="task-amount">{money(task.amount)}</span>
        <span className="task-badges">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </span>
      </span>
    </button>
  );
}
