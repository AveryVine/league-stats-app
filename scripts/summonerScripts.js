const bypassMatchList = false;
const bypassMatchData = false;
let elo = "PLATINUM";
let region = "NA";
let regions = ["NA", "EUNE", "EUW", "KR"];
let riotApiKey = null;
let championGGApiKey = null;
let champions = {};
let matchList = [];
let championInfo = {};
let browseHistory = [];
let summonerName = "";
let accountId = "";
let queue = 420;
let matchCountLimit = 5;

$(document).ready(function () {
    browseHistory = localStorage.getItem("history");
    let historyPage = browseHistory.slice(-1)[0];
    console.log("Loaded page: " + historyPage);
    summonerName = localStorage.getItem("param1");
    accountId = localStorage.getItem("param2");
    champions = parent.champions;
    console.log(champions);
    console.log("Summoner: " + summonerName);
    $("#summonerNameTitle").text(summonerName);
    // alert("Sorry, " + summonerName + "! This feature isn't ready yet! Press the Back (<) arrow in the top left to go back.");
    loadApiKeys();
});

function loadApiKeys() {
    console.log("Retrieving api keys...");
    let url = "https://avery-vine-server.herokuapp.com/apikeys";
    $.get(url, function (data, status) {
        console.log("Retrieved api keys");
        $("#summonerSubmit", window.parent.document).attr("disabled", false);
        riotApiKey = data.riot;
        championGGApiKey = data.championGG;
        getMatchList();
    });
}

function getMatchList() {
    if (bypassMatchList) {

    } else {
        console.log("Retrieving match list...");
        let url = "https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/" + accountId + "?queue=" + queue + "&endIndex=" + matchCountLimit + "&api_key=" + riotApiKey;
        $.get(url, function (data, status) {
            console.log("Retrieved match list");
            for (let match in data.matches) {
                getMatchData(data.matches[match].gameId, match);
            }
        }).fail(function (error) {
            console.error("Could not query for match list:\n\nResponse: " + error.responseJSON.status.message + " (" + error.responseJSON.status.status_code + ")");
            $("#analyzingText").html("<h2 id='analyzingText'>Something went wrong!</h2>");
        });
    }
}

function getMatchData(gameId, matchNum) {
    if (bypassMatchData) {

    } else {
        console.log("Retrieving match data for gameId: " + gameId);
        let url = "https://na1.api.riotgames.com/lol/match/v3/matches/" + gameId + "?api_key=" + riotApiKey;
        $.get(url, function (data, status) {
            console.log("Retrieved match data");
            matchList.push(data);
            if (matchNum == matchCountLimit - 1) {
                gatherMatchStatistics();
            }
        }).fail(function (error) {
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
    for (let i in matchList) {
        let match = matchList[i];
        let teamId = 100;
        let participantId = 1;
        let win = false;
        for (let j in match.participantIdentities) {
            if (match.participantIdentities[j].player.summonerName == summonerName) {
                participantId = match.participantIdentities[j].participantId;
                teamId = match.participants[participantId - 1].teamId;
            }
        }
        for (let j in match.teams) {
            let team = match.teams[j];
            if (team.teamId == teamId && team.win != "Win") {
                win = true;
            }
        }
        console.log("Analyzing match...");
        console.log(champions);
        console.log(championInfo);
        for (let j in match.participants) {
            let participant = match.participants[j];
            if (participant.teamId != teamId) {
                console.log("Analyzing new enemy...");
                let championId = match.participants[j].championId;
                let championName = "";
                let gamesVs = 0;
                let lossesVs = 0;
                if (championInfo[championId] != undefined) {
                    gamesVs = championInfo[championId].gamesVs;
                    lossesVs = championInfo[championId].lossesVs;
                }
                gamesVs++;
                if (!win) {
                    lossesVs++;
                }
                for (let champion in champions) {
                    if (champions[champion].key == championId) {
                        championName = champion;
                        break;
                    }
                }
                championInfo[championId] = {
                    "name": championName,
                    "gamesVs": gamesVs,
                    "lossesVs": lossesVs
                };
                console.log("Updated champion: " + championName + " (games vs: " + gamesVs + ", losses vs: " + lossesVs + ")");
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
        $("#backButton").show("slow", function () {});
    }
}

function loadExternalPage(page, param1, param2, param3) {
    console.log("Sending load external page event: " + page);
    remote.ipcRenderer.send(page, param1, param2, param3);
}
