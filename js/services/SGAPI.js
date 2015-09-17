'use strict';

angular.module('services.SGAPI', ['ngResource', 'services.SGUI', 'services.SGCore', 'services.MockData'])

.factory('sgDatasets', function ($resource, $q, sgCache, SG_URL, sgAuth) {
	var cache = sgCache.createCache('datasets');
	var url = SG_URL.replace(':location', 'datasets.json');

	var rest = $resource(url);

	return {
		/**
		 * @description
		 *
		 * get list of datasets
		 *
		 * @param {object} user
		 *
		 * @returns promise (Array of datasets { id:, title: })
		 */
		list: function (user) {
			var deferred = $q.defer();
			var key = "ds";
			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			rest.query(sgAuth.request(user.login, user.password), function (data) {
				cache.put(key, data);
				deferred.resolve(data);
			},
			function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		}
	};
})

.factory('sgAnalyses', function ($log, $resource, $q, sgCache, SG_URL, SG_MALE, sgAuth, sgUI) {
	var cache = sgCache.createCache('analyses');

	var analyses_rest = $resource(SG_URL.replace(':location', ':dataset/analyses.json'), {}, {});

	// metadata queries
	var breed_options_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/options/breeds.json'), {}, {});
	var birth_years_options_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/options/birthyears.json'), {}, {});
	var sex_options_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/options/sex.json'), {}, {});
	var sire_options_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/options/sirestatus.json'), {}, {});
	var woolgroup_options_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/options/woolgroup.json'), {}, {});
	var asbvs_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/asbvs/default.json'), {}, {});
	var averages_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/averages.json'), {}, {});

	// data queries
	var query_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/query.json'), {}, {});
	var animal_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/animal/sgid/:id.json'), {}, {});
	var pedigree_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/animal/sgid/:id/pedigree.json'), {}, {});

	return {
		/**
		 * @description
		 *
		 * get list of analyses
		 *
		 * @param {object} user
		 * @param {int} dataset - dataset id
		 *
		 * @returns promise of (Array of analyses { id:, title:, date: })
		 */
		list: function (user, dataset) {
			var deferred = $q.defer();

			var key = "an/" + dataset;
			var results = cache.get(key);
			if (results) {
				// $log.debug('cached result');
				deferred.resolve(results);
				return deferred.promise;
			}

			analyses_rest.query(sgAuth.request(user.login, user.password, { dataset: dataset })).$promise.then(function (data) {
				// $log.debug('query result');
				var len = data.length;
				for (var i = 0; i < len; i++) {
					var date = new Date(data[i].date).toLocaleDateString();

					data[i].display_date = date;

				}
				cache.put(key, data);
				deferred.resolve(data);
			},
			function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

		/**
		 * @description
		 *
		 * passes a single analysis { id:, title:, date:, dataset: } in the dataset into the promise
		 *
		 * @param {object} user
		 * @param {int} dataset - dataset id
		 * @param {int} id - analysis id
		 * @param {function} callback(data)
		 *
		 * @returns a promise
		 */
		get: function (user, dataset, id) {
			var deferred = $q.defer();

			// don't bother to cache here - just quickly loop through the cached list
			this.list(user, dataset)
				.then(function (items) {
					var len = items.length;
					if (id == "" && len > 0) {
						id = items[0].id; // default to first available analysis
					}
					for (var i = 0; i < len; i++) {
						if (items[i].id == id) {
							// return analysis with dataset id
							deferred.resolve({
								id: items[i].id,
								title: items[i].title,
								date: items[i].date,
								display_date: items[i].display_date,
								dataset: dataset
							});

							return;	// not promise as we are inside then(function)
						}
					}

					// we can't find the analysis - this _is_ an error
					return deferred.reject("Analysis not found");
				},
				deferred.reject // error handler is simple reject
			);

			return deferred.promise;
		},

		sortOptions: function (user, analysis) {
			var deferred = $q.defer();

			// TODO: fetch sort options from API when this has been implemented
			this.asbvDefinitions(user, analysis).then(function (asbvs) {
				var sorts = [
					{
						id: 'StudId_A',
						label: 'Animal Id'
					}
				];

				for (var i = 0; i < asbvs.length; i++) {
					sorts.push({
						id: sgUI.ucfirst(asbvs[i].id) + "_" + asbvs[i].sort_order,
						label: asbvs[i].abbrev
					});
				}

				deferred.resolve(sorts);
			},
			deferred.reject
			);

			return deferred.promise;
		},

		/**
		 * @description
		 *
		 * passes the lists of query criteria options (sex, sirestatus, woolgroup) into the promise
		 *
		 * @returns a promise
		 */
		options: function (user, analysis) {
			var deferred = $q.defer();

			var key = "an/options/" + analysis.dataset + "/" + analysis.id;
			var results = cache.get(key);

			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id
			};

			// run all options query in parallel via promises
			$q.all([
				sex_options_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				breed_options_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				sire_options_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				birth_years_options_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				woolgroup_options_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				this.sortOptions(user, analysis)
			]).then(function (data) {
				results = {
					sexes: data[0],
					breeds: data[1],
					sires: data[2],
					years: data[3],
					groups: data[4],
					sorts: data[5]
				};

				cache.put(key, results);
				return deferred.resolve(results);
			},
			deferred.reject
			);

			return deferred.promise;
		},

		asbvDefinitions: function (user, analysis) {
			var deferred = $q.defer();

			var key = "asbvs/" + analysis.id;
			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id
			};

			var averages;

			this.averages(user, analysis).then(
				function (data) {
					averages = data;

					return asbvs_rest.query(sgAuth.request(user.login, user.password, params)).$promise;
				},
				deferred.reject
			).then(
				function (data) {
					for (var i = 0; i < data.length; i++) {
						data[i].average = averages[data[i].id];
					}

					cache.put(key, data);
					deferred.resolve(data);
				},
				deferred.reject // chain error onwards
			);

			return deferred.promise;
		},

		averages: function (user, analysis) {
			var deferred = $q.defer();

			var key = "averages/" + analysis.id;
			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id
			};

			averages_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(
				function (data) {
					// build hash of abbreviation => average
					var vals = {};
					var len = data.length;
					for (var i = 0; i < len; i++) {
						vals[data[i].name] = data[i].value;
					}

					cache.put(key, vals);
					deferred.resolve(vals);
				},
				deferred.reject // chain error onwards
			);

			return deferred.promise;
		},
		
		drop_averages: function (user, analysis) {
			var deferred = $q.defer();

			var key = "dropaverages/" + analysis.id;
			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id
			};

			var drop_averages_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/statistics/dropaverages.json'), {}, {});

			drop_averages_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(
				function (data) {				    
					cache.put(key, data);
					deferred.resolve(data);
				},
				deferred.reject // chain error onwards
			);

			return deferred.promise;
		},

		search: function (user, analysis, criteria) {
			var deferred = $q.defer();

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id,
			};

			for (var crit in criteria) {
				if (crit != 'asbv_min' && crit != 'asbv_max') {
					params[crit] = criteria[crit];
				}
			}

			if (criteria.asbv_min) {
				for (var asbv in criteria.asbv_min) {
					params[sgUI.ucfirst(asbv) + "_min"] = criteria.asbv_min[asbv];
				}
			}

			if (criteria.asbv_max) {
				for (var asbv in criteria.asbv_max) {
					params[sgUI.ucfirst(asbv) + "_max"] = criteria.asbv_max[asbv];
				}
			}

			var key = "an/search";
			for (var fld in params) {
				key += "/" + fld + params[fld];
			}

			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			query_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(
				function (data) {
					cache.put(key, data);
					deferred.resolve(data);
				},
				deferred.reject
			);

			return deferred.promise;
		},

		getAnimalById: function (user, analysis, id) {
			var deferred = $q.defer();

			var key = "an/id" + id;
			var results = cache.get(key);

			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id,
				id: id
			};

			animal_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(
				function (data) {
					var animal = data[0]; // we get a list back from the query, so extract the animal
					var id = animal.id;

					//animal.display_id=sgUI.getDisplayID(animal.id);
					animal.drop = animal.birthdate.substr(0, 4);
					animal.stud = animal.studname + "(" + animal.id.substr(0, 6) + ")";
					if (animal.sire.length) {
						animal.sire_name = animal.sirestudname + "-" + animal.sire.substring(10);
					} else {
						animal.sire_name = "Unavailable";
					}

					if (animal.dam.length) {
						animal.dam_name = sgUI.getDisplayID(animal.dam);
					} else {
						animal.dam_name = "Unavailable";
					}

					animal.has_pedigree = animal.dam.length > 0 || animal.sire.length > 0;

					cache.put(key, animal);
					deferred.resolve(animal);
				},
				deferred.reject // chain error onwards
				);

			return deferred.promise;
		},

		/*
		*   @description
				build a pedigree with the structure that we want
					animal.sire
					animal.sire.sire
					animal.sire.dam
					etc..
			
				ensures we have values at all levels so display logic is simple

				NOTE: the incoming pedigree data may be missing parents at any level
		*/
		_buildPedigree: function (data) {

			var pedigree = {
				id: data[0].id,
				display_id: data[0].display_id,
				sire: {
					sire: {},
					dam: {}
				},
				dam: {
					sire: {},
					dam: {}
				}
			};

			this._setPedigree(pedigree, data[0], 1, 3);

			return pedigree;
		},

		_setPedigree: function (pedigree, generation, depth, max_depth) {
			if (depth >= max_depth) {
				return;
			}

			pedigree.sire = {};
			pedigree.dam = {};

			if (generation && generation.parents[0].display_id) {
				pedigree.sire.display_id = generation.parents[0].display_id;
				pedigree.sire.id = generation.parents[0].id;

				this._setPedigree(pedigree.sire, generation.parents[0], depth + 1, max_depth);
			} else {
				pedigree.sire.display_id = "";
				pedigree.sire.id = "";
				this._setPedigree(pedigree.sire, null, depth + 1, max_depth);
			}

			if (generation && generation.parents[1].display_id) {
				pedigree.dam.display_id = generation.parents[1].display_id;
				pedigree.dam.id = generation.parents[1].id;

				this._setPedigree(pedigree.dam, generation.parents[1], depth + 1, max_depth);
			} else {
				pedigree.dam.display_id = "";
				pedigree.dam.id = "";
				this._setPedigree(pedigree.dam, null, depth + 1, max_depth);
			}
		},

		getAnimalPedigreeById: function (user, analysis, id) {
			var deferred = $q.defer();

			var key = "an/pedigree/" + id;
			var results = cache.get(key);

			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id,
				id: id
			};

			pedigree_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(ionic.proxy(function (data) {
				var pedigree = this._buildPedigree(data);

				cache.put(key, pedigree);
				deferred.resolve(pedigree);
			}, this),
			deferred.reject // chain error onwards
			);

			return deferred.promise;
		},

		getAnimalDetailsById: function (user, analysis, id) {
			var deferred = $q.defer();

			var key = "an/details/id" + id;
			var results = cache.get(key);

			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var asbvs;
			var sexes;

			// note: ionic.proxy so we can call functions on this
			this.asbvDefinitions(user, analysis).then(
				ionic.proxy(function (data) {
					asbvs = data;

					return this.getAnimalById(user, analysis, id);
				}, this),
				deferred.reject // chain error onwards
			).then(
				function (animal) {
					// set label for animal
					animal.sex_name = animal.sex == SG_MALE ? 'MALE' : 'FEMALE';


					// build hash of asbv_abbreviation => animal breeding value
					var vals = {};
					var len = animal.breedingvalues.length;
					for (var i = 0; i < len; i++) {
						vals[animal.breedingvalues[i].name] = animal.breedingvalues[i];
					}

					len = asbvs.length;

					animal.breedingvalues = new Array();

					// stick the values in with the labels
					for (var i = 0; i < len; i++) {
						try {
							var asbv = asbvs[i].id;
							var val = vals[asbv];

							if (val && val.value.length) {
								var accuracy = val.accuracy ? "" + val.accuracy + "%" : "";
								animal.breedingvalues.push({
									value: val.value,
									accuracy: accuracy,
									percentile: val.percentile,
									is_trait_leader: val.percentile == 1, // assume this is a leader for now until SG start setting this flag
									label: asbvs[i].label,
									abbrev: asbvs[i].abbrev,
									units: asbvs[i].units,
									// description: asbvs[i].description, // description is currently identical to label, so skip it
									average: asbvs[i].average,
									display_type: val.displaytype   // styling for asbv type
								});
							}
						} catch (e) {
							// ignore error
						}
					}

					cache.put(key, animal);
					deferred.resolve(animal);
				},
				deferred.reject // chain error onwards
			);

			return deferred.promise;
		}

	};
})

.factory('sgFlocks', function ($log, $resource, $q, sgCache, SG_URL, SG_URL2, sgAuth, sgAnalyses) {
	var cache = sgCache.createCache('flocks');

	return {
		/**
		 * @description
		 *
		 * get list of flocks
		 *
		 * @param {object} user
		 * @param {int} dataset - dataset id
		 *
		 * @returns promise of (Array of analyses { id:, title:, date: })
		 */
		list: function (user, analysis) {
			var deferred = $q.defer();

			var key = "list/" + analysis.id;
			var results = cache.get(key);
			if (results) {
				deferred.resolve(results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id
			};

			var flock_list_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/flocks.json'), {}, {});

			flock_list_rest.query(sgAuth.request(user.login, user.password, params)).$promise.then(
				function (data) {
					if (data && data.length) {
						cache.put(key, data);
					}

					deferred.resolve(data);
				},
				deferred.reject // chain error onwards
			);

			return deferred.promise;
		}

		/**
		 * @description
		 *
		 * retrieve details of a flock as a promise
		 *
		 * @param {object} user
		 * @param {object} analysis
		 * @param {int} id - flock breed_flock_code id
		 * @param {function} callback(data)
		 *
		 * @returns a promise for { flock, flock_averages, group_averages }
		 */
		, get: function (user, analysis, breed_flock_code, group_type) {
			var deferred = $q.defer();

			// deferred.reject(); return deferred.promise; // mock failure

			var key = "flock/" + analysis.id + "/" + breed_flock_code;

			var cached_results = cache.get(key);
			if (cached_results) {
				deferred.resolve(cached_results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id,
				id: breed_flock_code,
                grouptype: group_type
			};

			var flock_details_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/flock/:id.json'), {}, {
				query: {
					method: "GET",
					isArray: false  // flock details returns an object not an array
				}
			});

			var flock_averages_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/statistics/flockaverages/:id.json'), {}, {});
			var flock_generations_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/statistics/flockgenerationintervals/:id.json'), {}, {});
			var group_averages_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/statistics/groupaverages/:grouptype.json'), {}, {});

			$q.all([
				flock_details_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				flock_averages_rest.query(sgAuth.request(user.login, user.password, params)).$promise,
				group_averages_rest.query(sgAuth.request(user.login, user.password, params)).$promise
			]).then(
				function (data) {
					var result = {
						details: data[0],
						flock_averages: data[1],
						group_averages: data[2]
					};

					var start_year = result.details.latest_drop; // maybe new Date().getFullYear()

					result.drop_years = [];
					for (var y = start_year ; y > 1950; y--) {
						result.drop_years.push(y);
					}

					var break_downs = {}; // use object as hashmap to obtain unique values
					for (var i = 0; i < result.flock_averages.length; i++) {
						var bd = result.flock_averages[i].breakdown;

						break_downs[bd] = 1;
					}
					result.break_downs = Object.keys(break_downs); // keys are the unique breakdown values

					cache.put(key, result);

					return deferred.resolve(result);
				},
				function (err) {
					console.log("failed: " + err);
					return deferred.reject;
				}
			);

			return deferred.promise;
		}

        , group_by_field: function (data, field) {
            var break_downs = {}; // use object as hashmap to obtain unique values
            for (var i = 0; i < data.length; i++) {
                var bd = data[i].breakdown;

                break_downs[bd] = 1;
            }
        }

		/**
		*   @description
		*
		* retrieve flock distribution data (UNUSED)
		*/
		, distribution: function (user, analysis, breed_flock_code, drop, break_down, trait) {
			var deferred = $q.defer();

			// deferred.reject(); return deferred.promise; // mock failure

			var key = "flock/" + analysis.id + "/" + breed_flock_code + "/distribution/" + drop + "/" + break_down + "/" + trait;

			var cached_results = cache.get(key);
			if (cached_results) {
				deferred.resolve(cached_results);
				return deferred.promise;
			}

			var params = {
				dataset: analysis.dataset,
				analysis: analysis.id,
				id: breed_flock_code,

				dropyear: drop,
				breakdown: break_down,
				traitname: trait
			};

			var dist_rest = $resource(SG_URL.replace(':location', ':dataset/:analysis/statistics/distribution/:id.json'), {}, {});

			dist_rest.query(sgAuth.request(user.login, user.password, params)).$promise
				.then(
					function (data) {
						if (data && data.length) {
							cache.put(key, data);
						}

						deferred.resolve(data);
					},
					deferred.reject // chain error onwards
				);

			return deferred.promise;

		}

		/**
		*   @description
		*
		*   retrieves all the analysis-level data required to access flock data
		*
		*   @returns: object
		*       flocks: list of flocks
		*       asbvs:  list of asbvs
		*       drop_averages: list of drop averages
		*/        
		, flock_analysis_data: function (user, analysis) {
			var deferred = $q.defer();

			// deferred.reject(); return deferred.promise; // mock failure

			var key = "flock_analysis_data/" + analysis.id;

			var cached_results = cache.get(key);
			if (cached_results) {
				deferred.resolve(cached_results);
				return deferred.promise;
			}

			$q.all([
				this.list(user,analysis),
				sgAnalyses.asbvDefinitions(user, analysis),
				sgAnalyses.drop_averages(user, analysis)
			]).then(
				function (data) {
					var result = {
						flocks: data[0],
						asbvs: data[1],
						drop_averages: data[2]
					};

					cache.put(key, result);

					return deferred.resolve(result);
				},
				function (err) {
					console.log("failed: " + err);
					return deferred.reject;
				}
			);

			return deferred.promise;
		}
	};
})

;

