/**
 * Created by yangmuhe on 3/23/16.
 */
d3.StationChart = function(){

    var w = 800,
        h = 600,
        m = {t:0, r:0, b:0, l:0},
        chartW = w - m.l - m.r,
        chartH = h - m.t - m.b,
        barWidth = 10,
        padding = 2,
        //bins = 5,
        //range = [0, 100],
        scaleX = d3.scale.ordinal(),
        scaleY = d3.scale.linear(),
        axisFlag = true,
        axisX = d3.svg.axis().orient('bottom').ticks(10),
        axisY = d3.svg.axis().orient('left').ticks(5),
        dataRange,
        //layout = d3.layout.histogram(),
        valueAccessor = function(d){return d;};

    var exports = function (_selection) {
        //recalculate width, height, scales, layout if updated
        //chartW = w - m.l - m.r;
        chartH = h - m.t - m.b;

        //layout.value(valueAccessor)
        //    .range(range)
        //    .bins(bins);

        _selection.each(draw);
    }


    function draw (array){
        //var histData = layout(array);

        chartW = (barWidth + padding)*(array.length - 1) + barWidth ;
        var maxY = d3.max(array, function(d){return d.values;});
        //scaleX.domain(dataRange || d3.extent(array)); //??
        scaleY.domain([0, maxY]).range([chartH,0]);

        //var xValues = array.map(function(d){return d.key});
        //xValues = d3.set(xValues).values();

        scaleX.domain(array.map(function(d){return d.key}))  //d3.map!!
            .rangeRoundBands([0,chartW], 0.1);

        var svg = d3.select(this).selectAll('svg').data([array]);  //"this" is plot
        var svgEnter = svg.enter().append('svg').attr('width',w).attr('height',h);
        svgEnter.append('g').attr('transform','translate('+ m.l+','+m.t+')')
            .attr('class','axis axis-y');
        svgEnter.append('g').attr('transform','translate('+ m.l+','+ m.t+')')
            .attr('class','chart');
        svgEnter.append('g')//.attr('transform','translate('+ m.l+','+m.t+')')
            .attr('class','label');

        //barWidth = ( chartW - (array.length-1)*padding )/array.length;
        //padding = (chartW - barWidth * array.length) / (array.length - 1);

        //draw bar chart
        var bar = svg.select('.chart')
            .selectAll('.bar')
            .data(array, function(d){return d.key;});

        bar.enter().append('rect').attr('class','bar');

        bar.exit().remove();

        bar.transition()
            .attr('x', function(d,i){ return i*(barWidth + padding);})
            .attr('y',function(d){return scaleY(d.values);})
            .attr('height',function(d){return chartH - scaleY(d.values);})
            .attr('width', scaleX.rangeBand());

        //bar.append('text').attr('class','label')
        //    //.attr('x', scaleX.rangeBand()/2)
        //    .attr('x', function(d,i){ return i*(barWidth + padding);})
        //    .attr('y', chartH + m.t + 5)
        //    //.attr("dx", ".35em")
        //    //.attr("text-anchor", "middle")
        //    .text(function(d){ return d.key });



        //add labels on x-axis
        var labelX = svg.select('.label')
            .selectAll('.label-x')
            .data(array)

        labelX.enter().append('text')
            .attr('class', 'label-x')

        labelX.exit().remove();

        labelX.transition()
            .attr('x', function(d,i){ return i*(barWidth + padding)+ m.l +barWidth/2;})
            .attr('y', chartH+ m.t + 10)
            .attr("text-anchor", "middle")
            .text(function(d){ return d.key })




        axisX.scale(scaleX).tickSize(0)
            //.tickFormat()
            //.tickValues([1,2,3,4,5,6,7,8,9,10]);
        axisY.scale(scaleY).innerTickSize(-chartW);

        //draw axes
        if(axisFlag==true){
            //svg.select('.axis-x').transition().call(axisX);
            svg.select('.axis-y').transition().call(axisY);
        }else{
            svg.select('.axis-x').empty();  //empty it if there is anything
            svg.select('.axis-y').empty();
        }



    }


    //Getter and setter
    exports.width = function(_x){
        if(!arguments.length) return w;
        w = _x;
        return this;
    };
    exports.height = function(_x){
        if(!arguments.length) return h;
        h = _x;
        return this;
    };
    exports.margin = function(_m){
        if(!arguments.length) return [m.t, m.r, m.b, m.l];
        m.t = _m[0];m.r = _m[1];m.b = _m[2];m.l = _m[3];
        return this;
    };
    exports.padding = function(_x){
        if(!arguments.length) return padding;
        padding = _x;
        return this;
    };
    exports.barWidth = function(_x){
        if(!arguments.length) return barWidth;
        barWidth = _x;
        return this;
    };
    //exports.bins = function(_bins){
    //    if(!arguments.length) return layout.bins();
    //    layout.bins(_bins);
    //    return this;
    //};
    //exports.range = function(_range){
    //    if(!arguments.length) return layout.range();
    //    dataRange = _range;
    //    layout.range(_range);
    //    return this;
    //};
    //exports.value = function(_v){
    //    //type of _v --> value accessor function
    //    if(!arguments.length) return valueAccessor;
    //    valueAccessor = _v;
    //    return this;
    //};
    exports.applyAxis = function(_a){
        //type of _a is a boolean
        if(!arguments.length) return axisFlag;
        axisFlag = _a;
        return this;
    };

    return exports;

}
