'use strict';

////////////////////////
// LedgerIT
// Author : Melvyn Tie
////////////////////////

import i18n from 'i18n';
import path from 'path';

export default function (app) {
  // Get the status of the Dev
  const isDev = app.get('env') === 'development';
  // Configure the settings of the i18
  i18n.configure({
    locales: ['en', 'de', 'es', 'pt'],
    defaultLocale: 'en',
    // sets a custom cookie name to parse locale settings from
    cookie: 'applang',
    // query parameter to switch locale (ie. /home?lang=ch)
    queryParameter: 'applang',
    // watch for changes in json files to reload locale on updates
    autoReload: isDev,
    directory: path.resolve(__dirname, "../../locales")
  });
  // Set cookie 'applang' if query parameter is set to persist result
  app.use((req, res, next) => {
    const langParam = req.query['applang'];
    if (langParam) {
      res.cookie('applang', langParam);
    }
    // Use app.use()in the next one
    next();
  });
  app.use(i18n.init);
}
