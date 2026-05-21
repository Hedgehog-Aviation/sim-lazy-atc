function lazyAtcUpdateMode() {
    var mode = document.getElementById("lazyatc-mode").value;
    document.getElementById("lazyatc-route-section").style.display =
        mode === "invalid_route" ? "block" : "none";
    document.getElementById("lazyatc-altitude-section").style.display =
        mode === "non_standard_altitude" ? "block" : "none";
    document.getElementById("lazyatc-validate-section").style.display =
        mode === "validate_route" ? "block" : "none";
    document.getElementById("lazyatc-output").innerText = "\u00a0";
}

async function lazyAtcGetRoutes(dept, dest) {
    var res = await fetch(
        "https://api.pilotassist.dev/routes?dept=" + encodeURIComponent(dept) +
        "&dest=" + encodeURIComponent(dest),
        { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    return data.routes || [];
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

    lazyAtcGetRoutes(dept, dest)
        .then(function(routes) {
            if (!routes.length) {
                var opt = document.createElement("option");
                opt.textContent = "No routes found";
                list.appendChild(opt);
                return;
            }
            routes.forEach(function(r) {
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
        if (!route) { alert("Please select or enter a route."); return; }
        message = "Hi, your planned route seems to be invalid. Can you accept amended routing via " + route + "?";
    } else if (mode === "non_standard_altitude") {
        var filed = parseInt(document.getElementById("lazyatc-filed-fl").value);
        if (isNaN(filed)) { alert("Please enter a valid flight level."); return; }
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

async function lazyAtcValidateRoute() {
    var dept = document.getElementById("lazyatc-val-dept").value.trim().toUpperCase();
    var dest = document.getElementById("lazyatc-val-dest").value.trim().toUpperCase();
    var filedRoute = document.getElementById("lazyatc-val-route").value.trim().toUpperCase();
    var output = document.getElementById("lazyatc-output");

    if (!dept || !dest) { alert("Enter departure and destination."); return; }
    if (!filedRoute) { alert("Paste the pilot's route to check."); return; }

    output.innerText = "Checking...";

    var knownRoutes = [];
    try {
        knownRoutes = await lazyAtcGetRoutes(dept, dest);
    } catch (err) {
        output.innerText = "API Error: " + err.message;
        return;
    }

    if (!knownRoutes.length) {
        output.innerText = "No known routes found for " + dept + " to " + dest + ". Cannot validate.";
        return;
    }

    var filedFixes = filedRoute.replace(/DCT/g, " ").split(/\s+/).filter(Boolean);
    var bestMatch = null;
    var bestScore = -1;

    knownRoutes.forEach(function(r) {
        var knownFixes = r.route.replace(/DCT/g, " ").split(/\s+/).filter(Boolean);
        var matches = 0;
        filedFixes.forEach(function(f) { if (knownFixes.includes(f)) matches++; });
        var score = knownFixes.length > 0 ? matches / Math.max(knownFixes.length, filedFixes.length) : 0;
        if (score > bestScore) { bestScore = score; bestMatch = r; }
    });

    var pct = Math.round(bestScore * 100);
    var status = bestScore >= 0.6 ? "VALID" : bestScore >= 0.35 ? "PARTIAL MATCH" : "INVALID";
    var result = status + " (" + pct + "% match)";

    if (bestMatch) {
        result += "\nClosest known route: " + bestMatch.route;
    }

    output.innerText = result;
}