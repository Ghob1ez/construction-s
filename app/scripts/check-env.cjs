const keys = ["DATABASE_URL", "DIRECT_DATABASE_URL"];
let ok = true;
for (const k of keys) {
  const present = !!process.env[k];
  console.log(`[env] ${k}: ${present ? "present" : "MISSING"}`);
  if (!present) ok = false;
}
if (!ok) {
  console.error("❌ Missing env(s). Ensure they’re set for Production with Build + Runtime in Vercel.");
  process.exit(1);
}
