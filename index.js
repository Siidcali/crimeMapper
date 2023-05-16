var points = null;
var barGraph = '';
// Instantiaze the mao
var map = L.map('map').setView([52.505, -0.99], 8);

// Add the osm and google hybrid basemap layer
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var google_hybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
	maxZoom: 20,
	subdomains:['mt0','mt1','mt2','mt3']
});

// Create the layer control
var baseMaps = {
	"OpenStreetMap": osm,
	"Google Hybrid": google_hybrid
};

//var layerControl = L.control.activeLayers(baseMaps, null).addTo(map);
var layerControl = L.control.layers(baseMaps, null).addTo(map);

// Function to fetch data from the API and call function to add date onto the map
async function fetchAsync (url) {
	let response = await fetch(url);
	let data = await response.json();

	addPoints(data);
	return data;
}

// Function to get the date from HTML form and send API request
function getData(){
	// Get values from form
	coords = document.getElementById('coords').value;
	date = document.getElementById('dateRange').value;

	// Check for empty values and then send the API call
	if (coords !== '' && date !== ''){
		data = fetchAsync('https://data.police.uk/api/crimes-street/all-crime?lat=' + mvf
							coords.split(',')[0].trim() + 
	   	 					'&lng= ' + coords.split(',')[1].trim() + 
	   	 					'&' + 5
	}else{
		alert('Please fill in the form fields');
		}
			
}


// Function to get the coordinates when clicked on the map
map.on('click', function(ev){
	var latlng = map.mouseEventToLatLng(ev.originalEvent);

	var coords_input = document.getElementById('coords');
	coords_input.value = (String(latlng.lat) + ', ' + String(latlng.lng));
});

// Function to add data to the map
function addPoints(data){
	// Check if the API returned any data or not
	if (data.length <= 0 ){
		alert ('Could not find any data for this query, change the parameters and try again!')
		returns
	}

	// Remove previous points if there are any
	map.eachLayer(function (layer) {
	    if (typeof layer['_url'] === "undefined") {
	        map.removeLayer(layer);
	        layerControl.removeLayer(layer);
	    }
    })

	var points_pre = [];
	// Create a list of data points by using the L.marker
	for (let i = 0; i < data.length; i++) {
		popup_text = '<span><b>Category: </b></span> ' + data[i]['category'] + '<br>' + 
					 '<b>Location Type: </b> ' + data[i]['location_type'];

		points_pre.push(L.marker([data[i]['location']['latitude'], data[i]['location']['longitude']]).bindPopup(popup_text));
	}

	// Create a feature group from the list
	var points = L.featureGroup(points_pre).addTo(map);

	// Zoom the map to the points
	map.fitBounds(points.getBounds());

	// Add the layer to layer control
	layerControl.addOverlay(points, "Crimes");

	// Call function to create graph
	createGraph(data);
}

// Function to find the distince categories and their count to create a bar graph
function findOcc(arr, key){
	let arr2 = [];
	        
	arr.forEach((x)=>{
	        
	   	if(arr2.some((val)=>{ return val[key] == x[key] })){
	           
	        arr2.forEach((k)=>{
	            if(k[key] === x[key]){ 
	            k["occurrence"]++
	            }
	        })
	             
	    }else{
	        let a = {}
	        a[key] = x[key]
	        a["occurrence"] = 1
	        arr2.push(a);
	    }
	})
	        
	return arr2
}

// Get a random color to fill in the bar graphs
function getRandomColor() {
	var letters = '0123456789ABCDEF'.split('');
	var color = '#';
	    
	for (var i = 0; i < 6; i++ ) {
	    color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

// Function to create a graph
function createGraph(data){

	// Delete previous chart canvas so it always creates a new one for new chart
	document.getElementById("chartContainer").innerHTML = '&nbsp;';
	document.getElementById("chartContainer").innerHTML = '<canvas id="chart"></canvas>';

	// Call function to get distinct categories and count of each
	var graph_data = findOcc(data, 'category')

	// Append values to a list to be displayed on the chart
	xValues = [];
	yValues = [];
	barColors = [];
	for(let i = 0; i < graph_data.length; i++){
		xValues.push(graph_data[i]['category']);
		yValues.push(graph_data[i]['occurrence'])
		barColors.push(getRandomColor());
	}

	// Create the chart
	var ctx = document.getElementById("chart").getContext("2d");
	var barGraph = new Chart(ctx, {
		type: "bar",
		data: {
		    labels: xValues,
		    datasets: [{
		      	backgroundColor: barColors,
		      	data: yValues
		    }]
		},
		options: {
		  	legend: {
		        display: false
		    },

		  	scales:{
            	x: {
            		title: {
            			display: true,
            			text: 'Crime Type'
            		}
            		,
                	ticks: {
		                display: false
		            }
            	}
        	},
		  	responsive: true,
			maintainAspectRatio: false
		}
	});
}

// Add listener to toggle side panel to display or not
document.querySelector(".side-panel-toggle").addEventListener('click', () => {
	document.querySelector(".wrapper").classList.toggle("side-panel-open");
})y