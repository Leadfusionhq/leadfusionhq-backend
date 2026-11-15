// src/utils/sms.utils.js
// Helpers for building SMS bodies that fit the Notifyre send limit.
//
// Notifyre concatenates up to 8 parts per SMS:
//   - GSM-7 text  : 8 x 153 = 1224 characters
//   - UCS-2 text  : 8 x  67 =  536 characters (used when any non-GSM char is present)
// A message over the limit is rejected by the provider, so we only trim the
// notes section, and only when the whole message would not fit.

const GSM_MAX_LENGTH = 1224;
const UCS2_MAX_LENGTH = 536;
const ELLIPSIS = '...';

// Basic GSM-7 character set plus the escaped extension characters.
const GSM7_REGEX =
  /^[\s@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/;

const isGsm7 = (text) => GSM7_REGEX.test(text);

const smsMaxLength = (text) => (isGsm7(text) ? GSM_MAX_LENGTH : UCS2_MAX_LENGTH);

/**
 * Build an SMS from a render function that takes the notes text.
 * The full notes are used whenever the message fits the provider limit.
 * Only when it would not fit, the notes are shortened just enough to fit.
 *
 * @param {(notes: string) => string} render  builds the full SMS body from the notes
 * @param {string} notes                      full notes text
 * @returns {string} SMS body that fits within the provider limit
 */
const buildSmsWithNotes = (render, notes = '') => {
  const fullNotes = String(notes || '');
  const full = render(fullNotes);
  const limit = smsMaxLength(full);
  if (full.length <= limit) return full;

  const overflow = full.length - limit + ELLIPSIS.length;
  const keep = Math.max(0, fullNotes.length - overflow);
  return render(fullNotes.substring(0, keep).trimEnd() + ELLIPSIS);
};

module.exports = {
  GSM_MAX_LENGTH,
  UCS2_MAX_LENGTH,
  isGsm7,
  smsMaxLength,
  buildSmsWithNotes,
};
