// System nieprzeczytanych czat�w (tj. czat�w, w kt�rych s� jakie� nowe
// nieprzeczytane wiadomo�ci) oraz powiadomie�

// Oryginalny tytu� strony
// Potrzebny, poniewa� b�dziemy dodawa� informacje na pasku tytu�y
var OriginalPageTitle = document.title;

// Licznik nieprzeczytanych czat�w
var NumUnreads = 0;

function ShowUnreadCount () {
    // Poka� licznik nieprzeczytanych na pasku tytu�u,
    // lub nie wy�wietlaj �adnego licznika gdy nieprzeczytanych nie ma
    // (zamiast bezsensownie wy�wietla� 0)
    var t;
    
    t = OriginalPageTitle;
    if (NumUnreads > 0)
        t = "(" + NumUnreads + ") " + t;
    document.title = t;
}

// Sygna� o nowej wiadomo�ci w nieaktywnym czacie
// "Czat" to inaczej obiekt rozm�wcy
function SignalNewUnread (chat) {
    // Je�li ten czat jest aktywny, albo i tak by�y w nim nieprzeczytane
    // wiadomo�ci, to nie ma nowych nieprzeczytanych.
    if (chat.isViewedNow () || chat.hasUnreads)
        return;
    
    // Zwi�ksz licznik nieprzeczytanych. Oznacz czat jako nieprzeczytany.
    ++NumUnreads;
    chat.hasUnreads = true;
    // Poinformuj o wyst�powaniu nieprzeczytanych wiadomo�ci
    ShowUnreadCount ();
}

// Sygna� o wy�wietleniu czatu, w zwi�zku czym przestaje on by�
// nieprzeczytany (je�eli wcze�niej taki by�)
function SignalChatRead (chat) {
    if (chat.hasUnreads) {
        // By�y nieprzeczytane
        
        chat.hasUnreads = false; // Ju� nie
        --NumUnreads;
        ShowUnreadCount (); // Od�wie� licznik na pasku tytu�u
    }
}

