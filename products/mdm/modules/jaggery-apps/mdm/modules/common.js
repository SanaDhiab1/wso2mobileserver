var log = new Log();

var getRecordsFilteredByDate = function(startDate,endDate,tableName){
    var zeros = ' 00:00:00'
    var startDate = startDate+zeros;
    var endDate = endDate+zeros;
    var result = db.query("SELECT * FROM "+tableName+" where created_date between '"+date1+"' and '"+date2+"'");
    if(typeof result !== 'undefined' && result !== null && typeof result[0] !== 'undefined' && result[0] !== null ){
        return  result;
    }else{
        return null;
    }
}
var getTenantID = function() {
    if(!(typeof session === "undefined")){
        if (session.get("mdmConsoleUser") && session.get("mdmConsoleUser").tenantId != 0) {
            var tenantID = session.get("mdmConsoleUser").tenantId;
            log.info("Tenant IDD :"+tenantID);
            return tenantID;
        } else {
            return "-1234";
        }
    }
}
var getTenantIDFromEmail = function(email){
    var carbon = require('carbon');
    var tenantUser = carbon.server.tenantUser(email);
    return tenantUser.tenantId;
}
var getTenantIDFromDevice = function(deviceID){
    var result = db.query("SELECT * FROM devices where id = ?",deviceID);
    if(typeof (result) !== 'undefined' && result !== null && typeof (result[0]) !== 'undefined' && result[0] !== null){
        return result[0].tenant_id;
    }else{
        return null;
    }
}
var removePrivateRole = function(roleList){
    var roles = new Array();
    for(var i = 0; i<roleList.length; i++){
        var prefix = '';
        try{
            prefix = roleList[i].substring(0,17);
        }catch(e){
        //   log.info('error occured while removing private role');
        }
        if(prefix == 'Internal/private_'){
            continue;
        }else{
            roles.push(roleList[i]);
        }
    }
    return roles;
}

var removeNecessaryElements = function(list,removeList){
    var newList = Array();
    for(var i=0; i< list.length; i++){
        var flag = true;
        for(var j=0; j<removeList.length; j++){
            if(list[i]==removeList[j]){
                flag = false;
                break;
            }
        }
        if(flag){
            newList.push(list[i]);
        }
    }
    return newList;
}

var getCurrentDateTime = function(){
    var date = new Date();
    var fdate = date.getFullYear() + '-' +('00' + (date.getMonth()+1)).slice(-2) + '-' +('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2);
    return fdate;
}

var getFormattedDate = function(value){
    if(value==null && value == undefined){
        return "";
    }
    var date = new Date(value);
    var fdate = date.getFullYear() + '-' +('00' + (date.getMonth()+1)).slice(-2) + '-' +('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2);
    return fdate;
}

var initAPNS = function(deviceToken, magicToken) {
	
	if(deviceToken == null || magicToken == null || 
		deviceToken == undefined || magicToken == undefined) {
		return;
	}

    log.debug("initAPNS >>>>>>>>");
    log.debug("Device Token: >>>>>> " + deviceToken);
    log.debug("Magic Token: >>>>>> " + magicToken);

	try {
		var apnsInitiator = new Packages.com.wso2mobile.ios.apns.PushNotificationSender();

		var userData = new Packages.java.util.ArrayList();
		var params = new Packages.java.util.HashMap();
		params.put("devicetoken", deviceToken);
		params.put("magictoken", magicToken);
		userData.add(params);

		apnsInitiator.pushToAPNS(userData);

	} catch (e) {
		log.error(e);
	}
}

var getPayloadIdentifierMap = function() {
	
	var identifierMap = {};
	identifierMap["CAMERA"] = "com.wso2.camera";
	identifierMap["WIFI"] = "com.wso2.wifi";
	identifierMap["APN"] = "com.wso2.apn";
	identifierMap["PASSWORDPOLICY"] = "com.wso2.passcode.policy";
	identifierMap["EMAIL"] = "com.wso2.email.conf";
	identifierMap["VPN"] = "com.wso2.vpn";
	identifierMap["LDAP"] = "com.wso2.ldap";
	identifierMap["GOOGLECALENDAR"] = "com.wso2.calendar";
	identifierMap["WEBCLIP"] = "com.wso2.webclip";

	return identifierMap;
}

var getValueByFeatureIdentifier = function(identifier) {
	
	var identifierMap = getPayloadIdentifierMap();
	
	for(var key in identifierMap) {
		if(identifierMap[key] == identifier) {
			return key;
		}
	}
	
	return null;
	
}

var loadPayload = function(identifier , operationCode, data) {
	
	if(data == null) {
		data = {};
	} else {
		data = parse(data);
	}
	
	var log = new Log();
	var operation = "";
	var paramMap = new Packages.java.util.HashMap();
	var payloadIdentifier = getPayloadIdentifierMap();
	paramMap.put("PayloadOrganization", "WSO2");
		
	var isProfile = false;
	
	log.error("operationCode >>>>>>>>>>>>>>>>>> " + operationCode);	
	
	if(operationCode == "503A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_LOCK;  
	} else if(operationCode == "505A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CLEAR_PASSCODE;
		paramMap.put("UnlockToken", data.unlock_token);
	} else if(operationCode == "502A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APPLICATION_LIST;
	} else if(operationCode == "500A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_INFORMATION; 
	} else if(operationCode == "508A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAMERA_SETTINGS; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["CAMERA"]);
		if(data.function == "Disable") {
			paramMap.put("AllowCamera", false);
		} else {
			paramMap.put("AllowCamera", true);
		}
		isProfile = true;
	} else if(operationCode == "507A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WIFI_SETTINGS; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["WIFI"]);
		paramMap.put("PayloadDisplayName", "WIFI Configurations");
		paramMap.put("Password", data.password);
		paramMap.put("SSID", data.ssid);
		isProfile = true;
	} else if(operationCode == "512A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APN_SETTINGS; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["APN"]);
		paramMap.put("PayloadDisplayName", "VPN Configurations");
		paramMap.put("APN", data.carrier);
		paramMap.put("Username", data.user_name);
		paramMap.put("Password", data.password);
		paramMap.put("Proxy", data.proxy_server);
		paramMap.put("ProxyPort", data.proxy_port);
		isProfile = true;
	} else if(operationCode == "518A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WEBCLIP;
		paramMap.put("PayloadIdentifier", payloadIdentifier["WEBCLIP"]);
		paramMap.put("PayloadDisplayName", "Web Clip");
		paramMap.put("URL", data.url);
		paramMap.put("Label", data.label);
		isProfile = true;
	} else if(operationCode == "519A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.PASSCODE_POLICY; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["PASSWORDPOLICY"]);
		paramMap.put("PayloadDisplayName", "Passcode Policy");
		paramMap.put("MaxFailedAttempts", data.maxFailedAttempts);
		paramMap.put("MinLength", data.minLength);
		paramMap.put("MaxPINAgeInDays", data.maxPINAgeInDays);
		paramMap.put("MinComplexChars", data.minComplexChars);
		paramMap.put("PinHistory", data.pinHistory);
		paramMap.put("AllowSimple", data.allowSimple);
		paramMap.put("RequireAlphanumeric", data.requireAlphanumeric);
		isProfile = true;
	} else if(operationCode == "520A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.EMAIL_CONFIGURATIONS;
		paramMap.put("PayloadIdentifier", payloadIdentifier["EMAIL"]);
		paramMap.put("PayloadDisplayName", "Email Configurations");
		paramMap.put("EmailAccountName", data.emailAccountName);
		paramMap.put("EmailAddress", data.emailAddress);
		
		if(data.emailAccountType == "imap") {
			paramMap.put("EmailAccountType", "EmailTypeIMAP");
		} else if(data.emailAccountType == "pop") {
			paramMap.put("EmailAccountType", "EmailTypePOP");
		} else {
			paramMap.put("EmailAccountType", "");
		}
		
		if(data.incomingMailServerAuthentication == "password") {
			paramMap.put("IncomingMailServerAuthentication", "EmailAuthPassword");
		} else if(data.incomingMailServerAuthentication == "none") {
			paramMap.put("IncomingMailServerAuthentication", "EmailAuthNone");
		} else {
			paramMap.put("IncomingMailServerAuthentication", "");
		}
		
		if(data.outgoingMailServerAuthentication == "password") {
			paramMap.put("OutgoingMailServerAuthentication", "EmailAuthPassword");
		} else if(data.outgoingMailServerAuthentication == "none") {
			paramMap.put("OutgoingMailServerAuthentication", "EmailAuthNone");
		} else {
			paramMap.put("OutgoingMailServerAuthentication", "");
		}
		
		paramMap.put("EmailAccountDescription", data.emailAccountDescription);
		paramMap.put("IncomingMailServerUsername", data.incomingMailServerUsername);
		paramMap.put("IncomingPassword", data.incomingPassword);
		paramMap.put("IncomingMailServerUseSSL", data.incomingMailServerUseSSL);
		paramMap.put("OutgoingMailServerUsername", data.outgoingMailServerUsername);
		paramMap.put("OutgoingPassword", data.outgoingPassword);
		paramMap.put("OutgoingMailServerUseSSL", data.outgoingMailServerUseSSL);
		paramMap.put("OutgoingPasswordSameAsIncomingPassword", (data.outgoingPassword == data.incomingPassword));
		paramMap.put("IncomingMailServerHostName", data.incomingMailServerHostName);
		paramMap.put("IncomingMailServerPortNumber", data.incomingMailServerPortNumber);
		paramMap.put("OutgoingMailServerHostName", data.outgoingMailServerHostName);
		paramMap.put("OutgoingMailServerPortNumber", data.outgoingMailServerPortNumber);
		
		isProfile = true;
	} else if(operationCode == "521A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CALENDAR_SUBSCRIPTION; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["GOOGLECALENDAR"]);
		paramMap.put("PayloadDisplayName", "Calendar Subscription");
		paramMap.put("SubCalAccountUsername", data.username);
		paramMap.put("SubCalAccountPassword", data.password);
		isProfile = true;
	} else if(operationCode == "525A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAL_DAV;
	} else if(operationCode == "") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_CERT;
	} else if(operationCode == "523A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_SECRET;
		paramMap.put("PayloadIdentifier", payloadIdentifier["VPN"]);
		paramMap.put("PayloadDisplayName", "VPN Configurations");
		paramMap.put("AuthenticationMethod", data.type);
		paramMap.put("SharedSecret", data.sharedsecret);
		isProfile = true;
	} else if(operationCode == "524A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.LDAP; 
		paramMap.put("PayloadIdentifier", payloadIdentifier["LDAP"]);
		paramMap.put("PayloadDisplayName", "LDAP Configurations");
		paramMap.put("LDAPAccountDescription", data.ldapdesc);
		paramMap.put("LDAPAccountHostName", data.hostname);
		paramMap.put("LDAPAccountUserName", data.username);
		paramMap.put("LDAPAccountPassword", data.password);
		paramMap.put("LDAPAccountUseSSL", data.usedssl);
		isProfile = true;
	} else if(operationCode == "501P") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.PROFILE_LIST;
	} else if(operationCode == "509A") {
		
		if(data.type == "Enterprise") {
			operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.INSTALL_ENTERPRISE_APPLICATION;
			paramMap.put("ManifestURL", data.identity);
		} else if(data.type == "Market") {
			operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.INSTALL_APPSTORE_APPLICATION;
			paramMap.put("iTunesStoreID", data.identity);
		} else if(data.type == "VPP") {
			operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.INSTALL_APPSTORE_APPLICATION_VOLUME_PURCHASE;
			paramMap.put("iTunesStoreID", data.identity);
		}
		
	} else if(operationCode == "510A") {
		
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.REMOVE_APPLICATION;
		paramMap.put("Identifier", data.identity);
		
	} else if(operationCode == "529A") {
		
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.REMOVE_PROFILE;
		paramMap.put("Identifier", data.identifier);
		
	} else if(operationCode == "528A") {
		
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APPLY_REDEMPTION_CODE;
		paramMap.put("Identifier", data.identifier);
		paramMap.put("RedemptionCode", data.redemptionCode);
		
	} else if(operationCode == "527A") {
		return "ENTERPRISE_WIPE";
	} else {
		return "";
	}

	paramMap.put("PayloadUUID", identifier);
	paramMap.put("CommandUUID", identifier);
	
	try {
		var payloadLoader = new Packages.com.wso2mobile.ios.mdm.payload.PayloadLoader();
		var responseData = payloadLoader.loadPayload(operation, paramMap, isProfile);	
	} catch (e) {
		log.error(e);
	}
			
	return responseData;
}
