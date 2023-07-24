const fs = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const readFileAsync = util.promisify(fs.readFile);

const getNewSites = () => {
  const directoryPath = "sites";
  const newSites = [];
  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);
    if (fs.statSync(filePath).isFile() && path.extname(filePath) === ".js") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const basename = path.basename(filePath);
      if (fileContent.includes("getParams"))
        // a string that we're 99% sure it's included in new sites but not on old ones
        newSites.push(basename);
    }
  });
  return newSites;
};

async function getCurrentBranchName() {
  try {
    const { stdout, stderr } = await exec("git rev-parse --abbrev-ref HEAD");
    if (stderr) {
      console.error("Error getting current branch name:", stderr.trim());
      return "";
    }
    return stdout.trim();
  } catch (error) {
    console.error("Error getting current branch name:", error.message);
    return "";
  }
}

function getFileNamesFromDiff(diffOutput) {
  const regex = /^sites\/.*\.js$/gm;
  const matches = [];
  let match;
  while ((match = regex.exec(diffOutput)) !== null) {
    const fileName = match[0];
    if (fileName.startsWith("sites/")) {
      matches.push(fileName.replace(/^sites\//, ""));
    }
  }
  return matches;
}

async function getDiffSites() {
  try {
    const currentBranch = await getCurrentBranchName();
    const { stdout, stderr } = await exec(
      `git diff origin/main origin/${currentBranch} --name-only`
    );
    if (stderr) {
      console.error(`Error while running git diff: ${stderr}`);
      return [];
    }
    const diffSites = getFileNamesFromDiff(stdout);
    return diffSites;
  } catch (error) {
    console.error(`Error executing git diff: ${error.message}`);
    return [];
  }
}

async function readFromTXT() {
  try {
    const filename = "diffSites";
    const filePath = path.join(__dirname, `./${filename}.txt`);
    const data = await readFileAsync(filePath, "utf8");
    const diffArray = data.split(" ");
    const diffSitesUnformatted = diffArray.filter((file) =>
      file.startsWith("sites/")
    );
    const diffSites = diffSitesUnformatted.map((file) => {
      const regexWhitespace = /[\s\x00-\x1F\x7F\xFEFF]/g;
      file = file.replace("sites/", "");
      file = file.replace(regexWhitespace, "");
      file = file.replace(/\.js.*/, ".js");
      return file;
    });
    return diffSites;
  } catch (error) {
    console.error("Error reading TXT data:", error);
    return [];
  }
}

async function getSites() {
  const newSites = getNewSites();
  let diffSites;
  if (process.env.GITHUB_ACTIONS) {
    diffSites = await readFromTXT();
  } else {
    diffSites = await getDiffSites();
  }
  const sites = [];
  if (typeof diffSites !== "undefined")
    diffSites.forEach((diffSite) => {
      if (newSites.includes(diffSite)) sites.push(diffSite);
    });
  return sites;
}

const writeToJSON = async (data, filename) => {
  const filePath = path.join(__dirname, `./${filename}.json`);
  const dataJSON = JSON.stringify(data);
  try {
    // Write the JSON string to the file synchronously, overwriting the existing content
    fs.writeFileSync(filePath, dataJSON, "utf8");
  } catch (err) {
    console.error("Error writing to the file:", err);
  }
};

const getTestData = async () => {
  console.log("Running pretest script...");
  const sites = await getSites();
  const siteJobsCollection = [];
  const paramsCollection = [];
  if (sites.length !== 0)
    for (const site of sites) {
      const { getJobs, getParams } = require(`../sites/${site}`);
      const jobs = await getJobs();
      const params = getParams();
      siteJobsCollection.push({ [site]: jobs });
      paramsCollection.push({ [site]: params });
    }
  await writeToJSON(siteJobsCollection, "siteJobsCollection");
  await writeToJSON(paramsCollection, "paramsCollection");
  console.log("Finished pretest script");
  console.log("Running tests...");
};

getTestData();
