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
var summonerName = "";

$(document).ready(function() {
    browseHistory = localStorage.getItem("history");
    var historyPage = browseHistory[browseHistory.length - 1];
    console.log("Loaded page: " + historyPage);
    summonerName = localStorage.getItem("param1");
    console.log("Summoner: " + summonerName);
    $("#summonerNameTitle").text(summonerName);
});

function loadPage(page, param1, param2, history) {
    console.log("Storing params");
    localStorage.setItem("param1", param1);
    localStorage.setItem("param2", param2);
    localStorage.setItem("history", history);
    console.log("Loading page: " + page);
    $("#contentView").attr("src", page);
    browseHistory.push(page);
    if (browseHistory.length > 1) {
        $("#backButton", window.parent.document).show("slow", function() {});
    }
}

function loadExternalPage(page, param1, param2) {
    console.log("Sending load external page event: " + page);
    remote.ipcRenderer.send(page, param1, param2);
}

function getParams() {
    return params;
}