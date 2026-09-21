// APNs sender for Cloudflare Workers — ES256 JWT with the .p8 key, HTTP/2 push.
// send(env, token, { title, body, url, badge }) → Response
let cached = { jwt: "", at: 0 };
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function jwt(env) {
  if (cached.jwt && Date.now() - cached.at < 50 * 60 * 1000) return cached.jwt;
  const pem = env.APNS_KEY_P8.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const enc = new TextEncoder();
  const head = b64u(enc.encode(JSON.stringify({ alg: "ES256", kid: env.APNS_KEY_ID })));
  const body = b64u(enc.encode(JSON.stringify({ iss: env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body));
  cached = { jwt: head + "." + body + "." + b64u(sig), at: Date.now() };
  return cached.jwt;
}
export async function send(env, token, { title, body, url, badge, collapseId }) {
  const host = env.APNS_ENV === "production" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  return fetch(`${host}/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${await jwt(env)}`,
      "apns-topic": env.APNS_TOPIC || "com.maxintensity.app",
      "apns-push-type": "alert",
      "apns-priority": "10",
      ...(collapseId ? { "apns-collapse-id": collapseId } : {}),
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default", ...(badge != null ? { badge } : {}) }, url: url || "./" }),
  });
}
