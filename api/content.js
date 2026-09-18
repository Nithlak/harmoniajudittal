export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (!globalThis.__HJ_USERS) {
    globalThis.__HJ_USERS = [{ name: "Judit2026", pass: "TMMT2026" }];
  }

  if (req.method === "GET") {
    if (!globalThis.__HJ_CONTENT) {
      res.status(404).json({ ok: false });
      return;
    }
    res.status(200).json(globalThis.__HJ_CONTENT);
    return;
  }

  if (req.method === "POST") {
    var body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};
    var allowed = (globalThis.__HJ_USERS || []).some(function (row) {
      return row && row.name === body.user && row.pass === body.pass;
    });
    if (!allowed || !body.content) {
      res.status(401).json({ ok: false });
      return;
    }
    if (Array.isArray(body.users) && body.users.length) {
      globalThis.__HJ_USERS = body.users;
    }
    globalThis.__HJ_CONTENT = body.content;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false });
}
