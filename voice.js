let msg = new SpeechSynthesisUtterance();
msg.voice = null;
msg.volume = 1; // 0 to 1
msg.rate = 0.8; // 0.1 to 10
msg.pitch = 0; //0 to 2
msg.lang = "ja";

let talking = false;

async function get_voices() {
  return new Promise((res, rej) => {
    function check() {
      let voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        setTimeout(check, 100);
      } else {
        res(voices);
      }
    }
    check();
  });
}
const init_voice = async () => {
  let voices = await get_voices();
  msg.voice = voices.filter(v => v.lang.startsWith("ja"))[1];
};

const say_in_japanese = text => {
  talking = true;
  msg.text = text;
  speechSynthesis.speak(msg);
  msg.onend = function(e) {
    talking = false;
  };
};

const is_talking = () => talking;

const cancel = () => speechSynthesis.cancel();

export default {
  init_voice,
  say_in_japanese,
  is_talking,
  cancel
};
