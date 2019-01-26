import { get_random_number, levels, generate_wrong_answers } from "./number_generator.js";
import {
  clamp,
  shuffle,
  lerp,
  timer,
  percent,
  choose,
  RingList,
  hasTouch
} from "./utils.js";
import convert from "./number_to_kanji_converter.js";
import voice from "./voice.js";

/* TODO maybe:
- if I ever want to add more feature, I should probably switch to state objects instead of constants... 
- if I get down to make some UI to configure everything, it will be available on pause
- resize text to always fit button ... meh...
//*/

const game_params = {
  config: {
    timer: 5,
    min_xp: 5,
    max_xp: 50
  },
  current: {
    xp: 0,
    pass: 0,
    fail: 0,
    level: 0,
    timer: 0,
    deck: []
  }
};
game_params.current.next_xp = game_params.config.min_xp;

let $score;
let $level;
let $progressbar;
let $buttons = null;

const INIT = Symbol.for("INIT");
const TALKING = Symbol.for("TALKING");
const PLAY = Symbol.for("PLAY");
const WAIT = Symbol.for("WAIT");
let state = null;
let answer;
let choices;
let pause = false;
let started = false;
let congratulating = false;

const PAUSE_SYMB = "❚❚";
const RESUME_SYMB = "▶";

const set_buttons_state = is_enabled => {
  $buttons.forEach(el => {
    el.disabled = !is_enabled;
  });
};
const set_buttons_visibility = is_visible => {
  $buttons.forEach(el => {
    el.style.visibility = is_visible ? "visible" : "hidden";
  });
};
const set_buttons_display = display => {
  $buttons.forEach(el => {
    el.style.display = display ? "block" : "none";
  });
};

const setup_shortcuts = function() {
  document.onkeydown = function(e) {
    switch (e.keyCode) {
      /* shortcuts for buttons using the numpad
            5 6
            2 3
      */
      case 101: // NumPad 5
        $buttons[0].click();
        break;
      case 102: // NumPad 6
        $buttons[1].click();
        break;
      case 98: // NumPad 2
        $buttons[2].click();
        break;
      case 99: // NumPad 3
        $buttons[3].click();
        break;
      case 76: // L
        voice.cancel();
        let input_level = parseInt(prompt(`Input level [1-${levels.length}]`), 10);
        if (!isNaN(input_level) && input_level >= 1 && input_level <= levels.length) {
          game_params.current.level = input_level - 1;
          lastLevel = input_level - 1;
          init_level();
        }
        if (state !== null) {
          reset_ui();
          state = INIT;
        }
        break;
    }
  };
};

const init = () => {
  state = INIT;
  $buttons = document.querySelectorAll("button.answer");
  reset_ui();
  update();
};

const reset_ui = () => {
  reset_progressbar();
  set_buttons_state(false);
  set_buttons_visibility(false);
};
const reset_progressbar = () => {
  $progressbar.style.width = "0%";
  $progressbar.classList.remove("timeout");
};
const display_score = () => {
  let { pass, fail } = game_params.current;
  let total = pass + fail;
  $score.textContent = total > 0 ? `${percent(pass / total)}%` : "...";
};
const display_level = () => {
  let { level } = game_params.current;
  $level.textContent = `${level + 1}`;
};

const reset_xp = total => {
  let $xp = document.getElementById("xp");
  $xp.innerHTML = "";
  for (let i = 0; i < total; i++) {
    $xp.appendChild(document.createElement("div"));
  }
};

const display_xp = current => {
  let $xp = document.getElementById("xp");
  for (let [i, elm] of $xp.childNodes.entries()) {
    if (i < current && !elm.classList.contains("on")) {
      elm.classList.add("on");
    }
  }
};

const generate_deck = (level, max_size) => {
  let deck = new Set();
  let new_found = 0;
  while (deck.size < max_size && new_found < 1000) {
    let number = get_random_number(level);
    if (!deck.has(number)) {
      new_found = 0;
      deck.add(number);
    } else {
      new_found++;
    }
  }
  return new RingList(shuffle(Array.from(deck)));
};

const congrat_list = new RingList(
  shuffle([
    "凄い！",
    "ワーーー！マジ？！",
    "ワー！マジでヤバイよ？！",
    "ウオー!面白い！",
    "スゲエッ！",
    "マジ、スゲエッ！",
    "スゴーーーーーイ！！",
    "素晴らしすぎー！！",
    "信じられない！！",
    "ヤバー！！",
    "いいねー！",
    "お見事！"
  ])
);

const congrats = () => {
  congratulating = true;
  congrat_list.next();
  voice.say_in_japanese("レベルアップ！" + congrat_list.value);
};

const done = (is_right, idx) => {
  if (is_right) {
    game_params.current.pass++;
    game_params.current.xp++;
    display_xp(game_params.current.xp);
    if (game_params.current.xp >= game_params.current.next_xp) {
      // TODO: proper ending, or something
      game_params.current.level = Math.min(
        levels.length - 1,
        game_params.current.level + 1
      );
      $level.classList.remove("pulsate");
      setTimeout(() => $level.classList.add("pulsate"), 0);
      congrats();
    }
  } else {
    game_params.current.fail++;
  }
  display_score();
  display_level();
  display_answer(idx);
  set_buttons_state(false);

  timer.start(2000);
  state = WAIT;
};

const display_answer = idx => {
  for (let [i, $button] of $buttons.entries()) {
    if ($button.is_right) {
      $button.classList.add("right");
    } else if (i === idx) {
      $button.classList.add("wrong");
    }
  }
};

const init_level = () => {
  game_params.current.next_xp = Math.round(
    lerp(
      game_params.config.min_xp,
      game_params.config.max_xp,
      game_params.current.level / levels.length
    )
  );
  game_params.current.deck = generate_deck(
    game_params.current.level,
    game_params.current.next_xp * 10
  );
  reset_xp(game_params.current.next_xp);
  display_level();
};

let lastTime = Date.now();
let lastLevel = null;
const update = () => {
  window.requestAnimationFrame(update);
  let now = Date.now();
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (pause) return;

  switch (state) {
    case INIT: {
      reset_ui();
      game_params.current.level = clamp(game_params.current.level, 0, levels.length);
      if (game_params.current.xp >= game_params.current.next_xp) {
        game_params.current.xp = 0;
      }
      if (game_params.current.level != lastLevel) {
        lastLevel = game_params.current.level;
        init_level();
      }

      display_score();
      game_params.current.deck.next();
      answer = game_params.current.deck.value;
      choices = generate_wrong_answers(answer, 4);

      voice.say_in_japanese(convert(answer));
      state = TALKING;
      break;
    }
    case TALKING: {
      if (!voice.is_talking()) {
        for (let [i, $button] of $buttons.entries()) {
          let number = choices[i];
          $button.textContent = parseInt(choices[i], 10).toLocaleString();
          $button.classList.remove("wrong");
          $button.classList.remove("right");
          $button.is_right = number === answer;
          $button.onclick = function(idx) {
            done(this.is_right, idx);
          }.bind($button, i);
          set_buttons_state(true);
          set_buttons_visibility(true);
        }
        game_params.current.timer = 0;
        state = PLAY;
      }
      break;
    }
    case PLAY: {
      game_params.current.timer += dt;
      if (game_params.current.timer >= game_params.config.timer) {
        game_params.current.timer = game_params.config.timer;
        $progressbar.classList.add("timeout");
        done(false);
      }
      $progressbar.style.width =
        (100 * game_params.current.timer) / game_params.config.timer + "%";
      break;
    }
    case WAIT: {
      if (!(voice.is_talking() && congratulating) && timer.is_done()) {
        congratulating = false;
        state = INIT;
      }
      break;
    }
  }
};

window.onload = async () => {
  if (!hasTouch()) document.body.classList.add("has_hover");
  await voice.init_voice();
  $score = document.getElementById("score_value");
  $level = document.getElementById("level_value");
  $progressbar = document.getElementById("bar");
  reset_progressbar();
  display_score();
  display_level();

  let $pause = document.getElementById("pause");
  $pause.textContent = RESUME_SYMB;
  $pause.onclick = function() {
    document.body.classList.remove("pause");
    if (!started) {
      started = true;
      this.style.fontSize = "1em";
      this.textContent = PAUSE_SYMB;
      init();
      set_buttons_display(true);
    } else {
      pause = !pause;
      if (pause) {
        document.body.classList.add("pause");
        this.style.fontSize = "4em";
        reset_ui();
        set_buttons_display(false);
        voice.cancel();
        this.textContent = RESUME_SYMB;
      } else {
        set_buttons_display(true);
        this.style.fontSize = "1em";
        state = INIT;
        this.textContent = PAUSE_SYMB;
      }
    }
  };
  setup_shortcuts();
};
