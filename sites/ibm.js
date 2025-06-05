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
  let url = "https://www-api.ibm.com/search/api/v2";

  const data = {
    appId: "careers",
    scopes: ["careers", "careers2"],
    query: { bool: { must: [] } },
    post_filter: { term: { field_keyword_05: "Romania" } },
    aggs: {
      field_keyword_172: {
        filter: { term: { field_keyword_05: "Romania" } },
        aggs: {
          field_keyword_17: { terms: { field: "field_keyword_17", size: 6 } },
          field_keyword_17_count: {
            cardinality: { field: "field_keyword_17" },
          },
        },
      },
      field_keyword_083: {
        filter: { term: { field_keyword_05: "Romania" } },
        aggs: {
          field_keyword_08: { terms: { field: "field_keyword_08", size: 6 } },
          field_keyword_08_count: {
            cardinality: { field: "field_keyword_08" },
          },
        },
      },
      field_keyword_184: {
        filter: { term: { field_keyword_05: "Romania" } },
        aggs: {
          field_keyword_18: { terms: { field: "field_keyword_18", size: 6 } },
          field_keyword_18_count: {
            cardinality: { field: "field_keyword_18" },
          },
        },
      },
      field_keyword_055: {
        filter: { match_all: {} },
        aggs: {
          field_keyword_05: {
            terms: { field: "field_keyword_05", size: 1000 },
          },
          field_keyword_05_count: {
            cardinality: { field: "field_keyword_05" },
          },
        },
      },
    },
    size: 100,
    sort: [{ dcdate: "desc" }, { _score: "desc" }],
    lang: "zz",
    localeSelector: {},
    sm: { query: "", lang: "zz" },
    _source: [
      "_id",
      "title",
      "url",
      "description",
      "language",
      "entitled",
      "field_keyword_17",
      "field_keyword_08",
      "field_keyword_18",
      "field_keyword_19",
    ],
  };
  const jobs = [];

  const scraper = new Scraper(url);
  const res = await scraper.post(data);

  for (const job of res.hits.hits) {
    const job_title = job._source.title;
    const job_link = job._source.url;
    const location = job._source.field_keyword_19.split(",")[0].trim();
    const remote = job._source.field_keyword_17.toLowerCase();

    let cities = [];
    let counties = [];

    const city = translate_city(location);
    const { city: c, county: co } = await _counties.getCounties(city);
    if (c) {
      cities.push(c);
      counties = [...new Set([...counties, ...co])];
    }

    const job_element = generateJob(
      job_title,
      job_link,
      "Romania",
      cities,
      counties,
      remote
    );

    jobs.push(job_element);
  }

  return jobs;
};

const run = async () => {
  const company = "IBM";
  const logo =
    "https://cdn-static.findly.com/wp-content/uploads/sites/1432/2020/12/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams };
