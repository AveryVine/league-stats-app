require('jquery');
const remote = require('electron');

const bypassStaticData = false;
const bypassChampionGGData = false;
var elo = "PLATINUM";
var region = "NA";
var regions = ["NA", "EUNE", "EUW", "KR"];
var riotApiKey = null;
var championGGApiKey = null;
var staticData = {};
var championGGData = {};
var browseHistory = [];
var params = [];

$(document).ready(function() {
    $(".developer").each(function() {
        $(this).on("click", function() {
            console.log("Clicked: " + $(this).text());
            loadExternalPage("developer", $(this).text());
        });
    });

    $("#backButton").click(function() {
        browseHistory.pop();
        historyPage = browseHistory[browseHistory.length - 1];
        console.log("Loading page: " + historyPage);
        if (historyPage == "bans.html" && browseHistory.length == 1) {
            $("#backButton").hide("slow", function() {});
        }
        $("#contentView").attr("src", historyPage);
        return false;
    });

    $("#contentView").on('load', function() {
        var historyPage = browseHistory[browseHistory.length - 1];
        console.log("Loaded page: " + historyPage);
    
        if (historyPage == "bans.html") {
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
        }
    
        else if (historyPage == "summoner.html") {
            var params = top.getParams();
            $("#patchData").text(parms[0]);
        }
    });

    $("#summonerSearch").submit(function(e) {
        e.preventDefault();
        var summonerName = $("#summonerName").val();
        if (summonerName == null || summonerName == "") {
            console.log("Validation failed for summoner name: " + summonerName);
            // $("#summonerName").addClass("is-invalid");
            alert("Please enter a valid summoner name");
        }
        else {
            console.log("Searching for Summoner: " + summonerName);
            var formattedSummonerName = encodeURIComponent(summonerName);
            console.log(formattedSummonerName);
            var url = "https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/" + formattedSummonerName + "?api_key=" + riotApiKey;
            $.get(url, function(data) {
                console.log("Retrieved summoner: " + data.name + " (account id " + data.accountId + ")");
                loadPage("summoner.html", data.name, data.accountId);
            }).fail(function(error) {
                if (error.responseJSON.status.status_code == "404") {
                    console.log("Validation failed for summoner name: " + summonerName);
                    // $("#summonerName").addClass("is-invalid");
                    alert("Please enter a valid summoner name");
                }
                else {
                    alert("Could not query for static data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
                }
            });
        }
    });

    loadPage("bans.html");

    $( window ).resize(function() {
        updateContentViewDimensions();
    });
    updateContentViewDimensions();
    loadRegionsIntoList();
});

function updateContentViewDimensions() {
    $("#contentView").width($(window).width()).height($(window).height());
}

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

function updatePatch(patchData, riotPatch) {
    $("#patchData").text(patchData);
    if (riotPatch != undefined) {
        riotPatch = riotPatch.substring(0, riotPatch.lastIndexOf("."));
    }
    $("#riotPatch").text(riotPatch);
}

function getStaticData() {
    console.log("Retrieving static data...");
    var url = "https://na1.api.riotgames.com/lol/static-data/v3/champions?locale=en_US&tags=info&dataById=false&api_key=" + riotApiKey;
    $.get(url, function(data, status) {
        console.log("Retrieved static data");
        staticData = data;
        getChampionGGData();
    }).fail(function(error) {
        alert("Could not query for static data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
        if (bypassStaticData) {
            getChampionGGData();
        }
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
        updatePatch(data[0].patch, staticData.version);
        prepareChampionGGData(data);
        updateChampionTable();
    }).fail(function(error) {
        alert("Could not query for ChampionGG data:\n\nResponse: " + error.responseJSON.message + " (" + error.responseJSON.code + ")");
        if (bypassChampionGGData) {
            updateChampionTable();
        }
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

function loadPage(page, param1, param2) {
    console.log("Storing params");
    params.push(param1);
    params.push(param2);
    console.log("Loading page: " + page);
    $("#contentView").attr("src", page);
    browseHistory.push(page);
    if (browseHistory.length > 1) {
        $("#backButton").show("slow", function() {});
    }
}

function loadExternalPage(page, param1, param2) {
    console.log("Sending load external page event: " + page);
    remote.ipcRenderer.send(page, param1, param2);
}

function getParams() {
    return params;
}