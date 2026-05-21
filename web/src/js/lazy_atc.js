function lazyAtcUpdateMode() {
    var mode = document.getElementById("lazyatc-mode").value;
    document.getElementById("lazyatc-route-section").style.display =
        mode === "invalid_route" ? "block" : "none";
    document.getElementById("lazyatc-altitude-section").style.display =
        mode === "non_standard_altitude" ? "block" : "none";
}

function lazyAtcFetchRoutes() {
    var dept = document.getElementById("lazyatc-dept").value.trim().toUpperCase();
    var dest = document.getElementById("lazyatc-dest").value.trim().toUpperCase();
    var list = document.getElementById("lazyatc-route-list");
    list.innerHTML = "";

    if (!dept || !dest) {
        alert("Please enter both departure and destination airports.");
        return;
    }

    fetch("https://api.pilotassist.dev/routes?dept=" + dept + "&dest=" + dest)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            data.routes.forEach(function(r) {
                var option = document.createElement("option");
                option.value = r.route;
                option.textContent = (r.acft || "Any") + " | " + r.route;
                list.appendChild(option);
            });
        })
        .catch(function(err) {
            alert("Error fetching routes: " + err.message);
        });
}

function lazyAtcGenerate() {
    var mode = document.getElementById("lazyatc-mode").value;
    var message = "";

    if (mode === "invalid_route") {
        var override = document.getElementById("lazyatc-override").value.trim();
        var selected = document.getElementById("lazyatc-route-list").value;
        var route = override || selected;
        if (!route) {
            alert("Please select or enter a route.");
            return;
        }
        message = "Hi, your planned route seems to be invalid. Can you accept amended routing via " + route + "?";
    } else if (mode === "non_standard_altitude") {
        var filed = parseInt(document.getElementById("lazyatc-filed-fl").value);
        if (isNaN(filed)) {
            alert("Please enter a valid flight level.");
            return;
        }
        var fl1 = "FL" + String(filed - 10).padStart(3, "0");
        var fl2 = "FL" + String(filed + 10).padStart(3, "0");
        message = "Hi, your altitude is non-standard. I can offer you either " + fl1 + " or " + fl2 + ".";
    }

    document.getElementById("lazyatc-output").innerText = message;

    var temp = document.createElement("textarea");
    temp.value = message;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
}
