// Zarz�dzanie tym, czy okno/karta przegl�darki zawieraj�ca czat jest aktywna.

var IsOurTabActive = true;

window.onfocus = function () {
    // U�ytkownik uaktywni� nasz� kart�
    IsOurTabActive = true;
    TabActivated ();
};

window.onblur = function () {
    // U�ytkownik opu�ci� kart�
    IsOurTabActive = false;
};

