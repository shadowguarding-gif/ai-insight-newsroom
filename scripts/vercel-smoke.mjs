const deploymentUrl = process.argv[2] || "";

if (!deploymentUrl) {
  console.error("Usage: node scripts/vercel-smoke.mjs <deployment-url>");
  process.exit(1);
}

async function checkJson(pathname) {
  const response = await fetch(new URL(pathname, deploymentUrl));
  const text = await response.text();

  return {
    pathname,
    status: response.status,
    ok: response.ok,
    preview: text.slice(0, 200)
  };
}

const checks = await Promise.all([
  checkJson("/api/news"),
  checkJson("/api/account?action=session")
]);

console.log(JSON.stringify(checks, null, 2));
