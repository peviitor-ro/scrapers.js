const { spawn } = require("child_process");
const JSSoup = require("jssoup").default;

const ARCHIVE_URL =
  "https://web.archive.org/web/20250308125634/https://www.bearingpoint.com/en-ro/careers/open-roles/?country=RO";

const main = async () => {
  return new Promise((resolve) => {
    let html = "";
    const curl = spawn("curl", ["-sL", ARCHIVE_URL]);
    
    curl.stdout.on("data", (data) => {
      html += data.toString();
    });
    
    curl.stderr.on("data", (data) => {
      console.error("stderr:", data.toString());
    });
    
    curl.on("close", (code) => {
      console.log("Curl exited with code:", code);
      console.log("HTML length:", html.length);
      
      if (html && html.includes("class=\"jobs\"")) {
        const soup = new JSSoup(html);
        const jobsDiv = soup.find("div", { class: "jobs" });
        if (jobsDiv) {
          const elements = jobsDiv.findAll("a");
          console.log("Found", elements.length, "job elements");
        }
      } else {
        console.log("First 500 chars:", html.substring(0, 500));
      }
      
      resolve();
    });
  });
};

main();
