class MsgFmt {  
    static SMILEY_DIR = "smileys/";  
    static SMILEY_EXT = ".png";  
    static SMILEYS = [  
        { "sym": [":)", ":-)"], "filename": "Happy" },  
        { "sym": [":(", ":-("], "filename": "Sad" },  
        { "sym": [":D", ":-D"], "filename": "Laugh" },  
        { "sym": [":O", ":-O"], "filename": "Suprised" },  
        { "sym": [";)"], "filename": "Wink" },  
        { "sym": [":P", ":-P"], "filename": "Tongue" },  
        { "sym": ["<3", "[love]"], "filename": "Heart" },  
        { "sym": ["[thumbsup]", "[like]", "[+1]"], "filename": "ThumbsUp" }  
    ];  
    static N_SMILEYS = MsgFmt.SMILEYS.length;  

    MsgContentFormat(inMsg) {  
        var outHTML = "";  

        function hasnext() {  
            return inMsg.length > 0;  
        }  

        function nxchar() {  
            var c;  
            c = inMsg.substring(0, 1);  
            inMsg = inMsg.substring(1);  
            return c;  
        }  

        function infront(what) {  
            var le = what.length;  
            if (inMsg.substring(0, le) == what) {  
                inMsg = inMsg.substring(le);  
                return true;  
            }  
            return false;  
        }  

        function testsmiley() {  
            var i = 0, j;  
            var s, nsy;  
            while (i < MsgFmt.N_SMILEYS) {  
                s = MsgFmt.SMILEYS[i++];  
                nsy = s.sym.length;  
                j = 0;  
                while (j < nsy) {  
                    if (infront(s.sym[j])) {  
                        outHTML += '<img src="'  
                            + MsgFmt.SMILEY_DIR + s.filename + MsgFmt.SMILEY_EXT  
                            + '" class="smiley">';  
                        return true;  
                    }  
                    ++j;  
                }  
            }  
            return false;  
        }  

        var ch;  
        while (hasnext()) {  
            if (testsmiley())  
                ;  
            else {  
                ch = nxchar();  
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
}






class Unreads{
    OriginalPageTitle = document.title;

    NumUnreads;

    InitUnreadModule () {
        this.NumUnreads = 0;
    }

    ShowUnreadCount () {
        var t;
        
        t = OriginalPageTitle;
        if (this.NumUnreads > 0)
            t = "(" + this.NumUnreads + ") " + t;
        document.title = t;
    }

    SignalNewUnread (chat) {
        if (chat.isViewedNow () || chat.hasUnreads)
            return;
        
        ++this.NumUnreads;
        chat.hasUnreads = true;
        ShowUnreadCount ();
    }

    SignalChatRead (chat) {
        if (chat.hasUnreads) {
            
            chat.hasUnreads = false; 
            --this.NumUnreads;
            ShowUnreadCount ();
        }
    }    
}





class Utils{
    HideElement (elm) {
        elm.style.display = "none";
    }
    
    ShowElement (elm) {
        elm.style.display = "block";
    }    
}







var OriginalPageTitle = document.title;
var NumUnreads;

class Xunreads{

    InitUnreadModule () {
        NumUnreads = 0;
    }

    ShowUnreadCount () {
        var t;
        
        t = OriginalPageTitle;
        if (NumUnreads > 0)
            t = "(" + NumUnreads + ") " + t;
        document.title = t;
    }

    SignalNewUnread (chat) {
        if (chat.isViewedNow () || chat.hasUnreads)
            return;
        
        ++NumUnreads;
        chat.hasUnreads = true;
        this.ShowUnreadCount ();
    }

    SignalChatRead (chat) {
        if (chat.hasUnreads) {
            
            chat.hasUnreads = false; 
            --NumUnreads;
            this.ShowUnreadCount ();
        }
    }
}





class Interface{
    constructor() {
        this.unreads = new Unreads()
        this.utils = new Utils();
        this.xunreads = new Xunreads()
        this.msgFmt = new MsgFmt()
    }

    scrollToBottom() {
        const messages = document.getElementById('messages');
        messages.scrollTop = messages.scrollHeight;
    }

    BuildMsgCloud (who, text, direction) {
        var cl, s;
        cl = document.createElement ("DIV");
        cl.className = "cloud-msg " + (direction ?
                "cloud-sent" : "cloud-received");
        s = document.createElement ("SPAN");
        s.className = "cloud-msg-header";
        s.innerText = who;
        cl.appendChild (s);
        s = document.createElement ("SPAN");
        s.className = "cloud-msg-content";
        s.innerHTML = this.msgFmt.MsgContentFormat (text);
        cl.appendChild (s);
        function dateStr () {
            var d = new Date ();
            var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
                    "Aug", "Sep", "Oct", "Nov", "Dec"];
            return d.getHours () + ":" + d.getMinutes () + ", "
                    + MONTHS[d.getMonth ()] + " " + d.getDate ();
        }
        s = document.createElement ("DIV");
        s.className = "cloud-msg-date";
        s.innerText = (direction ? "Sent" : "Received")
                + " at " + dateStr ();
        cl.appendChild (s);
        return cl;
    }

    IncomingMessage (recipient, msgText) {
        
        console.log ("Przyszla odszyfrowania wiadomosc");
        console.log ("Od: " + recipient.username);
        console.log ("Tresc: " + msgText);
    
        recipient.windowElement.appendChild (
            this.BuildMsgCloud (recipient.username, msgText, false)
        );
        this.scrollToBottom ();
        
        this.xunreads.SignalNewUnread (recipient);
    }
    
    TabActivated () {
        if (SelectedRecipient)
            this.xunreads.SignalChatRead (SelectedRecipient);
    }

    GetRecipient (username) {
        var i, nRecipients;
        var reObj;
        var foundRec;
        
        i = 0;
        nRecipients = RecipientTable.length;
        foundRec = null;
        
        while (i < nRecipients) {
            reObj = RecipientTable[i];
            if (reObj.username == username) {
                foundRec = reObj;
                break;
            }
            ++i;
        }
    
        if (!foundRec) {
            foundRec = RecipientTable[nRecipients] = new Object ();
            foundRec.username = username;
            foundRec.hasUnreads = false;
            foundRec.knownPubKey = false;
            
            foundRec.isViewedNow = function () {
                return IsOurTabActive && SelectedRecipient == this;
            };
        }
        return foundRec;
    }
    
    
    ProvideChatWindow (recipient) {
        
        if (recipient.windowElement)
            return; 
        
        let w; 
        w = document.createElement ("DIV");
        w.className = "window-msg";
        this.utils.HideElement (w);
        
        document.getElementById("messages").appendChild (w);
        
        recipient.windowElement = w;
    }

    ChActiveWnd (newChat) {
        if (ActiveChatWindow)
            this.utils.HideElement (ActiveChatWindow);
        this.utils.ShowElement (ActiveChatWindow = newChat);
    }  
}