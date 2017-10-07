require('jquery');
const ipc = require('electron').ipcRenderer;

var elo = "PLATINUM";
var region = "NA";
var regions = ["NA", "EUNE", "EUW", "KR"];
var riotApiKey = null;
var championGGApiKey = null;
var staticData = {};
var championGGData = {};

$(document).ready(function() {
    $("#championTable").DataTable({
        "columns": [
            null,
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]}
        ], "select": true
    });

    $("#championTable tbody").on("click", "tr", function() {
        championClicked(this);
    });

    $(".developer").each(function() {
        $(this).on("click", function() {
            console.log("Clicked: " + $(this).text());
            loadPage($(this).text());
        });
    });

    // $("#devAvery").on("click", function() {
    //     loadPage("devAvery");
    // });

    // $("#devKirk").on("click", function() {
    //     loadPage("devKirk");
    // });

    loadRegionsIntoList();
    loadApiKeys();
});

function loadApiKeys() {
    console.log("Retrieving api keys...");
    $.getJSON("apiKeys.json", function(json) {
        console.log("Retrieved api keys");
        riotApiKey = json["riot"];
        championGGApiKey = json["championGG"];
        getStaticData();
    });
}

function updateChampionTable() {
    var table = $("#championTable").DataTable();
    table.clear();
    for (champion in championGGData) {
        console.log("Adding champion: " + champion);
        var championData = getDataForChampion(champion);
        table.row.add(championData).order([4, 'desc']).draw();
    }
}

function getStaticData() {
    console.log("Retrieving static data...");
    var url = "https://na1.api.riotgames.com/lol/static-data/v3/champions?locale=en_US&tags=info&dataById=false&api_key=" + riotApiKey;
    $.get(url, function(data) {
        console.log("Retrieved static data");
        staticData = data;
        getChampionGGData();
    });
}

function getChampionGGData() {
    console.log("Retrieving data from ChampionGG...");
    var url = "http://api.champion.gg/v2/champions?elo=" + elo + "&limit=200&api_key=" + championGGApiKey;
    if (elo == "PLATINUM+") {
        url.replace("elo=PLATINUM+&", "");
    }
    $.get(url, function(data) {
        console.log("Retrieved data from ChampionGG");
        prepareChampionGGData(data);
        updateChampionTable();
    });
}

function prepareChampionGGData(data) {
    for (champion in staticData.data) {
        console.log("Retrieving stats for " + champion + " (id " + staticData.data[champion].id + ")");
        for (i in data) {
            if (staticData.data[champion].id == data[i].championId) {
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
    return [staticData.data[champion].name,
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

    loadPage('newChampionDetailWindow', championId, championName);
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
        }
        else {
            $("#selectedRegion").text(regions[i]);
        }
    }
}

function loadPage(page, param1, param2) {
    console.log("Sending load page event: " + page);
    ipc.send(page, param1, param2);
}