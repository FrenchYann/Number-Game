export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, p) => a + (b - a) * p;
export const random_int = (min, max) => Math.floor(min + (max - min) * Math.random());
export const random_digit = () => random_int(0, 10);
export const random_non_zero_digit = () => random_int(1, 10);
export const random_choice = (...choices) => choices[random_int(0, choices.length)];
export const percent = (num, precision = 0) => fixnum(100 * num, precision);
export const fixnum = (num, precision = 0) => {
  let exp = Math.pow(10, precision);
  return Math.round(num * exp) / exp;
};
export const shuffle = a => {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
};

export const build_array = (length, builder) =>
  new Array(length).fill(undefined).map(builder);
export const choose = arr => arr[Math.floor(arr.length * Math.random())];

export const timer = {
  // this timer is reset each time
  // its start method is called
  // ie: only the last call counts
  is_done: () => true,
  start: function(time) {
    let is_done = false;
    this.is_done = () => is_done;
    setTimeout(() => (is_done = true), time);
  }
};

export class RingList {
  constructor(arr) {
    this.arr = arr;
    this.index = 0;
  }
  get value() {
    return this.arr[this.index];
  }
  next() {
    this.index = (this.index + 1) % this.arr.length;
  }
  prev() {
    this.index = (this.arr.length + (this.index - 1)) % this.arr.length;
  }
}
