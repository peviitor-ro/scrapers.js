const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const EXCLUDE = new Set(["main.js"]);
const SITES_DIR = path.resolve(__dirname, "sites");
const REPO_ROOT = __dirname;
const REPAIR_TIMEOUT_SECONDS = Number.parseInt(
  process.env.OPENCODE_REPAIR_TIMEOUT || "900",
  10,
);
const MAX_LOG_LENGTH = 4000;

function commandExists(command) {
  const action = spawnSync(command, ["--version"], {
    encoding: "utf8",
  });

  return !action.error;
}

function snapshotSiblingFiles(scriptPath) {
  return new Set(
    fs.readdirSync(path.dirname(scriptPath)).filter((name) => {
      const siblingPath = path.join(path.dirname(scriptPath), name);
      const stats = fs.lstatSync(siblingPath);
      return stats.isFile() || stats.isSymbolicLink();
    }),
  );
}

function cleanupCreatedSiblingFiles(scriptPath, existingFiles) {
  const currentFiles = snapshotSiblingFiles(scriptPath);
  const createdFiles = [...currentFiles]
    .filter((fileName) => !existingFiles.has(fileName))
    .sort();

  for (const fileName of createdFiles) {
    const createdFile = path.join(path.dirname(scriptPath), fileName);
    if (createdFile === scriptPath) {
      continue;
    }

    fs.rmSync(createdFile, { force: true });
    console.log(`Deleted extra file ${path.basename(createdFile)}`);
  }
}

function truncateOutput(content, limit = MAX_LOG_LENGTH) {
  if (!content) {
    return "No output captured.";
  }

  const trimmed = String(content).trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }

  return `${trimmed.slice(0, limit)}\n...[truncated]`;
}

function normalizeActionResult(action) {
  const stdout = action.stdout || "";
  const stderr = action.stderr || "";
  const timedOut = action.error && action.error.code === "ETIMEDOUT";

  return {
    stdout,
    stderr,
    timedOut,
    returncode: timedOut ? 1 : action.status ?? 1,
  };
}

function runScraper(scriptPath) {
  return normalizeActionResult(
    spawnSync(process.execPath, [scriptPath], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    }),
  );
}

function getScriptPath(scraperName) {
  const scriptName = scraperName.endsWith(".js")
    ? scraperName
    : `${scraperName}.js`;
  const scriptPath = path.join(SITES_DIR, scriptName);

  if (EXCLUDE.has(scriptName)) {
    throw new Error(`${scriptName} cannot be tested manually.`);
  }

  if (!fs.existsSync(scriptPath) || !fs.statSync(scriptPath).isFile()) {
    throw new Error(`Scraper not found: ${scriptName}`);
  }

  return scriptPath;
}

function repairScraperWithOpencode(scriptPath, failedAction) {
  if (!commandExists("opencode")) {
    console.log(
      `OpenCode is not installed. Skipping auto-repair for ${path.basename(
        scriptPath,
      )}.`,
    );
    return false;
  }

  const stderrOutput = truncateOutput(failedAction.stderr);
  const stdoutOutput = truncateOutput(failedAction.stdout);
  const relativeScriptPath = path.relative(REPO_ROOT, scriptPath);
  const prompt = `Fix the failing scraper \`${relativeScriptPath}\`. Use the attached context file for the traceback and rerun the scraper until it exits successfully.`;

  const repairContext = `Scraper: ${relativeScriptPath}
Run command: ${process.execPath} ${relativeScriptPath}

Requirements:
- Fix only what is needed for this scraper to run correctly.
- Preserve the existing scraper behavior and output schema.
- Keep changes focused; avoid unrelated edits.
- Re-run the scraper after your fix and stop only when it exits successfully.

Captured stderr:
\`\`\`
${stderrOutput}
\`\`\`

Captured stdout:
\`\`\`
${stdoutOutput}
\`\`\``;

  let contextFilePath;

  try {
    console.log(`Starting OpenCode repair for ${path.basename(scriptPath)}...`);

    contextFilePath = path.join(
      os.tmpdir(),
      `${path.basename(
        scriptPath,
        ".js",
      )}_${Date.now()}_opencode_repair_context.md`,
    );
    fs.writeFileSync(contextFilePath, repairContext, "utf8");

    const action = normalizeActionResult(
      spawnSync(
        "opencode",
        [
          "run",
          "--dir",
          REPO_ROOT,
          "-f",
          scriptPath,
          "-f",
          contextFilePath,
          "--",
          prompt,
        ],
        {
          cwd: REPO_ROOT,
          encoding: "utf8",
          timeout: REPAIR_TIMEOUT_SECONDS * 1000,
        },
      ),
    );

    if (action.timedOut) {
      console.log(
        `OpenCode repair timed out for ${path.basename(scriptPath)}.`,
      );
      return false;
    }

    if (action.returncode !== 0) {
      const opencodeError = truncateOutput(action.stderr || action.stdout);
      console.log(`OpenCode could not repair ${path.basename(scriptPath)}.`);
      console.log(opencodeError);
      return false;
    }
  } finally {
    if (contextFilePath && fs.existsSync(contextFilePath)) {
      fs.rmSync(contextFilePath, { force: true });
    }
  }

  console.log(`OpenCode repair finished for ${path.basename(scriptPath)}.`);
  return true;
}

function testScraperRepair(scraperName) {
  let scriptPath;

  try {
    scriptPath = getScriptPath(scraperName);
  } catch (error) {
    console.log(error.message);
    return false;
  }

  let existingFiles = snapshotSiblingFiles(scriptPath);
  let action = runScraper(scriptPath);
  cleanupCreatedSiblingFiles(scriptPath, existingFiles);

  if (action.returncode === 0) {
    console.log(`Scraper ${path.basename(scriptPath)} already works.`);
    return true;
  }

  console.log(`Error scraping ${path.basename(scriptPath)}`);
  console.log(truncateOutput(action.stderr));

  if (!repairScraperWithOpencode(scriptPath, action)) {
    return false;
  }

  existingFiles = snapshotSiblingFiles(scriptPath);
  action = runScraper(scriptPath);
  cleanupCreatedSiblingFiles(scriptPath, existingFiles);

  if (action.returncode === 0) {
    console.log(
      `Success scraping after auto-repair ${path.basename(scriptPath)}`,
    );
    return true;
  }

  console.log(`Auto-repair did not fix ${path.basename(scriptPath)}`);
  console.log(truncateOutput(action.stderr));
  return false;
}

function main() {
  for (const site of fs.readdirSync(SITES_DIR).sort()) {
    if (!site.endsWith(".js") || EXCLUDE.has(site)) {
      continue;
    }

    const scriptPath = path.join(SITES_DIR, site);
    const existingFiles = snapshotSiblingFiles(scriptPath);
    const action = runScraper(scriptPath);
    cleanupCreatedSiblingFiles(scriptPath, existingFiles);

    if (action.returncode === 0) {
      console.log(`Success scraping ${site}`);
      continue;
    }

    console.log(`Error scraping ${site}`);
    console.log(truncateOutput(action.stderr));

    if (!repairScraperWithOpencode(scriptPath, action)) {
      continue;
    }

    const repairedExistingFiles = snapshotSiblingFiles(scriptPath);
    const repairedAction = runScraper(scriptPath);
    cleanupCreatedSiblingFiles(scriptPath, repairedExistingFiles);

    if (repairedAction.returncode === 0) {
      console.log(`Success scraping after auto-repair ${site}`);
    } else {
      console.log(`Auto-repair did not fix ${site}`);
      console.log(truncateOutput(repairedAction.stderr));
    }
  }
}

if (process.argv.length > 2) {
  testScraperRepair(process.argv[2]);
} else {
  main();
}
