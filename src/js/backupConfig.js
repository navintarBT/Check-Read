jQuery.noConflict();
(async function ($, Swal10, PLUGIN_ID) {
	"use strict";
	let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);

	// get field from kintone app.
	let GETFIELD = await kintone.api("/k/v1/preview/app/form/fields", "GET", {
		app: kintone.app.getId()
	});

	// get layout for get space from kintone app.
	let GETSPACE = await kintone.api("/k/v1/preview/app/form/layout.json", "GET", {
		app: kintone.app.getId()
	});

	// get space.
	let SPACE = GETSPACE.layout.reduce((setSpace, layoutFromApp) => {
		if (layoutFromApp.type === "GROUP") {
			layoutFromApp.layout.forEach(layoutItem => {
				layoutItem.fields.forEach(field => {
					if (field.type === "SPACER" && field.elementId) {
						setSpace.push({
							code: field.elementId
						});
					}
				});
			});
		} else {
			layoutFromApp.fields.forEach(field => {
				if (field.type === "SPACER" && field.elementId) {
					setSpace.push({
						code: field.elementId
					});
				}
			});
		}
		return setSpace;
	}, []);

	// sort space
	let SORTSPACE = SPACE.sort((a, b) => {
		return a.code.localeCompare(b.code);
	});

	// sort field.
	let FIELDFROMAPP = Object.values(GETFIELD.properties).sort((a, b) => {
		return a.code.localeCompare(b.code);
	});

	//function set value to config setting.
	async function setValueConfig() {
		return new Promise((resolve) => {
			FIELDFROMAPP.forEach((items) => {
				if (items.type == "DATE") {
					$("select#store_field").append(
						$("<option>").attr("value", items.code).attr("title", items.label).text(`${items.label}(${items.code}) `)
					);
					$("select#field_search").append(
						$("<option>").attr("value", items.code).attr("title", items.label).text(`${items.label}(${items.code}) `)
					);
				}
			});

			SORTSPACE.forEach((items) => {
				$("select#space").append(
					$("<option>").attr("value", items.code).text(`${items.code}`)
				);
			});
			resolve();
		});
	}

	// function get data from table.
	async function getData() {
		let formatSetting = $("#kintoneplugin-setting-tspace > tr:gt(0)").map(function () {
			let type = $(this).find("#type").val();
			let space = $(this).find("#space").val();
			let storeField = {
				code: $(this).find("#store_field").val(),
				label: $(this).find("#store_field option:selected").attr("title")
			}
			let format = $(this).find("#format").val();
			let initialValue = $(this).find("#initial_value").val();
			return { type, space, storeField, format, initialValue };
		}).get();
		let searchContent = $("#kintoneplugin-setting-search > tr:gt(0)").map(function () {
			let fieldSearch = {
				code: $(this).find("#field_search").val(),
				label: $(this).find("#field_search option:selected").attr("title")
			}
			let searchName = $(this).find("#search_name").val();
			return { fieldSearch, searchName };
		}).get();
		return {
			formatSetting,
			searchContent
		};
	}

	async function setValueToTable(getConfig) {
		getConfig.formatSetting.forEach((item) => {
			let rowForClone = $("#kintoneplugin-setting-tspace tr:first-child").clone(true).removeAttr("hidden");
			$("#kintoneplugin-setting-tspace tr:last-child").after(rowForClone);
			rowForClone.find("#initial_value").val(item.initialValue);

			//check type dropdown
			if ($(rowForClone).find('select#type option[value="' + item.type + '"]').length == 0) {
				rowForClone.find("#type").val("-----");
			} else {
				rowForClone.find("#type").val(item.type);
			}
			//check space dropdown
			if ($(rowForClone).find('select#space option[value="' + item.space + '"]').length == 0) {
				rowForClone.find("#space").val("-----");
			} else {
				rowForClone.find("#space").val(item.space);
			}

			//check store field dropdown
			if ($(rowForClone).find('select#store_field option[value="' + item.storeField.code + '"]').length == 0) {
				rowForClone.find("#store_field").val("-----");
			} else {
				rowForClone.find("#store_field").val(item.storeField.code);
			}

			//check format dropdown
			if ($(rowForClone).find('select#format option[value="' + item.format + '"]').length == 0) {
				rowForClone.find("#format").val("-----");
			} else {
				rowForClone.find("#format").val(item.format);
			}
		})
		getConfig.searchContent.forEach((item) => {
			let rowSearchContent = $("#kintoneplugin-setting-search tr:first-child").clone(true).removeAttr("hidden");
			$("#kintoneplugin-setting-search tr:last-child").after(rowSearchContent);
			rowSearchContent.find("#search_name").val(item.searchName);

			//check type dropdown
			if ($(rowSearchContent).find('select#field_search option[value="' + item.fieldSearch.code + '"]').length == 0) {
				rowSearchContent.find("#field_search").val("-----");
			} else {
				rowSearchContent.find("#field_search").val(item.fieldSearch.code);
			}

		})
	}

	// setInitialValue function
	async function setInitialValue(status, setInitial) {
		let getConfig = {};
		if (status == "setInitial") {
			if (Object.keys(CONFIG).length === 0) {
				$("#kintoneplugin-setting-tspace tr:first-child").after(
					$("#kintoneplugin-setting-tspace tr:first-child").clone(true).removeAttr("hidden")
				)
				$("#kintoneplugin-setting-search tr:first-child").after(
					$("#kintoneplugin-setting-search tr:first-child").clone(true).removeAttr("hidden")
				)
				checkRow();
				return;
			} else {
				getConfig = JSON.parse(CONFIG.config);
				await setValueToTable(getConfig);
			}
		} else {
			// Clear all rows except the first row of table space for prompt template and button and table setting prompt template.
			$("#kintoneplugin-setting-tspace > tr:not(:first)").remove();
			$("#kintoneplugin-setting-search > tr:not(:first)").remove();
			getConfig = setInitial;
			await setValueToTable(getConfig);
		}
		checkRow();
	}

	// check row function.
	function checkRow() {
		const tablesId = [
			"#kintoneplugin-setting-tspace",
			"#kintoneplugin-setting-search",
		];
		$.each(tablesId, function (index, id) {
			let rows = $(id + " > tr");
			if (rows.length <= 2) {
				rows.find(".removeRow").hide();
			} else {
				rows.find(".removeRow").show();
			}
		});
	}
	// validate update function.
	async function validation() {
		let hasError = false;
		let errorMessage = "";
		let errorSearchContent = "";
		let storeFiledArray = [];
		let fieldSearchArray = [];
		let spaceArray = [];
		//group setting table
		let formatSettingTable = $('#kintoneplugin-setting-tspace > tr:gt(0)').toArray();
		let searchContentTable = $('#kintoneplugin-setting-search > tr:gt(0)').toArray();
		let typeError = "";
		let storeFieldError = "";
		let spaceError = "";
		let searchNameError = "";
		let fieldSearchError = "";
		for (const [index, element] of formatSettingTable.entries()) {
			let type = $(element).find('#type');
			let space = $(element).find('#space');
			let storeField = $(element).find('#store_field');
			if (type.val() == "-----") {
				typeError = `<p>Please select a type.</p>`;
				$(type).parent().addClass('validation-error');
				hasError = true;
			} else {
				$(type).parent().removeClass('validation-error');
			}

			if (space.val()) {
				if (!spaceArray.includes(space.val().trim())) {
					$(space).parent().removeClass('validation-error');
					spaceArray.push(space.val());
				} else {
					$(space).parent().addClass('validation-error');
					spaceError = `<p>Cannot select the same space</p>`;
					hasError = true;
				}
			}

			if (storeField.val() == "-----") {
				storeFieldError = `<p>Select the storage field.</p>`;
				$(storeField).parent().addClass('validation-error');
				hasError = true;
			} else {
				$(storeField).parent().removeClass('validation-error');
				if (!storeFiledArray.includes(storeField.val().trim())) {
					$(storeField).parent().removeClass('validation-error');
					storeFiledArray.push(storeField.val());
				} else {
					$(storeField).parent().addClass('validation-error');
					errorMessage += `<p>The field to be searched${storeField.val()}already exists.</p>`;
					hasError = true;
				}
			}

		}
		for (const [index, element] of searchContentTable.entries()) {
			let searchName = $(element).find('#search_name');
			let fieldSearch = $(element).find('#field_search');
			if (searchName.val() == "") {
				searchNameError = `<p>Search name cannot be empty</p>`;
				$(searchName).addClass('validation-error');
				hasError = true;
			} else {
				$(searchName).removeClass('validation-error');
				if (!fieldSearchArray.includes(searchName.val().trim())) {
					$(searchName).removeClass('validation-error');
					fieldSearchArray.push(searchName.val());
				} else {
					$(searchName).addClass('validation-error');
					errorSearchContent += `<p>The search name ${searchName.val()} already exists.</p>`;
					hasError = true;
				}
			}

			if (fieldSearch.val() == "-----") {
				fieldSearchError = `<p>Please select a type field for search</p>`;
				$(fieldSearch).parent().addClass('validation-error');
				hasError = true;
			} else {
				$(fieldSearch).parent().removeClass('validation-error');
				if (!fieldSearchArray.includes(fieldSearch.val().trim())) {
					$(fieldSearch).parent().removeClass('validation-error');
					fieldSearchArray.push(fieldSearch.val());
				} else {
					$(fieldSearch).parent().addClass('validation-error');
					errorSearchContent += `<p>The field for search ${fieldSearch.val()} already exists.</p>`;
					hasError = true;
				}
			}
		}
		if (typeError) errorMessage += typeError;
		if (spaceError) errorMessage += spaceError;
		if (storeFieldError) errorMessage += storeFieldError;
		if (searchNameError) errorSearchContent += searchNameError;
		if (fieldSearchError) errorSearchContent += fieldSearchError;
		if (errorMessage.length > 0) errorMessage = "<p>【Date format settings】</p>" + errorMessage;
		if (errorSearchContent.length > 0) errorSearchContent = "<p>【Search Content】</p>" + errorSearchContent;

		if (hasError) Swal10.fire({
			position: 'center',
			icon: 'error',
			html: errorMessage + errorSearchContent,
			showConfirmButton: true,
		});
		return hasError;
	}


	//function start when open the plugin.
	$(document).ready(function () {
		window.RsComAPI.showSpinner();
		setValueConfig().then(() => {
			return setInitialValue('setInitial');
		}).then(() => {
			window.RsComAPI.hideSpinner();
		});


		$('#kintoneplugin-setting-tspace,#kintoneplugin-setting-search').sortable({
			handle: '.drag-icon',  // Restrict dragging to the drag icon (bars)
			items: 'tr:not([hidden])', // Ensure only visible rows can be dragged
			cursor: 'move',
			placeholder: 'ui-state-highlight',
			axis: 'y'
		});

		$('input#initial_value').on('input', function () {
			$(this).val($(this).val().replace(/[^0-9-]/g, ''));
		})

		$('input#search_name').on('input', function () {
			let currentValue = $(this).val();
			currentValue = currentValue.replace(/[^a-zA-Z0-9\s]/g, '');
			currentValue = currentValue.replace(/\s{2,}/g, ' ');
			$(this).val(currentValue);
		});
		
		// button save.
		$('#button_save').on('click', async function () {
			let createConfig = await getData();
			let hasError = await validation("save", createConfig);
			if (hasError) return;
			let config = JSON.stringify(createConfig);
			kintone.plugin.app.setConfig({ config }, () => {
				window.location.href = `../../flow?app=${kintone.app.getId()}#section=settings`;
			});
		});

		$(".cancel").on('click', async function () {
			Swal10.fire({
				position: "center",
				icon: "info",
				text: "Do you want to finish setting up the plugin?",
				confirmButtonColor: "#3498db",
				showCancelButton: true,
				cancelButtonColor: "#f7f9fa",
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
				customClass: {
					confirmButton: 'custom-confirm-button',
					cancelButton: 'custom-cancel-button'
				}
			}).then((result) => {
				if (result.isConfirmed) {
					window.location.href = "../../" + kintone.app.getId() + "/plugin/";
				}
			});
		});

		//add new row function
		$(".addRow").on('click', function () {
			let closestTable = $(this).closest("table");
			let closestTbody = $(this).closest("tbody");
			let clonedRow = closestTbody.find("tr").first().clone(true).removeAttr("hidden");
			if (closestTable.is("#kintoneplugin-setting-body"));
			// Insert the cloned row after the current clicked row
			$(this).closest("tr").after(clonedRow);
			checkRow();
		});

		//remove row function
		$(".removeRow").on('click', function () {
			$(this).closest("tr").remove();
			checkRow();
		});

		// Export function
		$("#Export").on('click', async function () {
			Swal10.fire({
				customClass: {
					confirmButton: 'custom-confirm-button',
					cancelButton: 'custom-cancel-button'
				},
				position: "center",
				icon: "info",
				text: "Do you want to export configuration information?",
				confirmButtonColor: "#3498db",
				showCancelButton: true,
				cancelButtonColor: "#f7f9fa",
				confirmButtonText: "OK",
				cancelButtonText: "Cancel",
			}).then(async (result) => {
				if (result.isConfirmed) {
					let hasError = await validation("export", await getData());
					if (hasError) return;
					let data = await getData();
					let blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
					let url = URL.createObjectURL(blob);
					let date = new Date();
					let year = date.getFullYear();
					let month = ('0' + (date.getMonth() + 1)).slice(-2);
					let day = ('0' + date.getDate()).slice(-2);
					let hours = ('0' + date.getHours()).slice(-2);
					let minutes = ('0' + date.getMinutes()).slice(-2);
					let formattedDateTime = `${year}-${month}-${day} ${hours}-${minutes}.json`;
					let elementDownload = $('<a>')
						.attr('href', url)
						.attr('download', formattedDateTime)
						.appendTo('body');
					elementDownload[0].click();
					elementDownload.remove();
				};
			});
		});

		// Import function
		$("#Import").on('click', function () {
			$("#fileInput").click();
		});
		$("#fileInput").on('change', function (event) {
			let file = event.target.files[0];
			if (file) {
				let reader = new FileReader();
				reader.onload = async (e) => {
					let fileContent = e.target.result;
					let dataImport;
					try {
						dataImport = JSON.parse(fileContent);
					} catch (error) {
						let customClass = $("<div></div>")
							.html(`The file format of the configuration information for reading is JSON format.<br> Please check the file format extension.`)
							.css("font-size", "14px");
						await Swal10.fire({
							icon: "error",
							html: customClass.prop("outerHTML"),
							confirmButtonColor: "#3498db",
						});

						$("#fileInput").val('');
						return;
					}

					let checkCompareConfig = await compareConfigStructures(dataImport);
					if (!checkCompareConfig) {
						$("#fileInput").val('');
						return;
					} else {
						await setInitialValue('import', dataImport);
						Swal10.fire({
							position: 'center',
							icon: 'success',
							text: 'Configuration information loaded successfully.',
							showConfirmButton: true,
						});
						$("#fileInput").val('');
					}
				};
				reader.readAsText(file);
			}
		});

		// function check structure and data import
		async function compareConfigStructures(dataImport) {
			let configStructure = {
				formatSetting: [
					{
						type: "string",
						space: "string",
						storeField: {
							code: "string",
							label: "string",
						},
						format: "string",
						initialValue: "string"
					}
				],
				searchContent: [
					{
						fieldSearch: {
							code: "string",
							label: "string",
						},
						searchName: "string"
					}
				]
			}

			function checkType(configStructure, dataImport) {
				if (Array.isArray(configStructure)) {
					if (!Array.isArray(dataImport)) {
						return false;
					}
					for (let item of dataImport) {
						if (!checkType(configStructure[0], item)) {
							return false;
						}
					}
					return true;
				}

				if (typeof configStructure === 'object' && !Array.isArray(configStructure)) {
					if (typeof dataImport !== 'object' || Array.isArray(dataImport)) {
						return false;
					}
					for (let key in configStructure) {
						if (!(key in dataImport)) {
							return false;
						}
						if (!checkType(configStructure[key], dataImport[key])) {
							return false;
						}
					}
					for (let key in dataImport) {
						if (!(key in configStructure)) {
							return false;
						}
					}
					return true;
				}
				return true;
			}

			function checkAllCases(dataImport) {
				// Check if the object is empty
				if (Object.keys(dataImport).length === 0) {
					return false;
				}

				// Specific checks for required keys and data types
				if (!checkType(configStructure, dataImport)) {
					return false;
				}

				return true;
			}

			let isValid = checkAllCases(dataImport);
			if (!isValid) {
				let customClass = $("<div></div>")
					.text("Failed to load configuration information.")
					.css("font-size", "18px");
				await Swal10.fire({
					icon: "error",
					html: customClass.prop("outerHTML"),
					confirmButtonColor: "#3498db",
				});
				return false;
			}
			return true;
		}
	});
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);



