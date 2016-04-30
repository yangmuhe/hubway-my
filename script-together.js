/**
 * Created by yangmuhe on 4/25/16.
 */

var w = d3.select('.plot').node().clientWidth,
    h = d3.select('.plot').node().clientHeight;


//dispatcher
var dispatcherStation = d3.dispatch('getarray', 'getstationid');


//Module
var stationChart = d3.StationChart()
    .width(350).height(300)
    .margin([15,0,10,10])
    //.barWidth(20)

var plot = d3.select('.plot').datum([]).call(stationChart);


//time span
var morning = [new Date(0,0,0,6,0), new Date(0,0,0,12,0)],
    afternoon = [new Date(0,0,0,12,0), new Date(0,0,0,19,0)],
    evening = [new Date(0,0,0,19,0), new Date(0,0,0,24,0)];


//Draw charts by module
dispatcherStation.on('getarray',function(array, stations, longlat, s){

    plot.datum(array)
        .call(stationChart);


    draw_triangles(array, stations, longlat, s);

});



//PATRICK'S GLOBAL VARIABLES
var width = d3.select('#plot').node().clientWidth,
    height = d3.select('#plot').node().clientHeight,
    centered, mapped_trips,
    zoomed = false,
    switch_a = false,
    rad =2;

var tri = [{"x":-rad/3, "y":-5*rad/2}, {"x":rad/3,"y":-5*rad/2}, {"x":0,"y":-7*rad/2}];

//SVG FOR MAP
var svg = d3.select( "#plot" )
    .append( "svg" )
    .attr( "width", width )
    .attr( "height", height );

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .style('fill', 'none')
    .on("click", clicked);

var g = svg.append( "g" );

//PROJECTION
var albersProjection = d3.geo.albers()
    .scale( 310000 )
    .rotate( [71.087,0] )
    .center( [0, 42.3575] )
    .translate( [width/2,height/2] );

//DRAWING THE PATHS OF geoJSON OBJECTS
var geoPath = d3.geo.path()
    .projection( albersProjection );

//END PATRICK'S GLOBAL VARIABLES



d3_queue.queue()
    .defer(d3.csv,'data/hubway_trips_reduced.csv', parse)
    .defer(d3.csv,'data/hubway_stations-changed.csv', parseStations)
    .defer(d3.json, 'data/neighborhoods.json') //boston
    .defer(d3.json, 'data/camb_zipcode.json') //cambridge
    .defer(d3.json, 'data/somerville_wards.json') //sommerville
    .defer(d3.json, 'data/brookline_zips.json') //brookline
    .await(dataLoaded);


function dataLoaded(err, rows, stations, bos, cam, som, bro){
        

    //Look-up table of station ID and name
    var stationNameID = d3.map(stations, function(d){return d.id;});
    //console.log(stationNameID.get(3).fullName); //!!
    //console.log(stationNameID.get(3).lngLat);


    //pass on data for labels
    stationChart.labels(stations);


    //crossfilter and dimensions
    var cfStart = crossfilter(rows);
    var tripsByStart1 = cfStart.dimension(function(d){return d.startStation;}),
        tripsByTimeStart = cfStart.dimension(function(d){return d.startTimeT;});

    var cfEnd = crossfilter(rows);
    var tripsByEnd1 = cfEnd.dimension(function(d){return d.endStation;}),
        tripsByTimeEnd = cfEnd.dimension(function(d){return d.startTimeT;});


    //Connect map with chart
    dispatcherStation.on('getstationid', function(id){
        console.log(id);

        selectStation(id);

        buttonClick(id);

    });


    //drop-down menu: choose station
    d3.select('.station').on('change',function(){
        console.log(this);
        var stationID = this.value;

        if(stationID!=""){
            d3.selectAll('.station_dot')
                .transition()
                .style('opacity',function(d){
                    if(d.id == stationID){
                        return '1';
                    }
                    else{
                        return '0.4'
                    }
                });
        } else{ // if select the first option, show all dots
            d3.selectAll('.station_dot')
                .transition()
                .style('opacity','1');
        }

        selectStation(stationID);

        buttonClick(stationID);

    });


    /*-----------------------------functions (by Muhe)------------------------------*/
    //nest and crossfilter data when a station is selected as start
    function selectStation(id){
        tripsByStart1.filterAll();
        tripsByTimeStart.filterAll();

        //choose the station as start station
        var nestStart = d3.nest()
            .key(function(d){return d.endStation})
            .rollup(function(d){return d.length})  //rollup!!
            .entries(tripsByStart1.filter(id).top(Infinity));

        var cf2Start = crossfilter(nestStart);
        var topTripsStart = cf2Start.dimension(function(d){return d.values;}).top(10);
        console.log(topTripsStart);

        var longlat = stationNameID.get(id).lngLat;
        var start = true;

        //pass on the array of trips to dispatcher
        dispatcherStation.getarray(topTripsStart, stations, longlat, start);
    }


    //nest and crossfilter data when a station is selected as start
    function selectStationEnd(id){
        tripsByEnd1.filterAll();
        tripsByTimeEnd.filterAll();

        //choose the station as end station
        var nestEnd = d3.nest()
            .key(function(d){return d.startStation})
            .rollup(function(d){return d.length})  //rollup!!
            .entries(tripsByEnd1.filter(id).top(Infinity));

        var cf2End = crossfilter(nestEnd);
        var topTripsEnd = cf2End.dimension(function(d){return d.values;}).top(10);
        console.log(topTripsEnd);

        var longlat = stationNameID.get(id).lngLat;
        var start = false;

        //pass on the array of trips to dispatcher
        dispatcherStation.getarray(topTripsEnd, stations, longlat, start);
    }


    //Button click behavior
    function buttonClick(i){
        //when click button "start" or "end"
        d3.selectAll('.btn-group .station').on('click', function(){
            var id = d3.select(this).attr('id');
            if(id=='startstation'){
                selectStation(i);

                //when click button "morning", "afternoon" or "evening"
                d3.selectAll('.btn-group .time').on('click', function(){
                    var id = d3.select(this).attr('id');
                    var s = true;
                    if(id=='morning'){
                        timeDimension(i, tripsByTimeStart, morning, s);
                    }if(id=='afternoon'){
                        timeDimension(i, tripsByTimeStart, afternoon, s);
                    }if(id=='evening'){
                        timeDimension(i, tripsByTimeStart, evening, s);
                    }
                })

            }if(id=='endstation'){
                selectStationEnd(i);

                //when click button "morning", "afternoon" or "evening"
                d3.selectAll('.btn-group .time').on('click', function(){
                    var id = d3.select(this).attr('id');
                    var s = false;
                    if(id=='morning'){
                        timeDimensionEnd(i, tripsByTimeEnd, morning, s);
                    }if(id=='afternoon'){
                        timeDimensionEnd(i, tripsByTimeEnd, afternoon, s);
                    }if(id=='evening'){
                        timeDimensionEnd(i, tripsByTimeEnd, evening, s);
                    }
                })
            }
        });
    }


    //Get array of trips during certain time span if choosing station as start station
    function timeDimension(i, cfdimension, time, start){
        var tripsByTimeMorning = cfdimension.filter(time).top(Infinity);
        var nestTime = d3.nest()
            .key(function(d){return d.endStation})
            .rollup(function(d){return d.length})  //rollup!!
            .entries(tripsByTimeMorning);

        var cfTime = crossfilter(nestTime);
        var topTripsTime = cfTime.dimension(function(d){return d.values;}).top(10);

        //dispatcherStation.getarray(topTripsTime);
        console.log("start: "+start);

        var longlat = stationNameID.get(i).lngLat;

        //pass on the array of trips to dispatcher
        dispatcherStation.getarray(topTripsTime, stations, longlat, start);
    }


    //Get array of trips during certain time span if choosing station as end station
    function timeDimensionEnd(i, cfdimension, time, start){
        var tripsByTimeMorning = cfdimension.filter(time).top(Infinity);
        var nestTime = d3.nest()
            .key(function(d){return d.startStation})
            .rollup(function(d){return d.length})  //rollup!!
            .entries(tripsByTimeMorning);

        var cfTime = crossfilter(nestTime);
        var topTripsTime = cfTime.dimension(function(d){return d.values;}).top(10);

        //dispatcherStation.getarray(topTripsTime);
        console.log("start: "+start);

        var longlat = stationNameID.get(i).lngLat;

        //pass on the array of trips to dispatcher
        dispatcherStation.getarray(topTripsTime, stations, longlat, start);
    }

    /*-----------------------------functions end------------------------------*/



    //PATRICK'S JS
    //APPEND NEIGHBORHOODS ON MAP
    g.selectAll( ".boston" )
        .data( bos.features )
        .enter()
        .append('path')
        .attr('class', 'boston neighborhoods')
        .attr( 'd', geoPath )
        //.style('fill', '#888') //boston
        .on("click", clicked);

    g.selectAll( ".cambridge" )
        .data( cam.features )
        .enter()
        .append('path')
        .attr('class', 'cambridge neighborhoods')
        .attr( "d", geoPath )
        //.style('fill', '#999') //cambridge
        .on("click", clicked);

    g.selectAll( ".somerville" )
        .data( som.features )
        .enter()
        .append('path')
        .attr('class', 'somerville neighborhoods')
        .attr( "d", geoPath )
        //.style('fill', '#aaa')
        .on("click", clicked); //somerville

    g.selectAll( ".brookline" )
        .data( bro.features )
        .enter()
        .append('path')
        .attr('class', 'brookline neighborhoods')
        .attr( "d", geoPath )
        //.style('fill', '#bbb')
        .on("click", clicked); //brookline
    //END OF NEIGHBORHOODS ON MAP



    //PLOT STATIONS ON MAP
    g.selectAll('.station_dot')
        .data( stations )
        .enter()
        .append('circle')
        .attr('class', 'station_dot')
        //.attr('station_num', function(d) { return d.id })
        .attr('id', function(d) { return d.fullName })
        .attr('cx', function(d) {
            var xy = albersProjection(d.lngLat);
            return xy[0]; })
        .attr('cy', function(d) {
            var xy = albersProjection(d.lngLat);
            return xy[1]; })
        .attr('r', rad)
        .on('click', set_station_num)

    //END OF STATIONS ON MAP

    svg.append('rect')
        .attr('x', 460)
        .attr('y', 650)
        .attr('class','substitle')
        .attr('height', 30)
        .attr('width', 400)
        .style('fill', "#ffffff")
        .style('opacity', .75)
            
    svg.append('text')
        .attr('x', 470)
        .attr('y', 671)
        .text('Boston, Brookline, Cambridge, Somerville')
        .attr("font-family", "serif")
        .attr("font-size", "18px")
        .attr('font-style', 'oblique')
        .attr("fill", "rgb(50,50,50)")
        .attr('class','substitle');



} //end of dataLoaded


/*-----------------------------functions------------------------------*/


//PATRICK'S FUNCTIONS
//global draw_triangle function
//PLOT TRIANGLES AROUND STATION DOT
function draw_triangles(array, stations, longlat, start_boolean) {

    g.selectAll('polygon').remove();

    var stationNameID = d3.map(stations, function(d){return d.id;});

    //var z = Math.floor(Math.random() * (stations.length-1));
    var station = albersProjection(longlat); //"stations" is object
    

    g.selectAll('polygon')
        .data( array )
        .enter()
        .append('polygon')
        .attr("points", function (d) {
            return tri.map(function (e) {
                return [(e.x), (e.y)].join(",");
            })
                .join(" ");
        })
        .attr('transform', function (d) {
            var where = stationNameID.get(d.key).lngLat
            var xy = albersProjection(where);
            var slope1 = (station[0] - xy[0]) / (xy[1] - station[1]) // station = albersprojection[lng, lat]
            //var atan = Math.atan( (slope) )

            var quad_shift, angle;
            if (station[0] < xy[0] && station[1] < xy[1]) {
                angle = Math.atan(slope1);
                quad_shift = angle;
                //console.log(angle*180/Math.PI+' is angle in quad 2');
            }
            else if (station[0] > xy[0] && station[1] < xy[1]) {
                angle = Math.atan((slope1));
                quad_shift = angle;
                //console.log(angle*180/Math.PI+' is angle in quad 3');
            }
            else if (station[0] < xy[0] && station[1] > xy[1]) {
                angle = Math.atan((slope1));
                quad_shift = Math.PI + angle;
                //console.log(angle*180/Math.PI+' is angle in quad 1');
            }
            else if (station[0] > xy[0] && station[1] > xy[1]) {
                angle = Math.atan((xy[1] - station[1]) / (station[0] - xy[0]));
                quad_shift = (Math.PI / 2) + (Math.PI - angle) + Math.PI;
                //console.log(angle*180/Math.PI+' is angle in quad 4');
            }
            else {
                console.log('didnt work');
            }
            var degrees = quad_shift * 180 / (Math.PI)

            //console.log(d.id+', '+slope+', '+atan+', '+rot_ex()+', '+degr);
            if (start_boolean==false) {
                console.log('ending at')
                return 'translate(' + xy[0] + ', ' + xy[1] + ') rotate (' + degrees + ')'
            } else if (start_boolean==true) {
                console.log('starting at')
                return 'translate(' + station[0] + ', ' + station[1] + ') rotate (' + degrees + ')'
            } else { console.log('return didnt happen') }
        })
        .attr("stroke", "#F16521")
        .attr("stroke-width", rad / 2);


} //end draw triangles

// CLICK TO GET INFO ON STATION
// now assign this console log to a global variable
//

function set_station_num (d) {

    var stationid = d.id;
    //console.log(stationid);

    d3.select(".station").node().value = stationid; //!!!

    dispatcherStation.getstationid(stationid);

    //highlight station dot
    d3.selectAll('.station_dot').style('fill', 'rgb(80,80,80)').style('opacity',.4);
    d3.select(this).style('fill', 'rgb(80,80,80)').style('opacity',1);

}


//
// ZOOMING AND CLICKING FUNCTIONS OF MAP
// click area to zoom in on it
//

var sc_rad = function scaleradius () {

    if (zoomed == true){
        radius = 5;
        return radius
    }
    if (zoomed == false){
        radius = 2;
        return radius
    }

}

function clicked(d) {
    //console.log(x+', '+y+', '+k)
    var x, y, k;

    if (d && centered !== d) {
        var centroid = geoPath.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 3.5;
        zoomed = true;
        centered = d;
    } else {
        x = width / 2;
        y = height / 2;
        k = 1;
        zoomed = false;
        centered = null;
    }

    //console.log(x+', '+y+', '+k)

    g.selectAll(".neighborhoods")
        .classed("active", centered && function(d) { return d === centered; });

    g.selectAll('.station_dot')
        .transition()
        .duration(550)
        .attr('r', function() {
            if(k == 1) {return rad}
            else { return rad*k/2 } })
        .attr('stroke-width', function(){
            if(k == 1) {return rad/2}
            else { return rad*k/2 } });


    g.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    //.style("stroke-width", 1.5 / k + "px");
}



/*-------------------------- Parse data -----------------------*/
function parse(d){
    if(+d.duration<0) return;

    return {
        duration: +d.duration,
        startTime: parseDate(d.start_date),
        endTime: parseDate(d.end_date),
        startStation: d.strt_statn,
        endStation: d.end_statn,
        startTimeT: parseTime(d.start_date)
    }
}

function parseDate(date){
    var day = date.split(' ')[0].split('/'),
        time = date.split(' ')[1].split(':');

    return new Date(+day[2],+day[0]-1, +day[1], +time[0], +time[1]);
}

function parseTime(t){
    var time = t.split(' ')[1].split(':');

    return new Date(0, 0, 0, +time[0], +time[1]);
}

function parseStations(s){

    d3.select('.station')
            .append('option')
            .html(s.station)
            .attr('value', +s.id);

    return {
        id: s.id,
        fullName: s.station,
        lngLat: [+s.lng, +s.lat]
    };
}
