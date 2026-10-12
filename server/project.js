export default function ({
  db,
  router,
  run,
  get,
  all,
  id,
  now,
  text,
  choice,
  integer,
  publish,
}) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY,owner TEXT REFERENCES users(id),service TEXT,level TEXT,message TEXT,at TEXT);CREATE INDEX IF NOT EXISTS logs_filter ON logs(owner,level,id);CREATE INDEX IF NOT EXISTS logs_service ON logs(owner,service,id);`,
  );
  const redact = (s) =>
    s.replace(
      /(password|token|secret|authorization)\s*[=:]\s*\S+/gi,
      "$1=[REDACTED]",
    );
  router.post("/logs", (req, res) => {
    const service = text(req.body.service, 80),
      level = choice(req.body.level, ["INFO", "WARN", "ERROR"]),
      message = redact(text(req.body.message, 4000));
    const lid = Number(
      run(
        "INSERT INTO logs(owner,service,level,message,at) VALUES(?,?,?,?,?)",
        req.user.id,
        service,
        level,
        message,
        now(),
      ).lastInsertRowid,
    );
    run(
      "DELETE FROM logs WHERE owner=? AND id NOT IN (SELECT id FROM logs WHERE owner=? ORDER BY id DESC LIMIT 10000)",
      req.user.id,
      req.user.id,
    );
    publish("log", { id: lid }, req.user.id);
    res.status(201).json({ id: lid });
  });
  router.get("/logs", (req, res) => {
    const level = req.query.level
        ? choice(req.query.level, ["INFO", "WARN", "ERROR"])
        : null,
      q = String(req.query.q || "").slice(0, 100),
      before = req.query.before
        ? integer(req.query.before, 1)
        : Number.MAX_SAFE_INTEGER;
    res.json(
      all(
        "SELECT * FROM logs WHERE owner=? AND (? IS NULL OR level=?) AND message LIKE ? AND id<? ORDER BY id DESC LIMIT 100",
        req.user.id,
        level,
        level,
        "%" + q + "%",
        before,
      ),
    );
  });
  router.get("/stats", (req, res) =>
    res.json(
      all(
        "SELECT level,COUNT(*) count FROM logs WHERE owner=? GROUP BY level",
        req.user.id,
      ),
    ),
  );
  router.delete("/logs", (req, res) => {
    run("DELETE FROM logs WHERE owner=?", req.user.id);
    res.json({ ok: true });
  });
}
