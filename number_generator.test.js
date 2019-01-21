import convert from "./number_to_kanji_converter.js";
import { levels, get_random_number } from "./number_generator.js";

console.log("start testing number generator...");
for (let digit_count = 1; digit_count <= 16; digit_count++) {
  for (let i = 0; i < 1000; i++) {
    let complexity = "hardest";
    const level = levels.length - 1;
    const { digit_count, low, hi } = levels[levels.length - 1];
    let number = get_random_number(level);
    let kanji = convert(number);
    let len = kanji.length;
    if (len < low || len > hi) {
      console.error(
        `we want 
  ${digit_count} digits, with complexity ${complexity} (${low},${hi})
we got:
  ${number} - ${kanji} - ${len}`
      );
    }
    //console.log(`${number} - ${kanji} - ${len}`);
  }
}
console.log("done!");
