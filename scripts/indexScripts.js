require('jquery');
const remote = require('electron');

var elo = "PLATINUM";
var region = "NA";
var regions = ["NA", "EUNE", "EUW", "KR"];
var riotApiKey = null;
var championGGApiKey = null;
var staticData = {};
var championGGData = {};
var browseHistory = [];

$(document).ready(function() {
    $(".developer").each(function() {
        $(this).on("click", function() {
            console.log("Clicked: " + $(this).text());
            loadExternalPage("developer", $(this).text());
        });
    });

    $("#backButton").click(function() {
        browseHistory.pop();
        var historyPage = browseHistory.slice(-1)[0];
        console.log("Loading page: " + historyPage);
        if (historyPage == "bans.html" && browseHistory.length == 1) {
            $("#backButton").hide("slow", function() {});
        }
        $("#contentView").attr("src", historyPage);
        return false;
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
                loadPage("summoner.html", data.name, data.accountId, staticData);
            }).fail(function(error) {
                if (error.responseJSON.status.status_code == "404") {
                    console.log("Validation failed for summoner name: " + summonerName);
                    // $("#summonerName").addClass("is-invalid");
                    alert("Please enter a valid summoner name");
                }
                else {
                    console.error("Could not query for summoner data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
                }
            });
        }
    });

    $( window ).resize(function() {
        updateContentViewDimensions();
    });
    updateContentViewDimensions();
    loadRegionsIntoList();
    loadApiKeys();
});

function updateContentViewDimensions() {
    $("#contentView").width($(window).width()).height($(window).height());
}

function loadApiKeys() {
    console.log("Retrieving api keys...");
    var url = "http://www.averyvine.com/discordBot/keys";
    $.get(url, function(data, status) {
        console.log("Retrieved api keys");
        riotApiKey = data["riot"];
        championGGApiKey = data["championGG"];
        loadPage("bans.html");
    }).fail(function(error) {
        console.error("Could not get api keys.");
    });

    // console.log("Retrieving api keys...");
    // $.getJSON("apiKeys.json", function(json) {
    //     console.log("Retrieved api keys");
    //     riotApiKey = json["riot"];
    //     championGGApiKey = json["championGG"];
    // });
}

function updatePatch(patchData, riotPatch) {
    $("#patchData").text(patchData);
    if (riotPatch != undefined) {
        riotPatch = riotPatch.substring(0, riotPatch.lastIndexOf("."));
    }
    $("#riotPatch").text(riotPatch);
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