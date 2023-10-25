"use strict";
const scraper = require("../peviitor_scraper.js");
const { getTownAndCounty } = require("../getTownAndCounty.js");

const obj = {
  url: "https://www.delonghigroup.com/en/views/ajax?_wrapper_format=drupal_ajax",
  params: {
    "MIME Type": "application/x-www-form-urlencoded; charset=UTF-8",
    field_job_country_target_id: 115,
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
  },
};

const company = { company: "DeLonghi" };

const fetchData = async () => {
  const jobs = [];
  const s = new scraper.ApiScraper(obj.url);
  s.headers.headers["Content-Type"] =
    "application/x-www-form-urlencoded; charset=UTF-8";
  const res = await s.post(obj.params).then((res) => {
    const soup = scraper.soup(res[2].data);
    const jobsContainer = soup.findAll("div", {
      class: "views-row",
    });
    jobsContainer.forEach((job) => {
      const job_title = job.find("h3").text;
      const job_link =
        "https://www.delonghigroup.com" + job.find("a").attrs.href;
      const job_location = job.find("div", {
        class: "job-country-location",
      }).text;
      let city_element = job_location.split(",")[1].trim();
      const job_country = job_location.split(",")[0].trim();

      if (city_element.toLowerCase() === "cluj") {
        city_element = "Cluj-Napoca";
      } else if (city_element.toLowerCase() === "bucharest") {
        city_element = "Bucuresti";
      }

      const { foudedTown, county } = getTownAndCounty(city_element);

      jobs.push({
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: foudedTown,
        country: job_country,
        county: county,
      });
    });
  });
  return jobs;
};

fetchData().then((jobs) => {
  console.log(JSON.stringify(jobs, null, 2));

  scraper.postApiPeViitor(jobs, company);

  let logo =
    "https://logos-world.net/wp-content/uploads/2020/12/DeLonghi-Logo-700x394.png";

  let postLogo = new scraper.ApiScraper("https://api.peviitor.ro/v1/logo/add/");
  postLogo.headers.headers["Content-Type"] = "application/json";
  postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
});