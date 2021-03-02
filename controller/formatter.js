/* global moment:true */
sap.ui.define([
	"IT_CALENDAR/libs/moment",
	"IT_CALENDAR/libs/momentTimezone"
	], function(momentjs, momentjsTimezone) {
	"use strict";
	return {
		dateTimeToDateObj: function(d, t) {
			if (d === "" || d === null || t === "" || t === null) {
				return "";
			} else {
				return new Date(d.substr(0, 4), d.substr(4, 2) - 1, d.substr(6, 2), t.substr(0, 2), t.substr(2, 2), t.substr(4, 2));
			}

		},

		appointmentColorType: function(colorType) {
			var type = colorType.toUpperCase();
			if (type === "TYPE01" || type === "TYPE02" || type === "TYPE03" || type === "TYPE04" || type === "TYPE05" ||
				type === "TYPE06" || type === "TYPE07" || type === "TYPE08" || type === "TYPE09" || type === "TYPE10") {
				return colorType;
			} else {
				return "None";
			}
		},
		attributeName: function(name){
			var parts = name.split("_");
			if(parts[0] === "ADMINFIELD"){
				return parts[1];
			}else{	
				return parts[0];	
			}
		},
		dateTimeToOutput: function(date, time){
			var sDate = date.substring(6,8) + "." + date.substring(4,6) + "." + date.substring(0,4);
			var sTime = time.substring(0,2) + ":" + time.substring(2,4) + ":" + time.substring(4,6);
			var sDateTime = sDate + " - " + sTime;
			return sDateTime;
		},
		recurringFormat: function(recurring){
			if(recurring == ""){
				return this.getView().getModel("i18n").getResourceBundle().getText("PopoverEventRecurringFalse");
			} else {
				return this.getView().getModel("i18n").getResourceBundle().getText("PopoverEventRecurringTrue");
			}
		},
		formatMandatory: function(value){
			if(value == ""){
				return true; 
			} else {
				return false; 
			}
		},
		formatActive: function(bActive){ //CHG PDO 09.03.2020
			if(bActive === true || bActive === "X"){
				return true;
			} else {
				return false;
			} //ENDCHG PDO 09.03.2020
		},
		formatWMMDate: function(oDateTime){
			var oDate = moment(oDateTime).tz("UTC");
			if(oDate.isValid()){
				return oDate.format("DD.MM.YYYY");
			}
		},
		formatWMMTime: function(oDateTime){
			var oDate = moment(oDateTime).tz("UTC");
			if(oDate.isValid()){
				return oDate.format("HH:mm");
			}
		}
	};
});