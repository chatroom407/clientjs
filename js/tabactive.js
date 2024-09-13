// Zarz¹dzanie tym, czy okno/karta przegl¹darki zawieraj¹ca czat jest aktywna.

var IsOurTabActive = true;

window.onfocus = function () {
    // U¿ytkownik uaktywni³ nasz¹ kartê
    IsOurTabActive = true;
};

window.onblur = function () {
    // U¿ytkownik opuœci³ kartê
    IsOurTabActive = false;
};

