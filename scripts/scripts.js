require('jquery');

var elo = "PLATINUM";
var ddragonData = {};
var championGGData = {};

$(document).ready(function() {
    $("#championTable").DataTable({
        "columns": [
            null,
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]},
            {"orderSequence": ["desc", "asc"]}]
    });
    getDDragonData();
});

function updateChampionTable() {
    var table = $("#championTable").DataTable();
    table.clear();
    for (champion in championGGData) {
        console.log("Adding champion: " + champion);
        var championData = getDataForChampion(champion);
        table.row.add(championData).order([4, 'desc']).draw();
        // table.row.add([ddragonData.data[champion].name, null, null, null, null]).draw();
    }
}

function getDDragonData() {
    if ($.isEmptyObject(ddragonData)) {
        console.log("Retrieving data from DDragon...");
        $.get("http://ddragon.leagueoflegends.com/cdn/6.24.1/data/en_US/champion.json", function(data) {
            console.log("Retrieved data from DDragon");
            ddragonData = data;
            getChampionGGData();
        });
    }
}

function getChampionGGData() {
    console.log("Retrieving data from ChampionGG...");
    $.get("http://api.champion.gg/v2/champions?elo=" + elo + "&limit=200&api_key=245e4f76b33c6b217115e7d14e7f00f2", function(data) {
        console.log("Retrieved data from ChampionGG");
        prepareChampionGGData(data);
        updateChampionTable();
    });
}

function prepareChampionGGData(data) {
    for (champion in ddragonData.data) {
        console.log("Retrieving stats for " + champion + " (id " + ddragonData.data[champion].key + ")");
        for (i in data) {
            if (ddragonData.data[champion].key == data[i].championId) {
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
    return [ddragonData.data[champion].name,
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
    console.log("Updating elo");
    if (newElo == "PLATINUM+") {
        elo = "PLATINUM,DIAMOND,MASTER,CHALLENGER"
    }
    else {
        elo = newElo;
    }
    getChampionGGData();
}