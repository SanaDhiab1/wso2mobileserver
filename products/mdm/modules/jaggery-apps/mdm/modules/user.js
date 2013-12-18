var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var user = (function () {
    var config = require('/config/mdm.js').config();
    var routes = new Array();

	var log = new Log();
	var db;
	var common = require("/modules/common.js");
	var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}
	
	var claimEmail = "http://wso2.org/claims/emailaddress";
	var claimFirstName = "http://wso2.org/claims/givenname";
	var claimLastName = "http://wso2.org/claims/lastname";
	var claimMobile = "http://wso2.org/claims/mobile";
	
    var module = function (dbs) {
		db = dbs;
        //mergeRecursive(configs, conf);
    };

	var configs = function (tenantId) {
	    var configg = application.get(TENANT_CONFIGS);
		if (!tenantId) {
	        return configg;
	    }
	    return configs[tenantId] || (configs[tenantId] = {});
	};			
	/**
	 * Returns the user manager of the given tenant.
	 * @param tenantId
	 * @return {*}
	 */
	var userManager = function (tenantId) {
	    var config = configs(tenantId);
	    if (!config || !config[USER_MANAGER]) {
			var um = new carbon.user.UserManager(server, tenantId);
			config[USER_MANAGER] = um;
	        return um;
	    }
	    return configs(tenantId)[USER_MANAGER];
	};
	
	var createPrivateRolePerUser = function(username){
		var um = userManager(common.getTenantID());
		var indexUser = username.replace("@", ":");
		var arrPermission = {};
	    var permission = [
	        'http://www.wso2.org/projects/registry/actions/get',
	        'http://www.wso2.org/projects/registry/actions/add',
	        'http://www.wso2.org/projects/registry/actions/delete',
	        'authorize','login'
	    ];
	    arrPermission[0] = permission;
		if(!um.roleExists("Internal/private_"+indexUser)){
			um.addRole("Internal/private_"+indexUser, [username], arrPermission);
		}
	}			
	
    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }
	
	function generatePassword() {
	    var length = 6,
	        charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
	        retVal = "";
	    for (var i = 0, n = charset.length; i < length; ++i) {
	        retVal += charset.charAt(Math.floor(Math.random() * n));
	    }
	    return retVal;
	}
    // prototype
    module.prototype = {
        constructor: module,
        /*User CRUD Operations (Create, Retrieve, Update, Delete)*/
        addUser: function(ctx){
            log.info("Check Params"+stringify(ctx));
            var claimMap = new java.util.HashMap();

            claimMap.put(claimEmail, ctx.username);
            claimMap.put(claimFirstName, ctx.first_name);
            claimMap.put(claimLastName, ctx.last_name);
            claimMap.put(claimMobile, ctx.mobile_no);
            var proxy_user = {};

            try {
                var tenantId = common.getTenantID();
                var users_list = Array();
                if(tenantId){
                    var um = userManager(common.getTenantID());
                    if(um.userExists(ctx.username)) {
                        proxy_user.error = 'User already exist with the email address.';
                        proxy_user.status = "ALLREADY_EXIST";
                    } else {
						var generated_password =  generatePassword();
                        if(ctx.type == 'user'){
                            um.addUser(ctx.username, generated_password,ctx.groups, claimMap, null);
                        }else if(ctx.type == 'administrator'){
                            um.addUser(ctx.username, generated_password,new Array('mdmadmin'), claimMap, null);
                        }
                        createPrivateRolePerUser(ctx.username);
                        proxy_user.status = "SUCCESSFULL";
						proxy_user.generatedPassword = generated_password;
                    }
                }
                else{
                    log.error('Error in getting the tenantId from session');
                    print('Error in getting the tenantId from session');
                }
            } catch(e) {
                proxy_user.status = "BAD_REQUEST";
                log.error(e);
                proxy_user.error = 'Error occurred while creating the user.';
            }
            return proxy_user;
        },
        getUser: function(ctx){
            try {
                var proxy_user = {};
                var tenantUser = carbon.server.tenantUser(ctx.userid);
                var um = userManager(tenantUser.tenantId);
                var user = um.getUser(tenantUser.username);
                var claims = [claimEmail, claimFirstName, claimLastName];
                var claimResult = user.getClaimsForSet(claims,null);
                proxy_user.email = claimResult.get(claimEmail);
                proxy_user.firstName = claimResult.get(claimFirstName);
                proxy_user.lastName = claimResult.get(claimLastName);
                proxy_user.mobile = claimResult.get(claimMobile);
                proxy_user.username = tenantUser.username;
                proxy_user.tenantId = tenantUser.tenantId;
                proxy_user.roles = stringify(user.getRoles());
                return proxy_user;
            } catch(e) {
                log.error(e);
                var error = 'Error occurred while retrieving user.';
                return error;
            }
        },
        getAllUsers: function(ctx){
            var tenantId = common.getTenantID();
            var users_list = Array();
            if(tenantId){
                var um = userManager(common.getTenantID());
                var allUsers = um.listUsers();
                var removeUsers = new Array("wso2.anonymous.user","admin","admin@admin.com");
                var users = common.removeNecessaryElements(allUsers,removeUsers);
                for(var i = 0; i < users.length; i++) {
                    var user = um.getUser(users[i]);
                    var claims = [claimEmail, claimFirstName, claimLastName];
                    var claimResult = user.getClaimsForSet(claims,null);
                    var proxy_user = {};
                    proxy_user.username = users[i];
                    proxy_user.email = claimResult.get(claimEmail);
                    proxy_user.firstName = claimResult.get(claimFirstName);
                    proxy_user.lastName = claimResult.get(claimLastName);
                    proxy_user.mobile = claimResult.get(claimMobile);
                    proxy_user.tenantId = tenantId;
                    proxy_user.roles = stringify(user.getRoles());
                    users_list.push(proxy_user);

                }
            }else{
                print('Error in getting the tenantId from session');
            }
            log.info("LLLLLLLLLLLLLLLLLLLL"+stringify(users_list));
            return users_list;
        },
        deleteUser: function(ctx){
            var result = db.query("select * from devices where user_id = ?",ctx.userid);
            log.info("Result :"+result);
            if(result != undefined && result != null && result != '' && result[0].length != undefined && result[0].length != null && result[0].length > 0){
                return 404;
            }else{
                var um = userManager(common.getTenantID());
                um.removeUser(ctx.userid);
                var private_role = ctx.userid.replace("@", ":");
                um.removeRole("Internal/private_"+private_role);
                return 200;
            }
        },

        /*End of User CRUD Operations (Create, Retrieve, Update, Delete)*/
/*----------------------------------------------------------------------------------------------------------------------------------------------------------------*/
        /*other user manager functions*/

        /*Get list of roles belongs to particular user*/
        getUserRoles: function(ctx){
            log.info("User Name >>>>>>>>>"+ctx.username);
            var um = userManager(common.getTenantID());
            var roles = um.getRoleListOfUser(ctx.username);
            var roleList = common.removePrivateRole(roles);
            return roleList;
        },
        updateRoleListOfUser:function(ctx){
            var existingRoles = this.getUserRoles(ctx);
            var addedRoles = ctx.added_groups;
            var newRoles = new Array();
            for(var i=0;i<addedRoles.length;i++){
                var flag = false;
                for(var j=0;j<existingRoles.length;j++){
                    if(addedRoles[i]== existingRoles[j]){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == false){
                    newRoles.push(addedRoles[i]);
                }
            }
            var removedRoles = ctx.removed_groups;
            var deletedRoles = new Array();
            for(var i=0;i<removedRoles.length;i++){
                var flag = false;
                for(var j=0;j<existingRoles.length;j++){
                    if(removedRoles[i]== existingRoles[j]){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == true){
                    deletedRoles.push(removedRoles[i]);
                }
            }
            var um = userManager(common.getTenantID());
            um.updateRoleListOfUser(ctx.username, deletedRoles, newRoles);
        },
        getUsersByType:function(ctx){//types are administrator,mam,user
            var type = ctx.type;
            var usersByType = new Array();
            var users = this.getAllUsers();
            for(var i =0 ;i<users.length;i++){
                var roles = this.getUserRoles({'username':users[i].username});
                var flag = 0;
                for(var j=0 ;j<roles.length;j++){
                    log.info("Test iteration2"+roles[j]);
                    if(roles[j]=='admin'||roles[j]=='mdmadmin'||roles[j]=='mamadmin'){
                        flag = 1;
                        break;
                    }else if(roles[j]==' Internal/publisher'||roles[j]=='Internal/reviewer'||roles[j]=='Internal/store'){
                        flag = 2;
                        break;
                    }else{
                        flag = 0;
                    }
                }
                if(flag == 1){
                    users[i].type = 'administrator';
                    if(type == 'admin'){
                        usersByType.push( users[i]);
                    }
                }else if(flag == 2) {
                    users[i].type = 'mam';
                    usersByType.push( users[i]);
                }else{
                    users[i].type = 'user';
                    usersByType.push( users[i]);
                }
                //print(stringify(users[i]));
            }
            return usersByType;
        },
        /*end of other user manager functions*/
/*----------------------------------------------------------------------------------------------------------------------------------------------------------------*/

        /*other functions*/

        /*authentication for devices only*/
        authenticate: function(ctx){
			ctx.username = ctx.username;
			log.info("username "+ctx.username);
			var authStatus = server().authenticate(ctx.username, ctx.password);
			log.info(">>auth "+authStatus);
			if(!authStatus) {
				return null;
			}
			var user =  this.getUser({'userid': ctx.username});
			var result = db.query("SELECT COUNT(id) AS record_count FROM tenantplatformfeatures WHERE tenant_id = ?",  stringify(user.tenantId));
			if(result[0].record_count == 0) {
				for(var i = 1; i < 13; i++) {
					var result = db.query("INSERT INTO tenantplatformfeatures (tenant_id, platformFeature_Id) VALUES (?, ?)", stringify(user.tenantId), i);
				}
			}
		    return user;
		},

        /*send email to particular user*/
        sendEmail: function(ctx){
			var password_text = "";
			if(ctx.generatedPassword){
				password_text = "Your password to your login : "+ctx.generatedPassword;
			}
            content = "Dear "+ ctx.first_name+", "+config.email.emailTemplate+config.HTTPS_URL+"/mdm/api/device_enroll \n "+password_text+" \n"+config.email.companyName;
            subject = "MDM Enrollment";

            var email = require('email');
            var sender = new email.Sender("smtp.gmail.com", "25", config.email.senderAddress, config.email.emailPassword, "tls");
            sender.from = config.email.senderAddress;

            log.info("Email sent to -> "+ctx.username);
            sender.to = stringify(ctx.username);
            sender.subject = subject;
            sender.text = content;
            try{
				sender.send();
			}catch(e){
				log.info(e);
			}
        },

        /*Get all devices belongs to particular user*/
		getDevices: function(obj){
			var devices = db.query("SELECT * FROM devices WHERE user_id= ? AND tenant_id = ?", String(obj.userid), common.getTenantID());
			return devices;
		}


    };
    return module;
})();