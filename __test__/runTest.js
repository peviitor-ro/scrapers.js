#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Get the list of modified files from git diff against upstream/main
 * Falls back to origin/main if upstream is not configured
 */
function getModifiedFiles() {
  try {
    // Try to fetch upstream first
    try {
      execSync("git fetch upstream", { stdio: "ignore" });
      console.log("✓ Fetched upstream");
    } catch (error) {
      // upstream might not be configured, try origin
      try {
        execSync("git fetch origin", { stdio: "ignore" });
        console.log("✓ Fetched origin (upstream not configured)");
      } catch (fetchError) {
        console.log("⚠ Could not fetch, using local refs");
      }
    }

    // Try upstream/main first, then fall back to origin/main, then HEAD
    let diffOutput;
    try {
      diffOutput = execSync("git diff upstream/main --name-only", {
        encoding: "utf8",
      });
    } catch (error) {
      try {
        diffOutput = execSync("git diff origin/main --name-only", {
          encoding: "utf8",
        });
      } catch (error2) {
        // Fall back to comparing with HEAD or just list all files in sites/
        try {
          diffOutput = execSync("git diff HEAD --name-only", {
            encoding: "utf8",
          });
        } catch (error3) {
          // If all else fails, return empty
          return [];
        }
      }
    }

    // Filter for files in sites/ directory with .js extension
    const files = diffOutput
      .split("\n")
      .filter((file) => file.startsWith("sites/") && file.endsWith(".js"))
      .map((file) => file.trim());

    return files;
  } catch (error) {
    console.error("Error getting modified files:", error.message);
    return [];
  }
}

/**
 * Execute a scraper and capture its JSON output
 */
function executeScraperAndGetJSON(filePath) {
  try {
    console.log(`\n📝 Testing: ${filePath}`);

    // Execute the scraper using node
    const output = execSync(`node ${filePath}`, {
      encoding: "utf8",
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Extract JSON array from output
    // Look for pattern [...] in the output
    const jsonMatch = output.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No JSON array found in scraper output");
    }

    const jsonStr = jsonMatch[0];
    const jobs = JSON.parse(jsonStr);

    return { success: true, jobs };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr ? error.stderr.toString() : "",
    };
  }
}

/**
 * Validate a job object against the schema
 */
function validateJob(job, index) {
  const errors = [];

  // Required keys
  const requiredKeys = ["job_title", "job_link", "country"];
  // Optional keys
  const optionalKeys = ["city", "county", "remote"];
  // All allowed keys
  const allowedKeys = [...requiredKeys, ...optionalKeys];

  // Check for required keys
  for (const key of requiredKeys) {
    if (!(key in job)) {
      errors.push(`Job ${index}: Missing required key "${key}"`);
    } else if (
      job[key] === null ||
      job[key] === undefined ||
      job[key] === ""
    ) {
      errors.push(`Job ${index}: Required key "${key}" is empty or null`);
    }
  }

  // Check for extra keys
  const jobKeys = Object.keys(job);
  for (const key of jobKeys) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Job ${index}: Unexpected key "${key}"`);
    }
  }

  // Validate remote field if present
  if ("remote" in job) {
    if (!Array.isArray(job.remote)) {
      errors.push(`Job ${index}: "remote" must be an array`);
    } else {
      const validRemoteValues = ["remote", "on-site", "hybrid"];
      for (const value of job.remote) {
        if (typeof value !== "string") {
          errors.push(
            `Job ${index}: "remote" values must be strings, got ${typeof value}`
          );
        } else if (value !== value.toLowerCase()) {
          errors.push(
            `Job ${index}: "remote" value "${value}" must be lowercase`
          );
        } else if (!validRemoteValues.includes(value)) {
          errors.push(
            `Job ${index}: "remote" value "${value}" is not valid. Must be one of: ${validRemoteValues.join(
              ", "
            )}`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Validate all jobs in the array
 */
function validateJobs(jobs) {
  const errors = [];

  if (!Array.isArray(jobs)) {
    errors.push("Output is not an array");
    return errors;
  }

  if (jobs.length === 0) {
    errors.push("Jobs array is empty");
    return errors;
  }

  jobs.forEach((job, index) => {
    const jobErrors = validateJob(job, index + 1);
    errors.push(...jobErrors);
  });

  return errors;
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Scraper Validation Script");
  console.log("============================\n");

  // Get modified files
  const modifiedFiles = getModifiedFiles();

  if (modifiedFiles.length === 0) {
    console.log("ℹ No modified scrapers found in sites/ directory");
    console.log("✅ Validation complete");
    return 0;
  }

  console.log(`Found ${modifiedFiles.length} modified scraper(s):`);
  modifiedFiles.forEach((file) => console.log(`  - ${file}`));

  let allValid = true;
  const results = [];

  // Process each file
  for (const file of modifiedFiles) {
    const result = executeScraperAndGetJSON(file);

    if (!result.success) {
      console.log(`\n❌ ${file}`);
      console.log(`   Error: ${result.error}`);
      if (result.stderr) {
        console.log(`   Stderr: ${result.stderr}`);
      }
      allValid = false;
      results.push({ file, valid: false, error: result.error });
      continue;
    }

    // Validate jobs
    const errors = validateJobs(result.jobs);

    if (errors.length > 0) {
      console.log(`\n❌ ${file}`);
      errors.forEach((error) => console.log(`   ${error}`));
      allValid = false;
      results.push({ file, valid: false, errors });
    } else {
      console.log(`\n✅ ${file}`);
      console.log(`   Found ${result.jobs.length} valid job(s)`);
      results.push({ file, valid: true, jobCount: result.jobs.length });
    }
  }

  // Print summary
  console.log("\n============================");
  console.log("📊 Summary");
  console.log("============================");

  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;

  console.log(`Total scrapers tested: ${results.length}`);
  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${invalidCount}`);

  if (allValid) {
    console.log("\n🎉 All scrapers are valid!");
    return 0;
  } else {
    console.log("\n❌ Some scrapers have validation errors");
    return 1;
  }
}

// Run the script
if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { validateJob, validateJobs, getModifiedFiles };
