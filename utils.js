const translate_city = (city) => {
  /**
   * @summary This function translates the city in romanian
   * @param {String} city
   *
   * @returns {String} city
   */

  if (!city) return "";

  // Populate this object with the cities that need translation
  const cities = {
    bucharest: "Bucuresti",
    cluj: "Cluj-Napoca",
  };

  if (cities[city.toLowerCase()]) {
    return cities[city.toLowerCase()];
  } else {
    return city;
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
  translate_city,
  replace_char,
  get_jobtype,
};
