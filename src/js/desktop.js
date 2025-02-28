jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID) {
  let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID).config;

  if (!CONFIG) return;
  CONFIG = JSON.parse(kintone.plugin.app.getConfig(PLUGIN_ID).config);
  console.log(CONFIG);
  
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
