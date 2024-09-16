// Formatowanie tekstu wiadomoœci
// Funkcja MsgContentFormat zamienia obs³ugiwane znaczniki formatowania
// na HTML.


// Definicja uœmieszków
var SMILEY_DIR = "smileys/";
var SMILEY_EXT = ".png";
var SMILEYS = [
    {"sym" : ":)", "name" : "Happy"},
    {"sym" : ":(", "name" : "Sad"},
    {"sym" : ":D", "name" : "Laugh"},
    {"sym" : ":O", "name" : "Suprised"},
    {"sym" : ";)", "name" : "Wink"},
    {"sym" : ":P", "name" : "Tongue"}
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
        var i = 0;
        var s;
        while (i < N_SMILEYS) {
            s = SMILEYS[i++];
            if (infront (s.sym)) {
                outHTML += '<img src="'
                        + SMILEY_DIR + s.name + SMILEY_EXT
                        + '" class="smiley">';
                return true;
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
            if (ch == "<")
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

