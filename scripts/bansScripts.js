const bypassStaticData = false;
const bypassChampionGGData = false;
var elo = "PLATINUM";
var region = "NA";
var regions = ["NA", "EUNE", "EUW", "KR"];
var riotApiKey = null;
var championGGApiKey = null;
var staticData = {};
var version = null;
var championGGData = {};
var browseHistory = [];

$(document).ready(function() {
    browseHistory = localStorage.getItem("history");
    var historyPage = browseHistory.slice(-1)[0];
    console.log("Loaded page: " + historyPage);
    $("#championTable").DataTable({
        "columns": [
            null,
            { "orderSequence": ["desc", "asc"] },
            { "orderSequence": ["desc", "asc"] },
            { "orderSequence": ["desc", "asc"] },
            { "orderSequence": ["desc", "asc"] }
        ],
        "select": true
    });

    $("#championTable tbody").on("click", "tr", function() {
        championClicked(this);
    });

    loadApiKeys();
});

function loadApiKeys() {
    console.log("Retrieving api keys...");
    var url = "https://avery-vine-server.herokuapp.com/apikeys";
    $.get(url, function(data, status) {
        console.log("Retrieved api keys");
        riotApiKey = data["riot"];
        championGGApiKey = data["championGG"];
        getVersion();
    }).fail(function(error) {
        console.error("Could not get api keys.");
    });
}

function updateChampionTable() {
    var table = $("#championTable").DataTable();
    table.clear();
    $("#loadingText").hide();
    for (champion in championGGData) {
        console.log("Adding champion: " + champion);
        var championData = getDataForChampion(champion);
        table.row.add(championData).order([4, 'desc']).draw();
    }
}

function updatePatch(patchData, riotPatch) {
    $("#patchData", window.parent.document).text(patchData);
    if (riotPatch != undefined) {
        riotPatch = riotPatch.substring(0, riotPatch.lastIndexOf("."));
    }
    $("#riotPatch", window.parent.document).text(riotPatch);
}

function getVersion() {
    console.log("Getting LoL version...");
    var url = "https://ddragon.leagueoflegends.com/api/versions.json";
    $.get(url, function(data) {
        console.log("Retrieved version data");
        version = data[0];
        parent.version = version;
        console.log(version);
        getChampions();
    }).fail(function(error) {
        console.error("Could not query for LoL version:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
        $("#loadingText").html("<h2 id='loadingText'>Something went wrong!</h2>");
    });
}

function getChampions() {
    if (bypassStaticData) {
        getChampionGGData();
    }
    else {
        console.log("Retrieving champion data...");
        var url = "https://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json";
        $.get(url, function(data, status) {
            console.log("Retrieved champion data");
            champions = data.data;
            parent.champions = champions;
            console.log(champions);
            getChampionGGData();
        }).fail(function(error) {
            console.error("Could not query for champion data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
            $("#loadingText").html("<h2 id='loadingText'>Something went wrong!</h2>");
        });
    }
}

function getChampionGGData() {
    if (bypassChampionGGData) {
        updateChampionTable();
    }
    else {
        console.log("Retrieving data from ChampionGG...");
        var url = "http://api.champion.gg/v2/champions?elo=" + elo + "&limit=200&api_key=" + championGGApiKey;
        if (elo == "PLATINUM+") {
            url = url.replace("elo=PLATINUM+&", "");
        }
        $.get(url, function(data) {
            console.log("Retrieved data from ChampionGG");
            updatePatch(data[0].patch, version);
            prepareChampionGGData(data);
            updateChampionTable();
        }).fail(function(error) {
            console.error("Could not query for ChampionGG data:\n\nResponse: " + error.responseJSON.message + " (" + error.responseJSON.code + ")");
            $("#loadingText").html("<h2 id='loadingText'>Something went wrong!</h2>");
        });
    }

}

function prepareChampionGGData(data) {
    for (champion in champions) {
        console.log("Retrieving stats for " + champion + " (key " + champions[champion].key + ")");
        for (i in data) {
            if (champions[champion].key == data[i].championId) {
                championGGData[champion] = data[i];
                break;
            }
        }
    }
}

function getDataForChampion(champion) {
    var winRate = championGGData[champion].winRate;
    var playRate = championGGData[champion].playRate;
    var banRate = championGGData[champion].banRate;
    var banAdvantage = ((winRate - 0.5) * playRate / (1 - banRate));
    return [champions[champion].name,
        formatPercentage(winRate, 2),
        formatPercentage(playRate, 2),
        formatPercentage(banRate, 3),
        formatPercentage(banAdvantage, 5)
    ];
}

function formatPercentage(value, decimals) {
    return (value * 100).toFixed(decimals) + "%";
}

function updateElo(newElo) {
    console.log("Updating elo to: " + newElo);
    elo = newElo;
    getChampionGGData();
}

function championClicked(data) {
    var championNameFormatted = $("#championTable").DataTable().row(data).data()[0];
    var championId = 0;
    var championName = "";
    for (champion in staticData.data) {
        if (staticData.data[champion].name == championNameFormatted) {
            championId = staticData.data[champion].key;
            championName = champion;
            break;
        }
    }
    console.log("Champion clicked: " + championNameFormatted + " (" + championId + ")");

    loadExternalPage('newChampionDetailWindow', championId, championName);
}

function loadRegionsIntoList() {
    var dropdownList = $("#nonSelectedRegions");
    for (i in regions) {
        if (regions[i] != region) {
            var newRegion = $('<a class = "dropdown-item" href="#">' + regions[i] + '</a>');
            newRegion.click(function() {
                region = $(this).text();
                dropdownList.empty();
                loadRegionsIntoList();
            });
            dropdownList.append(newRegion);
        } else {
            $("#selectedRegion").text(regions[i]);
        }
    }
}

function loadPage(page, param1, param2, param3) {
    console.log("Storing params");
    localStorage.setItem("param1", param1);
    localStorage.setItem("param2", param2);
    localStorage.setItem("param3", param3);
    localStorage.setItem("history", browseHistory);
    console.log("Loading page: " + page);
    $("#contentView").attr("src", page);
    if (browseHistory[browseHistory.length - 1] != page) {
        browseHistory.push(page);
    }
    if (browseHistory.length > 1) {
        $("#backButton").show("slow", function() {});
    }
}

function loadExternalPage(page, param1, param2, param3) {
    console.log("Sending load external page event: " + page);
    remote.ipcRenderer.send(page, param1, param2, param3);
}
