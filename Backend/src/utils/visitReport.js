// Prints who used the demo, per day: `npm run demo:visits` (optionally `-- 60` for 60 days).
const prisma = require('../lib/prisma')
const { dailyVisitSummary } = require('../lib/visitLog')

const ROLE_NAMES = {
  JODAYN_UPPER_MGMT: 'جدين - إدارة عليا',
  JODAYN_DATA_ENTRY: 'جدين - مدخل بيانات',
  ORG_UPPER_MGMT: 'الجهة - إدارة عليا',
  ORG_DATA_ENTRY: 'الجهة - مدخل بيانات',
  CLIENT_UPPER_MGMT: 'العميل - إدارة عليا',
  CLIENT_DATA_ENTRY: 'العميل - مدخل بيانات',
}

async function main() {
  const days = Number(process.argv[2]) || 30
  const { days: rows, demoByRole, people } = await dailyVisitSummary(days)
  console.log(`\nDemo usage, last ${days} days (Saudi time)\n`)
  if (!rows.length) console.log('  Nothing recorded yet.')
  else {
    console.table(
      rows.map((row) => ({
        Day: row.day,
        'Demo button logins': row.demo_logins,
        'Demo visitors (unique)': row.demo_visitors,
        'Password sign-ins': row.password_logins,
        'People signed in': row.password_users,
        Invited: row.invited,
      })),
    )
  }
  if (demoByRole.length) {
    console.log('\nDemo buttons pressed, by role')
    console.table(demoByRole.map((row) => ({ Role: ROLE_NAMES[row.role] || row.role, Count: row.count })))
  }
  if (people.length) {
    console.log('\nPeople invited or signed in with a password')
    console.table(
      people.map((row) => ({
        Email: row.email,
        Name: row.name,
        Invited: row.invited ? 'yes' : '',
        'Sign-ins': row.logins,
        'Last seen': row.last_seen,
      })),
    )
  }
}

main()
  .catch((err) => {
    console.error(err.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
