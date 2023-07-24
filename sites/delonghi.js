"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

const country_id = [165, 175];
const urls = {
  url: "https://www.delonghigroup.com/en/views/ajax?_wrapper_format=drupal_ajax",
  params: {
    "MIME Type": "application/x-www-form-urlencoded; charset=UTF-8",
    field_job_country_target_id: 175,
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
let finalJobs = [];

const fetchData = () => {
  let jobs = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < country_id.length; i++) {
      urls.params.field_job_country_target_id = country_id[i];
      const s = new scraper.ApiScraper(urls.url);
      s.headers.headers["Content-Type"] =
        "application/x-www-form-urlencoded; charset=UTF-8";
      s.post(urls.params).then((res) => {
        const soup = scraper.soup(res[2].data);
        const jobsContainer = soup.findAll("div", {
          class: "views-row",
        });
        jobsContainer.forEach((job) => {
          jobs.push(job);
        });
        if (i === country_id.length - 1) {
          resolve(jobs);
        }
      });
    }
  });
};

fetchData()
  .then((jobs) => {
    jobs.forEach((job) => {
      const id = uuid.v4();
      const job_title = job.find("h3").text;
      const job_link =
        "https://www.delonghigroup.com" + job.find("a").attrs.href;

      finalJobs.push({
        id: id,
        job_title: job_title,
        job_link: job_link,
        company: company.company,
        city: "Romania",
        country: "Romania",
      });
    });
  })
  .then(() => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://logos-world.net/wp-content/uploads/2020/12/DeLonghi-Logo-700x394.png";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });