'use strict';

angular.module('services.SGChart', ['services.SGUtil'])

.factory('sgChart', function (sgUtil) {
	
	return {
		/**
		*   @description
		*
		*   factory function returns object which provides a data() function returning data
        *   to render the genetic averages trend chart
		*/
	    get_trend_chart: function (flock_averages, group_averages, drop_averages) {
	        var flock_name = flock_averages && flock_averages.ALL && flock_averages.ALL.length ? flock_averages.ALL[0].flock : "UNKNOWN";
	        var group_name = group_averages && group_averages.ALL && group_averages.ALL.length ? group_averages.ALL[0].group : "UNKNOWN";

		    return {
                // averages grouped by break_down, ordered by year
                _flock_averages: flock_averages,
                _drop_averages: drop_averages,
                _group_averages: group_averages,

                _flock_name: flock_name,
                _group_name: group_name,

                data: function (year, break_down, trait) {
                    console.log("chart.data " + year + "," + break_down + "," + trait);

                    var series = [
                        "Run averages",
                        this._group_name + " averages",
                        this._flock_name + " averages"
                    ];

                    var da = sgUtil.extract_from_field_by_value(this._drop_averages[break_down], 'drop_year', year, trait);
                    var ga = sgUtil.extract_from_field_by_value(this._group_averages[break_down], 'drop_year', year, trait);
                    var fa = sgUtil.extract_from_field_by_value(this._flock_averages[break_down], 'drop_year', year, trait);

                    var points = [
                        da.map(function (val) { return val.f2; }),
                        ga.map(function (val) { return val.f2; }),
                        fa.map(function (val) { return val.f2; })
                    ];

                    // get the min/max years for the data set
                    var from_year = year;
                    var to_year = year;
                    
                    // may have no data in the chosen year range so need to check length!

                    if(da.length) {
                        from_year = da[0].f1;
                        to_year = da[da.length - 1].f1;
                    }

                    if (ga.length) {
                        from_year = ga[0].f1 < from_year ? ga[0].f1 : from_year;
                        to_year = ga[ga.length-1].f1 > to_year ? ga[ga.length-1].f1 : to_year;
                    }

                    //  prefer to show flock data if possible, so check last so it 'wins'
                    if (fa.length) {
                        from_year = fa[0].f1 < from_year ? fa[0].f1 : from_year;
                        to_year = fa[fa.length-1].f1 > to_year ? fa[fa.length-1].f1 : to_year;
                    }

                    var labels = [];
                    for (var i = from_year; i <= to_year; i++) {
                        labels.push(i);
                    }

                    var result = {
                        points: points,
                        series: series,
                        labels: labels
                    };

                    console.log(result);

                    return result;
                }

                , getColour: function (colour) {
                        return {
                            fillColor: 'transparent',
                            strokeColor: rgba(colour, 1),
                            pointColor: rgba(colour, 1),
                            pointStrokeColor: '#fff',
                            pointHighlightFill: '#fff',
                            pointHighlightStroke: rgba(colour, 0.8)
                        };
                }
            };
        }
	};

})

;

