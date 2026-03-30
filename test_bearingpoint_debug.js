const axios = require("axios");
const { execSync } = require("child_process");
const JSSoup = require("jssoup").default;

const ARCHIVE_URL =
  "https://web.archive.org/web/20250308125634/https://www.bearingpoint.com/en-ro/careers/open-roles/?country=RO";

const fetchWithCurl = async (url) => {
  try {
    const html = execSync(
      `curl -sL --connect-timeout 30 "${url}"`,
      { encoding: "utf-8", timeout: 60000 }
    );
    return html;
  } catch (error) {
    console.error("curl error:", error.message);
    return null;
  }
};

const main = async () => {
  const url = "https://www.bearingpoint.com/en-ro/careers/open-roles/?country=RO";
  let html = "";

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 30000,
    });
    html = res.data;
    console.log("Got response from main URL, length:", html.length);
    console.log("Contains 403:", html.includes("403 Forbidden"));
  } catch (error) {
    console.error("Axios error:", error.message);
  }

  if (!html || html.includes("403 Forbidden")) {
    console.log("Trying archive...");
    html = await fetchWithCurl(ARCHIVE_URL);
    console.log("Got archive response, length:", html ? html.length : 0);
  }

  if (!html || !html.includes("class=\"jobs\"")) {
    console.log("No jobs found in HTML");
    return;
  }

  const soup = new JSSoup(html);
  const jobsDiv = soup.find("div", { class: "jobs" });
  console.log("Jobs div found:", !!jobsDiv);
  
  if (jobsDiv) {
    const elements = jobsDiv.findAll("a");
    console.log("Found", elements.length, "job elements");
  }
};

main();
