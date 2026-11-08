/** Server-only. The Board of Advisors are Design Meetup members too. */

const BOARD_OF_ADVISORS_EMAILS = new Set<string>([
  "angela@achudesign.com",
  "jinsupark@icloud.com",
  "sophia@framer.com",
  "elizabeth.lin@ramp.com",
  "me@jameygannon.com",
  "adam@fal.ai",
  "jordynnicolebrands@gmail.com",
  "tisebuilds@gmail.com",
  "hello@matthewvernon.co",
  "doug@dougdemarco.com",
  "mail@dennisjin.com",
  "cheng@instagram.com",
  "jocelynzhaodesign@gmail.com",
  "lsandoval@makenotion.com",
  "adesignwoman@gmail.com",
  "jxsephz@gmail.com",
  "jhnbai@gmail.com",
  "jncelee@gmail.com",
  "mareike.carolin.keller@gmail.com",
  "steph@designmoresteph.studio",
  "joanna.chen@figma.com",
  "yuheng.jennifer.jing@gmail.com",
  "adam@skywalker.design",
  "csziebert@google.com",
  "flo@paradigmai.com",
  "rissakeichua@gmail.com",
  "mathurah.ravigulan@gmail.com",
  "workwithchiq@gmail.com",
  "bycovacut@gmail.com",
  "bchodesign@gmail.com",
  "uxbrianthompson@gmail.com",
  "hello@angelaguzman.co",
  "mrinali@hiriffle.com",
  "aibek@wonder.so",
  "sam@rivet.design",
  "shaahananaufal@gmail.com",
  "burtonrast@gmail.com",
  "cj@mlgrto.com",
  "kenny@anysphere.co",
  "chris.allick@doordash.com",
  "alekhyamaram1@gmail.com",
  "vamsibatchuk@gmail.com",
  "bennett.w.huffman@gmail.com",
  "kathytzhou@gmail.com",
  "jgt@meta.com",
  "heyresham@gmail.com",
  "m@senyil.com",
  "ahmed@falcon.so",
  "hi@jessyin.world",
]);

export function boardOfAdvisorsEmails() {
  return [...BOARD_OF_ADVISORS_EMAILS];
}

export function isBoardOfAdvisorsEmail(email: string) {
  return BOARD_OF_ADVISORS_EMAILS.has(email.trim().toLowerCase());
}
