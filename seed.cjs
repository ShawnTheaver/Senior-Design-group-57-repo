// seed.cjs — RICH DATASET: users + curriculums + catalog + professors(30) + sections(capacity)
//           + profiles + transcripts (Bob missing required) + events + scenarios
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

async function ensureTables() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      m_number TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS curriculums (
      id BIGSERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      total_courses INT NOT NULL
    );
  `);

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

  await client.query(`
    CREATE TABLE IF NOT EXISTS student_courses (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      curriculum_id BIGINT REFERENCES curriculums(id) ON DELETE CASCADE,
      course_name TEXT NOT NULL,
      status TEXT CHECK (status IN ('Completed','In Progress','Pending')) NOT NULL DEFAULT 'Pending'
    );
  `);

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

  await client.query(`
    CREATE TABLE IF NOT EXISTS student_events (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS student_scenarios (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='student_scenarios' AND column_name='scenario'
      ) THEN
        ALTER TABLE student_scenarios ADD COLUMN scenario TEXT;
      END IF;
    END
    $$;
  `);

  // catalog/professors/sections/transcripts
  await client.query(`
    CREATE TABLE IF NOT EXISTS catalog_courses (
      id BIGSERIAL PRIMARY KEY,
      curriculum_id BIGINT REFERENCES curriculums(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INT NOT NULL,
      required BOOLEAN NOT NULL DEFAULT TRUE,
      UNIQUE(curriculum_id, code)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS professors (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS class_sections (
      id BIGSERIAL PRIMARY KEY,
      course_id BIGINT REFERENCES catalog_courses(id) ON DELETE CASCADE,
      professor_id BIGINT REFERENCES professors(id) ON DELETE SET NULL,
      day TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INT NOT NULL DEFAULT 30,
      enrolled INT NOT NULL DEFAULT 0
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS student_transcripts (
      id BIGSERIAL PRIMARY KEY,
      student_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      course_id BIGINT REFERENCES catalog_courses(id) ON DELETE CASCADE,
      grade TEXT,
      semester TEXT,
      year INT
    );
  `);
}

async function resetTables() {
  console.log('🧹 Resetting tables (cascade)…');
  await client.query(`
    TRUNCATE TABLE
      student_transcripts,
      class_sections,
      professors,
      catalog_courses,
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
  const list = [
    { username: 'alice',   email: 'alice@example.com',   m: 'M10000001' },
    { username: 'bob',     email: 'bob@example.com',     m: 'M10000002' },
    { username: 'charlie', email: 'charlie@example.com', m: 'M10000003' },
    { username: 'diana',   email: 'diana@example.com',   m: 'M10000004' },
    { username: 'eric',    email: 'eric@example.com',    m: 'M10000005' },
  ];
  for (const u of list) {
    const hash = await bcrypt.hash('Test1234!', 10);
    await client.query(
      `INSERT INTO users (username, email, password, m_number) VALUES ($1,$2,$3,$4)`,
      [u.username, u.email, hash, u.m]
    );
  }
}

function programs() {
  return [
    { name:'Information Technology (BSIT)', description:'Networking, cybersecurity, software development, and systems administration.', total_courses:40 },
    { name:'Cybersecurity (BSCyber)',       description:'Secure coding, digital forensics, penetration testing, and incident response.', total_courses:38 },
    { name:'Accounting (BBA)',              description:'Financial reporting, auditing, taxation, and managerial accounting.', total_courses:42 },
    { name:'Finance (BBA)',                 description:'Investment analysis, corporate finance, financial modeling, and capital markets.', total_courses:40 },
    { name:'Mechanical Engineering (BSE)',  description:'Design, thermodynamics, materials, manufacturing systems, and robotics.', total_courses:45 },
  ];
}

function catalogByProgram() {
  return {
    'Information Technology (BSIT)': [
      { code:'IT101', name:'IT Fundamentals',         credits:3, required:true },
      { code:'IT201', name:'Networking I',            credits:3, required:true },
      { code:'IT205', name:'Database Systems',        credits:3, required:true },
      { code:'IT220', name:'Web Development',         credits:3, required:true },
      { code:'IT250', name:'Python Programming',      credits:3, required:false },
      { code:'IT310', name:'Systems Administration',  credits:4, required:true },
    ],
    'Cybersecurity (BSCyber)': [
      { code:'CY100', name:'Intro to Cybersecurity',  credits:3, required:true },
      { code:'CY210', name:'Network Defense',         credits:3, required:true },
      { code:'CY220', name:'Ethical Hacking',         credits:3, required:true },
      { code:'CY230', name:'Digital Forensics',       credits:3, required:false },
      { code:'CY260', name:'Secure Software Design',  credits:3, required:true },
      { code:'CY310', name:'Incident Response',       credits:4, required:true },
    ],
    'Accounting (BBA)': [
      { code:'AC101', name:'Financial Accounting I',  credits:3, required:true },
      { code:'AC210', name:'Managerial Accounting',   credits:3, required:true },
      { code:'AC230', name:'Business Law',            credits:3, required:false },
      { code:'AC240', name:'Taxation I',              credits:3, required:true },
      { code:'AC260', name:'Auditing Principles',     credits:3, required:true },
      { code:'AC310', name:'Intermediate Accounting', credits:4, required:true },
    ],
    'Finance (BBA)': [
      { code:'FI100', name:'Principles of Finance',   credits:3, required:true },
      { code:'FI210', name:'Financial Markets',       credits:3, required:true },
      { code:'FI230', name:'Corporate Finance',       credits:3, required:true },
      { code:'FI260', name:'Econometrics',            credits:3, required:false },
      { code:'FI270', name:'Risk Management',         credits:3, required:true },
      { code:'FI310', name:'Investment Analysis',     credits:4, required:true },
    ],
    'Mechanical Engineering (BSE)': [
      { code:'ME101', name:'Statics',                 credits:3, required:true },
      { code:'ME120', name:'Dynamics',                credits:3, required:true },
      { code:'ME201', name:'Thermodynamics I',        credits:4, required:true },
      { code:'ME210', name:'Materials Science',       credits:3, required:true },
      { code:'ME230', name:'Fluid Mechanics',         credits:3, required:false },
      { code:'ME310', name:'Mechanical Design',       credits:4, required:true },
    ],
  };
}

async function seedCurriculumsAndCatalog() {
  console.log('🎓 Seeding curriculums + catalog…');
  for (const p of programs()) {
    await client.query(
      `INSERT INTO curriculums (name, description, total_courses) VALUES ($1,$2,$3)`,
      [p.name, p.description, p.total_courses]
    );
  }
  const currs = (await client.query(`SELECT id, name FROM curriculums;`)).rows;
  const maps = catalogByProgram();
  for (const c of currs) {
    for (const course of maps[c.name] || []) {
      await client.query(
        `INSERT INTO catalog_courses (curriculum_id, code, name, credits, required)
         VALUES ($1,$2,$3,$4,$5)`,
        [c.id, course.code, course.name, course.credits, course.required]
      );
    }
  }
}

async function seedProfessorsAndSections() {
  console.log('👩‍🏫 Seeding professors(30) + sections with buildings/rooms/times/capacity…');

  // 30 professors across departments
  const names = [
    'Dr. Nguyen','Dr. Patel','Prof. Ellis','Prof. Blake','Dr. Romero','Dr. Green','Dr. Singh','Prof. White',
    'Dr. Chen','Dr. Alvarez','Prof. Carter','Dr. Brooks','Prof. Diaz','Dr. Hunter','Dr. Iqbal','Prof. James',
    'Dr. Kane','Prof. Lee','Dr. Malik','Prof. Novak','Dr. Ortega','Prof. Park','Dr. Quinn','Prof. Reed',
    'Dr. Silva','Prof. Tanaka','Dr. Usman','Prof. Vega','Dr. Walker','Prof. Young'
  ];
  const depts = ['IT','Cybersecurity','Accounting','Finance','Mechanical Eng'];

  for (let i = 0; i < names.length; i++) {
    const d = depts[i % depts.length];
    const email = `${names[i].toLowerCase().replace(/[^a-z]/g,'')}@uc.edu`;
    await client.query(
      `INSERT INTO professors (name, email, department) VALUES ($1,$2,$3)`,
      [names[i], email, d]
    );
  }

  const profs = (await client.query(`SELECT id, name, department FROM professors ORDER BY id;`)).rows;

  // 5 buildings × 15 rooms
  const buildings = ['Baldwin Hall','Rhodes Hall','ERC','Old Chem','Swift Hall'];
  const rooms = ['101','102','103','104','105','201','202','203','204','205','301','302','303','304','305'];

  // many unique time slots
  const slots = [
    { day:'Mon', time:'08:00 – 09:15' }, { day:'Mon', time:'10:00 – 11:15' }, { day:'Mon', time:'14:00 – 15:15' },
    { day:'Tue', time:'09:30 – 10:45' }, { day:'Tue', time:'13:00 – 14:15' }, { day:'Tue', time:'16:00 – 17:15' },
    { day:'Wed', time:'10:00 – 11:15' }, { day:'Wed', time:'14:00 – 15:15' },
    { day:'Thu', time:'09:30 – 10:45' }, { day:'Thu', time:'13:00 – 14:15' }, { day:'Thu', time:'16:00 – 17:15' },
    { day:'Fri', time:'09:00 – 10:15' }, { day:'Fri', time:'11:30 – 12:45' }, { day:'Fri', time:'13:30 – 14:45' },
  ];

  // all catalog courses
  const courses = (await client.query(`
    SELECT cc.id, cc.code, cc.name, c.name AS curriculum
    FROM catalog_courses cc
    JOIN curriculums c ON c.id = cc.curriculum_id
    ORDER BY cc.id
  `)).rows;

  // choose dept-compatible professors
  function profPool(curr) {
    if (curr.includes('Cyber')) return profs.filter(p => ['Cybersecurity','IT'].includes(p.department));
    if (curr.includes('Information Technology')) return profs.filter(p => p.department === 'IT');
    if (curr.includes('Accounting')) return profs.filter(p => p.department === 'Accounting');
    if (curr.includes('Finance')) return profs.filter(p => p.department === 'Finance');
    if (curr.includes('Mechanical')) return profs.filter(p => p.department === 'Mechanical Eng');
    return profs;
  }

  let slotIdx = 0;
  for (const course of courses) {
    const pool = profPool(course.curriculum);
    // 3 sections per course, different professors, locations, times
    for (let k = 0; k < 3; k++) {
      const prof = pool[(course.id + k) % pool.length];
      const s = slots[slotIdx % slots.length]; slotIdx++;
      const loc = `${buildings[(course.id + k) % buildings.length]} ${rooms[(course.id + k) % rooms.length]}`;

      // make 2 sections look full, 1 with seats left
      const capacity = 30;
      const enrolled = (k < 2) ? 30 : Math.floor(10 + (course.id % 10)); // last section has seats

      await client.query(
        `INSERT INTO class_sections (course_id, professor_id, day, time, location, capacity, enrolled)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [course.id, prof.id, s.day, s.time, loc, capacity, enrolled]
      );
    }
  }
}

async function seedProfilesProgressTranscriptsLegacy() {
  console.log('🧑‍🎓 Seeding profiles, progress, transcripts, legacy student_courses, events, scenarios…');
  const users = (await client.query(`SELECT id, email, username FROM users ORDER BY id;`)).rows;
  const currs = (await client.query(`SELECT id, name, description, total_courses FROM curriculums;`)).rows;

  const map = {
    'alice@example.com':'Information Technology (BSIT)',
    'bob@example.com':'Cybersecurity (BSCyber)',
    'charlie@example.com':'Accounting (BBA)',
    'diana@example.com':'Finance (BBA)',
    'eric@example.com':'Mechanical Engineering (BSE)',
  };

  const profiles = {
    'alice@example.com':   { full_name:'Alice Johnson',  phone:'(513) 555-1010', year:'Sophomore', advisor:'Dr. Nguyen', hometown:'Cincinnati, OH', bio:'BSIT student into cloud & web.' },
    'bob@example.com':     { full_name:'Bob Martinez',   phone:'(513) 555-2020', year:'Junior',    advisor:'Dr. Patel',  hometown:'Mason, OH',      bio:'Cyber student focused on IR.' },
    'charlie@example.com': { full_name:'Charlie Kim',    phone:'(513) 555-3030', year:'Senior',    advisor:'Prof. Ellis',hometown:'Dayton, OH',     bio:'Accounting student prepping for CPA.' },
    'diana@example.com':   { full_name:'Diana Shah',     phone:'(513) 555-4040', year:'Junior',    advisor:'Prof. Blake',hometown:'Columbus, OH',   bio:'Finance student, markets nerd.' },
    'eric@example.com':    { full_name:'Eric Liu',       phone:'(513) 555-5050', year:'Sophomore', advisor:'Dr. Romero', hometown:'Blue Ash, OH',   bio:'ME student exploring robotics.' },
  };

  const cat = (await client.query(`
    SELECT cc.id, cc.code, cc.name, cc.credits, cc.required, c.name AS program
    FROM catalog_courses cc
    JOIN curriculums c ON c.id = cc.curriculum_id
  `)).rows;

  function catalogFor(program) { return cat.filter(r => r.program === program) }

  for (const u of users) {
    const programName = map[u.email];
    const curr = currs.find(c => c.name === programName);

    // profile
    const p = profiles[u.email];
    await client.query(
      `INSERT INTO student_profiles (student_id, full_name, phone, year, advisor, hometown, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [u.id, p.full_name, p.phone, p.year, p.advisor, p.hometown, p.bio]
    );

    // simple recurring events for demo
    const events = [
      { day:'Monday', time:'10:00 – 11:15', title:`${programName.split(' ')[0]} 101` },
      { day:'Wednesday', time:'10:00 – 11:15', title:`${programName.split(' ')[0]} 101` },
      { day:'Thursday', time:'23:59', title:'Weekly Quiz (online)' },
      { day:'Friday', time:'16:00', title:'Draft Submission' },
    ];
    for (const e of events) {
      await client.query(`INSERT INTO student_events (student_id, day, time, title) VALUES ($1,$2,$3,$4)`,
        [u.id, e.day, e.time, e.title]);
    }

    // scenario
    const scenarios = {
      'Information Technology (BSIT)':'Migrate a legacy PHP site to Next.js + Neon. Draft a 2-week plan.',
      'Cybersecurity (BSCyber)':'SOC triaged suspicious login. Outline first 3 IR steps and containment.',
      'Accounting (BBA)':'Prepare working papers for an internal audit finding and propose 3 controls.',
      'Finance (BBA)':'Build a simple DCF, list two key sensitivities.',
      'Mechanical Engineering (BSE)':'Design a heatsink for 50W module; discuss materials & fin geometry.',
    };
    await client.query(
      `INSERT INTO student_scenarios (student_id, scenario) VALUES ($1,$2)`,
      [u.id, scenarios[programName]]
    );

    // transcripts — Bob intentionally missing required courses
    const catalog = catalogFor(programName);
    let taken;
    if (u.email === 'bob@example.com') {
      // Bob skips CY210 & CY260 (both required) → missing required classes
      taken = catalog.filter(c => ['CY100','CY230','CY310'].includes(c.code));
    } else {
      taken = catalog.slice(0, 3);
    }
    for (const t of taken) {
      await client.query(
        `INSERT INTO student_transcripts (student_id, course_id, grade, semester, year)
         VALUES ($1,$2,$3,$4,$5)`,
        [u.id, t.id, 'A', 'Fall', 2024]
      );
    }

    // progress stats
    const gpa = (Math.random() * (4.0 - 3.0) + 3.0).toFixed(2);
    await client.query(
      `INSERT INTO student_progress (student_id, curriculum_id, courses_completed, gpa)
       VALUES ($1,$2,$3,$4)`,
      [u.id, curr.id, taken.length, gpa]
    );

    // legacy student_courses for dashboard cards
    for (let i = 0; i < catalog.length; i++) {
      const c = catalog[i];
      const status = taken.find(t => t.id === c.id) ? 'Completed' : (i < taken.length + 1 ? 'In Progress' : 'Pending');
      await client.query(
        `INSERT INTO student_courses (student_id, curriculum_id, course_name, status)
         VALUES ($1,$2,$3,$4)`,
        [u.id, curr.id, `${c.code} ${c.name}`, status]
      );
    }
  }
}

async function main() {
  console.log('🔌 Connecting…');
  await client.connect();
  await ensureTables();
  await resetTables();
  await seedUsers();
  await seedCurriculumsAndCatalog();
  await seedProfessorsAndSections();
  await seedProfilesProgressTranscriptsLegacy();
  await client.end();
  console.log('✅ Seeding complete.');
}

main().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  try { await client.end(); } catch {}
  process.exit(1);
});
