const { translate_city } = require("../utils.js");
const Jssoup = require("jssoup").default;
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  const url =
    "https://www.delonghigroup.com/en/views/ajax?_wrapper_format=drupal_ajax";

  const scraper = new Scraper(url);
  scraper.config.headers["Content-Type"] =
    "application/x-www-form-urlencoded; charset=UTF-8";

  const data = {
    "MIME Type": "application/x-www-form-urlencoded; charset=UTF-8",
    view_name: "jobs_positions",
    view_display_id: "block_1",
    view_path: "/node/62",
    view_dom_id:
      "234a22ea9c4ecf65d02b891c459c61852a1d8447531647441cca717d095a9926",
    pager_element: 0,
    _drupal_ajax: 1,
    "ajax_page_state[theme]": "delonghi",
    "ajax_page_state[libraries]":
      "better_exposed_filters/auto_submit,better_exposed_filters/general,better_exposed_filters/select_all_none,classy/base,classy/messages,colorbox/colorbox,colorbox/default,core/html5shiv,core/normalize,delonghi/banner,delonghi/global,delonghi/paragraph--body-element,delonghi/paragraph--drupal-block,delonghi/paragraph--row,delonghi/views-view--jobs-positions,eu_cookie_compliance/eu_cookie_compliance_bare,media/filter.caption,msg_useless_options/useless_options,msg_zip/msg_zip,paragraphs/drupal.paragraphs.unpublished,system/base,views/views.ajax,views/views.module",
  };

  const jobs = [];

  const form = new FormData();

  for (const key in data) {
    form.append(key, data[key]);
  }

  const res = await scraper.post(form);
  const soup = new Jssoup(res[2].data);
  const elements = soup.findAll("div", { class: "views-row" });

  await Promise.all(
    elements.map(async (elem) => {
      const job_title = elem.find("h3").text;
      const job_link =
        "https://www.delonghigroup.com" + elem.find("a").attrs.href;
      const job_location = elem.find("div", {
        class: "job-country-location",
      }).text;
      let city_element = translate_city(job_location.split(",")[1].trim());
      const job_country = job_location.split(",");

      let country;
      if (job_country[0] === "CEE") {
        country = job_country[2].trim();
      } else {
        country = job_country[0].split(" ")[0].trim();
      }

      let cities = [];
      let counties = [];

      if (country === "Romania") {
        const { city: c, county: co } =
          await _counties.getCounties(city_element);
        if (c) {
          cities.push(c);
          counties = [...new Set([...counties, ...co])];
        }
        const job = generateJob(job_title, job_link, country, cities, counties);
        jobs.push(job);
      }
    })
  );
  return jobs;
};

const run = async () => {
  const company = "DeLonghi";
  const logo =
    "https://logos-world.net/wp-content/uploads/2020/12/DeLonghi-Logo-700x394.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job

