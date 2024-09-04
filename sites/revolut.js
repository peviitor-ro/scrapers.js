const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const Jssoup = require("jssoup").default;

const getHtml = async (url) => {
  const res = await fetch(
    "https://www.revolut.com/careers/?city=Romania+-+Remote",
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,ro;q=0.8",
        "cache-control": "max-age=0",
        priority: "u=0, i",
        "sec-ch-ua":
          '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );

  const soup = new Jssoup(await res.text());
  return soup;
};

const getJobs = async () => {
  const soup = await getHtml(
    "https://www.revolut.com/careers/?city=Romania+-+Remote"
  );

  const items = JSON.parse(soup.find("script", { id: "__NEXT_DATA__" }).text)
    .props.pageProps.positions;

  const jobs = [];

  for (const item of items) {
    for (const location of item.locations) {
      if (location.country === "Romania") {
        const job_title = item.text;
        const job_link = "https://www.revolut.com/careers/position/" + item.id;
        const remote = location.type === "remote" ? ["remote"] : [];

        const job = generateJob(job_title, job_link, "Romania", null, remote);
        jobs.push(job);
      }
    }
  }
  return jobs;
};

const run = async () => {
  const company = "Revolut";
  const logo =
    "https://cdn.icon-icons.com/icons2/3914/PNG/512/revolut_logo_icon_248648.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);
  await postApiPeViitor(jobs, params);
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
