const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  USER: 'USER',
  ADMIN: 'ADMIN',
};
const LEAD_TYPE = {
  SOLAR_RESIDENTIAL: 'SOLAR_RESIDENTIAL',
  ROOFING: 'ROOFING',
  GUTTERS: 'GUTTERS',
  HVAC: 'HVAC',
};

const BOBERDOO_LEAD_TYPE_MAP = {
  SOLAR_RESIDENTIAL: 33,
  ROOFING: 35,
  GUTTERS: 37,
  HVAC: 39,
};


const TIMEZONES = {
  EASTERN: 'America/New_York',
  CENTRAL: 'America/Chicago',
  MOUNTAIN: 'America/Denver',
  PACIFIC: 'America/Los_Angeles'
};

const TIMEZONE_LABELS = {
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Los_Angeles': 'Pacific Time (PT)'
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
  PAYMENT_TYPE,
  TIMEZONES,
  TIMEZONE_LABELS,

};
