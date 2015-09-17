'use strict';

angular.module('services.SGUtil', [])

.factory('sgUtil', function ($log) {

    return {
        group_by_field: function (data, field) {
            var result = {};

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var bd = item[field];

                if (isNaN(bd)) { // we ignore the percentile break downs and just capture SIRE, DAM, etc
                    if (!result[bd]) {
                        result[bd] = [];
                    }

                    result[bd].push(item);
                }
            }

            return result;
        }

        , group_sorted_by_nfield: function (data, group_field, sort_field) {
            var result = {};

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var bd = item[group_field];

                if (isNaN(bd)) { // we ignore the percentile break downs and just capture SIRE, DAM, etc
                    if (!result[bd]) {
                        result[bd] = [];
                    }

                    result[bd].push(item);
                }
            }

            for (var grp in result) {
                result[grp] = this.sort_by_n_field(result[grp], sort_field);
            }

            return result;
        }

        , sort_by_n_field: function (data, field) {
            var $compare = function (a, b) {
                return a[field] - b[field];
            };

            return data.sort($compare);
        }

        , extract_from_field_by_value: function (data, field1, value1, field2) {
            var results = [];
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                if (item[field1] >= value1) {
                    results.push({ f1: item[field1], f2: item[field2] });
                }
            }

            return results;
        }
    };

})

;

