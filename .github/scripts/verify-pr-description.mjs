import { readFileSync } from 'fs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.log("⚠️ GITHUB_EVENT_PATH is not defined. Skipping PR description check (probably running locally or in non-PR context).");
  process.exit(0);
}

try {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const prBody = event.pull_request?.body || "";

  let failed = false;

  // Check that email is filled in (not empty after "- Email:")
  // Use [^\S\r\n]* (whitespace except newlines) to avoid consuming line breaks
  const emailMatch = prBody.match(/-\s*Email:[^\S\r\n]*([^\r\n]+)/);
  const hasEmail = Boolean(emailMatch && emailMatch[1].trim().length > 0);

  if (!hasEmail) {
    console.error("❌ Error: You must provide your email in the PR description!");
    failed = true;
  } else {
    console.log("✅ Verified: Email is provided in the PR description.");
  }

  // Regex matches "- [x] Product", "- [X] Developer", with optional whitespace variations
  const hasRoleChecked = /-\s*\[[xX]\]\s*(Product|Developer)/.test(prBody);

  if (!hasRoleChecked) {
    console.error("❌ Error: You must select at least one role (Product or Developer) in the PR description!");
    failed = true;
  } else {
    console.log("✅ Verified: At least one role (Product or Developer) is selected in the PR description.");
  }

  if (failed) {
    console.error("\nPlease edit the pull request description to fix the above issues.");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to parse GitHub event payload or verify PR description:", error);
  process.exit(1);
}
