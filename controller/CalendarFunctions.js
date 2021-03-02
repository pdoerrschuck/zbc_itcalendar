sap.ui.define([
	"IT_CALENDAR/controller/CalendarFunctions"
], function() {
	return {
		findObjectByKey: function(array, key, value) {
			for (var i = 0; i < array.length; i++) {
				if (array[i][key] === value) {
					return array[i];
				}
			}
			return null;
		},
		getCurrentDate: function() {
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth() + 1; //January is 0!

			var yyyy = today.getFullYear();
			if (dd < 10) {
				dd = '0' + dd;
			}
			if (mm < 10) {
				mm = '0' + mm;
			}
			today = dd + '.' + mm + '.' + yyyy;
			return today;
		},
		getCurrentTime: function(sAddHours) {
			var today = new Date();
			if (sAddHours !== "" && sAddHours !== undefined && sAddHours !== null) {
				today.setHours(today.getHours() + sAddHours);
			}
			var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
			return time;
		},
		setInitialCreatePopupData: function() {
			var oStartDate = sap.ui.getCore().byId("startDateDP");
			var oEndDate = sap.ui.getCore().byId("endDateDP");
			var oStartTime = sap.ui.getCore().byId("startTimeTP");
			var oEndTime = sap.ui.getCore().byId("endTimeTP");
			//Vorbelegung mit heutigem Datum, Uhrzeit
			oStartDate.setValue(this.getCurrentDate());
			//Plus 1 Stunde
			oStartTime.setValue(this.getCurrentTime(1));
			oEndDate.setValue(this.getCurrentDate());
			//Plus 2 Stunden
			oEndTime.setValue(this.getCurrentTime(2));
		},
		convertContext: function(sContextITC, oThis) {
			var aContextType = sContextITC.split(":", 2);
			var sContextType = aContextType[0];
			var sTranslateContextType = oThis.getView().getModel().getProperty("/ContextTranslationSet('" + sContextType + "')").WmmContext;
			if (sTranslateContextType === undefined || sTranslateContextType === null || sTranslateContextType === "") {
				return "";
			} else {
				return [sTranslateContextType, aContextType[1]];
			}
		},
		buildDependents: function(aPanelData, oItem) {
			var oParent = this.findObjectByKey(aPanelData, "managed_object_id", oItem.ParentContextId);
			var oDep = this.findObjectByKey(oParent.dependents, "mo_type", oItem.MoType);
			var that = this;
			if (oDep === undefined || oDep === null) {
				var oDepNew = {
					"mo_type": oItem.MoType,
					"MoTypeDesc": oItem.MoTypeDesc,
					"dependents_for_mo": []
				};
				oParent.dependents.push(oDepNew);
				oDep = this.findObjectByKey(oParent.dependents, "mo_type", oItem.MoType);
			}
			oItem.Processes.results.forEach(function(oProcess) {
				var oProc = that.findObjectByKey(oParent.proc_dependents, "verf_key", oProcess.VerfKey);
				if (oProc === undefined || oProc === null) {
					var oProcNew = {
						"verf_key": oProcess.VerfKey,
						"verf_desc": oProcess.VerfDesc
					};
					oParent.proc_dependents.push(oProcNew);
				}
			});
			oDep.dependents_for_mo.push(oItem);
		}
	};
});