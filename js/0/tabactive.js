var IsOurTabActive = true;

window.onfocus = function () {    
    IsOurTabActive = true;
    TabActivated ();
};

window.onblur = function () {
    IsOurTabActive = false;
};

