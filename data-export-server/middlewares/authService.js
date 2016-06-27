'use strict';

var _ = require('lodash');
var compose = require('composable-middleware');
var IdentityService = require('./identityService');

// current privalage name  TITLE MANAGEMENT

function validatetoken(req, res, next) {
	if(req.cookies && req.cookies.hasOwnProperty && req.cookies.hasOwnProperty('token')) {
		var token = req.cookies.token;
		console.log(token);
		token = token.replace('"', '');
		token = token.replace('"', '');
		IdentityService.checkTokenValidity(token, function(err, user, isValid) {
			if (isValid == true) {
				req.token = token;
				req.user = user;
				req.user.role = _.map(_.filter(user.privileges, { 'module_name': 'Analytics', 'enable': 'Y' }), 'privilege_name');
				delete req.user.privileges;
				req._id = user.id;
				req._role_id = user.role_id;
				next();			
			} else {
				return res.send(401);	
			}
		});
	} else {
		return res.send(401);
	}
};

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate
    .use(function(req, res, next) {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
			validatetoken(req, res, next);
    })
    .use(function(req, res, next) {
			 next();
    });
}


function hasPrivilege(privilegeRequired) {
	if (!privilegeRequired) throw new Error('Required privilege needs to be set');
	
	return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
			if (privilegeRequired) {
				if (req.user.role.indexOf(privilegeRequired) > -1) {
					next();	
				} else {
					res.send(403);
				}
			} else {
				res.send(403);	
			}
    });
}

function checkAuthenticity(){
	return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
			res.json({
							"user" : req.user,
							"role" : req.user.role,
							"_id" : req._id,
							"_role_id" : req._role_id,
							"token" : req.token
						});
    });
}



exports.checkAuthenticity = checkAuthenticity;
exports.hasPrivilege = hasPrivilege;