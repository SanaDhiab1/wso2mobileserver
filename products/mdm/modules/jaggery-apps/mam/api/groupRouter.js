var group = (function () {
	
    var module = function (db,router) {
		var groupModule = require('modules/group.js').group;
		var group = new groupModule(db);
        var userModule = require('modules/user.js').user;
        var user = new userModule(db);

		router.get('groups/', function(ctx){
			var groups= group.getAllGroups(ctx);
		    if(groups[0]!=null){
		        response.content = groups;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});
        router.get('groups/invite', function(ctx){
            var groups= group.getGroups(ctx);
            if(groups[0]!=null){
                response.content = groups;
                response.status = 200;
            }else{
                response.status = 404;
            }
        });
		router.delete('groups/{groupid}', function(ctx){
            log.info("Test Delete Router");
			group.deleteGroup(ctx);
		    response.status = 201;
		});
		router.get('groups/{groupid}/users/device_count', function(ctx){
			var users = group.getUsers(ctx);
		    response.content =  users;
		    response.status = 200;
		});
        router.get('groups/{groupid}/users', function(ctx){
            log.info("Test Router");
            var allUsers = group.getUsersByGroup(ctx);
            response.content =  allUsers;
            response.status = 200;
        });
        router.put('groups/{groupid}/users', function(ctx){
            log.info("Test Request PUTTTTT"+stringify(ctx));
             var result = group.updateUserListOfRole(ctx);
             response.content = result;
             response.status = 200;
        });
		router.post('groups', function(ctx){
            log.info("Test Groups >>>>>>>>>>");
			var returnMsg = group.addGroup(ctx);
            if(returnMsg.status == 'ALLREADY_EXIST'){
                response.status = 409;
                response.content = "Already Exist";
            }else if(returnMsg.status == 'SUCCESSFULL' ){
                response.status = 201;
                response.content = "Successfull";
            }else if(returnMsg.status == 'BAD_REQUEST'){
                response.status = 400;
                response.content = "Name not According to Policy";
            }else if(returnMsg.status == 'SERVER_ERROR'){
                response.status = 500;
                response.content = "Session Expired";
            }else{
                response.status = 400;
            }
		});
		router.post('groups/{groupid}/operations/{operation}', function(ctx){
                response.status = 200;
                response.content = "success";
                var result = group.sendMsgToGroupDevices(ctx);

		});
		
    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();