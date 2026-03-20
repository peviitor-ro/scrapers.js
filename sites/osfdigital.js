const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");

function extractJobMeta(jobSoup) {
  const meta = {};
  const metaSections = jobSoup.findAll("div", { class: "job-detail-meta-div" });

  metaSections.forEach((section) => {
    const label = section
      .find("span", { class: "job-detail-meta-label" })
      ?.text.replace(/:/g, "")
      .trim()
      .toLowerCase();
    const value = section
      .find("span", { class: "job-detail-meta-tag" })
      ?.text.trim();

    if (label && value) {
      meta[label] = value;
    }
  });

  return meta;
}

const getJobs = async () => {
  const url = "https://osf.digital/career/jobs/";
  const scraper = new Scraper(url);
  const soup = await scraper.get_soup("HTML");

  const jobUrls = new Set();

  // 1. Extract from script tags (hidden jobs)
  const scripts = soup.findAll("script");
  scripts.forEach((script) => {
    if (script.text) {
      const matches = script.text.match(/\/career\/jobs\/[^"'\\]+/g);
      if (matches) {
        matches.forEach((match) => {
          let cleanMatch = match.replace(/\/$/, "");
          jobUrls.add("https://osf.digital" + cleanMatch + "/");
        });
      }
    }
  });

  // 2. Extract from visible links (just in case)
  const anchors = soup.findAll("a");
  anchors.forEach((a) => {
    if (a.attrs.href && a.attrs.href.includes("/career/jobs/")) {
      let href = a.attrs.href.replace(/\/$/, "");
      jobUrls.add("https://osf.digital" + href + "/");
    }
  });

  // Remove the main jobs page itself
  jobUrls.delete("https://osf.digital/career/jobs/");

  const jobs = [];
  const urls = Array.from(jobUrls);

  // Helper to fetch a single job
  const fetchJob = async (jobUrl) => {
    try {
      const jobScraper = new Scraper(jobUrl);
      const jobSoup = await jobScraper.get_soup("HTML");

      let title = jobSoup
        .find("h1", { class: "job-detail-title" })
        ?.text.trim();
      if (!title) {
        const titleTag = jobSoup.find("title");
        if (titleTag) {
          title = titleTag.text.split("|")[0].trim();
        }
      }

      if (!title) return;

      const meta = extractJobMeta(jobSoup);
      const location = meta.location || "";

      if (!location.toLowerCase().includes("romania")) {
        return;
      }

      const job = generateJob(title, jobUrl, "Romania", [], []);
      jobs.push(job);
    } catch (error) {
      // Ignore errors for individual pages
    }
  };

  // Fetch in batches to be polite
  const BATCH_SIZE = 10;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((url) => fetchJob(url)));
  }

  return jobs;
};

const run = async () => {
  const company = "OSFDigital";
  const logo =
    "https://osf.digital/library/media/osf/digital/common/header/osf_digital_logo.svg";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
