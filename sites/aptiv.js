const { translate_city } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url = "https://essearchapi-na.hawksearch.com/api/v2/search/";

  let data = {
    ClientData: {
      UserAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Safari/605.1.15",
      VisitId: "b7b3d3b1-eeae-4fd9-8e8e-276d00975054",
      VisitorId: "c051d37f-a348-4a58-8d95-33e897fa9b3c",
      Custom: { custom: null },
    },
    Keyword: "",
    FacetSelections: { country: ["Romania"] },
    PageNo: 1,
    IndexName: "",
    IgnoreSpellcheck: false,
    IsInPreview: true,
    ClientGuid: "28fad22cfe584b879917858203dd97ce",
    Is100CoverageTurnedOn: false,
  };

  const scraper = new Scraper(url);

  let res = await scraper.post(data);

  let pages = res.Pagination.NofPages;
  let items = res.Results;

  const jobs = [];

  for (let i = 1; i <= pages; i++) {
    for (const item of items) {
      const job_title = item.Document.title[0];
      const job_link = item.Document.link[0];
      const city = translate_city(item.Document.city[0]);

      const { city: c, county: co } = await _counties.getCounties(city);
      let counties = [];

      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
    data.PageNo = i;
    res = await scraper.post(data);
    items = res.Results;
  }
  return jobs;
};

const run = async () => {
  const company = "Aptiv";
  const logo =
    "https://freight.cargo.site/w/3000/q/75/i/ab331f52d894b36d5310e73ce4781b5b30e2e169459c3d655c7ef56d660a0b0c/Asset-134096.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
