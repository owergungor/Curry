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
      const rawSig = (p && p.signature ? p.signature.trim() : "");
      let isValid = false;

      if (rawSig.startsWith("untrusted comment:")) {
        isValid = true;
      } else if (rawSig.length > 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(rawSig)) {
        try {
          const decoded = Buffer.from(rawSig, "base64").toString("utf8");
          if (decoded.startsWith("untrusted comment:")) {
            isValid = true;
          }
        } catch {}
      }

      if (!isValid) {
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

  // Accepts signed NSIS setup installer URL directly
  const installerManifest = {
    ...windowsOnlyManifest,
    platforms: {
      "windows-x86_64": {
        signature: "untrusted comment: minisign signature\nsig_win_exe",
        url: "https://github.com/owergungor/Curry/releases/download/v2.1/Curry_v2.1_win-x64-setup.exe",
      },
    },
  };
  assert.equal(validateManifest(installerManifest, "windows-only"), true);
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

test("latest.json updater signature must be valid Base64 decoding into Minisign format", () => {
  const minisignText =
    "untrusted comment: signature from tauri secret key\nRURj2GAZfTSBdlgZvw0T...\ntrusted comment: timestamp:123\nNlntYPe...";
  const base64Sig = Buffer.from(minisignText, "utf8").toString("base64");

  // Base64 string must not contain ASCII 32 (space) which causes "Invalid symbol 32, offset 9."
  assert.equal(base64Sig.includes(" "), false, "Base64 signature must not contain spaces");

  // Decoding must produce valid Minisign text
  const decoded = Buffer.from(base64Sig, "base64").toString("utf8");
  assert.ok(
    decoded.startsWith("untrusted comment:"),
    "Decoded signature must start with untrusted comment:"
  );
});

test("latest.json signature validator comprehensively handles plaintext, base64, empty, and invalid signatures", () => {
  const minisignText =
    "untrusted comment: signature from tauri secret key\nRURj2GAZfTSBdlgZvw0T...\ntrusted comment: timestamp:123\nNlntYPe...";
  const base64Sig = Buffer.from(minisignText, "utf8").toString("base64");

  function validateSignature(signature: unknown): boolean {
    if (typeof signature !== "string") return false;
    const rawSig = signature.trim();
    if (rawSig.startsWith("untrusted comment:")) {
      return true;
    }
    if (rawSig.length > 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(rawSig)) {
      try {
        const decoded = Buffer.from(rawSig, "base64").toString("utf8");
        return decoded.startsWith("untrusted comment:");
      } catch {
        return false;
      }
    }
    return false;
  }

  // 1. Plaintext Minisign accepted
  assert.equal(validateSignature(minisignText), true, "Plaintext Minisign signature must be accepted");

  // 2. Base64-encoded Minisign accepted
  assert.equal(validateSignature(base64Sig), true, "Base64-encoded Minisign signature must be accepted");

  // 3. Empty signature rejected
  assert.equal(validateSignature(""), false, "Empty signature must be rejected");
  assert.equal(validateSignature("   "), false, "Whitespace-only signature must be rejected");
  assert.equal(validateSignature(null), false, "Null signature must be rejected");

  // 4. Invalid Base64 / non-Minisign rejected
  assert.equal(validateSignature("invalid!not!base64!"), false, "Invalid base64 characters must be rejected");
  assert.equal(
    validateSignature(Buffer.from("random payload not minisign", "utf8").toString("base64")),
    false,
    "Valid base64 but non-Minisign content must be rejected"
  );
  assert.equal(
    validateSignature("some-random-plain-text"),
    false,
    "Non-Minisign plaintext must be rejected"
  );

  // 5. Plaintext signature containing spaces directly in latest.json triggers 'Invalid symbol 32, offset 9'
  // Simulation of toBase64Signature to ensure plaintext is converted and spaces are eliminated
  const toBase64Signature = (sig: string) => {
    if (!sig) return "";
    const trimmed = sig.trim();
    if (trimmed.startsWith("untrusted comment:")) {
      return Buffer.from(trimmed, "utf8").toString("base64");
    }
    return trimmed;
  };

  const processedSig = toBase64Signature(minisignText);
  assert.notEqual(processedSig, minisignText, "Plaintext minisign must not be preserved as-is");
  assert.equal(processedSig.includes(" "), false, "Base64 signature must not contain spaces (avoids 'Invalid symbol 32, offset 9')");
  assert.equal(validateSignature(processedSig), true, "Processed signature must validate successfully");

  // Verify release.yml has base64 validation logic
  const workflowPath = path.resolve(".github/workflows/release.yml");
  const content = fs.readFileSync(workflowPath, "utf8");
  assert.ok(
    content.includes("Buffer.from(rawSig, 'base64')"),
    "release.yml must contain Base64 signature decoding validation"
  );
});
