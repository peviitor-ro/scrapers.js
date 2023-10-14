const { Scraper, postApiPeViitor } = require("peviitor_jsscraper");
const { getTownAndCounty } = require("../getTownAndCounty.js");
const counties = require("../getTownAndCounty.js").counties;

const generateJob = (job_title, job_link, city, county, remote) => ({
  job_title,
  job_link,
  country: "Romania",
  city,
  county,
  remote,
});

const findCity = (sentence) => {
  const splitsSentence = sentence.split(" ");
  const supposedCity = [];
  splitsSentence.forEach((word) => {
    counties.forEach((county) => {
      Object.values(county).forEach((value) => {
        value.forEach((city) => {
          if (city.toLowerCase().includes(word.toLowerCase())) {
            if (sentence.toLowerCase().indexOf(city.toLowerCase()) !== -1) {
              if (!supposedCity.includes(city)) {
                supposedCity.push(city);
              }
            }
          }
        });
      });
    });
  });
  let arrays = [...supposedCity.map((city) => city.split(" "))];
  let longest = arrays.sort((a, b) => b.length - a.length)[0];
  return longest.join(" ");
};

const getJobs = async () => {
    let url = "https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=1&section_color_preset=primary"
    const jobs = [];
    let page = 1;

    const scraper = new Scraper(url);
    const additionalHeaders = {
        "Accept":"text/vnd.turbo-stream.html, text/html, application/xhtml+xml",
        "Sec-Fetch-Site":"same-origin",
        "Accept-Language":"en-GB,en;q=0.9",
        "Accept-Encoding":"gzip, deflate, br",
      };

    scraper.config.headers = { ...scraper.config.headers, ...additionalHeaders };

    
    let res = await scraper.get_soup("HTML");

    let elements = res.findAll("li");

    while (elements.length > 0) {
        elements.forEach((item) => {
            const jobsElements = item.findAll("span")
            const job_title = jobsElements[0].text.trim();
            const job_link = item.find("a").attrs.href;
            
            const city = findCity(jobsElements[3].text.trim().replace("Spring", "").replace("Roma", ""));
            const county = getTownAndCounty(city).county;
            let remote;
            try {
                const remoteElement = jobsElements[5].text.trim();
                if (remoteElement.includes("remote") || remoteElement.includes("hibrid")) {
                    remote = remoteElement.includes("remote") ? ["Remote"]: ["Hybrid"];
                }
            } catch (error) {
                remote = [];
            }

            jobs.push(generateJob(job_title, job_link, city, county, remote));
            
        });
        console.log(page);
        page++;
        url = `https://careerromania.autoliv.com/jobs/show_more?layout=card-image&page=${page}&section_color_preset=primary`;
        scraper.url = url;
        res = await scraper.get_soup("HTML");
        elements = res.findAll("li");

    };

    return jobs;
};

const getParams = () => {
    const company = "Autoliv";
    const logo =
      "https://images.teamtailor-cdn.com/images/s3/teamtailor-production/logotype-v3/image_uploads/d7b6d876-3ad3-4051-81a2-e6293d1694ec/original.png";
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
