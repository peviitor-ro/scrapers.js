const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();
const URL = "https://preh8-portal.rexx-recruitment.com/job-offers.html";
const PAGE_SIZE = 20;

const getJobsFromPage = async (start) => {
  const scraper = new Scraper(`${URL}?start=${start}`);
  const soup = await scraper.get_soup("HTML");
  const rows = soup.find("tbody")?.findAll("tr") || [];

  return rows
    .slice(1)
    .map((row) => {
      const linkNode = row.find("a");
      const cells = row.findAll("td");

      if (!linkNode || cells.length < 3) {
        return null;
      }

      const job_title = linkNode.text.trim();
      const job_link = linkNode.attrs.href;
      const location = cells[2].text.trim();

      if (!location.includes("(Romania)")) {
        return null;
      }

      const city = location.replace("(Romania)", "").trim();
      return { job_title, job_link, city };
    })
    .filter(Boolean);
};

const getJobs = async () => {
  const scraper = new Scraper(URL);
  const soup = await scraper.get_soup("HTML");
  const totalJobs = Number.parseInt(
    soup.find("div", { id: "countjobs" })?.text.trim() || "0",
    10,
  );
  const numberOfPages = Math.ceil(totalJobs / PAGE_SIZE);
  const jobs = [];

  for (let pageIndex = 0; pageIndex < numberOfPages; pageIndex += 1) {
    const pageJobs = await getJobsFromPage(pageIndex * PAGE_SIZE);

    for (const job of pageJobs) {
      const { city, county } = await _counties.getCounties(job.city);
      jobs.push(
        generateJob(
          job.job_title,
          job.job_link,
          "Romania",
          city || job.city,
          county || [],
        ),
      );
    }
  }

  return jobs;
};

const run = async () => {
  const company = "Preh";
  const logo =
    "https://career.preh.com/fileadmin/templates/website/media/images/preh_logo.png";
  const jobs = await getJobs();

  if (jobs.length === 0) {
    console.log(`No jobs found for ${company}.`);
    return;
  }

  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
