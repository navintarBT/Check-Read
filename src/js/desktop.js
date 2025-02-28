jQuery.noConflict();
(async function ($, PLUGIN_ID) {
  "use strict";
  let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID).config;

  if (!CONFIG) return;
  CONFIG = JSON.parse(kintone.plugin.app.getConfig(PLUGIN_ID).config);
  kintone.events.on("app.record.index.show", async () => {
    console.log("CONFIG");
  });
})(jQuery, kintone.$PLUGIN_ID);
