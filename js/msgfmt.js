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

var LINK_PROTOCOLS = ["http://", "https://", "ftp://"];
var N_LINK_PROTOCOLS = LINK_PROTOCOLS.length;
var LINK_DFL_PROTOCOL = LINK_PROTOCOLS[0];
// Znaki mog¹ce wyst¹piæ w ³¹czu
var LINK_CHARSET = "abcdefghijklmnopqrstuvwxyz01234567890/";
// Znaki mog¹ce wyst¹piæ wewn¹trz ³¹cza
var LINK_INTCHARSET = LINK_CHARSET + "-:#?=%_.@+";
// Znak, który MUSI wyst¹piæ w ka¿dym ³¹czu
var LINK_RQCHAR = ".";
// Znak czyni¹cy ³¹cze ³¹czem pocztowym
var LINK_MAILCHAR = "@";

function MsgContentFormat (inMsg) {
    var outHTML = "";
    
    function hasnext () {
        return inMsg.length > 0;
    }
    
    function peekchar () {
        return inMsg.charAt (0);
    }
    
    function nxchar () {
        var c;
        c = peekchar ();
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
    
    function htmlescape (s) {
        var i, ch, result, sl;
        i = 0;
        result = "";
        sl = s.length;
        while (i < sl) {
            ch = s.charAt (i);
            if (ch == "<")
                ch = "&lt";
            else if (ch == ">")
                ch = "&gt;";
            else if (ch == "&")
                ch = "&amp;";
            else if (ch == "\"")
                ch = "&quot;";
            result += ch;
            ++i;
        }
        return result;
    }
    
    function testlink () {
        var i, isLink, whatProtocol, specProtocol;
        var linkEnd, msgEnd, linkContent, fullLink;
        var mail;

        isLink = false;
        i = 0;
        specProtocol = "";
        while (i < N_LINK_PROTOCOLS) {
            whatProtocol = LINK_PROTOCOLS[i];
            if (infront (whatProtocol)) {
                isLink = true;
                specProtocol = whatProtocol;
                break;
            }
            ++i;
        }
        
        if (!isLink) {
            if (LINK_CHARSET.indexOf (peekchar ()) != -1) {
                isLink = true;
                whatProtocol = LINK_DFL_PROTOCOL;
            }
        }
        
        if (isLink) {
            linkEnd = 1;
            msgEnd = inMsg.length;
            while (linkEnd < msgEnd && LINK_INTCHARSET.indexOf (
                inMsg.charAt (linkEnd)
            ) != -1)
                ++linkEnd;
            while (linkEnd > 0 && LINK_CHARSET.indexOf (
                inMsg.charAt (linkEnd - 1)
            ) == -1)
                --linkEnd;
            i = 0;
            isLink = false;
            while (i < linkEnd) {
                if (inMsg.charAt (i) == LINK_RQCHAR) {
                    isLink = true;
                    break;
                }
                ++i;
            }
            if (isLink) {
                linkContent = inMsg.substring (0, linkEnd);
                inMsg = inMsg.substring (linkEnd);
                if (mail = (!specProtocol &&
                        linkContent.indexOf (LINK_MAILCHAR) != -1))
                    whatProtocol = "mailto:";
                fullLink = whatProtocol + linkContent;
                outHTML += '<a href="' + htmlescape (fullLink)
                    + (mail ? '">' : '" target="_blank">')
                    + htmlescape (specProtocol + linkContent) + '</a>';
                return true;
            }
        }
        return false;
    }
    
    var ch;
    while (hasnext ()) {
        if (testsmiley ())
            ;
        else if (testlink ())
            ;
        else if (infront ("\r\n") || infront ("\n"))
            outHTML += "<br>";
        else
            outHTML += htmlescape (nxchar ());
    }
    
    return outHTML;
}
