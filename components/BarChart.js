// Grouped bar chart in plain SVG: created vs completed tasks per day.
export default function BarChart({ data }) {
  const W = 560, H = 220, padL = 28, padB = 28, padT = 12;
  const max = Math.max(1, ...data.flatMap((d) => [d.created, d.completed]));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = step * 4;
  const innerW = W - padL - 8;
  const innerH = H - padB - padT;
  const groupW = innerW / data.length;
  const barW = Math.min(18, groupW / 3);
  const y = (v) => padT + innerH - (v / top) * innerH;

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tasks created and completed in the last 7 days">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={padL} x2={W - 8} y1={y(i * step)} y2={y(i * step)} className="grid-line" />
            <text x={padL - 8} y={y(i * step) + 4} className="axis" textAnchor="end">{i * step}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const day = new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
          return (
            <g key={d.date}>
              <rect x={cx - barW - 2} y={y(d.created)} width={barW} height={Math.max(0, H - padB - y(d.created))} rx="3" className="bar-created">
                <title>{`${d.date}: ${d.created} created`}</title>
              </rect>
              <rect x={cx + 2} y={y(d.completed)} width={barW} height={Math.max(0, H - padB - y(d.completed))} rx="3" className="bar-completed">
                <title>{`${d.date}: ${d.completed} completed`}</title>
              </rect>
              <text x={cx} y={H - 8} className="axis" textAnchor="middle">{day}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="legend">
        <span><i className="dot created" /> Created</span>
        <span><i className="dot completed" /> Completed</span>
      </figcaption>
    </figure>
  );
}
