'use strict';

var authApiBaseURL = process.env.AUTH_API_BASE_URL;

var request = require('request');

function checkTokenValidity(token, callback) {
	request.get({ url: authApiBaseURL + 'identity/api/me/?access_token=' + token }, 
							 function(err,httpResponse,body) {
		if(err == null) {
			if (httpResponse.statusCode == 200) {
				callback(null,JSON.parse(body), true);
			} else {
				callback(err,body, false);
			}
		} else {
			callback(err,[], false);
		}
	});
}


exports.checkTokenValidity = checkTokenValidity;
