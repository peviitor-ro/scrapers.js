const {
  postApiPeViitor,
  generateJob,
  getParams,
} = require("peviitor_jsscraper");
const Jssoup = require("jssoup").default;
const axios = require("axios");
const vm = require("vm");
const { Counties } = require("../getTownAndCounty.js");

const _counties = new Counties();

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

const collectCookies = (response, jar) => {
  const cookies = (response.headers["set-cookie"] || []).map(
    (cookie) => cookie.split(";")[0],
  );
  return [...jar, ...cookies];
};

const solveChallenge = (html) => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    (match) => match[1],
  );
  const script = scripts.find((code) => code.includes("submit"));
  if (!script) {
    return null;
  }

  let captured = null;
  const makeElement = () => {
    const element = { children: [], style: "", type: "" };
    element.appendChild = (child) => element.children.push(child);
    Object.defineProperty(element, "submit", {
      value() {
        captured = {
          action: element.action,
          fields: element.children.map((child) => ({
            name: child.name,
            value: String(child.value),
          })),
        };
      },
    });
    return element;
  };

  const container = makeElement();
  const document = {
    getElementById: () => container,
    createElement: makeElement,
    attachEvent: undefined,
    addEventListener: (_event, callback) => callback(),
  };
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36";
  const windowObject = {
    navigator: {
      userAgent,
      appVersion: userAgent.replace("Mozilla/", "Mozilla/"),
      language: "en-US",
      languages: ["en-US", "en"],
    },
    outerHeight: 1080,
    outerWidth: 1920,
    addEventListener: (_event, callback) => callback(),
    document,
  };
  const sandbox = {
    window: windowObject,
    document,
    setTimeout: (callback) => callback(),
    console,
    XMLHttpRequest: class {
      open() {}
      send() {}
    },
    URLSearchParams,
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox);
  return captured;
};

const fetchPage = async (url) => {
  const firstResponse = await axios.get(url, { headers });
  let cookies = collectCookies(firstResponse, []);
  let { data: html } = firstResponse;

  if (html.includes("wsidchk")) {
    const form = solveChallenge(html);
    if (form) {
      const origin = new URL(url).origin;
      const query = new URLSearchParams();
      form.fields.forEach((field) => query.append(field.name, field.value));

      const verifyResponse = await axios.get(
        `${origin}${form.action}?${query.toString()}`,
        {
          headers: { ...headers, Cookie: cookies.join("; "), Referer: url },
          maxRedirects: 0,
          validateStatus: () => true,
        },
      );
      cookies = collectCookies(verifyResponse, cookies);

      const finalResponse = await axios.get(url, {
        headers: { ...headers, Cookie: cookies.join("; ") },
      });
      html = finalResponse.data;
    }
  }
  return html;
};

const getJobs = async () => {
  const url = "https://www.p-a.ro/cariere/";

  const jobs = [];

  const html = await fetchPage(url);
  const soup = new Jssoup(html);

  const items = soup.findAll("div", { class: "post-wrap" });

  for (const item of items) {
    const job_title = item.find("a").text.trim();
    const job_link = item.find("a").attrs.href;

    const job = generateJob(
      job_title,
      job_link,
      "Romania",
      "Bucuresti",
      "Bucuresti",
    );
    jobs.push(job);
  }
  return jobs;
};

const run = async () => {
  const company = "PoppAsociatii";
  const logo = "https://www.p-a.ro/wp-content/themes/pa/images/logo.png";
  const jobs = await getJobs();
  const params = getParams(company, logo);

  if (jobs.length > 0) {
    await postApiPeViitor(jobs, params);
  } else {
    console.log(`Joblist for ${company} is empty. Skipping API post.`);
  }
};

if (require.main === module) {
  run();
}

module.exports = { run, getJobs, getParams }; // this is needed for our unit test job
