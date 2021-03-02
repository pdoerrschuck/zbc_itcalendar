sap.ui.define([
	"IT_CALENDAR/controller/FilterBarFunctions"
], function() {
	return {
		selectCells: function(oEvent) {
			var iTS = sap.ui.getCore().byId("idTableTS").getSelectedItems().length;
			var iDB = sap.ui.getCore().byId("idTableDB").getSelectedItems().length;
			var iHost = sap.ui.getCore().byId("idTableHost").getSelectedItems().length;
			var iVerf = sap.ui.getCore().byId("idTableVerf").getSelectedItems().length;
			var oBtn = sap.ui.getCore().byId("PopoverOk");
			var sText = this.getView().getModel("i18n").getResourceBundle().getText("PopoverFilterBarOk");
			var iSelected = iTS + iDB + iHost + iVerf;
			 oBtn.setText(sText + " (" + iSelected + ")");
		}
	};
});