// System nieprzeczytanych czatów (tj. czatów, w których s¹ jakieœ nowe
// nieprzeczytane wiadomoœci) oraz powiadomieñ

// Oryginalny tytu³ strony
// Potrzebny, poniewa¿ bêdziemy dodawaæ informacje na pasku tytu³y
var OriginalPageTitle = document.title;

// Licznik nieprzeczytanych czatów
var NumUnreads = 0;

function ShowUnreadCount () {
    // Poka¿ licznik nieprzeczytanych na pasku tytu³u,
    // lub nie wyœwietlaj ¿adnego licznika gdy nieprzeczytanych nie ma
    // (zamiast bezsensownie wyœwietlaæ 0)
    var t;
    
    t = OriginalPageTitle;
    if (NumUnreads > 0)
        t = "(" + NumUnreads + ") " + t;
    document.title = t;
}

// Sygna³ o nowej wiadomoœci w nieaktywnym czacie
// "Czat" to inaczej obiekt rozmówcy
function SignalNewUnread (chat) {
    // Jeœli ten czat jest aktywny, albo i tak by³y w nim nieprzeczytane
    // wiadomoœci, to nie ma nowych nieprzeczytanych.
    if (chat.isViewedNow () || chat.hasUnreads)
        return;
    
    // Zwiêksz licznik nieprzeczytanych. Oznacz czat jako nieprzeczytany.
    ++NumUnreads;
    chat.hasUnreads = true;
    // Poinformuj o wystêpowaniu nieprzeczytanych wiadomoœci
    ShowUnreadCount ();
}

// Sygna³ o wyœwietleniu czatu, w zwi¹zku czym przestaje on byæ
// nieprzeczytany (je¿eli wczeœniej taki by³)
function SignalChatRead (chat) {
    if (chat.hasUnreads) {
        // By³y nieprzeczytane
        
        chat.hasUnreads = false; // Ju¿ nie
        --NumUnreads;
        ShowUnreadCount (); // Odœwie¿ licznik na pasku tytu³u
    }
}

