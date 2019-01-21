import convert from "./number_to_kanji_converter.js";
import { levels, get_random_number } from "./number_generator.js";

console.log("start testing number generator...");
for (let level = 0; level < levels.length; level++) {
  for (let i = 0; i < 100; i++) {
    const { digit_count, low, hi } = levels[level];
    let number = get_random_number(level);
    let kanji = convert(number);
    let word_length = kanji.length;
    if (number.length !== digit_count || word_length < low || word_length > hi) {
      console.error(
        `we want 
  ${digit_count} digits, with complexity ${complexity} (${low},${hi})
we got:
  ${number} - ${kanji} - ${word_length}`
      );
    }
  }
}
console.log("done!");
