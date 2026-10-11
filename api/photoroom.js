// api/photoroom.js — كيحيد خلفية صورة المنتوج بـ Photoroom (خطة Basic: /v1/segment).
// المفتاح كيتقرا من Vercel (Environment Variable: PHOTOROOM_API_KEY) —
// ماكاينش مكتوب فالكود وماكيوصلش أبداً للتيليفون.
// كياخد الصورة (JPEG) وكيرجع نفس الصورة بلا خلفية (WebP شفاف، نفس الأبعاد).

const PHOTOROOM_URL = "https://sdk.photoroom.com/v1/segment";
const MAX_BYTES = 4 * 1024 * 1024; // Vercel كيرفض أكثر من 4.5MB

// غير التطبيق ديالنا (نفس الموقع) اللي يقدر يستعمل هاد الرابط
function sameOrigin(req) {
  const host = req.headers.host;
  const src = req.headers.origin || req.headers.referer;
  if (!host || !src) return false;
  try {
    return new URL(src).host === host;
  } catch {
    return false;
  }
}

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });

  const key = process.env.PHOTOROOM_API_KEY;
  if (!key) return res.status(500).json({ error: "PHOTOROOM_API_KEY missing" });

  let input;
  try {
    input = await readBody(req);
  } catch {
    return res.status(400).json({ error: "bad body" });
  }
  if (!input || !input.length || input.length > MAX_BYTES) {
    return res.status(413).json({ error: "image empty or too large" });
  }

  try {
    const form = new FormData();
    form.append("image_file", new Blob([input], { type: "image/jpeg" }), "image.jpg");
    form.append("format", "webp");
    const r = await fetch(PHOTOROOM_URL, {
      method: "POST",
      headers: { "x-api-key": key },
      body: form,
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) {
      const detail = (await r.text().catch(() => "")).slice(0, 300);
      return res.status(502).json({ error: "photoroom failed", status: r.status, detail });
    }
    const out = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/webp");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(out);
  } catch (err) {
    return res.status(502).json({ error: "photoroom unreachable", detail: String((err && err.message) || err).slice(0, 200) });
  }
}
