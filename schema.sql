-- Referans şema: uygulama açılışında IF NOT EXISTS ile oluşturulur.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY,owner TEXT REFERENCES users(id),service TEXT,level TEXT,message TEXT,at TEXT);CREATE INDEX IF NOT EXISTS logs_filter ON logs(owner,level,id);CREATE INDEX IF NOT EXISTS logs_service ON logs(owner,service,id);
