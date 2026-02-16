// EAS Build sets SUPABASE_URL and SUPABASE_ANON_KEY as secrets; they are
// available as process.env here and get baked into the app via extra.
const base = require('./app.json');

module.exports = {
  expo: {
    ...base.expo,
    extra: {
      ...base.expo.extra,
      SUPABASE_URL: process.env.SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },
};
