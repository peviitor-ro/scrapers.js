const { counties } = require("./getTownAndCounty.js");

const findCity = (sentence) => {
  /**
   * @summary This function finds the city in a sentence
   * @param {String} sentence
   * @param {Array} exclude
   *
   * @tutorial This function is used in the following sentences:
   * - senteces: Regele Mihai a fost inmormantat la Curtea de Arges
   * - result: Curtea de Arges
   *
   * @returns {String} city
   */

  const allCities = counties
    .map((county) => {
      return Object.values(county).map((value) => {
        return value.map((city) => {
          return city.replace("-", " ");
        });
      });
    })
    .flat(2)
    .sort();

  const uniqueCities = [...new Set(allCities)];

  // split sentence into words
  const splitsSentence = sentence.split(" ");
  // create an array of supposed cities
  const supposedCity = [
    ...uniqueCities.filter((city) =>
      splitsSentence
        .map((word) => word.toLowerCase())
        .includes(city.toLowerCase())
    ),
  ];

  return [...new Set(supposedCity)];
};

const translate_city = (city) => {
  /**
   * @summary This function translates the city in romanian
   * @param {String} city
   *
   * @returns {String} city
   */

  city = city.replace(" ", "_");

  // Populate this object with the cities that need translation
  const cities = {
    bucharest: "Bucuresti",
    cluj: "Cluj-Napoca",
    cluj_napoca: "Cluj-Napoca",
    targu_mures: "Targu-Mures",
    bucuresti_ilfov: "Bucuresti",
    tg_mures: "Targu-Mures",
    târgu_mureș: "Targu-Mures",
  };

  if (cities[city.toLowerCase()]) {
    return cities[city.toLowerCase()];
  } else {
    return city.replace("_", " ");
  }
};

const replace_char = (sentence, chars = [], charToReplace = "") => {
  /**
   * @summary This function replaces the characters in a sentence
   * @param {String} sentence
   * @param {Array} chars
   * @param {String} charToReplace
   *
   * @returns {String} new sentence
   */

  let new_sentence = sentence;

  sentence.split("").forEach((char) => {
    if (chars.includes(char)) {
      new_sentence = new_sentence.replace(char, charToReplace);
    }
  });
  return new_sentence;
};

const get_jobtype = (sentence) => {
  /**
   * @summary This function finds the job type in a sentence
   * @param {String} sentence
   *
   * @returns {String} job type
   */

  const job_types = ["remote", "hybrid"];

  const jobType = job_types.filter((type) => sentence.includes(type));

  return jobType;
};

module.exports = {
  findCity,
  translate_city,
  replace_char,
  get_jobtype,
};
