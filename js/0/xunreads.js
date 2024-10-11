var OriginalPageTitle = document.title;

var NumUnreads;

function InitUnreadModule () {
    NumUnreads = 0;
}

function ShowUnreadCount () {
    var t;
    
    t = OriginalPageTitle;
    if (NumUnreads > 0)
        t = "(" + NumUnreads + ") " + t;
    document.title = t;
}

function SignalNewUnread (chat) {
    if (chat.isViewedNow () || chat.hasUnreads)
        return;
    
    ++NumUnreads;
    chat.hasUnreads = true;
    ShowUnreadCount ();
}

function SignalChatRead (chat) {
    if (chat.hasUnreads) {
        
        chat.hasUnreads = false; 
        --NumUnreads;
        ShowUnreadCount ();
    }
}

