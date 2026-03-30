const { execSync } = require("child_process");

const ARCHIVE_URL =
  "https://web.archive.org/web/20250308125634/https://www.bearingpoint.com/en-ro/careers/open-roles/?country=RO";

const main = async () => {
  try {
    console.log("Trying curl without timeout...");
    const html = execSync(`curl -sL "${ARCHIVE_URL}"`, { 
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024
    });
    console.log("Got response, length:", html.length);
    console.log("First 500 chars:", html.substring(0, 500));
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stderr:", error.stderr ? error.stderr.toString() : "none");
  }
};

main();
