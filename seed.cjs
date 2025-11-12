// seed.cjs — FINAL: users + curriculums + progress + courses + profiles + events + scenarios
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/** Create tables (idempotent) and migrate missing columns if table already existed */
async function ensureTables() {
  // users
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      m_number TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // curriculums
  await client.query(`
    CREATE TABLE IF NOT EXISTS curriculums (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      total_courses INT NOT NULL
    );
  `);

  // progress
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      curriculum_id BIGINT REFERENCES curriculums(id) ON DELETE CASCADE,
      courses_completed INT NOT NULL DEFAULT 0,
      gpa NUMERIC(3,2),
      last_updated TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // courses
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      curriculum_id BIGINT REFERENCES curriculums(id) ON DELETE CASCADE,
      course_name TEXT NOT NULL,
      status TEXT CHECK (status IN ('Completed', 'In Progress', 'Pending')) NOT NULL DEFAULT 'Pending'
    );
  `);

  // profiles
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT,
      phone TEXT,
      year TEXT,
      advisor TEXT,
      hometown TEXT,
      bio TEXT
    );
  `);

  // events
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_events (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL
    );
  `);

  // scenarios — table may already exist without `scenario` column; create then migrate
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_scenarios (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE
      -- scenario column ensured via migration block below
    );
  `);

  // 🔧 MIGRATION: ensure scenario column exists on old DBs
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'student_scenarios' AND column_name = 'scenario'
      ) THEN
        ALTER TABLE student_scenarios ADD COLUMN scenario TEXT;
      END IF;
    END
    $$;
  `);
}

/** Hard reset all rows; PKs restart (safe for foreign keys) */
async function resetTables() {
  console.log('🧹 Resetting tables (cascade)…');
  await client.query(`
    TRUNCATE TABLE
      student_scenarios,
      student_events,
      student_courses,
      student_progress,
      student_profiles,
      curriculums,
      users
    RESTART IDENTITY CASCADE;
  `);
}

async function seedUsers() {
  console.log('🌱 Seeding users (password "Test1234!")');
  const users = [
    { username: 'alice',   email: 'alice@example.com',   password: 'Test1234!', m_number: 'M10000001' },
    { username: 'bob',     email: 'bob@example.com',     password: 'Test1234!', m_number: 'M10000002' },
    { username: 'charlie', email: 'charlie@example.com', password: 'Test1234!', m_number: 'M10000003' },
    { username: 'diana',   email: 'diana@example.com',   password: 'Test1234!', m_number: 'M10000004' },
    { username: 'eric',    email: 'eric@example.com',    password: 'Test1234!', m_number: 'M10000005' },
  ];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await client.query(
      `INSERT INTO users (username, email, password, m_number) VALUES ($1,$2,$3,$4)`,
      [u.username, u.email, hashed, u.m_number]
    );
  }
}

function ucCurriculums() {
  return [
    {
      name: 'Information Technology (BSIT)',
      description:
        'Networking, cybersecurity, software development, and systems administration.',
      total_courses: 40,
      courses: [
        'IT Fundamentals','Networking I','Networking II','Database Systems',
        'Web Development','Python Programming','Cybersecurity Fundamentals',
        'Systems Administration','IT Project Management','Cloud Infrastructure'
      ],
    },
    {
      name: 'Cybersecurity (BSCyber)',
      description:
        'Secure coding, digital forensics, penetration testing, and incident response.',
      total_courses: 38,
      courses: [
        'Intro to Cybersecurity','Ethical Hacking','Network Defense','Digital Forensics',
        'Secure Software Design','Cyber Law and Policy','Penetration Testing',
        'Incident Response','Cloud Security','Advanced Network Defense'
      ],
    },
    {
      name: 'Accounting (BBA)',
      description:
        'Financial reporting, auditing, taxation, and managerial accounting.',
      total_courses: 42,
      courses: [
        'Financial Accounting I','Managerial Accounting','Auditing Principles',
        'Business Law','Taxation I','Cost Accounting','Accounting Information Systems',
        'Intermediate Accounting','Corporate Finance','Ethics in Accounting'
      ],
    },
    {
      name: 'Finance (BBA)',
      description:
        'Investment analysis, corporate finance, financial modeling, and capital markets.',
      total_courses: 40,
      courses: [
        'Principles of Finance','Financial Markets','Corporate Finance',
        'Investment Analysis','Econometrics','Risk Management',
        'Portfolio Theory','Behavioral Finance','International Finance','Financial Modeling'
      ],
    },
    {
      name: 'Mechanical Engineering (BSE)',
      description:
        'Design, thermodynamics, materials, manufacturing systems, and robotics.',
      total_courses: 45,
      courses: [
        'Statics','Dynamics','Thermodynamics I','Fluid Mechanics',
        'Materials Science','Mechanical Design','Manufacturing Processes',
        'Heat Transfer','Control Systems','Capstone Design Project'
      ],
    },
  ];
}

async function seedCurriculums() {
  console.log('🎓 Seeding curriculums…');
  const data = ucCurriculums();
  for (const c of data) {
    await client.query(
      `INSERT INTO curriculums (name, description, total_courses) VALUES ($1,$2,$3)`,
      [c.name, c.description, c.total_courses]
    );
  }
  return data;
}

async function seedProfilesProgressCoursesEvents(curriculums) {
  console.log('📊 Assigning program + progress + courses + profile + events + scenarios…');

  const users = (await client.query(`SELECT id, email, username FROM users ORDER BY id;`)).rows;
  const currs = (await client.query(`SELECT id, name, description, total_courses FROM curriculums;`)).rows;

  const map = {
    'alice@example.com':   'Information Technology (BSIT)',
    'bob@example.com':     'Cybersecurity (BSCyber)',
    'charlie@example.com': 'Accounting (BBA)',
    'diana@example.com':   'Finance (BBA)',
    'eric@example.com':    'Mechanical Engineering (BSE)',
  };

  const profiles = {
    'alice@example.com':   { full_name: 'Alice Johnson',  phone: '(513) 555-1010', year: 'Sophomore', advisor: 'Dr. Nguyen', hometown: 'Cincinnati, OH', bio: 'BSIT student into cloud & web.' },
    'bob@example.com':     { full_name: 'Bob Martinez',   phone: '(513) 555-2020', year: 'Junior',    advisor: 'Dr. Patel',  hometown: 'Mason, OH',      bio: 'Cyber student focused on blue-team and IR.' },
    'charlie@example.com': { full_name: 'Charlie Kim',    phone: '(513) 555-3030', year: 'Senior',    advisor: 'Prof. Ellis',hometown: 'Dayton, OH',     bio: 'Accounting student prepping for CPA.' },
    'diana@example.com':   { full_name: 'Diana Shah',     phone: '(513) 555-4040', year: 'Junior',    advisor: 'Prof. Blake',hometown: 'Columbus, OH',   bio: 'Finance student passionate about markets.' },
    'eric@example.com':    { full_name: 'Eric Liu',       phone: '(513) 555-5050', year: 'Sophomore', advisor: 'Dr. Romero', hometown: 'Blue Ash, OH',   bio: 'ME student exploring robotics & design.' },
  };

  const scenarioByProgram = {
    'Information Technology (BSIT)':
      'You are leading a small team project to migrate a legacy PHP site to Next.js with a Neon Postgres backend. Draft a 2-week plan.',
    'Cybersecurity (BSCyber)':
      'You are on IR duty. SOC triaged a suspicious login from an overseas IP. Draft first 3 steps and containment actions.',
    'Accounting (BBA)':
      'You must prepare working papers for an internal audit finding. Identify 3 controls and propose remediation.',
    'Finance (BBA)':
      'Build a basic DCF for a mid-cap company using conservative assumptions and identify 2 key sensitivities.',
    'Mechanical Engineering (BSE)':
      'Design a heatsink for a 50W module with ambient 25°C. Outline material choice and fin geometry tradeoffs.',
  };

  for (const u of users) {
    const programName = map[u.email];
    const curr = currs.find(c => c.name === programName);
    const meta = curriculums.find(c => c.name === programName);
    if (!curr || !meta) continue;

    // progress: between 30–70% complete, with slight variance
    const minDone = Math.floor(meta.courses.length * 0.3);
    const maxDone = Math.floor(meta.courses.length * 0.7);
    const span = Math.max(1, maxDone - minDone);
    const completed = Math.min(meta.courses.length - 1, minDone + (u.id % (span + 1)));
    const gpa = (Math.random() * (4.0 - 2.8) + 2.8).toFixed(2);

    await client.query(
      `INSERT INTO student_progress (student_id, curriculum_id, courses_completed, gpa)
       VALUES ($1,$2,$3,$4)`,
      [u.id, curr.id, completed, gpa]
    );

    // per-course statuses
    for (let i = 0; i < meta.courses.length; i++) {
      const course = meta.courses[i];
      let status = 'Pending';
      if (i < completed - 2) status = 'Completed';
      else if (i < completed) status = 'In Progress';

      await client.query(
        `INSERT INTO student_courses (student_id, curriculum_id, course_name, status)
         VALUES ($1,$2,$3,$4)`,
        [u.id, curr.id, course, status]
      );
    }

    // personal profile
    const p = profiles[u.email];
    await client.query(
      `INSERT INTO student_profiles (student_id, full_name, phone, year, advisor, hometown, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [u.id, p.full_name, p.phone, p.year, p.advisor, p.hometown, p.bio]
    );

    // weekly events
    const events = [
      { day: 'Monday',    time: '10:00 – 11:15', title: `${programName.split(' ')[0]} 101` },
      { day: 'Tuesday',   time: '16:00 – 17:00', title: 'CatAssist Standup' },
      { day: 'Wednesday', time: '10:00 – 11:15', title: `${programName.split(' ')[0]} 101` },
      { day: 'Thursday',  time: '23:59',         title: 'Weekly Quiz (online)' },
      { day: 'Friday',    time: '16:00',         title: 'Draft Submission' },
    ];
    for (const e of events) {
      await client.query(
        `INSERT INTO student_events (student_id, day, time, title) VALUES ($1,$2,$3,$4)`,
        [u.id, e.day, e.time, e.title]
      );
    }

    // scenario
    await client.query(
      `INSERT INTO student_scenarios (student_id, scenario) VALUES ($1,$2)`,
      [u.id, scenarioByProgram[programName]]
    );
  }

  console.log('✅ Seeded progress, courses, profiles, events, scenarios.');
}

async function main() {
  console.log('🔌 Connecting…');
  await client.connect();

  await ensureTables();
  await resetTables();
  const data = ucCurriculums();
  await seedUsers();
  await seedCurriculums();
  await seedProfilesProgressCoursesEvents(data);

  await client.end();
  console.log('✅ Seeding complete.');
}

main().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  try { await client.end(); } catch {}
  process.exit(1);
});
