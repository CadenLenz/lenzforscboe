let TURNSTILE_SITE_KEY = "";
let requestId = crypto.randomUUID();
let lastSubmission = "";
const form = document.querySelector("#endorsement-form");
const submit = document.querySelector("#endorsement-submit");
const status = document.querySelector("#form-status");
let token = "";
let widget;
let busy = false;
const thanks =
  "Thank you. Your endorsement means a great deal to me. I am grateful to have your support in my campaign. Together, we can help ensure every decision keeps what is best for students at the center of every decision.";
const fields = ["name", "affiliation", "email", "consent"];
function report(message) {
  status.textContent = message;
}
function validate() {
  let firstInvalid;
  for (const id of fields) {
    const field = form.elements[id];
    if (id !== "consent") field.value = field.value.trim();
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    document.querySelector(`#${id}-error`).textContent = valid
      ? ""
      : field.validationMessage;
    if (!valid && !firstInvalid) firstInvalid = field;
  }
  firstInvalid?.focus();
  return !firstInvalid;
}
form.noValidate = true;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !validate()) return;
  if (!token) {
    report("Please complete the spam-prevention check before submitting.");
    return;
  }
  const fingerprint = JSON.stringify([form.elements.name.value, form.elements.affiliation.value, form.elements.email.value]);
  if (lastSubmission && lastSubmission !== fingerprint) requestId = crypto.randomUUID();
  lastSubmission = fingerprint;
  busy = true;
  submit.disabled = true;
  submit.textContent = "Submitting…";
  report("Sending your endorsement for campaign review…");
  try {
    const response = await fetch("/api/endorsement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.elements.name.value,
        role: form.elements.affiliation.value,
        requestId,
        email: form.elements.email.value,
        consent: form.elements.consent.checked,
        website: form.elements.website.value,
        token,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true)
      throw new Error("Submission failed");
    form.reset();
    requestId = crypto.randomUUID();
    lastSubmission = "";
    report(thanks);
    status.setAttribute("tabindex", "-1");
    status.focus();
  } catch {
    report(
      "We could not confirm your submission. Your entries are still here. Complete a new verification check and try again, or email lenzforscboe@gmail.com.",
    );
  } finally {
    token = "";
    busy = false;
    submit.textContent = "Add Your Endorsement";
    if (window.turnstile && widget !== undefined)
      window.turnstile.reset(widget);
  }
});
async function configureForm() {
 try {
  const response = await fetch("/api/endorsement-config", { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error();
  const config = await response.json();
  if (!config.enabled || !config.siteKey) throw new Error();
  TURNSTILE_SITE_KEY = config.siteKey;
  report(
    "Complete the form and the spam-prevention check to submit your endorsement.",
  );
  window.onCampaignTurnstileReady = () => {
    widget = window.turnstile.render("#turnstile-widget", {
      sitekey: TURNSTILE_SITE_KEY,
      action: "endorsement",
      size: "compact",
      theme: "light",
      callback(value) {
        token = value;
        if (!busy) submit.disabled = false;
      },
      "expired-callback"() {
        token = "";
        submit.disabled = true;
        report("Verification expired. Please complete the check again.");
      },
      "error-callback"() {
        token = "";
        submit.disabled = true;
        report(
          "Verification is unavailable. Please reload this page or email the campaign.",
        );
      },
    });
  };
  const script = document.createElement("script");
  script.src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onCampaignTurnstileReady&render=explicit";
  script.async = true;
  script.onerror = () =>
    report(
      "Verification could not load. Please reload this page or email the campaign.",
    );
  document.head.append(script);
 } catch { report("Online endorsements are temporarily unavailable. Please email lenzforscboe@gmail.com to connect with the campaign."); }
}
configureForm();
let refreshing = false;
async function refreshEndorsements() {
 if (refreshing || document.hidden) return;
 refreshing = true;
 const list = document.querySelector("#approved-endorsements");
 const notice = document.querySelector("#endorsement-list-status");
 try {
  const response = await fetch("/api/endorsements", { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error();
  const data = await response.json();
  if (!Array.isArray(data.endorsements)) throw new Error();
  const cards = data.endorsements.map(({name, role}) => {
   const card = document.createElement("article"); card.className = "endorser";
   const person = document.createElement("strong"); person.textContent = name;
   const affiliation = document.createElement("span"); affiliation.textContent = role;
   card.append(person, affiliation); return card;
  });
  list.replaceChildren(...cards);
  notice.textContent = cards.length ? "" : "Endorsements will appear here as they are approved.";
 } catch { notice.textContent = "The endorsement list could not refresh. Please try again shortly."; }
 finally { refreshing = false; }
}
refreshEndorsements();
window.addEventListener("focus", refreshEndorsements);
document.addEventListener("visibilitychange", refreshEndorsements);
setInterval(refreshEndorsements, 60000);
// A privacy anchor also opens the disclosure for keyboard and pointer visitors.
function openPrivacy() {
  if (location.hash === "#privacy")
    document.querySelector("#privacy").open = true;
}
window.addEventListener("hashchange", openPrivacy);
openPrivacy();
