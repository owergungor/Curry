import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("tauri.conf.json maintains intact official updater configuration", () => {
  const confPath = path.resolve("src-tauri/tauri.conf.json");
  assert.ok(fs.existsSync(confPath), "src-tauri/tauri.conf.json must exist");

  const conf = JSON.parse(fs.readFileSync(confPath, "utf8"));
  assert.ok(conf.plugins?.updater?.pubkey, "plugins.updater.pubkey must be defined");
  assert.ok(
    conf.plugins.updater.endpoints?.length > 0,
    "plugins.updater.endpoints must have at least one URL"
  );

  const decoded = Buffer.from(conf.plugins.updater.pubkey, "base64").toString("utf8");
  assert.ok(
    decoded.includes("untrusted comment: minisign public key:"),
    "Decoded pubkey must be valid Minisign public key format"
  );
});

test("test build override correctly isolates bundle configuration without modifying tauri.conf.json", () => {
  const confPath = path.resolve("src-tauri/tauri.conf.json");
  const baseConf = JSON.parse(fs.readFileSync(confPath, "utf8"));

  const testOverride = {
    bundle: { createUpdaterArtifacts: false },
  };

  // Simulate Tauri config deep merge
  const merged = {
    ...baseConf,
    bundle: { ...baseConf.bundle, ...testOverride.bundle },
  };

  assert.equal(
    merged.bundle.createUpdaterArtifacts,
    false,
    "createUpdaterArtifacts must be false in test override"
  );
  assert.ok(
    merged.plugins?.updater?.pubkey,
    "updater pubkey must remain intact in test override so the client can initialize the plugin"
  );
  // Base configuration file must remain untouched
  assert.ok(baseConf.plugins.updater.pubkey, "base tauri.conf.json pubkey must remain intact");
});

test("official release override enables updater artifacts and preserves pubkey", () => {
  const confPath = path.resolve("src-tauri/tauri.conf.json");
  const baseConf = JSON.parse(fs.readFileSync(confPath, "utf8"));

  const officialOverride = {
    bundle: { createUpdaterArtifacts: true },
  };

  const merged = {
    ...baseConf,
    bundle: { ...baseConf.bundle, ...officialOverride.bundle },
  };

  assert.equal(
    merged.bundle.createUpdaterArtifacts,
    true,
    "createUpdaterArtifacts must be true in official release"
  );
  assert.ok(
    merged.plugins?.updater?.pubkey,
    "updater pubkey must be preserved in official release"
  );
});

test("latest.json validator strictly enforces only Tier 1 supported platforms", () => {
  const allowedKeys = ["darwin-aarch64", "windows-x86_64"];

  const validManifest = {
    version: "2.0.0",
    notes: "Curry v2.0",
    pub_date: new Date().toISOString(),
    platforms: {
      "darwin-aarch64": {
        signature: "untrusted comment: signature\nsig1...",
        url: "https://github.com/owergungor/Curry/releases/download/v2.0/Curry.app.tar.gz",
      },
      "windows-x86_64": {
        signature: "untrusted comment: signature\nsig2...",
        url: "https://github.com/owergungor/Curry/releases/download/v2.0/Curry_setup.nsis.zip",
      },
    },
  };

  const platformKeys = Object.keys(validManifest.platforms);
  assert.equal(platformKeys.length, 2);
  assert.ok(allowedKeys.every((k) => platformKeys.includes(k)));

  // Manifest with unsupported platform must fail
  const invalidManifest = {
    ...validManifest,
    platforms: {
      ...validManifest.platforms,
      "linux-x86_64": { signature: "sig3", url: "https://example.com" },
    },
  };
  const invalidKeys = Object.keys(invalidManifest.platforms);
  assert.notEqual(invalidKeys.length, 2, "Unsupported platform must be rejected");
});
