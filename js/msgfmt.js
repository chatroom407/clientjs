// Formatowanie tekstu wiadomoœci
// Funkcja MsgContentFormat zamienia obs³ugiwane znaczniki formatowania
// na HTML.


// Definicja uœmieszków
var SMILEY_DIR = "smileys/";
var SMILEY_EXT = ".png";
var SMILEYS = [
    {"sym" : [":)", ":-)"], "filename" : "Happy"},
    {"sym" : [":(", ":-("], "filename" : "Sad"},
    {"sym" : [":D", ":-D"], "filename" : "Laugh"},
    {"sym" : [":O", ":-O"], "filename" : "Suprised"},
    {"sym" : [";)"], "filename" : "Wink"},
    {"sym" : [":P", ":-P"], "filename" : "Tongue"},
    {"sym" : ["<3", "[love]"], "filename" : "Heart"},
    {"sym" : ["[thumbsup]", "[like]", "[+1]"], "filename" : "ThumbsUp"}
];
var N_SMILEYS = SMILEYS.length;


function MsgContentFormat (inMsg) {
    var outHTML = "";
    
    function hasnext () {
        return inMsg.length > 0;
    }
    
    function nxchar () {
        var c;
        c = inMsg.substring (0, 1);
        inMsg = inMsg.substring (1);
        return c;
    }
    
    function infront (what) {
        var le = what.length;
        if (inMsg.substring (0, le) == what) {
            inMsg = inMsg.substring (le);
            return true;
        }
        return false;
    }
    
    function testsmiley () {
        var i = 0, j;
        var s, nsy;
        while (i < N_SMILEYS) {
            s = SMILEYS[i++];
            nsy = s.sym.length;
            j = 0;
            while (j < nsy) {
                if (infront (s.sym[j])) {
                    outHTML += '<img src="'
                            + SMILEY_DIR + s.filename + SMILEY_EXT
                            + '" class="smiley">';
                    return true;
                }
                ++j;
            }
        }
        return false;
    }
    
    var ch;
    while (hasnext ()) {
        if (testsmiley ())
            ;
        else {
            ch = nxchar ();
            if (ch == "\n")
                ch = "<br>";
            else if (ch == "<")
                ch = "&lt";
            else if (ch == ">")
                ch = "&gt;";
            else if (ch == "&")
                ch = "&amp;";
            else if (ch == "\"")
                ch = "&quot;";
        
            outHTML += ch;
        }
    }
    
    return outHTML;
}

