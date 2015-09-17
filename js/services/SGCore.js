'use strict';

angular.module('services.SGCore', ['ngResource', 'services.SGUI'])

.constant('SG_URL','http://sgsearchqa.sheepgenetics.org.au/api/1/:location?appid=:public_key&userid=:user&timestamp=:timestamp&apikey=:hmac')
.constant('SG_URL2','http://sgsearch.sheepgenetics.org.au/api/1/:location')
.constant('SG_MALE',1)
/*
*   @description
*       sgCache is a facade over the underlying cache implementation so
*       we can implement extra cache functionality as needed
*/
.factory('sgCache', function ($log, DSCacheFactory) {
	return {
		createCache: function (name) {
			return DSCacheFactory.createCache(name);
		},

		reset: function () {
			DSCacheFactory.clearAll();
		}
	};
})

.factory('sgAuth', function ($log, $resource, $q, SG_URL) {

	// HSW key
	var apiPublicKey = 'd81bc4f76565241eac1acff8cf69fe2f';
	var apiSecretKey = 'f6f315ce4af87cb5a3bce46703ed8e2c';

	//var apiPublicKey = 'eec14b44831b571a7dbbc70432a4c145'; 
	//var apiSecretKey = '87a52d10878602fbcd92f98e9d825886';

	var apiSalt='SGPasswordSalt';
	
	return {
		/*
		 * sgAuth.request(path,user,password)
		 *
		 * returns array with authorisation parameters required for REST call to path
		 */
		request:function(user_id,password,params) {
			var ts=Math.round(Date.now()/1000);
			var passPhrase=password+apiSalt+user_id;
			var passPhraseHash=CryptoJS.SHA1(passPhrase);
			var signature=apiPublicKey+user_id+ts;
			var hmac=CryptoJS.HmacSHA1(signature,apiSecretKey+passPhraseHash);

			var request={
				'public_key':	apiPublicKey,
				'user':			user_id,
				'timestamp':	ts,
				'hmac':			hmac // +"FAIL"
			};

			if(params) {
				for(var prop in params) {
					request[prop]=params[prop];
				}
			}
			return request;
		},

		/**
		*   @description
		*       returns header object containing 'Authorization' value for a request to the SG API  
		*/
		authHeader: function (user) {
			var req = this.request(user.login, user.password);

			var auth = 'SheepGenetics appid="' + req.public_key + '",userid="' + req.user_id + '",timestamp="' + req.timestamp + '",apikey="' + req.hmac + '"';

			return {
				'Authorization': auth
			};
		}
	};

})

;

