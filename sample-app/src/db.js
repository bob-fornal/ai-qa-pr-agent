const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Minimal JSON-backed table store. ':memory:' keeps everything in process.
function createDb(file = ':memory:') {
  let state = { meta: { migrations: [] }, tables: {} };
  if (file !== ':memory:' && fs.existsSync(file)) {
    state = JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  const table = (name) => (state.tables[name] ??= {});

  const db = {
    meta: state.meta,
    all: (name) => Object.values(table(name)),
    get: (name, id) => table(name)[id] ?? null,
    insert: (name, row) => (table(name)[row.id] = { ...row }),
    update: (name, id, patch) => {
      const row = table(name)[id];
      if (!row) return null;
      Object.assign(row, patch);
      return row;
    },
    save: () => {
      if (file === ':memory:') return;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(state, null, 2));
    },
  };
  return db;
}

function runMigrations(db) {
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.js')).sort();
  for (const file of files) {
    if (db.meta.migrations.includes(file)) continue;
    require(path.join(MIGRATIONS_DIR, file)).up(db);
    db.meta.migrations.push(file);
  }
  db.save();
}

module.exports = { createDb, runMigrations };
