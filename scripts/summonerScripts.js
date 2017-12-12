const bypassMatchList = false;
const bypassMatchData = false;
var elo = "PLATINUM";
var region = "NA";
var regions = ["NA", "EUNE", "EUW", "KR"];
var riotApiKey = null;
var championGGApiKey = null;
var staticData = {};
var matchList = [];
var championInfo = {};
var browseHistory = [];
var summonerName = "";
var accountId = "";
var queue = 420;
var matchCountLimit = 5;

$(document).ready(function() {
    browseHistory = localStorage.getItem("history");
    var historyPage = browseHistory.slice(-1)[0];
    console.log("Loaded page: " + historyPage);
    summonerName = localStorage.getItem("param1");
    accountId = localStorage.getItem("param2");
    staticData = parent.staticData;
    console.log(staticData);
    console.log("Summoner: " + summonerName);
    $("#summonerNameTitle").text(summonerName);
    // alert("Sorry, " + summonerName + "! This feature isn't ready yet! Press the Back (<) arrow in the top left to go back.");
    loadApiKeys();
});

function loadApiKeys() {
    console.log("Retrieving api keys...");
    $.getJSON("apiKeys.json", function(json) {
        console.log("Retrieved api keys");
        $("#summonerSubmit", window.parent.document).attr("disabled", false);
        riotApiKey = json["riot"];
        championGGApiKey = json["championGG"];
        getMatchList();
    });
}

function getMatchList() {
    if (bypassMatchList) {
        
    }
    else {
        console.log("Retrieving match list...");
        var url = "https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/" + accountId + "?queue=" + queue + "&endIndex=" + matchCountLimit + "&api_key=" + riotApiKey;
        $.get(url, function(data, status) {
            console.log("Retrieved match list");
            for (match in data.matches) {
                getMatchData(data.matches[match].gameId, match);
            }
        }).fail(function(error) {
            console.error("Could not query for match list:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
            $("#analyzingText").html("<h2 id='analyzingText'>Something went wrong!</h2>");
        });
    }
}

function getMatchData(gameId, matchNum) {
    if (bypassMatchData) {

    }
    else {
        console.log("Retrieving match data for gameId: " + gameId);
        var url = "https://na1.api.riotgames.com/lol/match/v3/matches/" + gameId + "?api_key=" + riotApiKey;
        $.get(url, function(data, status) {
            console.log("Retrieved match data");
            matchList.push(data);
            if (matchNum == matchCountLimit - 1) {
                gatherMatchStatistics();
            }
        }).fail(function(error) {
            console.error("Could not query for match data:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
            $("#analyzingText").html("<h2 id='analyzingText'>Something went wrong!</h2>");
        });
    }
}

function analyzeMatchData() {
    console.log("Analyzing match data...");
    
}

function gatherMatchStatistics() {
    console.log("Gathering match statistics...");
    for (i in matchList) {
        var match = matchList[i];
        var teamId = 100;
        var participantId = 1;
        var win = false;
        for (j in match.participantIdentities) {
            if (match.participantIdentities[j].player.summonerName == summonerName) {
                participantId = match.participantIdentities[j].participantId;
                teamId = match.participants[participantId - 1].teamId;
            }
        }
        for (j in match.teams) {
            var team = match.teams[j];
            if (team.teamId == teamId && team.win != "Win") {
                win = true;
            }
        }
        console.log("Analyzing match...");
        for (j in match.participants) {
            var participant = match.participants[j];
            if (participant.teamId != teamId) {
                console.log("Analyzing new enemy...");
                var championId = match.participants[j].championId;
                var championName = staticData.name;
                var gamesVs = 0;
                var lossesVs = 0;
                var championName = "";
                if (championInfo[championId] != undefined) {
                    gamesVs = championInfo[championId].gamesVs;
                    lossesVs = championInfo[championId].lossesVs;
                }
                gamesVs++;
                if (!win) {
                    lossesVs++;
                }
                for (champion in staticData.data) {
                    if (staticData.data[champion].id == championId) {
                        championName = champion;
                        break;
                    }
                }
                championInfo[championId] = {"name": champion, "gamesVs": gamesVs, "lossesVS": lossesVs};
                console.log("Updated champion: " + champion + " (games vs: " + gamesVs + ", losses vs: " + lossesVs + ")");
            }
        }
    }
    analyzeMatchData();
}

function loadPage(page, param1, param2, param3) {
    console.log("Storing params");
    localStorage.setItem("param1", param1);
    localStorage.setItem("param2", param2);
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