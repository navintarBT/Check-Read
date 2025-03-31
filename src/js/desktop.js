jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID, kintone) {
  "use strict";

  let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID).config;
  if (!CONFIG) return;
  CONFIG = JSON.parse(CONFIG);
  console.log("CONFIG",CONFIG);

  kintone.events.on("app.record.detail.show", async (event) => {
    
    // get user login
    const userInfo = kintone.getLoginUser();
    async function checkAndCreateRecord() {
        let query = `((appID = "${CONFIG.appId}") and (user in ("${userInfo.code}")) and (recordId = "${kintone.app.record.getId()}") and (revision = "${event.record.$revision.value}"))`;
        const dataFromMaster = await window.RsComAPI.getRecords({
            app: CONFIG.appId,
            query: query,
        });
        if (dataFromMaster.length == 0) {
            const body = {
                app: CONFIG.appId,
                record: {
                    appID: { value: CONFIG.appId },
                    recordId: { value: kintone.app.record.getId() },
                    revision: { value: event.record.$revision.value },
                    date: { value: new Date().toISOString().split("T")[0] },
                    user: { value: [{ code: userInfo.code }] }
                }
            };
            
            await new Promise(async (resolve, reject) => {
                try {
                    const response = await fetch(kintone.api.url("/k/v1/record.json", true), {
                        method: "POST",
                        headers: {
                            "X-Cybozu-API-Token": CONFIG.apiToken,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    });
                    const data = await response.json();
                    if (response.ok) {
                        resolve(data); 
                    } else {
                        reject(data); 
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }
    }

    // set Read
    async function createLabel(event) {
        let query = `((appID = "${CONFIG.appId}") and (recordId = "${kintone.app.record.getId()}") and (revision = "${event.record.$revision.value}"))`;
        const dataFromMaster = await window.RsComAPI.getRecords({
            app: CONFIG.appId,
            query: query,
        });
        let userReadCount = 0;
        let tableRows = ""; 
        if (dataFromMaster.length > 0) {
            console.log(dataFromMaster);
            dataFromMaster.forEach((record) => {
                console.log(record);
                userReadCount++;
                tableRows += `
                    <tr>
                        <td class="kintoneplugin-table-td">${record.date?.value || "-"}</td>
                        <td class="kintoneplugin-table-td">${record.user?.value?.[0]?.code || "-"}</td>
                        <td class="kintoneplugin-table-td">${record.revision?.value || "-"}</td>
                    </tr>
                `;
            });
        }
    
        let count = CONFIG.countDisplay.includes("{%Num%}") 
            ? CONFIG.countDisplay.replace("{%Num%}", userReadCount)
            : "";
        let targetSpace = CONFIG.location === "header"
            ? kintone.app.record.getHeaderMenuSpaceElement()
            : kintone.app.record.getSpaceElement(CONFIG.location);
        if (!targetSpace) return;
        const label = $("<div>")
            .addClass("control-label-gaia")
            .append(
                $("<label>")
                    .addClass("control-label-text-gaia")
                    .css("margin-left", "10px")
                    .text(count)
            );
        $(targetSpace).append(label);
        $(document).off("click", ".control-label-gaia").on("click", ".control-label-gaia", function () {
            showTablePopup(tableRows);
        });
    }

    function showTablePopup(tableRows) {
        let tableHTML = `
            <table class="kintoneplugin-table">
                <thead>
                    <tr>
                        <th class="kintoneplugin-table-th">Date</th>
                        <th class="kintoneplugin-table-th">User</th>
                        <th class="kintoneplugin-table-th">Revision</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
        Swal10.fire({
            title: "Read Information",
            html: tableHTML,
            confirmButtonText: "Close",
            customClass: {
                popup: "swal-wide",
            }
        });
    }
    await checkAndCreateRecord();
    await createLabel(event);
  });

  kintone.events.on("app.record.index.show", async (event) => {
    console.log(event.records);
    const userInfo = kintone.getLoginUser();
    let query = `((appID = "${CONFIG.appId}") and (user in ("${userInfo.code}")))`;
    if (event.records && event.records.length > 0) {
        let conditions = event.records.map(record => 
            `(recordId = "${record.$id.value}" and revision = "${record.$revision.value}")`
        ).join(" or ");
        query += ` and (${conditions})`;
    }
    const dataFromMaster = await window.RsComAPI.getRecords({
        app: CONFIG.appId,
        query: query,
    });

    if (!dataFromMaster || dataFromMaster.length === 0) {
        console.warn("No records found from API");
        return event;
    }

    const elements = kintone.app.getFieldElements("Updated_by");
    if (!elements) return event;
    elements.forEach((element, index) => {
        const eventRecord = event.records[index];
        if (!eventRecord) return;
        const row = element.closest("tr");
        if (!row) return;
        let isMatch = false;
        for (const record of dataFromMaster) { 
            if (CONFIG.resetReadData) {
                if (
                    record.appID.value == CONFIG.appId &&
                    record.recordId.value == eventRecord.$id.value &&
                    record.user.value.length > 0 &&
                    record.user.value[0].code == userInfo.code &&
                    record.revision.value == eventRecord.$revision.value
                ) {
                    isMatch = true;
                    break;
                }
            } else {
                if (
                    record.appID.value == CONFIG.appId &&
                    record.recordId.value == eventRecord.$id.value &&
                    record.user.value.length > 0 &&
                    record.user.value[0].code == userInfo.code
                ) {
                    isMatch = true;
                    break;
                }
            }
        }
        row.style.backgroundColor = isMatch ? CONFIG.readBGColor : CONFIG.unreadBGColor;
        row.style.color = isMatch ? CONFIG.readTextColor : CONFIG.unreadTextColor;
    });
    return event;
});
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID, kintone);
