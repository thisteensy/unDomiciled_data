'use strict';


/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */




//Width and height of map
var width = 800;
var height = 500;

// D3 Projection
var projection = d3.geoAlbersUsa()
	.translate([width / 2, height / 2])    // translate to center of screen
	.scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
	.projection(projection);  // tell path generator to use albersUsa projection


// Define linear scale for output
var color = d3.scaleLinear()
	.range(["#fafa6e", "#c4ec74", "#92dc7e", "#64c987", "#39b48e", "#089f8f", "#00898a", "#08737f", "#215d6e", "#2a4858"])
	.domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

var legendText = ["91+ decile", "81-90 decile", "71-80 decile", "61-70 decile", "51-60 decile",
	"41-50 decile", "31-40 decile", "21-30 decile", "11-20 decile", "1-10 decile"];

var mapDiv =d3.select(".col-md-8")
	.append("div")
	.attr("class", "mapDiv")
	.attr("width", "900")
	.attr("height", "550");

//Create SVG element and append map to the SVG
var svg = d3.select(".mapDiv")
	.append("svg")
	// .attr("class", "map-svv")
	.attr("width", width)
	.attr("height", height)
	.style("position", "absolute");




// Append Div for tooltip to SVG
var div = d3.select(".mapDiv")
	.append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

var displayYear = d3.select(".mapDiv")
	.append("text")
	.attr("class", "displayYear")
	.style("color", "#2a4858")
	.style("font-size", "30px")





var years = [2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011]
var copyYears = []

Object.assign(copyYears, years)

renderMap(years.pop())

var mapInterval = setInterval(function () {
	if (years.length > 0) {
		renderMap(years.pop())
	}
}, 3000)

var restartButton = d3.selectAll(".mapDiv")
	.append("button")
	.text("Restart")
	.attr("class", "restart")
	.style("opacity", 0)
	.style("align", "right")
	.style("color", "#FFFFFF")
	.style("background-color", "#2a4858")
	.style("border-radius", "10px")
	.on("mouseover", function (d) {
		restartButton.style("color", "#2a4858")
			.style("background-color", "#FFFFFF")
			.style("cursor", "pointer")
	})
	.on("mouseout", function (d) {
		restartButton.transition()
			.duration(200)
			.style("color", "#FFFFFF")
			.style("background-color", "#2a4858")
	})
	.on("click", function () {
		Object.assign(years, copyYears)
		restartButton.style("opacity", 0)
		renderMap(years.pop())
		mapInterval = setInterval(function () {
			if (years.length > 0) {
				renderMap(years.pop())
			}
		}, 3000)
	})



function renderMap(year) {


	d3.json(`/load-data/${year}`).then(function (state_data) {
		console.log(year)
		if (years.length == 0) {
			console.log("CLEAR")
			clearInterval(mapInterval)
			restartButton.style("opacity", 1)
			console.log("BUTTON")

		}
		d3.json("/us-states.json").then(function (states_json) {



			// Loop through each state data value in the .csv file
			for (var i of state_data) {

				// Grab State ID
				var dataStateID = i[0]

				// Grab State Name
				var dataState = i[2]

				// Grab decile value 
				var dataValue = i[4]

				// Grab data year
				var dataYear = i[5]

				// Grab count per 100,000
				var dataCount = i[3]

				//***send all data to the front


				// Find the corresponding state inside the GeoJSON
				for (var j = 0; j < states_json.features.length; j++) {
					var jsonState = states_json.features[j].properties.name;

					if (dataState == jsonState) {

						// Copy the data value into the JSON
						//has only a key 'name'
						states_json.features[j].properties.decile = dataValue
						states_json.features[j].properties.count = dataCount
						// Stop looking through the JSON

						break;
					}
				}
			}
			function handleClick(path) {
				var state = path.properties.name
				window.location.href = `/state/${state}`;
			}

			displayYear.join(
				enter => enter.append("p")
					.text(`${year}`),
				update => update.text(`${year}`)
			)

			// // Bind the data to the SVG and create one path per GeoJSON feature
			svg.selectAll("path")
				.data(states_json.features)
				.join(
					enter => enter.append("path")
						.attr("d", path)
						.attr("id", "hover-text")
						.style("stroke", "#fff")
						.style("stroke-width", "1")
						.style("fill", function (f) {

							// Get data value

							var decile = f.properties.decile;

							if (decile) {
								//If value exists…
								return color(decile);
							}
						}),
					update => update.style("fill", function (f) {

						// Get data value

						var decile = f.properties.decile;
						if (decile) {
							//If value exists…
							return color(decile);
						}
					})
				)
				.on("click", handleClick)
				.on("mouseover", function (d) {
					var state = d.properties.name
					var count = d.properties.count

					div.transition()
						.duration(200)
						.style("opacity", .9);
					div.html(state + "<br/>" + count)
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px")
				})
				.on("mouseout", function (d) {
					div.transition()
						.duration(500)
						.style("opacity", 0);
				});
		});

	});

}



// Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
var legend = d3.select(".mapDiv").append("svg")
	.attr("class", "legend")
	.attr("width", 140)
	.attr("height", 200)
	.selectAll("g")
	.data(color.domain().slice().reverse())
	.enter()
	.append("g")
	.attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

legend.append("rect")
	.attr("width", 18)
	.attr("height", 18)
	.style("fill", color);

legend.append("text")
	.data(legendText)
	.attr("x", 24)
	.attr("y", 9)
	.attr("dy", ".35em")
	.text(function (d) { return d; });
