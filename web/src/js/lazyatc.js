const LAZYATC_INVALID_ROUTE = "Invalid Route";
const LAZYATC_NON_STANDARD_ALTITUDE = "Non-Standard Altitude";
const LAZYATC_INVALID_ROUTE_TEMPLATE = "Hi, your planned route seems to be invalid. Can you accept amended routing via {route}?";
const LAZYATC_NON_STANDARD_ALTITUDE_TEMPLATE = "Hi, your altitude is non-standard. I can offer you either {fl1} or {fl2}.";

$(document).ready(function() {
    lazyAtcUpdateMode();

    $("#lazyatc-dept").on("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            $("#lazyatc-dest").focus();
        }
    });

    $("#lazyatc-dest").on("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            lazyAtcFetchRoutes();
        }
    });

    $("#lazyatc-route-list").on("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            lazyAtcGenerateAndCopy();
        }
    });

    $("#lazyatc-override").on("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            lazyAtcGenerateAndCopy();
        }
    });

    $("#lazyatc-filed-fl").on("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            lazyAtcGenerateAndCopy();
        }
    });
});

function lazyAtcGetMode() {
    return $('input[name="lazyatc-mode"]:checked').val();
}

function lazyAtcUpdateMode() {
    const mode = lazyAtcGetMode();

    if (mode === LAZYATC_INVALID_ROUTE) {
        $("#lazyatc-route-section").show();
        $("#lazyatc-altitude-section").hide();
    } else {
        $("#lazyatc-route-section").hide();
        $("#lazyatc-altitude-section").show();
    }
}

async function lazyAtcFetchRoutes() {
    const dept = $("#lazyatc-dept").val().trim().toUpperCase();
    const dest = $("#lazyatc-dest").val().trim().toUpperCase();
    const routeList = $("#lazyatc-route-list");
    routeList.empty();

    if (!dept || !dest) {
        alert("Please enter both departure and destination airports.");
        return;
    }

    try {
        const response = await fetch("https://api.pilotassist.dev/routes?dept=" + encodeURIComponent(dept) + "&dest=" + encodeURIComponent(dest));
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            alert("No routes found for that city pair.");
            return;
        }

        for (let i = 0; i < data.routes.length; i++) {
            const route = data.routes[i];
            const option = $("<option></option>");
            option.val(route.route);
            option.text((route.acft || "Any") + " | " + route.route);
            routeList.append(option);
        }
    } catch (err) {
        alert("Error fetching routes: " + err.message);
    }
}

function lazyAtcGenerateAndCopy() {
    const mode = lazyAtcGetMode();
    let message = "";

    if (mode === LAZYATC_INVALID_ROUTE) {
        const overrideRoute = $("#lazyatc-override").val().trim();
        const selectedRoute = $("#lazyatc-route-list").val();
        const route = overrideRoute || selectedRoute;

        if (!route) {
            alert("Please select or enter a route.");
            return;
        }

        message = LAZYATC_INVALID_ROUTE_TEMPLATE.replace("{route}", route);
    } else if (mode === LAZYATC_NON_STANDARD_ALTITUDE) {
        const filedFlightLevel = parseInt($("#lazyatc-filed-fl").val());

        if (isNaN(filedFlightLevel)) {
            alert("Please enter a valid flight level.");
            return;
        }

        const lowerFlightLevel = "FL" + String(Math.max(filedFlightLevel - 10, 0)).padStart(3, "0");
        const upperFlightLevel = "FL" + String(filedFlightLevel + 10).padStart(3, "0");
        message = LAZYATC_NON_STANDARD_ALTITUDE_TEMPLATE
            .replace("{fl1}", lowerFlightLevel)
            .replace("{fl2}", upperFlightLevel);
    }

    $("#lazyatc-output").text(message);
    lazyAtcCopyToClipboard(message);
    alert("Message generated and copied!");
}

function lazyAtcCopyToClipboard(textToCopy) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy);
        return;
    }

    const tempTextArea = $("<textarea></textarea>");
    tempTextArea.val(textToCopy).appendTo("body");
    tempTextArea[0].focus();
    tempTextArea[0].select();
    document.execCommand("copy");
    tempTextArea.remove();
}
