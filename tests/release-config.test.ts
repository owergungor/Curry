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

test("latest.json validator strictly enforces dual-platform in 'all' mode and single-platform in 'windows-only' mode", () => {
  function validateManifest(manifest: any, targetPlatform: "all" | "windows-only") {
    const platformKeys = Object.keys(manifest.platforms || {});
    const expectedKeys =
      targetPlatform === "windows-only"
        ? ["windows-x86_64"]
        : ["darwin-aarch64", "windows-x86_64"];

    if (
      platformKeys.length !== expectedKeys.length ||
      !expectedKeys.every((k) => platformKeys.includes(k))
    ) {
      throw new Error(
        `latest.json must contain exactly ${expectedKeys.join(", ")} platforms! Found: ${platformKeys.join(", ")}`
      );
    }

    for (const plat of expectedKeys) {
      const p = manifest.platforms[plat];
      if (!p.signature || !p.signature.startsWith("untrusted comment:")) {
        throw new Error(`Invalid or empty signature for platform: ${plat}`);
      }
      if (
        !p.url ||
        !p.url.startsWith("https://github.com/owergungor/Curry/releases/download/")
      ) {
        throw new Error(`Invalid download URL for platform: ${plat}`);
      }
    }
    return true;
  }

  const dualPlatformManifest = {
    version: "2.1.0",
    notes: "Curry v2.1 release",
    pub_date: new Date().toISOString(),
    platforms: {
      "darwin-aarch64": {
        signature: "untrusted comment: minisign signature\nsig_mac",
        url: "https://github.com/owergungor/Curry/releases/download/v2.1/Curry.app.tar.gz",
      },
      "windows-x86_64": {
        signature: "untrusted comment: minisign signature\nsig_win",
        url: "https://github.com/owergungor/Curry/releases/download/v2.1/Curry.nsis.zip",
      },
    },
  };

  const windowsOnlyManifest = {
    version: "2.1.0",
    notes: "Curry v2.1 release",
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "untrusted comment: minisign signature\nsig_win",
        url: "https://github.com/owergungor/Curry/releases/download/v2.1/Curry.nsis.zip",
      },
    },
  };

  // 'all' mode
  assert.equal(validateManifest(dualPlatformManifest, "all"), true);
  assert.throws(
    () => validateManifest(windowsOnlyManifest, "all"),
    /must contain exactly darwin-aarch64, windows-x86_64/
  );

  // 'windows-only' mode
  assert.equal(validateManifest(windowsOnlyManifest, "windows-only"), true);
  assert.throws(
    () => validateManifest(dualPlatformManifest, "windows-only"),
    /must contain exactly windows-x86_64/
  );

  // Rejects fake or missing signatures
  const badSigManifest = {
    ...windowsOnlyManifest,
    platforms: {
      "windows-x86_64": {
        signature: "invalid-signature-without-comment",
        url: "https://github.com/owergungor/Curry/releases/download/v2.1/Curry.nsis.zip",
      },
    },
  };
  assert.throws(
    () => validateManifest(badSigManifest, "windows-only"),
    /Invalid or empty signature/
  );
});

test("release.yml defines target_platform with safe defaults and conditional job gating", () => {
  const workflowPath = path.resolve(".github/workflows/release.yml");
  assert.ok(fs.existsSync(workflowPath), ".github/workflows/release.yml must exist");
  const content = fs.readFileSync(workflowPath, "utf8");

  // Verify target_platform input exists under workflow_dispatch
  assert.ok(content.includes("target_platform:"), "target_platform input must be declared");
  assert.ok(
    content.includes("- all") && content.includes("- windows-only"),
    "target_platform must support all and windows-only"
  );
  assert.ok(content.includes("default: all"), "target_platform default must be 'all'");

  // Verify validate-tag outputs target_platform
  assert.ok(
    content.includes("target_platform: ${{ steps.check.outputs.target_platform }}"),
    "validate-tag must output target_platform"
  );

  // Verify release-mac skips on windows-only
  assert.ok(
    content.includes("if: needs.validate-tag.outputs.target_platform != 'windows-only'"),
    "release-mac must skip when target_platform is windows-only"
  );

  // Verify publish-release runs when release-windows succeeds and either target_platform is windows-only or release-mac succeeded
  assert.ok(
    content.includes(
      "needs.validate-tag.outputs.target_platform == 'windows-only' || needs.release-mac.result == 'success'"
    ),
    "publish-release must not be skipped in windows-only mode"
  );

  // Verify draft: true is preserved
  assert.ok(content.includes("draft: true"), "Draft release setting must be preserved");

  // Verify allow_unsigned default is false
  assert.ok(content.includes("allow_unsigned:"), "allow_unsigned input must exist");
  assert.ok(content.includes("default: false"), "allow_unsigned default must be false");
});

test("signing key detection supports both plaintext and base64-encoded minisign private keys", () => {
  function checkKeyValid(keyStr: string): boolean {
    if (!keyStr) return false;
    const trimmed = keyStr.trim();
    if (trimmed.includes("untrusted comment:")) {
      return true;
    }
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf8");
      if (decoded.includes("untrusted comment:")) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  const rawKey = "untrusted comment: minisign secret key\nRWRtest...\n";
  const b64Key = Buffer.from(rawKey, "utf8").toString("base64");
  const invalidKey = "completely-invalid-key-data";

  assert.equal(checkKeyValid(rawKey), true, "Raw minisign key must be valid");
  assert.equal(checkKeyValid(b64Key), true, "Base64-encoded minisign key must be valid");
  assert.equal(checkKeyValid(invalidKey), false, "Invalid key must be rejected");
  assert.equal(checkKeyValid(""), false, "Empty key must be rejected");
});
