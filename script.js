const map = L.map('map', {
    minZoom: 6,
    maxZoom: 14
}).setView([52.5, -1.5], 6);

const loh = L.tileLayer(
    'https://pub-149594e32a1c4ec4905b3d4a1b7566d0.r2.dev/{z}/{x}/{y}.png',
    {
        minZoom: 6,
        maxNativeZoom: 14,
        maxZoom: 14,
        attribution: 'Landscapes of History'
    }
).addTo(map);

const satelliteBasemap = L.tileLayer(
    "https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=sHCKlBV643II0LBppv5O",
    {
        maxZoom: 20,
        attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
    }
);

const osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }
);

document
    .querySelectorAll('input[name="mapStyle"]')
    .forEach(x => {
        x.addEventListener('change', function () {
            map.removeLayer(loh);
            map.removeLayer(osm);
            map.removeLayer(satelliteBasemap);

            if (this.value === 'osm') {
                osm.addTo(map);
            } else if (this.value === 'satellite') {
                satelliteBasemap.addTo(map);
            } else {
                loh.addTo(map);
            }
        });
    });

const mkIcon = url =>
    L.icon({
        iconUrl: url,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10]
    });

const projects = {
    martello: {
        name: 'Martello Towers',
        file: 'data/martellos.geojson',
        icon: mkIcon('icons/martellotowers.png')
    },

    water: {
        name: 'Water Towers',
        file: 'data/water_towers.geojson',
        icon: mkIcon('icons/watertower.png')
    },

    battlefield: {
        name: 'Battlefields',
        file: 'data/battlefields.geojson',
        icon: mkIcon('icons/Battlefields.png')
    }
};

const locations = [];

const searchLayer = L.layerGroup();

const $ = id => document.getElementById(id);

const txt = v => (v ?? '').toString().trim();

const norm = v => txt(v).toLowerCase();

const esc = v =>
    txt(v)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

function popup(p) {
    let h = `<h3>${esc(p.Name || 'Unknown Site')}</h3>`;

    [
        ['Town', p.Town],
        ['Locality', p.Locality],
        ['Parish', p.Parish],
        ['County', p.County]
    ].forEach(([k, v]) => {
        if (txt(v)) {
            h += `<b>${k}:</b> ${esc(v)}<br>`;
        }
    });

    return h;
}

function active(key, on) {
    const p = projects[key];

    const card = document.querySelector(
        `[data-project="${key}"]`
    );

    if (!p.layer) return;

    if (on && !map.hasLayer(p.layer)) {
        p.layer.addTo(map);
    }

    if (!on && map.hasLayer(p.layer)) {
        map.removeLayer(p.layer);
    }

    card.classList.toggle('active', on);
}

function clearSearchMap() {
    searchLayer.clearLayers();

    if (map.hasLayer(searchLayer)) {
        map.removeLayer(searchLayer);
    }
}

function clearProjects() {
    Object.keys(projects).forEach(key => {
        active(key, false);
    });
}

function load(key) {
    const p = projects[key];

    return fetch(p.file)
        .then(r => {
            if (!r.ok) {
                throw Error(`Could not load ${p.file}`);
            }

            return r.json();
        })
        .then(data => {
            p.layer = L.geoJSON(data, {
                pointToLayer: (f, ll) =>
                    L.marker(ll, {
                        icon: p.icon
                    }),

                onEachFeature: (f, marker) => {
                    const x = f.properties || {};

                    const popupHTML = popup(x);

                    marker.bindPopup(popupHTML);

                    locations.push({
                        key,
                        project: p.name,
                        name: txt(x.Name),
                        town: txt(x.Town),
                        locality: txt(x.Locality),
                        parish: txt(x.Parish),
                        county: txt(x.County),
                        latlng: marker.getLatLng(),
                        popupHTML
                    });
                }
            });
        })
        .catch(console.error);
}

Promise.all(
    Object.keys(projects).map(load)
);

document
    .querySelectorAll('.projectCard')
    .forEach(card =>
        card.addEventListener('click', () => {
            const key = card.dataset.project;
            const p = projects[key];

            clearSearchMap();

            if (p.layer) {
                active(
                    key,
                    !map.hasLayer(p.layer)
                );
            }
        })
    );

const input = $('searchInput');
const results = $('searchResults');
const summary = $('searchSummary');
const tabs = $('searchTabs');

function clear() {
    results.innerHTML = '';
    tabs.innerHTML = '';
    summary.textContent = '';
}

function search() {
    const q = norm(input.value);

    clear();

    if (!q) return;

    const matches = locations.filter(x =>
        norm(x.name).includes(q) ||
        [
            x.town,
            x.locality,
            x.parish,
            x.county
        ].some(v => norm(v) === q)
    );

    if (!matches.length) {
        clearSearchMap();

        summary.textContent =
            `No locations found for “${input.value.trim()}”.`;

        return;
    }

    clearProjects();
    clearSearchMap();

    matches.forEach(x => {
        const marker = L.marker(
            x.latlng,
            {
                icon: projects[x.key].icon
            }
        );

        marker.bindPopup(x.popupHTML);

        marker.addTo(searchLayer);

        x.searchMarker = marker;
    });

    searchLayer.addTo(map);

    map.fitBounds(
        L.latLngBounds(
            matches.map(x => x.latlng)
        ),
        {
            padding: [45, 45],
            maxZoom: 14
        }
    );

    summary.textContent =
        `${matches.length} location` +
        `${matches.length === 1 ? '' : 's'} found for ` +
        `“${input.value.trim()}”`;

    function renderResults(items) {
        results.innerHTML = '';

        [...items]
            .sort((a, b) =>
                a.name.localeCompare(b.name)
            )
            .forEach(x => {
                const b = document.createElement('button');

                b.className = 'searchResult';

                const icon =
                    projects[x.key].icon.options.iconUrl;

                const place =
                    x.locality ||
                    x.town ||
                    x.parish ||
                    x.county;

                b.innerHTML = `
                    <img src="${icon}" alt="">
                    <span>
                        <strong>${esc(x.name)}</strong>
                        <small>
                            ${esc(place)} · ${esc(x.project)}
                        </small>
                    </span>
                `;

                b.onclick = () => {
                    map.flyTo(
                        x.latlng,
                        14,
                        {
                            duration: 0.8
                        }
                    );

                    x.searchMarker.openPopup();
                };

                results.appendChild(b);
            });
    }

    const projectKeys = [
        ...new Set(matches.map(x => x.key))
    ];

    if (projectKeys.length > 1) {
        const allTab = document.createElement('button');

        allTab.className = 'searchTab active';
        allTab.textContent = 'All';

        allTab.onclick = () => {
            document
                .querySelectorAll('.searchTab')
                .forEach(t => t.classList.remove('active'));

            allTab.classList.add('active');

            renderResults(matches);
        };

        tabs.appendChild(allTab);

        projectKeys.forEach(key => {
            const tab = document.createElement('button');

            tab.className = 'searchTab';
            tab.textContent = projects[key].name;

            tab.onclick = () => {
                document
                    .querySelectorAll('.searchTab')
                    .forEach(t => t.classList.remove('active'));

                tab.classList.add('active');

                renderResults(
                    matches.filter(x => x.key === key)
                );
            };

            tabs.appendChild(tab);
        });
    }

    renderResults(matches);
}

$('searchButton').onclick = search;

input.addEventListener(
    'keydown',
    e => {
        if (e.key === 'Enter') {
            search();
        }
    }
);

input.addEventListener(
    'input',
    () => {
        if (!input.value.trim()) {
            clear();
            clearSearchMap();
        }
    }
);