const base = require('./app.json');

module.exports = {
  expo: {
    ...base.expo,
    scheme: 'numo',

    updates: {
      url: "https://u.expo.dev/c3aa979b-0b57-48c4-b948-aca1b7089034",
      checkAutomatically: "ON_LOAD"
    },

    runtimeVersion: {
      policy: "appVersion"
    },

    extra: {
      ...base.expo.extra,
      SUPABASE_URL: process.env.SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },
};