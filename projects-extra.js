// Additional Landscapes of History projects
projects.lighthouse = {
    name: 'Lighthouses',
    file: 'data/lighthouses.geojson',
    icon: mkIcon('icons/lighthouses.png')
};

projects.geoglyph = {
    name: 'Geoglyphs',
    file: 'data/geoglyphs.geojson',
    icon: mkIcon('icons/geoglyphs.png')
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