jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID) {
	"use strict";
    $('#button_save').on('click', async function () {
        let readSetting ={
            appId:"4",
            apiToken:"PlfW1fV81M22DIn78ghRinRswPghius5bZxLwV5K",
            location:"header",
            location1:"space_A",
            countDisplay:"Read:{%Num%}",
            resetReadData:"true",
            unreadTextColor:"back",
            unreadBGColor:"red",
            readTextColor:"back",
            readBGColor:"blue"

        };
        let config = JSON.stringify(readSetting);
        kintone.plugin.app.setConfig({ config }, () => {
            window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
        });
    });
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);



