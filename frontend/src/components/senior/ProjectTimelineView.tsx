import { CalendarDays } from 'lucide-react';

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const events = [
  { title: 'التحليل', date: '4 يناير — 1 مارس', start: 0.25, width: 1.75, row: 0, tone: 'pink' },
  { title: 'التصميم', date: '1 مارس — 2 أبريل', start: 1.0, width: 2.25, row: 1, tone: 'green' },
  { title: 'بروتوتايب', date: '5 أبريل — 20 مايو', start: 2.25, width: 1.75, row: 1, tone: 'blue' },
  { title: 'التطوير', date: '1 مارس — 28 مايو', start: 3.0, width: 4.9, row: 2, tone: 'dark-green' },
  { title: 'الإختبار', date: '1 سبتمبر — 25 نوفمبر', start: 8.0, width: 2.8, row: 3, tone: 'orange' },
];

export default function ProjectTimelineView() {
  return (
    <section className="project-timeline" dir="rtl" aria-label="الجدول الزمني للمشروع">
      <div className="project-timeline__heading">
        <div className="project-timeline__title">
          <h2>الجدول الزمني</h2>
          <span className="project-timeline__icon"><CalendarDays size={25} /></span>
        </div>
      </div>

      <div className="project-timeline__calendar">
        <div className="project-timeline__months" dir="ltr">
          {months.map((month) => <span key={month}>{month}</span>)}
        </div>
        <div className="project-timeline__grid" dir="ltr">
          {months.map((month) => <span key={month} className="project-timeline__column" aria-hidden="true" />)}
          <div className="project-timeline__events" dir="rtl">
            {events.map((event) => (
              <div
                key={event.title}
                className={`project-timeline__event is-${event.tone}`}
                style={{
                  left: `${(event.start / 12) * 100}%`,
                  width: `${(event.width / 12) * 100}%`,
                  top: `${event.row * 62 + 28}px`,
                }}
              >
                <span>{event.date}</span>
                <strong>{event.title}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
