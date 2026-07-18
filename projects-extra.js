// Additional Landscapes of History projects
projects.lighthouse = {
    name: 'Lighthouses',
    file: 'data/lighthouses_wgs84.geojson',
    icon: mkIcon('icons/Lighthouses(1).png')
};

projects.geoglyph = {
    name: 'Geoglyphs',
    file: 'data/geoglyphs_wgs84.geojson',
    icon: mkIcon('icons/Geoglyphs(1).png')
};

// Keep matching desktop and mobile controls visually in sync.
const baseActive = active;
active = function (key, on) {
    baseActive(key, on);

    document.querySelectorAll(`[data-project="${key}"]`).forEach(control => {
        control.classList.toggle('active', on);

        const state = control.querySelector('i');
        if (state) state.textContent = on ? '−' : '+';
    });
};

// Load the additional GeoJSON layers.
Promise.all([
    load('lighthouse'),
    load('geoglyph')
]);
