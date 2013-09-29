var count = 0;
navigator.geolocation.watchPosition(function (position) {
    count += 1;
    $('p').text("Position updated " + count);
    $.ajax('/updatePosition', { method: "POST", data: JSON.stringify(position) });
}, function (error) {
    alert(JSON.stringify(error));
}, { enableHighAccuracy: true });

