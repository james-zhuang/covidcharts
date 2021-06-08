
// --------- GRAPHING ---------

/*
    Types: cases, contactTracers, deaths, {hospitalBeds}, {icuBeds}, negativeTests,
    newCases, newDeaths, positiveTests, vaccinationsCompleted, vaccinationsInitiated,
    vaccinesAdministered, vaccinesDistributed
    https://apidocs.covidactnow.org/data-definitions/
*/

function chart(data, type, title="Chart") {
    data = cleanData(data, type);
    let margin = {top: 25, right: 50, bottom: 50, left: 100},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Add SVG element
    let graph = d3.select("#dashboard")
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('class', 'd3Chart')
        .append("g").attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Add Title
    graph.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .attr("class", "d3-title")
        .text(title);

    //Add Scales and Axis
    let yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[type])])
        .range([height, 0]);

    let xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.date)))
        .range([0, width]);

    let xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%b '%y")).ticks(width/70);

    graph.append("g")
               .attr("transform", "translate(0," + height + ")")
               .call(xAxis);
    graph.append("g")
               .call(d3.axisLeft(yScale).tickFormat(function(value) {
                   if (Math.abs(value) >= 1000000000) value = (value/1000000000).toFixed(1) + 'B';
                   else if (Math.abs(value) >= 1000000) value = (value/1000000).toFixed(1) + 'M';
                   else if (Math.abs(value) >= 1000) value = (value/1000).toFixed(1) + 'K';
                   return value;}).ticks(height/40));

    // Gridlines
    let yGrid = d3.axisLeft()
        .scale(yScale)
        .tickFormat('')
        .ticks(6)
        .tickSizeInner(-width);

    graph.append('g')
        .attr('class', 'gridlines')
        .call(yGrid);

    // Chart line and area
    let area = d3.area()
        .x(d => xScale(new Date(d.date)))
        .y0(d => yScale(d[type]))
        .y1(height)
        .curve(d3.curveMonotoneX);

    let line = d3.line()
        .x(d => xScale(new Date(d.date)))
        .y(d => yScale(d[type]))
        .curve(d3.curveMonotoneX);

    graph.append("path")
        .attr("fill", "rgba(0, 140, 255, 0.3)")
        .attr("d", area(data));

    graph.append("path")
        .attr('fill', 'none')
        .attr("stroke", "rgb(0, 140, 255)")
        .attr("stroke-width", 1.5)
        .attr("d", line(data));
}

function camelToTitle(x) {
    let formatted = x.replace(/([A-Z]+)/g, " $1");
    return formatted[0].toUpperCase() + formatted.slice(1);
}

function cleanData(data, type) {
    return data.filter(d => d[type] !== undefined && d[type] !== null);
}

function interpret_location(loc) {
    let location = {};

    if (STATES_HASH[loc.toUpperCase()]) {
        location.type = 'state';
        location.name = loc.toUpperCase();
        location.canonical = STATES_HASH[loc.toUpperCase()];
        return location;
    }

    let all_loc = Object.keys(STATES).concat(Object.keys(COUNTIES));
    let match = stringSimilarity.findBestMatch(loc, all_loc);
    if (match.bestMatch.rating < 0.4) {
        location.type = 'country';
        location.name = 'US';
        location.canonical = 'US';
        return location;
    } else {
        match = match.bestMatch.target;
        if (STATES[match]) {
            location.type = 'state';
            location.name = STATES[match];
        } else if (COUNTIES[match]) {
            location.type = 'county';
            location.name =COUNTIES[match];
        } else {
            return "bad input 2";
        }
        location.canonical = match;
    }
    return location;
}

async function displayAll(loc) {
    let data = await pullData(loc.type, loc.name);
    let type = 'newCases';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'cases';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'newDeaths';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'deaths';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'vaccinationsInitiated';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'vaccinationsCompleted';
    chart(data.actualsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'caseDensity';
    chart(data.metricsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'icuCapacityRatio';
    chart(data.metricsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'infectionRate';
    chart(data.metricsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'testPositivityRatio';
    chart(data.metricsTimeseries.slice(0,-1), type, loc.canonical + ' ' + camelToTitle(type));

    type = 'vaccinesCompletedRatio';
    // chart(data.metricsTimeseries.slice(0,-1), type, STATES_HASH[loc] + ' ' + camelToTitle(type));

    type = 'vaccinesInitiatedRatio';
    // chart(data.metricsTimeseries.slice(0,-1), type, STATES_HASH[loc] + ' ' + camelToTitle(type));

    // let allData = await $.getJSON("https://api.covidactnow.org/v2/counties.json?apiKey=2d1ce11e569b4ce88093a12fff633afb");
    // let obj = '[';
    // allData.map(x => {
    //     obj += '"' + x.county + '", ';
    // })
    // obj += "]"
    // $("body").append(obj);
    // console.log(obj);
}

function convertFunc(text) {
    if (text === 'new_cases') return 'newCases';
    if (text === 'new_deaths') return 'newDeaths';
    if (text === 'vaccines_initiated') return 'vaccinationsInitiated';
    if (text === 'vaccines_completed') return 'vaccinationsCompleted';
    if (text === 'case_density') return 'caseDensity';
    if (text === 'icu_capacity') return 'icuCapacityRatio';
    if (text === 'infection_rate') return 'infectionRate';
    if (text === 'positivity_rate') return 'testPositivityRatio';
    return text;
}

async function interpretTT(code) {

    let func = convertFunc(code[7]);
    let text = code.slice(12,-3);

    let loc = '';
    text.map(x => loc += x + ' ');
    loc = interpret_location(loc);
    $('.status-msg').text(`Loading ${camelToTitle(func)} for ${loc.canonical}...`)
                    .css('visibility', 'visible');
    let data = await pullData(loc.type, loc.name);
    if (func === 'caseDensity' || func === 'icuCapacityRatio' || func === 'infectionRate' || func === 'testPositivityRatio')
        chart(data.metricsTimeseries.slice(0,-1), func, loc.canonical + ' ' + camelToTitle(func));
    else
        chart(data.actualsTimeseries.slice(0,-1), func, loc.canonical + ' ' + camelToTitle(func));
    $('.status-msg').text("_").css('visibility', 'hidden');
}

function sendMessage(text) {
    let urlEndpoint = "https://nlp-staging.almond.stanford.edu/@org.thingpedia.models.covid/en-US/query?"
    $.ajax({
        'url' : urlEndpoint,
        'type' : 'GET',
        'data' : {
            'q' : text
        },
        'success' : function(response) {
            if (response["candidates"][0]) {
                console.log(response);
                interpretTT(response['candidates'][0].code);
            } else {
                $('.status-msg').text("Sorry, I didn't understand that. Please try again.").css('visibility', 'visible');
                console.log(response);
            }
        },
        'error' : function(request, error)
        {
            console.log("Request: "+JSON.stringify(request));
        }
    })
}

// Main dashboard handling

$(function () {
    //Setup and initialization

    $('form').submit(function(e){
      e.preventDefault();
      let loc = $('#location').val();
      if (loc != "") {
          // displayAll(interpret_location(loc));
          sendMessage(loc);
          $('#location').val('');
      }
      return false;

    });

    $('#clear-dashboard').click(() => {console.log('clear'); $('#dashboard').empty();});

});
