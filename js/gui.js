function BuildMsgCloud (who, text, direction) {
    // direction is false for received messages,
    // and true for sent messages.
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
    s.innerText = text;
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

