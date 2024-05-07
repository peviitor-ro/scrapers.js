const { translate_city, replace_char } = require("../utils.js");
const {
  Scraper,
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const getJobs = async () => {
  let url =
    "https://ro.brinks.com/ro/careers/career-positions?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomDateRangeFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomAttributesFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomCategoryFilter=false&p_r_p_resetCur=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_cur=1";
  const jobs = [];
  let page = 1;
  const scraper = new Scraper(url);

  let res = await scraper.get_soup("HTML");
  let items = res.findAll("div", { class: "card" });

  const pattern = /Locatii: (.*)./g;

  while (items.length > 0) {
    await Promise.all(
      items.map(async (item) => {
        const job_title = item.find("h2").text.trim();
        const job_link = item.find("a").attrs.href;
        let cities = [];
        let counties = [];

        const sentence = item
          .findAll("p")
          [item.findAll("p").length - 1].text.trim();
        const matches = sentence.match(pattern);
        if (matches) {
          await Promise.all(
            matches.map(async (match) => {
              const citys_elem = match.split(":")[1].split(",");
              await Promise.all(
                citys_elem.map(async (city) => {
                  let edited_city = replace_char(
                    city,
                    ["(", ")", "."],
                    ""
                  ).replace("Ghiroda", "");
                  const { city: c, county: co } = await _counties.getCounties(
                    translate_city(edited_city.trim())
                  );
                  if (c) {
                    cities.push(c);
                    counties = [...new Set([...counties, ...co])];
                  }
                })
              );
            })
          );
        }
        jobs.push(
          generateJob(job_title, job_link, "Romania", cities, counties)
        );
      })
    );
    page++;
    scraper.url =
      "https://ro.brinks.com/ro/careers/career-positions?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomDateRangeFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomAttributesFilter=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_enableCustomCategoryFilter=false&p_r_p_resetCur=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_TXQMYdxBLTIC_cur=" +
      page;
    res = await scraper.get_soup("HTML");
    items = res.findAll("div", { class: "card" });
  }
  console.log(jobs);
  return jobs;
};

const run = async () => {
  const company = "Brinks";
  const logo =
    "https://ro.brinks.com/o/brinks-website-theme/images/logos/brinks/brinks-logo-blue.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
