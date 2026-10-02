/** Server-only. 100% Stripe coupon applied at checkout for listed emails. */

export const COMP_MEMBERSHIP_SHEET =
  "https://docs.google.com/spreadsheets/d/1fT3s72MVCAxb8gXrE6YXfBrMEHxTbL6jG8LQI8l5hlM/edit?gid=0#gid=0";

const COMP_MEMBERSHIP_EMAILS = new Set<string>([
  "bl628@cornell.edu",
  "iy53@cornell.edu",
  "jc2887@cornell.edu",
  "studio@liumichelle.com",
  "emilyshenucla@gmail.com",
  "mh7323@nyu.edu",
  "yw2339@cornell.edu",
  "adaezeasonye@gmail.com",
  "evanamadeuscameron@gmail.com",
  "aqg4@cornell.edu",
  "21adoan2@gmail.com",
  "angelzeng39@gmail.com",
  "yt2694@nyu.edu",
  "hi@anunay.tech",
  "arrane@usc.edu",
  "ashleyhelento.design@gmail.com",
  "avacarroll22@gmail.com",
  "tothienbao6a0@gmail.com",
  "bemnet@umich.edu",
  "brayden@uwaterloo.ca",
  "my3037@nyu.edu",
  "charleschencui@gmail.com",
  "workwithchiq@gmail.com",
  "syrrchrisarchie@gmail.com",
  "chrisandravaz12@gmail.com",
  "cpr58@cornell.edu",
  "dxnielogura@gmail.com",
  "edin.le.314@gmail.com",
  "elaineyustudio@gmail.com",
  "emdesignsthings@gmail.com",
  "emmiwu@sas.upenn.edu",
  "el728@cornell.edu",
  "hannshin123@gmail.com",
  "hannahzhou8@g.ucla.edu",
  "hjelani@umich.edu",
  "hyebinp@umich.edu",
  "insia@sas.upenn.edu",
  "janani@clayzo.com",
  "janeh0120@gmail.com",
  "jeanchen.crjj@gmail.com",
  "thejenniferfang@gmail.com",
  "jxy.lee2005@gmail.com",
  "fungj@usc.edu",
  "jl4229@cornell.edu",
  "joelleshek@berkeley.edu",
  "jlsidelsky@gmail.com",
  "chow1kaitlin@gmail.com",
  "kyang01@g.ucla.edu",
  "kjc249@cornell.edu",
  "kayleytvu@gmail.com",
  "kbrjhala@gmail.com",
  "kristen.balisi@gmail.com",
  "lj295@cornell.edu",
  "kinsellalauryn@gmail.com",
  "lej56@cornell.edu",
  "lenoramalaika@gmail.com",
  "liamdudesign@gmail.com",
  "liesl.anggijono@gmail.com",
  "lily.samuels@duke.edu",
  "maggieju@g.ucla.edu",
  "markhou2023@gmail.com",
  "mattyu@stanford.edu",
  "zw757@cornell.edu",
  "may52@cornell.edu",
  "michellefeng153@gmail.com",
  "mikaelalabadan@gmail.com",
  "mingjinzhang43@gmail.com",
  "ninakim.info@gmail.com",
  "purav@clayzo.com",
  "quentin@tryinspector.com",
  "hello@richardtongiang.com",
  "roydenso.nyc@gmail.com",
  "rwq3@cornell.edu",
  "sakchhithapa@berkeley.edu",
  "samfoxcheng@gmail.com",
  "sam@tryrivet.design",
  "nyaangasarah@gmail.com",
  "shreeshasatvik@gmail.com",
  "seeun@berkeley.edu",
  "sheffw388@gmail.com",
  "sonya.pholsiri@utexas.edu",
  "sophiadelrosario.14@gmail.com",
  "sam9635@nyu.edu",
  "schou@gofundme.com",
  "stphnlines@gmail.com",
  "tisebuilds@gmail.com",
  "williamle2021@gmail.com",
  "yunakeem3@gmail.com",
]);

export function parseCompEmails(raw: string | undefined | null) {
  return new Set(
    (raw || "")
      .split(/[,;\n]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isDirectorySheetEmail(email: string) {
  return COMP_MEMBERSHIP_EMAILS.has(email.trim().toLowerCase());
}

export function isCompMembershipEmail(
  email: string,
  rawList = process.env.STRIPE_COMP_EMAILS,
) {
  const normalized = email.trim().toLowerCase();
  return (
    COMP_MEMBERSHIP_EMAILS.has(normalized) ||
    parseCompEmails(rawList).has(normalized)
  );
}

/** Live promotion code for directory-sheet comps. Env overrides this. */
export const DEFAULT_STRIPE_COMP_PROMOTION =
  "promo_1UKjNQRTgiLNfq1KP5vNNePP";

export function compCouponId(
  raw = process.env.STRIPE_COUPON_FREE_MEMBERSHIP,
) {
  const id = (raw || "").trim();
  if (id.startsWith("promo_") || id.startsWith("coupon_")) return id;
  return DEFAULT_STRIPE_COMP_PROMOTION;
}

export function shouldApplyCompCoupon(email: string) {
  return Boolean(compCouponId() && isCompMembershipEmail(email));
}
