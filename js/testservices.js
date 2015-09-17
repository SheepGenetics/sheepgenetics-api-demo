'use strict';

  angular.module('SheepGenetics.services', [])

    //
    //  API 
    //
    
      .service('API', function($http, $q, $log){

                this.loadCount = 0;
        this._datasets = null;
        this._analyses = {};

        //
        //  DISPATCHER
        //

          this.datasets = function(params) {
            var url = '/datasets.json';
            if (this._datasets == null)
              this._datasets = this.getData(url, params);
                return this._datasets;
            };
  
          this.analyses = function(id, params) {
            var url = '/' + id + '/analyses.json';
            if (typeof(this._analyses[id]) == 'undefined')
              this._analyses[id] = this.getData(url, params);
                return this._analyses[id];
            };
  
        //
        //  RETRIEVE DATA
        //
      
          this.getData = function (location, params)
          {

                        var $this = this;
            var deferred = $q.defer();

            var url = this.getApiUrl(location, params);
            $http.get(url).success(function(data) {
              deferred.resolve(data);
                            $this.loadCount++;
            }).error(function(){
              deferred.reject();
            });

            $log.message = 'REQUEST] ' + url;
            return deferred.promise;
          }
      
          this.getExternalData = function (location, params)
          {
          
            var deferred = $q.defer();

            $http.get(location).success(function(data) {
              deferred.resolve(data);
            }).error(function(){
              deferred.reject();
            });

            $log.message = 'REQUEST] ' + location;
            return deferred.promise;
          }
      
          this.getApiUrl = function (location, params)
          {
          
            var apiUrl = "http://sgsearch.sheepgenetics.org.au/api/1";
      
            //  AUTHENTICATION VARIABLES

              var userName = "public";
              var userPassword = "public";
              var secretAppAPIKey = "87a52d10878602fbcd92f98e9d825886";
              var publicAppAPIKey = "eec14b44831b571a7dbbc70432a4c145";

            //  PREPARE RESTFUL REQUEST

              var userPassPhrase = userName + "SGPasswordSalt" + userPassword;    
              var hashedUserPassPhrase =  CryptoJS.SHA1(userPassPhrase);    
              var timeStamp = Math.round(Date.now() / 1000);
              var messageSignature = publicAppAPIKey + userName + timeStamp;
              var hmac = CryptoJS.HmacSHA1(messageSignature,secretAppAPIKey + hashedUserPassPhrase);
      
            //  PREPARE PARAMS
            
              if (typeof(params) == 'object')
                params = '&' + this.serialize(params);
                            else if (typeof(params) == 'undefined')
                                params = '';
              
            //  REQUEST URL
                        return apiUrl + location + "?appid=" + publicAppAPIKey + "&userid=" + userName + "&" + "timestamp=" + timeStamp + "&apikey=" + hmac + params;
        
          }
          
          this.serialize = function(obj, prefix) {
             var str = [];
            for(var p in obj) {
              var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];

                            //  hack for breed id's
                            if (k == 'BreedId')
                            {
                                for(var i = 0; i < v.length; i++)
                                    str.push(k + "=" + encodeURIComponent(v[i]));

                            }
                            else
                            {
                                str.push(typeof v == "object" ?
                                    this.serialize(v, k) :
                                    k + "=" + encodeURIComponent(v));
                            }
            }
            return str.join("&");
          }
      
      
        });
