"use strict";
const scraper = require("../peviitor_scraper.js");
const uuid = require("uuid");

let url =
  "https://www.heidelbergcement.ro/ro/anunturi-de-angajare?field_job_offer_entry_level=16&field_job_offer_contract_type=13";

const company = { company: "HeidelbergCement" };

let s = new scraper.Scraper(url);

s.soup.then((soup) => {
  const totalJobs = parseInt(
    soup.find("p", { class: "hc-title" }).text.trim().split(" ")[0]
  );
  const step = 10;
  let pages = scraper.range(0, totalJobs, step);

  url =
    "https://www.heidelbergcement.ro/ro/views/ajax?lock_config_key=n_sz-gIY4zfasOypdPIGFzpNEs8YswUlnKSX8hDwMZw&?field_job_offer_entry_level=16&field_job_offer_contract_type=13&_wrapper_format=drupal_ajax";

  let data = {
    "MIME Type": "application/x-www-form-urlencoded; charset=UTF-8",
    country_code_1: "RO",
    view_name: "job_search",
    view_display_id: "search",
    view_path: "/node/15512",
    view_query: "block_config_key=n_sz-gIY4zfasOypdPIGFzpNEs8YswUlnKSX8hDwMZw",
    view_dom_id:
      "e1dc5691b7bd49689eef0dc7b0db74c5759f324adab2aced1f9db5864667e604",
    pager_element: 0,
    page: 0,
    _drupal_ajax: 1,
    "ajax_page_state[theme]": "hc",
    "ajax_page_state[libraries]":
      "ckeditor_accordion/accordion_style,classy/base,classy/messages,classy/node,core/drupal.autocomplete,core/normalize,core/picturefill,hc/footer,hc/global-styling,hc/header-search,hc/main-menu,hc/search-page-filter,hc/select-multiple,hc/slider,hc/teaser,hc/toolbar,hc_ckeditor/hc_editor,hc_custom_js_alter/custom_js,layout_discovery/onecol,search_api_autocomplete/search_api_autocomplete,social_media_links/social_media_links.theme,system/base,views/views.module,views_infinite_scroll/views-infinite-scroll",
  };

  const fetchData = () => {
    let finalJobs = [];
    return new Promise((resolve, reject) => {
      for (let i = 0; i < pages.length; i++) {
        s = new scraper.ApiScraper(url);
        s.headers.headers["Content-Type"] =
          "application/x-www-form-urlencoded; charset=UTF-8";
        data.page = i;
        s.post(data).then((res) => {
          const soup = scraper.soup(res[res.length - 1].data);

          const jobs = soup.findAll("div", { class: "hc-teaser__content" });

          jobs.forEach((job) => {
            const id = uuid.v4();
            const job_title = job.find("h3").text;
            const job_link =
              "https://www.heidelbergcement.ro" + job.find("a").attrs.href;

            finalJobs.push({
              id: id,
              job_title: job_title,
              job_link: job_link,
              company: company.company,
              country: "Romania",
              city: "Romania",
            });

            if (finalJobs.length === totalJobs) {
              resolve(finalJobs);
            }
          });
        });
      }
    });
  };

  fetchData().then((finalJobs) => {
    console.log(JSON.stringify(finalJobs, null, 2));

    scraper.postApiPeViitor(finalJobs, company);

    let logo =
      "https://www.heidelbergcement.ro/sites/default/files/logo/HeidelbergCement-Romania.svg";

    let postLogo = new scraper.ApiScraper(
      "https://api.peviitor.ro/v1/logo/add/"
    );
    postLogo.headers.headers["Content-Type"] = "application/json";
    postLogo.post(JSON.stringify([{ id: company.company, logo: logo }]));
  });
});