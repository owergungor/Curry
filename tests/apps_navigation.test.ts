import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pagePath = path.resolve(process.cwd(), "src/routes/+page.svelte");
const page = fs.readFileSync(pagePath, "utf8");

test("Apps navigation button selects the applications tab and its view renders", () => {
  assert.match(page, /id="tab-applications-btn"/);
  assert.match(page, /onclick=\{\(\) => navigateToTab\("applications"\)\}/);
  assert.match(page, /function navigateToTab\(target: TabKey\)\s*\{[\s\S]*?activeTab = target;/);
  assert.match(page, /\{:else if activeTab === "applications"\}[\s\S]*?<div class="view-container applications-view">/);
  assert.match(page, /aria-current=\{activeTab === 'applications' \? 'page' : undefined\}/);
  assert.doesNotMatch(page.match(/<button\s+id="tab-applications-btn"[\s\S]*?<\/button>/)?.[0] ?? "", /\bdisabled(?:=|\s|>)/);
});

test("Apps scan results and actions stay available in the rendered Apps view", () => {
  const appsBranch = page.match(/\{:else if activeTab === "applications"\}([\s\S]*?)\{:else if activeTab === "glow"\}/)?.[1];
  assert.ok(appsBranch, "Applications conditional branch should be present");
  assert.match(appsBranch, /id="scan-applications-btn"[\s\S]*?onclick=\{triggerAppScan\}/);
  assert.match(appsBranch, /\{#if scanStatusBanner\}[\s\S]*?scan-status-banner/);
  assert.match(appsBranch, /id="add-application-btn"[\s\S]*?onclick=\{openAddProfileModal\}/);
  assert.match(appsBranch, /\{#each filteredProfiles as profile/);
});

test("Apps scan and add actions use translations in every supported language", () => {
  assert.match(page, /isScanningApps \? t\('apps\.scanning'\) : t\('apps\.scan_btn'\)/);
  assert.match(page, /\+ \{t\('apps\.add_profile'\)\}/);
});
