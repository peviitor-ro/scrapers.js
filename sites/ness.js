const { translate_city } = require("../utils.js");
const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");
const Jssoup = require("jssoup").default;
const axios = require("axios");

const _counties = new Counties();

const getHtml = async (url) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url, 
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Sec-Fetch-Site": "none",
      Cookie:
        "__cf_bm=60xVmnogx685t_97xoSNw7lUESa_AVx3nVw.vvV4xjc-1770950658.3438287-1.0.1.1-UBbIUD_Mb3.4WQywoj_rHm_c9eKdeXhO2jmPe9jkas9nGUt2lcSgGi.T6.BsZb_Ua.nLSQ2bQsy8Ul5sxxx2iL8cBFsMTR8BEAqonAgH4xQ.sAi938oAj.3Bm_gJmhuFQ2t2aeUuxWFazPdCOTGxuw; _jsuid=701778805; cf_clearance=zdICjR6QKlIwz3f_SZdRbqA18RPfqDs.CcB4fbY4Www-1770950656-1.2.1.1-lyM0oEhjiqAr6YWrrA1u2HyDfCtfyb1jFvXHpGCgR3nPu4uQ7U6YrjOpDr0LhzU8Io3F1D3Fqb55X56emO2x95f5kpt7TCqTRHv8xFlKE0qfKAGUdDRN5LHJ0X1nAvwvaw7eepfx1YOb6GW0UR0n8gbT2QfKc3gTPyQbBNlo1syO0Mdy8niiOua6bZuG6vLvB8tmZM0elJGOOHYrNveY3bjEg00ROZgDSYbSI4KzzyQ; jobs_search_type=talemetry; referral_source_id_recent=0; tid=x_b945015c-306a-4bda-9307-552b9b930d45; tsid=x_e542a4c4-a33b-4b0a-a678-97ca91fbbdb5; __cf_bm=_DwsO3k9gSpEDuQOOzeTV.yM4uvlpSPPk206Why2gq4-1770950763.4146051-1.0.1.1-nKaO.1bOr_OxyVW2roYbTEXFGN76L4Tvw7lVxICckYNP6udMSVnYoSlozkJzKGdQPJygI974QDIZBf14XxcditCH3qVkO1xCVvFp_Zp2V9QphdStxH.Sgj1GCh6zf8yRbRXW2li8qBb6xdc_I0odhQ; jobs_search_type=talemetry; referral_source_id_recent=0; tid=x_d8795c7d-f1bd-425c-afe1-2edd267bc768",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Fetch-Mode": "navigate",
      Host: "ness-usa.ttcportals.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      "Accept-Language": "en-GB,en;q=0.9",
      "Sec-Fetch-Dest": "document",
      Connection: "keep-alive",
    },
  };

  const res = axios.request(config).then((response) => {
    return response;
  });

  const soup = new Jssoup(await res.then((res) => res.data));
  return soup;
};

const getJobs = async () => {
  const url = "https://ness-usa.ttcportals.com/search/jobs/in/country/romania";
  let res = await getHtml(url);
  let page = 1;
  const jobs = [];

  var items = res.findAll("div", { class: "jobs-section__item" });

  while (items.length > 0) {
    for (const item of items) {
      const job_title = item.find("a").text.trim();
      const job_link = item.find("a").attrs.href;
      const city = item
        .find("div", { class: "large-4" })
        .text.split(",")[0]
        .replace("Location: ", "")
        .trim();

      const { city: c, county: co } = await _counties.getCounties(
        translate_city(city),
      );

      let counties = [];
      if (c) {
        counties = [...new Set([...counties, ...co])];
      }

      const job = generateJob(job_title, job_link, "Romania", c, counties);
      jobs.push(job);
    }
    page += 1;
    res = await getHtml(url + "?page=" + page + "#");
    items = res.findAll("div", { class: "jobs-section__item" });
  }
  return jobs;
};

const run = async () => {
  const company = "Ness";
  const logo = "https://ness.com/wp-content/uploads/2020/10/ness-logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
