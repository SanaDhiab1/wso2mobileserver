var isMDMRole = function(role) {
	var otherRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer", "admin", "mdmadmin");
	for (var i = 0; i < otherRoles.length; i++) {
		if (role == otherRoles[i]) {
			return false;
		}
	}
	return true;
}

var isMDMRoleWithAdmins = function(role) {

	var otherRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role","reviewer");
	for (var i = 0; i < otherRoles.length; i++) {
		if (role == otherRoles[i]) {
			return false;
		}
	}
	return true;
}

var isMDMUser = function (user) {
	var otherUsers = new Array("wso2.anonymous.user","admin");
	for(var i = 0; i < otherUsers.length; i++) {
		if(user == otherUsers[i]) {
			return false;
		}
	}
	return true;
}

var getTenantID = function() {
	if (session.get("mdmConsoleUser")) {
		return session.get("mdmConsoleUser")['tenantId'];
	} else {
		return null;
	}
}

var getCAPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ca_cert.pem";
}

var getRAPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ra_cert.pem";
}

var getCAPrivateKey = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ca_private.pem";
}

var getRAPrivateKey = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ra_private.pem";
}

//move this to a xml configuration file
var getPushCertPassword = function() {
	return "shan130474";
}

var getPushCertPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//PlainCert.pfx";
} 

var initAPNS = function(pathPushCert, pushCertPassword, deviceToken, magicToken) {

	try {
		var apnsInitiator = new Packages.com.wso2mobile.ios.apns.PushNotificationSender(pathPushCert, pushCertPassword);

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

var loadPayload = function(identifier , operationCode, data) {
	
	if(data == null) {
		data = {};
	} else {
		data = parse(data);
	}
	
	var log = new Log();
	var operation = "";
	var paramMap = new Packages.java.util.HashMap();
	paramMap.put("PayloadOrganization", "WSO2");
		
	var isProfile = false;
	
	log.error("operationCode >>>>>>>>>>>>>>>>>> " + operationCode);	
	
	if(operationCode == "503A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_LOCK;  //checked
	} else if(operationCode == "505A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CLEAR_PASSCODE;
		paramMap.put("UnlockToken", identifier);
	} else if(operationCode == "502A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APPLICATION_LIST;
	} else if(operationCode == "500A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_INFORMATION; //checked
	} else if(operationCode == "508A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAMERA_SETTINGS; //checked
		paramMap.put("PayloadIdentifier", "com.wso2.camera");
		
		if(data.function == "Disable") {
			paramMap.put("AllowCamera", false);
		} else {
			paramMap.put("AllowCamera", true);
		}
		isProfile = true;
	} else if(operationCode == "507A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WIFI_SETTINGS; //checked
		paramMap.put("PayloadIdentifier", "com.wso2.wifi");
		paramMap.put("PayloadDisplayName", "WIFI Payload");
		paramMap.put("Password", data.password);
		paramMap.put("SSID", data.ssid);
		isProfile = true;
	} else if(operationCode == "512A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APN_SETTINGS; //checked - not working
		paramMap.put("PayloadIdentifier", "com.wso2.vpn");
		paramMap.put("PayloadDisplayName", "VPN Payload");
		paramMap.put("APN", data.carrier);
		paramMap.put("Username", data.user_name);
		paramMap.put("Password", data.password);
		paramMap.put("Proxy", data.proxy_server);
		paramMap.put("ProxyPort", data.proxy_port);
		isProfile = true;
	} else if(operationCode == "518A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WEBCLIP;
	} else if(operationCode == "519A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.PASSCODE_POLICY; //checked
		paramMap.put("PayloadIdentifier", "com.wso2.passcode.policy");
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
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.EMAIL_CONFIGURATIONS; //checked
		paramMap.put("PayloadIdentifier", "com.wso2.email.conf");
		paramMap.put("PayloadDisplayName", "Email Configurations");
		paramMap.put("EmailAccountName", data.displayname);
		paramMap.put("IncomingMailServerUsername", data.username);
		paramMap.put("IncomingPassword", data.password);
		paramMap.put("IncomingMailServerUseSSL", true);
		paramMap.put("OutgoingMailServerUsername", data.username);
		paramMap.put("OutgoingPassword", data.password);
		paramMap.put("OutgoingMailServerUseSSL", true);
		paramMap.put("OutgoingPasswordSameAsIncomingPassword", true);
		
		if (data.type == "GMAIL") {
			
			paramMap.put("IncomingMailServerHostName", "imap.gmail.com");
			paramMap.put("IncomingMailServerPortNumber", 993);
			paramMap.put("OutgoingMailServerHostName", "smtp.gmail.com");
			paramMap.put("OutgoingMailServerPortNumber", 587);

        } else if (data.type == "YAHOO") {
        	
        	paramMap.put("IncomingMailServerHostName", "pop.mail.yahoo.com");
			paramMap.put("IncomingMailServerPortNumber", 110);
			paramMap.put("OutgoingMailServerHostName", "smtp.mail.yahoo.com");
			paramMap.put("OutgoingMailServerPortNumber", 25);

	    } else if (data.type == "HOTMAIL") {
	    	
	    	paramMap.put("IncomingMailServerHostName", "pop3.live.com");
			paramMap.put("IncomingMailServerPortNumber", 995);
			paramMap.put("OutgoingMailServerHostName", "smtp.live.com");
			paramMap.put("OutgoingMailServerPortNumber", 587);

        }
		
		isProfile = true;
	} else if(operationCode == "521A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAL_DAV;
	} else if(operationCode == "525A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAL_SUBSCRIPTION;
	} else if(operationCode == "") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_CERT;
	} else if(operationCode == "513A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_SECRET;
		paramMap.put("PayloadIdentifier", "com.wso2.vpn");
		paramMap.put("PayloadDisplayName", "VPN Payload");
		paramMap.put("AuthenticationMethod", data.type);
		paramMap.put("SharedSecret", data.sharedsecret);
		isProfile = true;
	} else if(operationCode == "524A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.LDAP; //checked
		paramMap.put("PayloadIdentifier", "com.wso2.ldap");
		paramMap.put("PayloadDisplayName", "LDAP Payload");
		paramMap.put("LDAPAccountDescription", data.ldapdesc);
		paramMap.put("LDAPAccountHostName", data.hostname);
		paramMap.put("LDAPAccountUserName", data.username);
		paramMap.put("LDAPAccountPassword", data.password);
		paramMap.put("LDAPAccountUseSSL", data.usedssl);
		isProfile = true;
	}
	
	if(isProfile) {
		paramMap.put("PayloadUUID", identifier);
	} else {
		paramMap.put("CommandUUID", identifier);
	}
	
	try {
		var payloadLoader = new Packages.com.wso2mobile.ios.mdm.payload.PayloadLoader();
		var responseData = payloadLoader.loadPayload(operation, paramMap, isProfile);	
	} catch (e) {
		log.error(e);
	}
			
	return responseData;
}