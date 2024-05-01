const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const axios = require("axios");

const exclude = ["michelin.js"];

function runFile(file, version) {
  let command = "";
  switch (version) {
    case "old":
      command = `node sites/${file}`;
      break;
    case "new":
      command = `node sites/${file}`;
      break;
    default:
      console.log("Invalid version");
      return;
  }
  return new Promise((resolve) => {
    childProcess.exec(command, (err, stdout, stderr) => {
      if (stderr) {
        console.log("Error scraping " + file);
        console.log(stderr);
      }
      if (stdout) {
        console.log("Success scraping " + file);
        resolve();
      } else {
        console.log("No jobs available for " + file);
        resolve();
      }
    });
  });
}

const getSites = () => {
  const directoryPath = "sites";
  const newSites = [];
  const oldSites = [];
  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isFile() && path.extname(filePath) === ".js") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const basename = path.basename(filePath);
      if (fileContent.includes("getParams")) {
        // a string that we're 99% sure it's included in new sites but not on old ones
        newSites.push(basename);
      } else oldSites.push(basename);
    }
  });

  return [oldSites, newSites];
};

const runOldSites = async (oldSites) => {
  for (let i = 0; i < oldSites.length; i += 1) {
    if (!exclude.includes(oldSites[i])) {
      await runFile(oldSites[i], "old");
    }
  }
};

const runNewSites = async (newSites) => {
  for (let i = 0; i < newSites.length; i += 1) {
    if (!exclude.includes(newSites[i])) {
      await runFile(newSites[i], "new");
    }
  }
};

async function run() {
  const [oldSites, newSites] = getSites();
  await runOldSites(oldSites);
  await runNewSites(newSites);
}

run();
