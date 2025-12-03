import http from "node:http";
import { URL } from "node:url";

const PORT = process.env.PORT || 3001;

let cachedToken = null;
let tokenExpiresAt = 0;

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,authorization");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    const secs = Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000));
    console.log(`[token] using cached token, expires in ${secs}s`);
    return { access_token: cachedToken, expires_in: secs };
  }
  const clientId = "48158965-8f06-4a0f-ac6f-f66735c0984b";
  const clientSecret = "aY2aASnH8TWNUBix0xdvmf7mcfjNzLDX";
  if (!clientId || !clientSecret) throw new Error("Missing credentials");
  console.log(`[token] fetching new token`);
  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "client_credentials");
  const res = await fetch("https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[token] error status=${res.status} body=${JSON.stringify(data)}`);
    throw new Error(String(data?.error_description || data?.error || res.statusText || "Token error"));
  }
  const accessToken = data?.access_token;
  const expiresIn = Number(data?.expires_in ?? 300);
  if (!accessToken) throw new Error("No access_token");
  cachedToken = accessToken;
  tokenExpiresAt = Date.now() + Math.max(0, (expiresIn - 30)) * 1000;
  console.log(`[token] obtained, expires_in=${expiresIn}s, buffer applied`);
  return { access_token: accessToken, expires_in: expiresIn };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 200, {});
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    console.log(`[req] ${req.method} ${url.pathname}`);
    if (req.method === "GET" && url.pathname === "/api/ping") return json(res, 200, { ok: true });
    if (req.method === "POST" && url.pathname === "/api/flutterwave/token") {
      const tok = await getToken();
      console.log(`[resp] /api/flutterwave/token expires_in=${tok.expires_in}s`);
      return json(res, 200, tok);
    }
    if (req.method === "POST" && url.pathname === "/api/flutterwave/direct-charges") {
      const payload = await readBody(req);
      const summary = {
        amount: payload?.amount,
        currency: payload?.currency,
        network: payload?.payment_method?.mobile_money?.network,
      };
      console.log(`[charge] payload ${JSON.stringify(summary)}`);
      const tok = await getToken();
      console.log(tok);
      const fw = await fetch("https://f4bexperience.flutterwave.com/orchestration/direct-charges", {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${tok.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await fw.json().catch(() => ({}));
      if (!fw.ok) {
        console.error(`[charge] error status=${fw.status} body=${JSON.stringify(data)}`);
        return json(res, fw.status, { error: data?.error?.message || fw.statusText || "Charge error" });
      }
      console.log(`[charge] success status=${fw.status}`);
      return json(res, 200, data);
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/flutterwave/charges/")) {
      const id = url.pathname.split("/api/flutterwave/charges/")[1];
      if (!id) return json(res, 400, { error: "Missing charge id" });
      const tok = await getToken();
      const fw = await fetch(`https://f4bexperience.flutterwave.com/charges/${id}`, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${tok.access_token}`,
        },
      });
      const data = await fw.json().catch(() => ({}));
      if (!fw.ok) return json(res, fw.status, { error: data?.error?.message || fw.statusText || "Verify error" });
      return json(res, 200, data);
    }
    console.warn(`[req] not found ${url.pathname}`);
    return json(res, 404, { error: "Not found" });
  } catch (e) {
    console.error(`[server] exception ${String(e?.message || e)}`);
    return json(res, 500, { error: String(e?.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
