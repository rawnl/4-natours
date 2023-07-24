export const displayMap = (locations) => {
    var map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/7ee1218e-447f-478d-bc13-c9d96eec3265/style.json?key=Jrlz1iNQ4PQwTgqz3zK5', // 'https://demotiles.maplibre.org/style.json', // 'https://api.maptiler.com/maps/7ee1218e-447f-478d-bc13-c9d96eec3265/style.json?key=Jrlz1iNQ4PQwTgqz3zK5', // stylesheet location
        scrollZoom: false,
        center: [0, 0],
        // center: [30, 45], // starting position [lng, lat]
        // zoom: 1, // starting zoom
        // interactive: false,
    });

    const bounds = new maplibregl.LngLatBounds();

    locations.forEach((loc) => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new maplibregl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new maplibregl.Popup({
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        // Extend map bounds to include the current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            right: 100,
            left: 100,
        },
    });
};
