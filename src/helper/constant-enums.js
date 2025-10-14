const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  USER: 'USER',
  ADMIN: 'ADMIN',
};
const LEAD_TYPE = {
  SOLAR_RESIDENTIAL: 'SOLAR_RESIDENTIAL',
  ROOFING: 'ROOFING',
  SOLAR_COMMERCIAL: 'SOLAR_COMMERCIAL',
  POWER_WASHING: 'POWER_WASHING',
  ROOF_REJUVENATION: 'ROOF_REJUVENATION',
  GUTTERS: 'GUTTERS',
  SIDING: 'SIDING',
  WINDOWS: 'WINDOWS',
};
const BOBERDOO_LEAD_TYPE_MAP = {
  SOLAR_RESIDENTIAL: 33, // replace with actual ID
  ROOFING: 34,           // replace with actual ID
  SOLAR_COMMERCIAL: 35,
  POWER_WASHING: 36,
  ROOF_REJUVENATION: 37,
  GUTTERS: 38,
  SIDING: 39,
  WINDOWS: 40,
};

const EXCLUSIVITY = {
  EXCLUSIVE: 'EXCLUSIVE',         // Lead sold to only 1 buyer
  NON_EXCLUSIVE: 'NON_EXCLUSIVE', // Lead sold to multiple buyers
  SHARED: 'SHARED',               // Shared leads (similar to non-exclusive)
  WARM_TRANSFER: 'WARM_TRANSFER', // Lead transferred live to client
  APPOINTMENT: 'APPOINTMENT',     // Lead with confirmed appointment
};

const STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  REJECTED: 'REJECTED',
};
const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const LANGUAGE = {
  ENGLISH: 'ENGLISH',
  SPANISH: 'SPANISH',
};

const CONTENT_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video',
};

const CHAT_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
}


const PAYMENT_TYPE = {
  PREPAID: 'prepaid',
  PAY_AS_YOU_GO: 'payasyougo',
};

module.exports = {
  USER_ROLE,
  LEAD_TYPE,
  BOBERDOO_LEAD_TYPE_MAP,
  EXCLUSIVITY,
  STATUS,
  DAYS_OF_WEEK,
  LANGUAGE,
  
  CONTENT_TYPE,
  CHAT_STATUS,
  PAYMENT_TYPE
};
