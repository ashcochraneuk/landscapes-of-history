// ============================================
// Landscapes of History
// Main Map Script
// ============================================


// -------------------------------------------------
// Create Map
// -------------------------------------------------

const map = L.map("map").setView([52.5, -1.5], 6);

const lohBasemap = L.tileLayer("basemap_tiles/{z}/{x}/{y}.png", {
    minZoom: 6,
    maxNativeZoom: 10,
    maxZoom: 18,
    attribution: "Landscapes of History"
}).addTo(map);

const osmBasemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
});




// -------------------------------------------------
// Map Style Switcher
// -------------------------------------------------

document.querySelectorAll('input[name="mapStyle"]').forEach(option => {

    option.addEventListener("change", function() {

        map.removeLayer(lohBasemap);
        map.removeLayer(osmBasemap);

        if (this.value === "osm") {
            osmBasemap.addTo(map);
        } else {
            lohBasemap.addTo(map);
        }

    });

});


// -------------------------------------------------
// Icons
// -------------------------------------------------

const icons = {

    martello: L.icon({
        iconUrl: "icons/martellotowers.png",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),

    water: L.icon({
        iconUrl: "icons/watertower.png",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    }),

    battlefield: L.icon({
        iconUrl: "icons/Battlefields.png",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    })

};


// -------------------------------------------------
// Storage
// -------------------------------------------------

const overlays = {};
const searchableLocations = [];


// -------------------------------------------------
// Popup Builder
// -------------------------------------------------

function buildPopup(properties) {

    let html = `<h3>${properties.Name || "Unknown Site"}</h3>`;

    if (properties.Town)
        html += `<b>Town:</b> ${properties.Town}<br>`;

    if (properties.County)
        html += `<b>County:</b> ${properties.County}<br>`;

    if (properties.Date)
        html += `<b>Date:</b> ${properties.Date}<br>`;

    if (properties.Description)
        html += `<br>${properties.Description}`;

    return html;

}


// -------------------------------------------------
// Load GeoJSON Layer
// -------------------------------------------------

function loadLayer(options) {

    fetch(options.file)

        .then(response => response.json())

        .then(data => {

            const layer = L.geoJSON(data, {

                pointToLayer: function(feature, latlng) {

                    return L.marker(latlng, {
                        icon: options.icon
                    });

                },

                onEachFeature: function(feature, layer) {

                    layer.bindPopup(
                        buildPopup(feature.properties)
                    );

                    searchableLocations.push({

                        town: (feature.properties.Town || "").toLowerCase(),

                        layer: layer

                    });

                }

            }).addTo(map);

            overlays[options.name] = layer;

            layerControl.addOverlay(layer, options.name);

        });

}



// -------------------------------------------------
// Layer Control
// -------------------------------------------------

const layerControl = L.control.layers(null, overlays).addTo(map);



// -------------------------------------------------
// Load Layers
// -------------------------------------------------

loadLayer({
    file: "data/martellos.geojson",
    name: "Martello Towers",
    icon: icons.martello
});

loadLayer({
    file: "data/water_towers.geojson",
    name: "Water Towers",
    icon: icons.water
});

loadLayer({
    file: "data/battlefields.geojson",
    name: "Battlefields",
    icon: icons.battlefield
});



// -------------------------------------------------
// Search
// -------------------------------------------------

document.getElementById("searchButton").addEventListener("click", searchTown);

document.getElementById("searchInput").addEventListener("keypress", function(e){

    if(e.key === "Enter")
        searchTown();

});



function searchTown(){

    const search = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if(search === "") return;

    let found = false;

    searchableLocations.forEach(location => {

        if(location.town === search){

            map.setView(location.layer.getLatLng(), 13);

            location.layer.openPopup();

            found = true;

        }

    });

    if(!found){

        alert("No locations found.");

    }

}

// -------------------------------------------------
// Project Cards
// -------------------------------------------------

document
    .getElementById("martelloCard")
    .classList.toggle("active");