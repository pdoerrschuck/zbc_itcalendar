/* global moment:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"IT_CALENDAR/controller/FilterBarFunctions",
	"IT_CALENDAR/controller/formatter",
	"IT_CALENDAR/controller/CalendarFunctions",
	'sap/m/MessageBox',
	"IT_CALENDAR/libs/moment",
	"IT_CALENDAR/libs/momentTimezone",
	"IT_CALENDAR/controller/validation"
], function(Controller, FilterBarFunctions, formatter, CalendarFunctions, MessageBox, momentjs, momentjsTimezone, validation) {
	"use strict";

	return Controller.extend("IT_CALENDAR.controller.Main", {
		onInit: function() {
			var viewId = this.getView().getId();
			var oToolPage = sap.ui.getCore().byId(viewId + "--toolPage");
			oToolPage.setSideExpanded(false);
			// Benutzername auf den Button setzen
			var oUserBtn = this.getView().byId("btnUser");
			oUserBtn.bindElement("/UserSet('DUMMY')");
			var oModel = this.getOwnerComponent().getModel();
			//Lesen der Zuordnung von IT-Calendar kontexte und Workmode kontexte
			//Die SAP hat das mit CASE gelöst, finde ich doof
			oModel.read("/ContextTranslationSet");
		},
		onPressTargets: function(oEvent) {
			if (!this._oFilterBar) {
				this._oFilterBar = sap.ui.xmlfragment("IT_CALENDAR.view.PopoverFilterBar", this);
				this.getView().addDependent(this._oFilterBar);
			}
			var oSource = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function() {
				this._oFilterBar.openBy(oSource);

			});
			var oModel = this.getView().getModel();
			var that = this;
			oModel.read("/UserSet('DUMMY')", {
				success: function(oData) {
					if (oData.VerfKey !== "" && oData.VerfKey !== undefined) {
						if (that.getView().byId("pc1").getRows().length === 0) {
							sap.ui.getCore().byId("idIconTabFilterBar").setSelectedKey("Verf");
							var oFilterBar = sap.ui.getCore().byId("idVerfsmartFilterBar");
							//Setzen des Filter, falls ein Parameter für das Verfahren hinterlegt ist
							oFilterBar.setFilterDataAsString('{"VerfKey":{"value":"' + oData.VerfKey + '","ranges":[],"items":[]}}', true);
							oFilterBar.search();
						}
					}
					//Button Ein oder Ausblebden (Arbeitsmodus anlegen)
					var oBtn = that.getView().byId("btnWMM");
					if (oData.Manage === true) {
						oBtn.setEnabled(true);
					} else {
						oBtn.setEnabled(false);
					}
				}
			});
		},
		onSelectionChange: FilterBarFunctions.selectCells,
		onSideNavButtonPress: function() {
			var viewId = this.getView().getId();
			var oToolPage = sap.ui.getCore().byId(viewId + "--toolPage");
			var bExpand = oToolPage.getSideExpanded();
			if (bExpand === true) {
				oToolPage.setSideExpanded(false);
			} else {
				oToolPage.setSideExpanded(true);
			}
		},
		formatter: formatter,
		handleOkPress: function() {
			/* Wir bauen einen Filter mit allen Systemen die ausgewählt sind */
			var aFilters = [];
			var aTableTs = sap.ui.getCore().byId("idTableTS").getSelectedItems();
			var aTableDb = sap.ui.getCore().byId("idTableDB").getSelectedItems();
			var aTableHost = sap.ui.getCore().byId("idTableHost").getSelectedItems();
			var aTableVerf = sap.ui.getCore().byId("idTableVerf").getSelectedItems();
			aTableTs.forEach(function(oItem) {
				var sContext = oItem.data("ContextType");
				var sId = oItem.data("Id");
				var oFilter = new sap.ui.model.Filter("Context", sap.ui.model.FilterOperator.EQ, sContext + ":" + sId);
				aFilters.push(oFilter);
			});
			aTableDb.forEach(function(oItem) {
				var sContext = oItem.data("ContextType");
				var sId = oItem.data("Id");
				var oFilter = new sap.ui.model.Filter("Context", sap.ui.model.FilterOperator.EQ, sContext + ":" + sId);
				aFilters.push(oFilter);
			});
			aTableHost.forEach(function(oItem) {
				var sContext = oItem.data("ContextType");
				var sId = oItem.data("Id");
				var oFilter = new sap.ui.model.Filter("Context", sap.ui.model.FilterOperator.EQ, sContext + ":" + sId);
				aFilters.push(oFilter);
			});
			aTableVerf.forEach(function(oItem) {
				var sContext = oItem.data("ContextType");
				var sId = oItem.data("Id");
				var oFilter = new sap.ui.model.Filter("Context", sap.ui.model.FilterOperator.EQ, sContext + ":" + sId);
				aFilters.push(oFilter);
			});
			var oFilter = new sap.ui.model.Filter("ApplicationKey", sap.ui.model.FilterOperator.EQ, "WMM"); //Aktuell nur auf Workmodes
			aFilters.push(oFilter);
			var oModel = this.getView().getModel();
			var that = this;
			oModel.read("/SystemeSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "Events" //Expand auf Events
				},
				success: function(oData) {
					/** @sap.m.PlanningCalendar */
					var oPC1 = that.getView().byId("pc1");
					oPC1.destroyRows();
					// Duplikate Check 
					var aResults = [];
					oData.results.forEach(function(oItem) {
						if (!CalendarFunctions.findObjectByKey(aResults, "Guid", oItem.Guid)) {
							aResults.push(oItem);
						}
					});
					//Nur noch die gefilterten Systeme in den PlanningCalendar laden =)
					aResults.forEach(function(oItem) {
						var oRow = new sap.m.PlanningCalendarRow({
							title: oItem.Id,
							text: oItem.Type
						});
						//Einmal nehmen wir Guid als CustomData
						var oGUID = new sap.ui.core.CustomData({
							key: "Guid",
							value: oItem.Guid
						});
						//Zusätzlich noch den Kontexttyp
						var oContext = new sap.ui.core.CustomData({
							key: "Context",
							value: oItem.Context
						});
						oRow.addCustomData(oGUID);
						oRow.addCustomData(oContext);
						oItem.Events.results.forEach(function(oEvent) {
							var oAppoint = new sap.ui.unified.CalendarAppointment({
								key: oEvent.EventID,
								startDate: formatter.dateTimeToDateObj(oEvent.StartDate, oEvent.StartTime),
								endDate: formatter.dateTimeToDateObj(oEvent.EndDate, oEvent.EndTime),
								title: oEvent.Title,
								icon: oEvent.Icon,
								text: oEvent.Category,
								type: formatter.appointmentColorType(oEvent.Color)
							});
							var oAppKey = new sap.ui.core.CustomData({
								key: "ApplicationKey",
								value: oEvent.ApplicationKey
							});
							oAppoint.addCustomData(oAppKey);
							var oContext = new sap.ui.core.CustomData({
								key: "Context",
								value: oEvent.Context
							});
							oAppoint.addCustomData(oContext);
							var oWMMGuid = new sap.ui.core.CustomData({
								key: "WmmGuid",
								value: oEvent.WmmGuid
							});
							oAppoint.addCustomData(oWMMGuid);
							oRow.addAppointment(oAppoint);
						});
						oPC1.addRow(oRow);
					});
				}
			});
		},
		onRebindTable: function(oEvent) {
			/* Wichtig, sonst werden die CustomData in der FilterBar nicht gebindet... */
			var oBindingParam = oEvent.getParameter("bindingParams");
			var sSelect = oBindingParam.parameters.select;
			sSelect = sSelect + ",Id,ContextType";
			oBindingParam.parameters.select = sSelect;

			var sSelectedFilterbar = oEvent.getParameter("id");
			//Filterbar Technical System
			if (sSelectedFilterbar === "idTSsmartTable") {
				var aKeys = sap.ui.getCore().byId("idTSFilterTechSystem").getTokens();
				aKeys.forEach(function(oKeyTS) {
					var oFilterNew = new sap.ui.model.Filter("ExtendedSID", sap.ui.model.FilterOperator.EQ, oKeyTS.getKey());
					oBindingParam.filters.push(oFilterNew);
				});
			}
			//Filterbar Database
			if (sSelectedFilterbar === "idDBsmartTable") {
				var aKeysDB = sap.ui.getCore().byId("idTSFilterDatabase").getTokens();
				aKeysDB.forEach(function(oKeyDB) {
					var oFilterNewDB = new sap.ui.model.Filter("ExtendedSID", sap.ui.model.FilterOperator.EQ, oKeyDB.getKey());
					oBindingParam.filters.push(oFilterNewDB);
				});
			}
			//Filterbar Host
			if (sSelectedFilterbar === "idHostsmartTable") {
				var aKeysHost = sap.ui.getCore().byId("idTSFilterHost").getTokens();
				aKeysHost.forEach(function(oKeyHost) {
					var oFilterNewHost = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.EQ, oKeyHost.getKey());
					oBindingParam.filters.push(oFilterNewHost);
				});
			}
		},
		onEventSelect: function(oEvent) {
			var sAppKey = oEvent.getParameter("appointment").data("ApplicationKey");
			var sContext = oEvent.getParameter("appointment").data("Context");
			/* Er mag den : nicht */
			sContext = encodeURIComponent(sContext);
			var sEventID = oEvent.getParameter("appointment").getKey();
			var sPath = "/EventSet(ApplicationKey='" + sAppKey + "',EventID='" + sEventID + "',Context='" + sContext + "')";
			if (!this._oEventPopover) {
				this._oEventPopover = sap.ui.xmlfragment("IT_CALENDAR.view.PopoverAttributes", this);
			} else {
				this._oEventPopover.destroy();
				this._oEventPopover = sap.ui.xmlfragment("IT_CALENDAR.view.PopoverAttributes", this);
			}
			this._oEventPopover.bindElement(sPath);
			this.getView().addDependent(this._oEventPopover);
			var oSource = oEvent.getParameter("appointment");
			jQuery.sap.delayedCall(0, this, function() {
				this._oEventPopover.openBy(oSource);
			});
		},
		onBtnWMMPress: function() {
			var oPc = this.getView().byId("pc1");
			var aRows = oPc.getSelectedRows();
			if (aRows.length === 0) {
				var sText = this.getView().getModel("i18n").getResourceBundle().getText("InfoNoRowsSelected");
				MessageBox.information(sText);
				return;
			}
			// Wir lesen noch den Default-Text, das Binding erfolgt im XML
			var oModel = this.getView().getModel();
			oModel.read("/EventDescrSet('ZBC_ITC_DESCR_DEFAULT')");
			if (!this._oDialogWMMCreate) {
				this._oDialogWMMCreate = sap.ui.xmlfragment("IT_CALENDAR.view.DialogCreateWMM", this);
			} else {
				this._oDialogWMMCreate.destroy();
				this._oDialogWMMCreate = sap.ui.xmlfragment("IT_CALENDAR.view.DialogCreateWMM", this);
			}
			this.getView().addDependent(this._oDialogWMMCreate);
			jQuery.sap.delayedCall(0, this, function() {
				this._oDialogWMMCreate.open();
			});
		},
		onOpenWMMCreate: function() {
			//Initiale Vorbelegung des Popups
			CalendarFunctions.setInitialCreatePopupData();
			/* Wichtiger Hinweis 
				Wir müssen für die dynamischen Komponentenauflistung ein JSON Model anlegen
				Es gibt (stand Heute) kein Möglichkeit die Anforderungen mit einem oDATA v2 Model umzusetzen!
				Es muss zwingend ein Filter aus Kombination ContextId + Type mitgegeben werden, also zwei Keys!
				Die LMDB-Schnittstelle (ABAP) für die Abhängikeiten akzeptiert nur die beiden oben genannten Werte
				Ein selbst gebastelter Filter o.ä. kann nicht genutzt werden, mit diesem lokalen JSON Model habe ich mich am Standard orientiert
			*/
			var oDependent = new sap.ui.model.json.JSONModel();
			oDependent.setProperty("/panel_data", []);
			this.getView().setModel(oDependent, "dependent");

			var oPc = this.getView().byId("pc1");
			var aRows = oPc.getSelectedRows();
			var that = this;
			aRows.forEach(function(oRow) {
				var aFilters = [];
				var oModel = that.getView().getModel();
				var sGuid = oRow.data("Guid");
				var sContext = oRow.data("Context");
				var aTranslateContextType = CalendarFunctions.convertContext(sContext, that);
				var oInputFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("MoContextId", sap.ui.model.FilterOperator.EQ, sGuid),
						new sap.ui.model.Filter("MoType", sap.ui.model.FilterOperator.EQ, aTranslateContextType[0])
					],
					and: true
				});
				aFilters.push(oInputFilter);
				var aPanelData = that.getView().getModel("dependent").getProperty("/panel_data");
				var oNewPanel = {
					"panel_name": aTranslateContextType[1],
					"managed_object_id": sGuid,
					"managed_object_type": aTranslateContextType[0],
					"dependents": [],
					"proc_dependents": []
				};
				aPanelData.push(oNewPanel);
				that.getView().getModel("dependent").setProperty("/panel_data", aPanelData);
				oModel.read("/WMMDependentsSet", {
					filters: aFilters,
					urlParameters: {
						"$expand": "Processes" //Expand auf Verfahren
					},
					success: function(oData) {
						oData.results.forEach(function(oItem) {
							//Wir brauchen noch ein IsActive Attribut (default true)
							oItem.IsActive = true; //CHG PDO 09.03.2020 - Anpassungen nach Version-Update
							CalendarFunctions.buildDependents(aPanelData, oItem);
							that.getView().getModel("dependent").refresh(true);
						});
					}
				});
			});
		},
		onWMMCancel: function() {
			this._oDialogWMMCreate.close();
		},
		onWMMViewCancel: function() {
			this._oViewDialog.close();
		},
		onWMMSave: function(oEvent) {
			//Datum und Uhrzeit validieren
			var bError = validation.validateForm(this);
			if (bError === true) {
				return;
			}
			//Kontrollabfrage - alá wollen Sie wirklich, wg. abhängigen Verfahren
			var aDepVerf = [];
			var oDepModel = this.getView().getModel("dependent");
			var oPanelData = oDepModel.getProperty("/panel_data");
			oPanelData.forEach(function(oData) {
				oData.proc_dependents.forEach(function(oProc) {
					var oObj = CalendarFunctions.findObjectByKey(aDepVerf, "verf_key", oProc.verf_key);
					if (oObj === undefined || oObj === null) {
						aDepVerf.push(oProc);
					}
				});
			});
			//Kontrollabfrage im Popover
			if (aDepVerf.length > 0) {
				oDepModel.setProperty("/process_data", aDepVerf);
				if (!this._oPopoverConfirmVerf) {
					this._oPopoverConfirmVerf = sap.ui.xmlfragment("IT_CALENDAR.view.PopoverConfirmVerf", this);
				} else {
					this._oPopoverConfirmVerf.destroy();
					this._oPopoverConfirmVerf = sap.ui.xmlfragment("IT_CALENDAR.view.PopoverConfirmVerf", this);
				}
				this.getView().addDependent(this._oPopoverConfirmVerf);
				var oSource = oEvent.getSource();
				jQuery.sap.delayedCall(0, this, function() {
					this._oPopoverConfirmVerf.openBy(oSource);
				});
			} else {
				//Speichern
				this.saveWMM();
			}
		},
		onCloseWMMCreate: function() {
			this._oDialogWMMCreate.destroy();
		},
		onCloseWMMView: function() {
			this._oViewDialog.destroy();
		},
		onShowEventDetails: function(oEvent) {
			var sEvent = oEvent.getSource().data("WmmEventGuid");
			var sPath = "/WMMWorkmodesSet('" + sEvent + "')";
			if (!this._oViewDialog) {
				this._oViewDialog = sap.ui.xmlfragment("IT_CALENDAR.view.DialogViewWMM", this);
			} else {
				this._oViewDialog.destroy();
				this._oViewDialog = sap.ui.xmlfragment("IT_CALENDAR.view.DialogViewWMM", this);
			}
			var oModel = this.getView().getModel();
			/* Wichtiger Hinweis 
				Wir müssen für die dynamischen Komponentenauflistung ein JSON Model anlegen
				Es gibt (stand Heute) kein Möglichkeit die Anforderungen mit einem oDATA v2 Model umzusetzen!
				Es muss zwingend ein Filter aus Kombination ContextId + Type mitgegeben werden, also zwei Keys!
				Die LMDB-Schnittstelle (ABAP) für die Abhängikeiten akzeptiert nur die beiden oben genannten Werte
				Ein selbst gebastelter Filter o.ä. kann nicht genutzt werden, mit diesem lokalen JSON Model habe ich mich am Standard orientiert
			*/
			var oDependentView = new sap.ui.model.json.JSONModel();
			oDependentView.setProperty("/panel_data", []);
			this.getView().setModel(oDependentView, "dependentView");
			var that = this;
			oModel.read(sPath, {
				success: function(oData) {
					var aPanelData = that.getView().getModel("dependentView").getProperty("/panel_data");
					var oNewPanel = {
						"panel_name": oData.MoName,
						"managed_object_id": oData.MoContextId,
						"managed_object_type": oData.MoType,
						"dependents": [],
						"proc_dependents": []
					};
					aPanelData.push(oNewPanel);
					that.getView().getModel("dependentView").setProperty("/panel_data", aPanelData);
					var aFilters = [];
					var oInputFilter = new sap.ui.model.Filter({
						filters: [
							new sap.ui.model.Filter("MoContextId", sap.ui.model.FilterOperator.EQ, oData.MoContextId),
							new sap.ui.model.Filter("MoType", sap.ui.model.FilterOperator.EQ, oData.MoType),
							new sap.ui.model.Filter("WmGuid", sap.ui.model.FilterOperator.EQ, oData.Guid)
						],
						and: true
					});
					aFilters.push(oInputFilter);
					oModel.read("/WMMDependentsSet", {
						filters: aFilters,
						urlParameters: {
							"$expand": "Processes" //Expand auf Verfahren
						},
						success: function(oDependents) {
							oDependents.results.forEach(function(oItem) {
								//Wir brauchen noch ein IsActive Attribut (default true)
								CalendarFunctions.buildDependents(aPanelData, oItem);
								that.getView().getModel("dependentView").refresh(true);
							});
						}
					});
				}
			});
			this._oViewDialog.bindElement(sPath);
			this.getView().addDependent(this._oViewDialog);
			this._oViewDialog.open();
		},
		onDeleteEvents: function(oEvent) {
			var sConfirm = this.getView().getModel("i18n").getResourceBundle().getText("DialogDeleteConfirm");
			var that = this;
			MessageBox.confirm(sConfirm, {
				onClose: function(sChoice) {
					if (sChoice === "OK") {
						var oBtn = sap.ui.getCore().byId("idEventDeleteBtn");
						var sGuid = oBtn.data("EventID");
						var sWMM = "WMM"; //Aktuell nur auf Workmodes
						var oModel = that.getView().getModel();
						oModel.callFunction("/EventDelete", {
							method: "POST",
							urlParameters: {
								ApplicationKey: sWMM,
								EventID: sGuid
							},
							success: function(oSuccess) {
								if (oSuccess.EventDelete.Success === true) {
									MessageBox.success(oSuccess.EventDelete.Message);
								} else if (oSuccess.EventDelete.Success === false) {
									MessageBox.error(oSuccess.EventDelete.Message);
								}
								that.handleOkPress();
							},
							error: function(oErrData) {
								var oMsg = JSON.parse(oErrData.responseText).error;
								var sMsg = oMsg.code + ", " + oMsg.message.value;
								MessageBox.error(sMsg);
							}
						});
					}
				}
			});
		},
		saveWMM: function() {
			var oDepModel = this.getView().getModel("dependent");
			var oPanelData = oDepModel.getProperty("/panel_data");
			var sTitle = sap.ui.getCore().byId("titleInput").getValue();
			var sType = sap.ui.getCore().byId("typeSelect").getSelectedKey();
			var sCategory = sap.ui.getCore().byId("categorySelect").getSelectedKey();
			var sDesc = sap.ui.getCore().byId("descTA").getValue();
			// Datum und Uhrzeit parsen			
			var sStartDate = sap.ui.getCore().byId("startDateDP").getValue();
			var sStartTime = sap.ui.getCore().byId("startTimeTP").getValue();
			var oStartDate = moment(sStartDate + " " + sStartTime, "DD.MM.YYYY HH:mm");

			var sEndDate = sap.ui.getCore().byId("endDateDP").getValue();
			var sEndTime = sap.ui.getCore().byId("endTimeTP").getValue();
			var oEndDate = moment(sEndDate + " " + sEndTime, "DD.MM.YYYY HH:mm", 'de');
			var that = this;
			oPanelData.forEach(function(oData) {
				var oPanel = {
					"Guid": oData.WmGuid,
					"Title": sTitle,
					"Description": sDesc,
					"Type": sType,
					"Category": sCategory,
					"StartDate": oStartDate.tz("Europe/Berlin").format("YYYY-MM-DDTHH:mm:ss"),
					"EndDate": oEndDate.tz("Europe/Berlin").format("YYYY-MM-DDTHH:mm:ss"),
					"TimeZone": "CET", //bei Bedarf erweitern
					"IsRecurring": "0", //bei Bedarf erweitern
					"IsActive": true, //Das Parent muss immer aktiv sein
					"Status": "", //keine Ahnung
					"MoContextId": oData.managed_object_id,
					"MoType": oData.managed_object_type,
					"MoName": oData.panel_name,
					"EndConstGen": true, //keine Ahnung
					"RefGuid": "",
					"WorkmodesHeader_Dependents_N": []
				};
				oData.dependents.forEach(function(oDependentsGroup) {
					oDependentsGroup.dependents_for_mo.forEach(function(oDependents) {
						var oDep = {
							"WmGuid": oDependents.WmGuid,
							"ParentContextId": oDependents.ParentContextId,
							"MoContextId": oDependents.MoContextId,
							"MoContextName": oDependents.MoContextName,
							"MoType": oDependents.MoType,
							"MoTypeDesc": oDependents.MoTypeDesc,
							"IsLandscape": oDependents.IsLandscape,
							"IsWmApplicable": oDependents.IsWmApplicable,
							"IsMandatoryCheck": oDependents.IsMandatoryCheck,
							"IsActive": formatter.formatActive(oDependents.IsActive)
						};
						oPanel.WorkmodesHeader_Dependents_N.push(oDep);
					});
				});
				var oModel = that.getView().getModel();
				oModel.setHeaders({
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/json",
					"DataServiceVersion": "3.0",
					"Accept": "application/atom+xml,application/atomsvc+xml,application/xml"
				});
				oModel.create("/WMMWorkmodesSet", oPanel, {
					success: function() {
						that._oDialogWMMCreate.close();
						MessageBox.success("Der Arbeitsmodi wurde erfolgreich angelegt!");
						that.handleOkPress();
					},
					error: function(oErrData) {
						var oMsg = JSON.parse(oErrData.responseText).error;
						var sMsg = oMsg.code + ", " + oMsg.message.value;
						MessageBox.error(sMsg);
					}
				});
			});
		},
		closePopoverConfirmVerf: function() {
			this._oPopoverConfirmVerf.close();
		},
		onChangeWMMTitle: validation.validateTitle,
		onStartDateChange: validation.validateDate,
		onEndDateChange: validation.validateDate,
		onOpenPopoverAttributes: function() {
			var oModel = this.getView().getModel();
			oModel.read("/UserSet('DUMMY')", {
				success: function(oData) {
					var oDelete = sap.ui.getCore().byId("idEventDeleteBtn");
					oDelete.setEnabled(oData.Manage);
				}
			});
		},
		onOpenWMMView: function() {
			var oModel = this.getView().getModel();
			// Wir prüfen, ob das Ereignis schon eingetreten ist, falls ja dürfen wir nichts mehr ändern!
			var sStartDate = sap.ui.getCore().byId("startDateDP").getValue();
			var sStartTime = sap.ui.getCore().byId("startTimeTP").getValue();
			var oStartDate = moment(sStartDate + " " + sStartTime, "DD.MM.YYYY HH:mm");
			var oNow = moment();
			if (oNow.isBefore(oStartDate)) {
				oModel.read("/UserSet('DUMMY')", {
					success: function(oData) {
						var oEdit = sap.ui.getCore().byId("editButton");
						oEdit.setEnabled(oData.Manage);
					}
				});
			}
		},
		onWMMViewEdit: function(oEvent) {
			var sIcon = oEvent.getSource().getIcon();
			if (sIcon === "sap-icon://edit") {
				sap.ui.getCore().byId("titleInput").setEnabled(true);
				sap.ui.getCore().byId("descTA").setEnabled(true);
				sap.ui.getCore().byId("startDateDP").setEnabled(true);
				sap.ui.getCore().byId("startTimeTP").setEnabled(true);
				sap.ui.getCore().byId("endDateDP").setEnabled(true);
				sap.ui.getCore().byId("endTimeTP").setEnabled(true);
				oEvent.getSource().setIcon("sap-icon://save");
			} else {
				// Holen der Event-Daten
				//Datum und Uhrzeit validieren
				var bError = validation.validateForm(this);
				if (bError === true) {
					return;
				}
				var oWorkmode = this._oViewDialog.getBindingContext().getObject();
				// Setzen der neuen Daten
				oWorkmode.Title = sap.ui.getCore().byId("titleInput").getValue();
				oWorkmode.Description = sap.ui.getCore().byId("descTA").getValue();
				//Konvertieren der Zeitangaben
				var sStartDate = sap.ui.getCore().byId("startDateDP").getValue();
				var sStartTime = sap.ui.getCore().byId("startTimeTP").getValue();
				var oStartDate = moment(sStartDate + " " + sStartTime, "DD.MM.YYYY HH:mm");
				oWorkmode.StartDate = oStartDate.tz("Europe/Berlin").format("YYYY-MM-DDTHH:mm:ss");
				//Konvertieren der Zeitangaben
				var sEndDate = sap.ui.getCore().byId("endDateDP").getValue();
				var sEndTime = sap.ui.getCore().byId("endTimeTP").getValue();
				var oEndDate = moment(sEndDate + " " + sEndTime, "DD.MM.YYYY HH:mm");
				oWorkmode.EndDate = oEndDate.tz("Europe/Berlin").format("YYYY-MM-DDTHH:mm:ss");

				var oModel = this.getView().getModel();
				oModel.setHeaders({
					"X-Requested-With": "XMLHttpRequest",
					"Content-Type": "application/json",
					"DataServiceVersion": "3.0",
					"Accept": "application/atom+xml,application/atomsvc+xml,application/xml"
				});
				// Wichtig sonst kommt "Fehler beim Parsen eines XML Stream bla bla"
				delete oWorkmode.__metadata;
				delete oWorkmode.WorkmodesHeader_Dependents_N;
				var sPath = "/WMMWorkmodesSet('" + oWorkmode.Guid + "')";
				var that = this;
				oModel.update(sPath, oWorkmode, {
					success: function(oSuccess) {
						MessageBox.success("Der Arbeitsmodi wurde erfolgreich gespeichert!");
						that.handleOkPress();
					},
					error: function(oErrData) {
						var oMsg = JSON.parse(oErrData.responseText).error;
						var sMsg = oMsg.code + ", " + oMsg.message.value;
						MessageBox.error(sMsg);
					}
				});
				sap.ui.getCore().byId("titleInput").setEnabled(false);
				sap.ui.getCore().byId("descTA").setEnabled(false);
				sap.ui.getCore().byId("startDateDP").setEnabled(false);
				sap.ui.getCore().byId("startTimeTP").setEnabled(false);
				sap.ui.getCore().byId("endDateDP").setEnabled(false);
				sap.ui.getCore().byId("endTimeTP").setEnabled(false);
				oEvent.getSource().setIcon("sap-icon://edit");
			}
		},
		onTextChangeTechsystem: function(oEvent) {
			var sValue = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sValue) {
				aFilters = [new sap.ui.model.Filter("ExtendedSID", sap.ui.model.FilterOperator.Contains, sValue)];
				var oSelect = sap.ui.getCore().byId("idTSFilterTechSystem");
				oSelect.getBinding("suggestionItems").filter(aFilters);
			}
		},
		onTextChangeDatabase: function(oEvent) {
			var sValue = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sValue) {
				aFilters = [new sap.ui.model.Filter("ExtendedSID", sap.ui.model.FilterOperator.Contains, sValue)];
				var oSelect = sap.ui.getCore().byId("idTSFilterDatabase");
				oSelect.getBinding("suggestionItems").filter(aFilters);
			}
		},
		onTextChangeHost: function(oEvent) {
			var sValue = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sValue) {
				aFilters = [new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue)];
				var oSelect = sap.ui.getCore().byId("idTSFilterHost");
				oSelect.getBinding("suggestionItems").filter(aFilters);
			}
		}
	});
});