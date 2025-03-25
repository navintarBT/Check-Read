jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID, kintone) {
    "use strict";

    let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID).config;
    if (!CONFIG) return;
    CONFIG = JSON.parse(CONFIG);

    kintone.events.on("app.record.detail.show", async (event) => {
        // set Read
        if (CONFIG.location === "header") {
            let headerSpace = kintone.app.record.getHeaderMenuSpaceElement();
            const label = $("<div>")
            .addClass("control-label-gaia")
            .append(
                $("<label>")
                .addClass("control-label-text-gaia").css("margin-left", "10px")
                .text("item.storeField.label")
            );
            $(headerSpace).append(label);
           
        } else {
        const spaceElement = kintone.app.record.getSpaceElement(CONFIG.location);
          const label = $("<div>")
        .addClass("control-label-gaia")
        .append(
            $("<label>")
            .addClass("control-label-text-gaia")
            .text("item.storeField.label")
        );
        $(spaceElement).append(label);
        }

        // get user login
          const userInfo = kintone.getLoginUser();

        const params = {
            app: CONFIG.appId,
            fields: ["appID", "recordId", "revision", "date", "user"],
            totalCount: true 
        };

        kintone.api(kintone.api.url('/k/v1/records', true), 'GET', params, function(resp) {
            let status = false;
            console.log('All Records:', resp.records);
                        let records = resp.records;
            for (const record of records) {
                if (
                    record.appID.value == CONFIG.appId &&
                    record.recordId.value == kintone.app.record.getId() &&
                    record.user.value.length > 0 &&
                    record.user.value[0].code == userInfo.code&&
                    record.revision.value == event.record.$revision.value
                ) {
                    console.log(record.appID.value);
                    console.log(record.recordId.value);
                    console.log(userInfo.code);
                    status = true;
                    break; 
                }
            }
                        
            console.log(status);
            if(!status){
            const body = {
                app: CONFIG.appId,
                record: {
                    "appID": {
                        value: CONFIG.appId
                    },
                    "recordId": {
                        value: kintone.app.record.getId()
                    },
                    "revision": {
                        value: event.record.$revision.value
                    },
                    "date": {
                        value: new Date().toISOString().split("T")[0] 
                    },
                    "user": {
                        value: [{ code: userInfo.code }]
                    },
                }
            };
            kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', body, function(resp) {
                console.log(resp);
              }, function(error) {
                console.log(error);
              });
            }
        });

        // create a new record in db app

                
            });

        kintone.events.on("app.record.detail.show", async (event) => {


        });
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID, kintone);