const bypassRiotChampionData = false;
const bypassChampionGGData = false;
let elo = "PLATINUM";
let roleFilter = "ALL";
let region = "NA";
let regions = ["NA", "EUNE", "EUW", "KR"];
let riotApiKey = null;
let championGGApiKey = null;
let version = null;
let championGGData = {};
let browseHistory = [];
let formattedRoles = {
    "TOP": "TOP",
    "JUNGLE": "JUNGLE",
    "MIDDLE": "MID",
    "DUO_CARRY": "BOT",
    "DUO_SUPPORT": "SUPPORT"
};

const remote = window.parent.require('electron');

$(document).ready(function () {
    browseHistory = localStorage.getItem("history");
    let historyPage = browseHistory.slice(-1)[0];
    console.log("Loaded page: " + historyPage);
    $("#championTable").DataTable({
        "columnDefs": [
            {
                "targets": [1],
                "searchable": false
            },
            {
                "targets": [5],
                "searchable": false,
                "visible": false
            }
        ]
    });
    $("#championTable tbody").on("click", "tr", function () {
        championClicked(this);
    });

    loadApiKeys();
});

function loadApiKeys() {
    console.log("Retrieving api keys...");
    let url = "https://avery-vine-server.herokuapp.com/apikeys";
    $.get(url, function (data) {
        console.log("Retrieved api keys");
        riotApiKey = data.riot;
        championGGApiKey = data.championGG;
        getVersion();
    }).fail(function (error) {
        console.error("Could not get api keys: " + error);
    });
}

function updateChampionTable() {
    let table = $("#championTable").DataTable();
    table.clear();
    $("#loadingText").hide();
    for (let champion in championGGData) {
        console.log("Adding champion: " + champion);
        let championData = getDataForChampion(champion);
        if (roleFilter === "ALL" || roleFilter === championData[5]) {
            table.row.add(championData).order([4, 'desc']);
        }
    }
    table.draw();
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
    let url = "https://ddragon.leagueoflegends.com/api/versions.json";
    $.get(url, function (data) {
        console.log("Retrieved version data");
        version = data[0];
        parent.version = version;
        console.log(version);
        getChampions();
    }).fail(function (error) {
        console.error("Could not query for LoL version:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
        $("#loadingText").html("<h2 id='loadingText'>Something went wrong! Try again later.</h2>");
    });
}

function getChampions() {
    if (bypassRiotChampionData) {
        getChampionGGData();
    } else {
        console.log("Retrieving champion data...");
        let url = "https://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json";
        $.get(url, function (data, status) {
            console.log("Retrieved champion data");
            champions = data.data;
            parent.champions = champions;
            console.log(champions);
            getChampionGGData();
        }).fail(function (error) {
            console.error("Could not query for champion data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
            $("#loadingText").html("<h2 id='loadingText'>Something went wrong! Try again later.</h2>");
        });
    }
}

function getChampionGGData() {
    if (bypassChampionGGData) {
        updateChampionTable();
    } else {
        console.log("Retrieving data from ChampionGG...");
        let url = "http://api.champion.gg/v2/champions?elo=" + elo + "&limit=200&api_key=" + championGGApiKey;
        if (elo == "PLATINUM+") {
            url = url.replace("elo=PLATINUM+&", "");
        }
        $.get(url, function (data) {
            console.log("Retrieved data from ChampionGG");
            updatePatch(data[0].patch, version);
            prepareChampionGGData(data);
            updateChampionTable();
        }).fail(function (error) {
            console.error("Could not query for ChampionGG data:\n\nResponse: " + error.responseJSON.message + " (" + error.responseJSON.code + ")");
            $("#loadingText").html("<h2 id='loadingText'>Something went wrong! Try again later.</h2>");
        });
    }

}

function prepareChampionGGData(data) {
    for (let champion in champions) {
        console.log("Retrieving stats for " + champion + " (key " + champions[champion].key + ")");
        for (let i in data) {
            if (champions[champion].key == data[i].championId) {
                championGGData[champion] = data[i];
                break;
            }
        }
    }
}

function getDataForChampion(champion) {
    let winRate = championGGData[champion].winRate;
    let playRate = championGGData[champion].playRate;
    let banRate = championGGData[champion].banRate;
    let banAdvantage = ((winRate - 0.5) * playRate / (1 - banRate));
    let role = championGGData[champion].role;
    return [champions[champion].name,
        formatPercentage(winRate, 2),
        formatPercentage(playRate, 2),
        formatPercentage(banRate, 2),
        formatPercentage(banAdvantage, 3),
        formattedRoles[role]
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

function updateFilter(newFilter) {
    console.log("Updating role filter to: " + newFilter);
    roleFilter = newFilter;
    updateChampionTable();

}

function championClicked(data) {
    let championNameFormatted = $("#championTable").DataTable().row(data).data()[0];
    let championId = 0;
    let championName = "";
    for (let champion in champions) {
        if (champions[champion].name == championNameFormatted) {
            championId = champions[champion].key;
            championName = champion;
            break;
        }
    }
    console.log("Champion clicked: " + championNameFormatted + " (" + championId + ")");

    loadExternalPage('newChampionDetailWindow', championId, championName);
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
        $("#backButton").show("slow", function () {});
    }
}

function loadExternalPage(page, param1, param2, param3) {
    console.log("Sending load external page event: " + page);
    remote.ipcRenderer.send(page, param1, param2, param3);
}
