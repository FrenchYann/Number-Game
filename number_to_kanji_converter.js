// convert a number to its kanji representation

const dictionary = {
  0: "",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
  10: "十",
  100: "百",
  1000: "千",
  10000: "万",
  100000000: "億",
  1000000000000: "兆"
};
const convert = n => {
  let str_num = n;
  let groups = [[]];
  for (let i = str_num.length - 1; i >= 0; i--) {
    let last = groups.length - 1;
    if (groups[last].length < 4) {
      groups[last].push(parseInt(str_num[i], 10));
    } else {
      groups.push([parseInt(str_num[i], 10)]);
    }
  }

  if (groups.length > 4) {
    throw new Error("Number too big must be within [1,10^16)");
  }
  let result = "";
  for (let index_group = groups.length - 1; index_group >= 0; index_group--) {
    let group = groups[index_group];
    for (let index = group.length - 1; index >= 0; index--) {
      let digit = group[index];
      // no 一 before 十/百/千, except for 千 if 万/億/兆 is afterward
      if (!(digit === 1 && (index === 1 || index === 2 || (index === 3 && index_group === 0)))) {
        result += dictionary[digit];
      }
      if (index > 0 && digit !== 0) {
        result += dictionary[Math.pow(10, index)]; // 十/百/千
      }
    }
    if (!group.every(x => x === 0) && index_group > 0) {
      result += dictionary[Math.pow(10, index_group * 4)]; //万, 億, 兆
    }
  }
  return result;
};

export default convert;