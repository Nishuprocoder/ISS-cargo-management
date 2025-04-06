const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // In-memory for simplicity; use a file for persistence

const initializeDatabase = () => {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS items (
                itemId TEXT PRIMARY KEY,
                name TEXT,
                width REAL,
                depth REAL,
                height REAL,
                priority INTEGER,
                expiryDate TEXT,
                usageLimit INTEGER,
                preferredZone TEXT,
                containerId TEXT,
                status TEXT DEFAULT 'stored'
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS containers (
                containerId TEXT PRIMARY KEY,
                zone TEXT,
                width REAL,
                depth REAL,
                height REAL,
                usedVolume REAL DEFAULT 0
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT,
                itemId TEXT,
                userId TEXT,
                timestamp TEXT
            )
        `);
    });
};

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

module.exports = { initializeDatabase, query, run };