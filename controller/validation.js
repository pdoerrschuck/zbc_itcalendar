/* global moment:true */
sap.ui.define([
	"IT_CALENDAR/libs/moment",
	"IT_CALENDAR/libs/momentTimezone"
], function(momentjs, momentjsTimezone) {
	return {
		validateTitle: function(oEvent) {
			var sParam = oEvent.getParameter("newValue").trim();
			if (sParam === null || sParam === undefined || sParam === "") {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			} else {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			}
		},
		validateDate: function(oEvent) {
			var oDate = moment(oEvent.getParameter("newValue"), "DD.MM.YYYY");
			if (!oDate.isValid()) {
				oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
				var sText = this.getView().getModel("i18n").getResourceBundle().getText("DateValdiation");
				oEvent.getSource().setValueStateText(sText);
				return;
			}
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			oEvent.getSource().setValueStateText("");
		},
		validateForm: function(oThis) {
			var oStartDP = sap.ui.getCore().byId("startDateDP");
			var oStartDate = moment(oStartDP.getValue(), "DD.MM.YYYY");
			var sText = oThis.getView().getModel("i18n").getResourceBundle().getText("DateValdiation");
			if (!oStartDate.isValid()) {
				oStartDP.setValueState(sap.ui.core.ValueState.Error);
				oStartDP.setValueStateText(sText);
				return true;
			} else {
				oStartDP.setValueState(sap.ui.core.ValueState.None);
				oStartDP.setValueStateText("");
			}
			var oEndDP = sap.ui.getCore().byId("endDateDP");
			var oEndDate = moment(oEndDP.getValue(), "DD.MM.YYYY");
			if (!oEndDate.isValid()) {
				oEndDP.setValueState(sap.ui.core.ValueState.Error);
				oEndDP.setValueStateText(sText);
				return true;
			} else {
				oEndDP.setValueState(sap.ui.core.ValueState.None);
				oEndDP.setValueStateText("");
			}
			var oStartTP = sap.ui.getCore().byId("startTimeTP");
			var oStartTime = moment(oStartTP.getValue(), "HH:mm");
			if (!oStartTime.isValid()) {
				oStartTP.setValueState(sap.ui.core.ValueState.Error);
				return true;
			} else {
				oStartTP.setValueState(sap.ui.core.ValueState.None);
			}
			var oEndTP = sap.ui.getCore().byId("endTimeTP");
			var oEndTime = moment(oEndTP.getValue(), "HH:mm");
			if (!oEndTime.isValid()) {
				oEndTP.setValueState(sap.ui.core.ValueState.Error);
				return true;
			} else {
				oEndTP.setValueState(sap.ui.core.ValueState.None);
			}
			var oStartDateTime = new moment(oStartDP.getValue() + " " + oStartTP.getValue(), "DD.MM.YYYY HH:mm:ss");
			var oEndDateTime = new moment(oEndDP.getValue() + " " + oEndTP.getValue(), "DD.MM.YYYY HH:mm:ss");
			var sTextDateTime = oThis.getView().getModel("i18n").getResourceBundle().getText("DateTimeValidation");
			if (oEndDateTime <= oStartDateTime) {
				oEndTP.setValueState(sap.ui.core.ValueState.Error);
				oEndTP.setValueStateText(sTextDateTime);
				oEndDP.setValueState(sap.ui.core.ValueState.Error);
				oEndDP.setValueStateText(sTextDateTime);
				return true;
			}
			var sTitleText = sap.ui.getCore().byId("titleInput").getValue().trim();
			if (sTitleText === null || sTitleText === undefined || sTitleText === "") {
				sap.ui.getCore().byId("titleInput").setValueState(sap.ui.core.ValueState.Error);
				return true;
			} else {
				sap.ui.getCore().byId("titleInput").setValueState(sap.ui.core.ValueState.None);
			}
		}
	};
});