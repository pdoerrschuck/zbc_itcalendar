sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"IT_CALENDAR/model/models",
	"sap/m/MessageBox"
], function(UIComponent, Device, models, MessageBox) {
	"use strict";

	return UIComponent.extend("IT_CALENDAR.Component", {

		metadata: {
			manifest: "json",
			config: { fullWidth: true } 
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			
			//Automatische authentifizierung
			this.getModel().setHeaders({"X-Requested-With" : "X"});
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
/*			var oBrowser = this.getModel("device");
			var sBrowser = oBrowser.getData("browser").browser.name;
			if(sBrowser === oBrowser.getData("browser").browser.BROWSER.INTERNET_EXPLORER){
				MessageBox.error("Bitte Chrome oder Firefox nutzen! Der Internet Explorer wird aktuell nicht unterstützt");
			}*/
		}
	});
});