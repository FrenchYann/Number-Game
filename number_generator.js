import convert from "./number_to_kanji_converter.js";
import { build_array, choose, random_int, random_digit, shuffle } from "./utils.js";

// the idea is to generate and list the word length of all numbers from 1 to 9999
// and group them by such length
// so if I want a random number with a given word length
// I can either directly pull from those group for up to a 4 digit number
// Or find all the possible group combinations to get any higher number and pull from said group
// for each number grouping (chou, oku, man and simple 0 to 9999)
// However since there's an exception with sen from 1000 to 1999 and
// and issen when it's in a chou, oku, man group, I have to duplicate those maps
// I'm actually lucky only this exception exists... As I have yet to find any better idea
const numbers_by_word_count = [];
const numbers_by_word_count_per_digit = build_array(5, _ => []);
const numbers_by_word_count_issen = [];
const numbers_by_word_count_per_digit_issen = build_array(5, _ => []);
for (let n = 1; n <= 9999; n++) {
  let issen = n >= 1000 && n <= 1999 ? 1 : 0;
  let s = n.toString();
  let word_count = convert(s).length;
  const initialize_array = (arr, index) => {
    if (arr[index] === undefined) arr[index] = [];
  };
  initialize_array(numbers_by_word_count, word_count);
  initialize_array(numbers_by_word_count_per_digit[s.length], word_count);
  initialize_array(numbers_by_word_count_issen, word_count + issen);
  initialize_array(numbers_by_word_count_per_digit_issen[s.length], word_count + issen);

  numbers_by_word_count[word_count].push(s);
  numbers_by_word_count_per_digit[s.length][word_count].push(s);
  numbers_by_word_count_issen[word_count + issen].push(s);
  numbers_by_word_count_per_digit_issen[s.length][word_count + issen].push(s);
}

let levels = [];
for (let digit_count = 1; digit_count <= 16; digit_count++) {
  // I use array because for the biggest number we reach imprecision
  let smallest = new Array(digit_count).fill(0);
  smallest[0] = 1;
  smallest.join(""); // 1, 10, 100, 1000, etc

  let biggest = new Array(digit_count).fill(9).join(""); // 9, 99, 999, 9999, etc
  let min = convert(smallest).length;
  let max = convert(biggest).length;
  for (let l = min; l <= max; l++) {
    let low = l;
    l++;
    let hi = Math.min(max, l);
    levels.push({ digit_count, low, hi });
  }
}

const get_random_number = level => {
  const { digit_count, low, hi } = levels[level];
  const dist = new Array(Math.ceil(digit_count / 4) - 1)
    .fill(undefined)
    .map(_ => ({ size: 4, words: 0 }));
  dist.push({ size: ((digit_count - 1) % 4) + 1 });

  const word_length = random_int(low, hi + 1);

  const digits_to_number = digits =>
    digits
      .flat()
      .reverse()
      .join("");

  function find_distributions(distribution, words, index = 0) {
    let sum = distribution.reduce((acc, x) => acc + x.words, 0);
    if (sum === words) {
      return [distribution];
    } else {
      if (index === distribution.length) {
        // bad sum and no more 4 digit groups to distribute
        // return no solution
        return [];
      }
      let choose_from;
      // we start with the last group (highest order)
      let group_index = distribution.length - 1 - index;
      if (index === 0) {
        // first iteration
        // it's a special case 'cause it may be less than 4 digit long
        // and we need to match the size
        // eg: if size is 3, 100 is ok, 10 isn't
        // otherwise the resulting number will always be too short
        let { size } = distribution[group_index];
        choose_from =
          group_index === 0
            ? numbers_by_word_count_per_digit[size]
            : numbers_by_word_count_per_digit_issen[size];
      } else {
        // always 4 digit long, we can use any number from 0 to 9999
        choose_from =
          group_index === 0 ? numbers_by_word_count : numbers_by_word_count_issen;
      }
      let penalty = group_index > 0 ? 1 : 0; // penalty is for the chou, oku, man words
      let results = [];
      for (let j = 1; j < choose_from.length; j++) {
        if (choose_from[j] && choose_from[j].length > 0) {
          let copy = distribution.map(x => Object.assign({}, x));
          copy[group_index].words = j + penalty;
          // we explore all possible cases recursively
          results = results.concat(find_distributions(copy, words, index + 1));
        }
      }
      return results;
    }
  }

  // we choose a random digit distribution amongst all possibilities
  // and generate a number following this "recipe"
  let final_distribution = choose(find_distributions(dist, word_length));
  //console.log("final distribution", final_distribution);
  let digits = [];
  for (let [i, d] of final_distribution.entries()) {
    let penalty = i > 0 ? 1 : 0;
    let final = i === final_distribution.length - 1;
    let choose_from = final
      ? i === 0
        ? numbers_by_word_count_per_digit[d.size]
        : numbers_by_word_count_per_digit_issen[d.size]
      : i === 0
      ? numbers_by_word_count
      : numbers_by_word_count_issen;
    //console.log("final?", final, " - words", d.words, " - penalty", penalty);
    if (d.words === 0) {
      digits.push(["0", "0", "0", "0"]);
    } else {
      digits.push(
        choose(choose_from[d.words - penalty])
          .padStart(d.size, "0")
          .split("")
          .reverse()
      );
    }
  }
  return digits_to_number(digits);
};

const generate_wrong_answers = (right_answer, count) => {
  // we will just jumble some of the inner number
  // for the smart asses out their who think they
  // just have to listen to the begining or the end
  // to find the answer
  const jumble_group = group => {
    let changes = Math.max(1, Math.floor(group.length / 2));
    let indexes_to_change = shuffle(
      new Array(group.length).fill(undefined).map((_, i) => i)
    ).slice(0, changes);
    let copy = [...group];
    for (let index of indexes_to_change) {
      copy[index] = random_digit();
    }
    return copy;
  };

  const group_array_from_right = (arr, group_size) => {
    let result = new Array(Math.ceil(arr.length / group_size));
    let offset = result.length * group_size - arr.length;

    for (let i = arr.length - 1; i >= 0; i--) {
      let index = i + offset;
      let group_index = Math.floor(index / group_size);
      if (index === (group_index + 1) * group_size - 1) {
        result[group_index] = new Array(group_size);
      }
      result[group_index][index % group_size] = arr[i];
    }

    result[0] = result[0].filter(x => x !== undefined);
    return result;
  };

  let choices = new Set([right_answer]);

  let str = group_array_from_right(right_answer.split(""), 4);
  while (choices.size < count) {
    let choice_str = str.slice(0);
    let group_to_jumble = random_int(0, choice_str.length);
    choice_str[group_to_jumble] = jumble_group(choice_str[group_to_jumble]);
    let choice = parseInt(choice_str.flat().join(""), 10).toString();
    if (choice.length === right_answer.length && choice !== "0") {
      choices.add(choice);
    }
  }
  return shuffle(Array.from(choices));
};

export { get_random_number, levels, generate_wrong_answers };
