const pjson = require('./package.json');

$(document).ready(function () {
    console.log("Setting app version: " + pjson.version);
    $("#appVersion").text(pjson.version);
});
