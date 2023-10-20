const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const { translate_city, replace_char } = require("../utils.js");

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const getJobs = async () => {
  let url =
    "https://ro.brinks.com/ro/careers/career-positions?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomDateRangeFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomAttributesFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomCategoryFilter=false&p_r_p_resetCur=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_cur=1";
  const jobs = [];
  let page = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.findAll("div", { class: "card" });

  while (items.length > 0) {
    items.forEach((item) => {
      const job_title = item.find("h2").text.trim();
      const job_link = item.find("a").attrs.href;
      let city = item
        .find("p", { class: "subtitle" })
        .text.trim()
        .split(",")[0];
      let citys = [];
      const counties = [];
      let { foudedTown, county } = getTownAndCounty(
        translate_city(city.toLowerCase())
      );
      if (!foudedTown && !county) {
        try {
          const citys_elem = item
            .findAll("p")[1]
            .text.trim()
            .split(":")[1]
            .split(",");
          citys_elem.forEach((city) => {
            let edited_city = replace_char(city, ["(", ")", "."], "").replace(
              "Ghiroda",
              ""
            );
            const { foudedTown, county } = getTownAndCounty(
              translate_city(edited_city.trim().toLowerCase())
            );
            if (county) {
              counties.push(county);
              citys.push(foudedTown);
            }
          });
        } catch (error) {}
      } else {
        counties.push(county);
        citys.push(foudedTown);
      }
      if (citys.length > 0) {
        jobs.push(generateJob(job_title, job_link, citys, counties, []));
      }
    });
    page++;
    scraper.url =
      "https://ro.brinks.com/ro/careers/career-positions?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomDateRangeFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomAttributesFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomCategoryFilter=false&p_r_p_resetCur=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_cur=" +
      page;
    res = await scraper.get_soup("HTML");
    items = res.findAll("div", { class: "card" });
  }

  return jobs;
};

const getParams = () => {
  const company = "Brinks";
  const logo =
    "https://ro.brinks.com/o/brinks-website-theme/images/logos/brinks/brinks-logo-blue.png";
  const apikey = process.env.APIKEY;
  const params = {
    company,
    logo,
    apikey,
  };
  return params;
};

const run = async () => {
  const jobs = await getJobs();
  const params = getParams();
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
