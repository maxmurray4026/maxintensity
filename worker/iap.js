// StoreKit 2 transaction verification for the worker. The app sends the signed
// transaction (JWS) after a purchase or restore; we check the chain, the bundle
// and the product, then store the membership so web and app agree.
const BUNDLE = "com.maxintensity.app";
const PRODUCTS = new Set(["com.maxintensity.app.weekly", "com.maxintensity.app.monthly", "com.maxintensity.app.yearly"]);
const b64uDecode = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));

// Verifies the x5c chain leaf's signature over the JWS and returns the payload.
// The chain roots in the Apple Root CA G3 — pin its fingerprint below.
const APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";
export async function verifyJWS(jws) {
  const [h, p, s] = jws.split(".");
  const header = JSON.parse(new TextDecoder().decode(b64uDecode(h)));
  const chain = header.x5c || [];
  if (!chain.length) throw new Error("no certificate chain");
  const rootDer = b64uDecode(chain[chain.length - 1].replace(/-/g, "+").replace(/_/g, "/"));
  const fp = [...new Uint8Array(await crypto.subtle.digest("SHA-256", rootDer))].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (fp !== APPLE_ROOT_G3_SHA256) throw new Error("chain does not root in Apple Root CA G3");
  const leaf = b64uDecode(chain[0]);
  const spki = extractSPKI(leaf);
  const key = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64uDecode(s), new TextEncoder().encode(h + "." + p));
  if (!ok) throw new Error("bad signature");
  const payload = JSON.parse(new TextDecoder().decode(b64uDecode(p)));
  if (payload.bundleId !== BUNDLE) throw new Error("wrong bundle");
  if (!PRODUCTS.has(payload.productId)) throw new Error("unknown product");
  return payload; // { productId, originalTransactionId, expiresDate (ms), offerType, environment, ... }
}

// Minimal DER walk: find the SubjectPublicKeyInfo inside an X.509 certificate.
function extractSPKI(der) {
  // certificate → tbsCertificate → ... → subjectPublicKeyInfo (the first SEQUENCE containing the P-256 OID 1.2.840.10045.3.1.7)
  const oid = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];
  for (let i = 0; i < der.length - oid.length; i++) {
    if (oid.every((b, j) => der[i + j] === b)) {
      // walk back to the enclosing SEQUENCE start (0x30 … len)
      for (let k = i; k > 0; k--) {
        if (der[k] === 0x30) {
          const len = der[k + 1] & 0x80 ? ((der[k + 1] & 0x7f) === 1 ? der[k + 2] : (der[k + 2] << 8) | der[k + 3]) : der[k + 1];
          const hdr = der[k + 1] & 0x80 ? 2 + (der[k + 1] & 0x7f) : 2;
          const seq = der.slice(k, k + hdr + len);
          if (seq.includes(0x03) && len > 60 && len < 120) return seq; // SPKI for P-256 is ~91 bytes
        }
      }
    }
  }
  throw new Error("no P-256 public key in certificate");
}

export async function handleVerify(env, body) {
  const t = await verifyJWS(body.jws);
  const rec = { productId: t.productId, originalTransactionId: String(t.originalTransactionId), expires: t.expiresDate || 0, trial: t.offerType === 1, environment: t.environment, at: Date.now() };
  const key = body.handle ? `member:${String(body.handle).toLowerCase()}` : `member:tx:${rec.originalTransactionId}`;
  await env.MI_KV.put(key, JSON.stringify(rec));
  return { ok: true, member: !rec.expires || rec.expires > Date.now(), ...rec };
}

export async function handleRegister(env, body) {
  if (body.platform !== "ios" || !body.token) return { ok: false };
  await env.MI_KV.put(`push:ios:${body.handle ? String(body.handle).toLowerCase() : body.token}`, JSON.stringify({ token: body.token, at: Date.now() }));
  return { ok: true };
}
