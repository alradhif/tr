import type { AssistantBlock, AssistantRecord, AssistantTone } from '../../../api/me';

/** Progress colour used across the portals: red below 40%, amber below 80%, green after. */
function progressTone(value: number) {
  if (value < 40) return '#f04438';
  if (value < 80) return '#f79009';
  return '#17b26a';
}

function Badge({ label, tone }: { label: string; tone?: AssistantTone }) {
  return <span className={`ab-badge ab-badge--${tone ?? 'neutral'}`}>{label}</span>;
}

function Progress({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="ab-progress" aria-label={`${percent}%`}>
      <div className="ab-progress__track">
        <i style={{ width: `${percent}%`, background: progressTone(percent) }} />
      </div>
      <span style={{ color: progressTone(percent) }}>{percent}%</span>
    </div>
  );
}

function Record({ record }: { record: AssistantRecord }) {
  return (
    <li className="ab-record">
      <div className="ab-record__head">
        <div className="ab-record__title">
          <strong>{record.title}</strong>
          {record.subtitle ? <span>{record.subtitle}</span> : null}
        </div>
        {record.badge ? <Badge {...record.badge} /> : null}
      </div>
      {record.progress !== undefined && record.progress !== null ? <Progress value={record.progress} /> : null}
      {record.value || record.note ? (
        <div className="ab-record__foot">
          {record.note ? <span>{record.note}</span> : <span />}
          {record.value ? <b>{record.value}</b> : null}
        </div>
      ) : null}
      {record.contact ? (
        <div className="ab-record__contact">
          <span>{record.contact.name}</span>
          {record.contact.phone ? (
            <a href={`tel:${record.contact.phone.replace(/\s/g, '')}`} dir="ltr">
              {record.contact.phone}
            </a>
          ) : null}
          {record.contact.email ? (
            <a href={`mailto:${record.contact.email}`} dir="ltr">
              {record.contact.email}
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Block({ block, answerTitle }: { block: AssistantBlock; answerTitle?: string }) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="ab-hero">
          <div className="ab-hero__head">
            <div>
              <strong>{block.title}</strong>
              {block.subtitle ? <span>{block.subtitle}</span> : null}
            </div>
            {block.badge ? <Badge {...block.badge} /> : null}
          </div>
          {block.progress !== undefined && block.progress !== null ? (
            <>
              <span className="ab-hero__label">{block.progressText}</span>
              <Progress value={block.progress} />
            </>
          ) : null}
        </div>
      );
    case 'stats':
      return (
        <div className="ab-stats">
          {block.items.map((item) => (
            <div key={item.label} className={`ab-stat ab-stat--${item.tone ?? 'neutral'}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.hint ? <small>{item.hint}</small> : null}
            </div>
          ))}
        </div>
      );
    case 'facts':
      return (
        <dl className="ab-facts">
          {block.items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd dir={item.ltr ? 'ltr' : undefined}>{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'bars': {
      const max = Math.max(1, ...block.items.map((item) => item.value));
      return (
        <div className="ab-bars">
          {block.title ? <h4>{block.title}</h4> : null}
          {block.items.map((item) => (
            <div key={item.label} className="ab-bar">
              <span>{item.label}</span>
              <div className="ab-bar__track">
                <i className={`ab-fill--${item.tone ?? 'info'}`} style={{ width: `${(item.value / max) * 100}%` }} />
              </div>
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      );
    }
    case 'records':
      return (
        <div className="ab-records">
          {block.title && !sameTitle(block.title, answerTitle) ? <h4>{block.title}</h4> : null}
          <ul>
            {block.items.map((record, index) => (
              <Record key={`${record.title}-${index}`} record={record} />
            ))}
          </ul>
          {block.more ? <p className="ab-more">و{block.more} أخرى</p> : null}
        </div>
      );
    default:
      return null;
  }
}

/** A list titled like the answer itself needs no second heading. */
function sameTitle(blockTitle: string, answerTitle?: string) {
  if (!answerTitle) return false
  const core = (text: string) => text.replace(/^عدد\s+/, '').replace(/\s*\(\d+\)$/, '').split(':')[0].trim()
  return core(blockTitle) === core(answerTitle)
}

/** Draws an answer as cards; plain text answers keep the paragraph view. */
export function AssistantAnswer({ title, text, blocks }: { title?: string; text: string; blocks?: AssistantBlock[] }) {
  if (!blocks?.length) return <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>;
  const startsWithHero = blocks[0]?.type === 'hero';
  return (
    <div className="ab-answer">
      {title && !startsWithHero ? <h3 className="ab-answer__title">{title}</h3> : null}
      {blocks.map((block, index) => (
        <Block key={index} block={block} answerTitle={title} />
      ))}
    </div>
  );
}
