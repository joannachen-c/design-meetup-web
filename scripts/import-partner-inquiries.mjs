import { config } from "dotenv";
import { siteUrl } from "../src/lib/site.ts";
import { importPartnerInquiriesFromGmail } from "../src/lib/partner-inquiry-import.ts";

config({ path: ".env.local" });
config();

const PRODUCTION_IMPORT_URL = `${siteUrl}/api/contact/import`;

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

async function importViaProduction(token, dryRun) {
  if (dryRun) {
    console.log(
      "Dry run cannot call production (it would write rows). Skipping.",
    );
    return;
  }

  const response = await fetch(PRODUCTION_IMPORT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `Production import returned HTTP ${response.status}. Is production deployed?`,
    );
  }
  let result = {};
  try {
    result = JSON.parse(body);
  } catch {
    result = {};
  }
  const inserted = Number(result.inserted) || 0;
  const skipped = Number(result.skipped) || 0;
  const found = Number(result.found) || 0;
  console.log(
    `Imported ${inserted} partner inquir${inserted === 1 ? "y" : "ies"} (${skipped} already present, ${found} found).`,
  );
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const password = process.env.GMAIL_APP_PASSWORD;
  const token = process.env.VERCEL_TOKEN;

  if (password) {
    console.log("Reading partner inquiries from Gmail…");
    const result = await importPartnerInquiriesFromGmail({ dryRun });
    if (dryRun) {
      console.log(`Found ${result.found} unique inquiry email(s).`);
      console.log("Dry run — no rows written.");
      return;
    }
    console.log(
      `Imported ${result.inserted} partner inquir${result.inserted === 1 ? "y" : "ies"} (${result.skipped} already present).`,
    );
    return;
  }

  if (token) {
    console.log("Gmail secrets are Vercel-only; calling production import…");
    await importViaProduction(token, dryRun);
    return;
  }

  console.error(
    [
      "GMAIL_APP_PASSWORD is a Vercel Sensitive env var, so it cannot be pulled locally.",
      "The GitHub Action calls production, where Gmail and Supabase keys already exist:",
      "",
      "  gh workflow run \"Import partner inquiries\"",
      "",
      "Or POST with the same Vercel token used for deploys:",
      "",
      `  curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" ${PRODUCTION_IMPORT_URL}`,
    ].join("\n"),
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
