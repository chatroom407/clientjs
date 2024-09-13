console.log("Script is Link!!!");

var socket = "";
var connFlag = "";
var windowChat = [];

let globalPublicKeyPem = "";
let globalPrivateKeyPem = "";
let globalKeypair = "";
let globalLogin = "";

let url  = "";
let port = "";

// Tablica wszystkich u¿ytkowników, z którymi rozmawiamy
// Wa¿n¹ w³aœciwoœci¹ ka¿dego obiektu rozmówcy jest username, czyli jego
// nazwa u¿ytkownika.
var RecipientTable = [];

// Spis w³aœciwoœci obiektów bêd¹cych elementami RecipientTable:
// username        - Nazwa, jak wspomniano wy¿ej
// windowElement   - Element DOM bêd¹cy "oknem" wyœwietlania rozmowy z danym
//                   u¿ytkownikiem
// hasUnreads      - Czy s¹ nowe nieprzeczytane wiadomoœci w czacie

var SelectedRecipient = null; // Wybrany przez u¿ytkownika rozmówca

function GetRecipient (username) {
    // Znajduje obiekt reprezentuj¹cy rozmówcê o podanej nazwie, a w razie
    // potrzeby tworzy go
    // To powinna byæ jedyna droga tworzenia obiektów-rozmówców
    var i, nRecipients;
    var reObj;
    var foundRec;
    
    i = 0;
    nRecipients = RecipientTable.length;
    foundRec = null;
    
    while (i < nRecipients) {
        reObj = RecipientTable[i];
        if (reObj.username == username) {
            // Znaleziono rozmówcê w tabeli
            foundRec = reObj;
            break;
        }
        ++i;
    }

    if (!foundRec) {
        // Obiekt ¿¹danego rozmówcy nie zosta³ odnaleziony, wiêc trzeba
        // go utworzyæ i dodaæ do tablicy.
        foundRec = RecipientTable[nRecipients] = new Object ();
        foundRec.username = username;
        foundRec.hasUnreads = false;
        
        // Metody obiektu rozmówcy
        foundRec.isViewedNow = function () {
            // Czy czat z rozmówc¹ jest aktywny, a wiêc przede wszystkim czy
            // komunikator jest aktywnym oknem przegl¹darki.
            return IsOurTabActive && SelectedRecipient == this;
        };
    }
    return foundRec;
}


function ProvideChatWindow (recipient) {
    // Zapewnij okno rozmowy dla danego rozmówcy, je¿eli jeszcze go nie ma
    
    if (recipient.windowElement)
        return; // Ju¿ istnieje
    
    let w; // Przygotowywane okno
    w = document.createElement ("DIV");
    w.className = "window-msg";
    // Okno domyœlnie jest ukryte (zanim zostanie aktywowane)
    HideElement (w);
    
    // Dodaj okno do obszaru wiadomoœci
    document.getElementById("messages").appendChild (w);
    
    // Przypisz okno do obiektu
    recipient.windowElement = w;
    // Dziêki temu nie musi ono mieæ ID okreœlaj¹cego nazwê rozmówcy,
    // którego dotyczy.
}


function IncomingMessage (recipient, msgText) {
    // Nowa wiadomoœæ od rozmówcy reprezentowanego przez obiekt.
    // Funkcja ta przyjmuje ju¿ rozszyfrowan¹ wiadomoœæ i jej rol¹ jest
    // m. in. wyœwietlenie jej.
    // W tym celu rozmówca musi mieæ u nas okno (stworzone przez
    // ProvideChatWindow).
    
    console.log ("Przyszla odszyfrowania wiadomosc");
    console.log ("Od: " + recipient.username);
    console.log ("Tresc: " + msgText);
    
    let cld; // Chmurka wiadomoœci
    cld = document.createElement ("DIV");
    cld.className = "cloud-msg";
    cld.innerHTML = '<span class="cloud-msg-header">' + recipient.username
            + '</span><span class="cloud-msg-content">' + msgText
            + "</span></div>";
    // Umieœæ chmurkê we w³aœciwym oknie
    recipient.windowElement.appendChild (cld);
    
    // Przeka¿ do systemu powiadomieñ i zliczania nieprzeczytanych
    SignalNewUnread (recipient);
}


function connect(){
    url = document.getElementById('url').value;
    port = document.getElementById('port').value;
    login = document.getElementById('login').value;
    password = document.getElementById('password').value;        
    
    let content = document.getElementById("content");
    content.style.display = "block"; 

    content = document.getElementById("loginWindow");
    content.style.display = "none";

    getServerKey()
    .then(text => {
        console.log("Login start");
        var crypt = new JSEncrypt();

        console.log(text);
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(text, "application/xml");
        let session = xmlDoc.getElementsByTagName("session")[0]?.textContent;


        let encMatch = text.match(/<enc>([\s\S]*?)<\/enc>/);

        let encContent = "";
        if (!encMatch) {
            console.error("Tag <enc> not found.");
        } else if (!encMatch[1]) {
            console.error("Tag <enc> is empty.");
        } else {
            encContent = encMatch[1];
            try {
                //const privateKey = forge.pki.privateKeyFromPem(globalPrivateKeyPem);
                var encryptedData = forge.util.decode64(encContent);
                var decryptedMessageAesKey = globalKeypair.privateKey.decrypt(encryptedData, 'RSA-OAEP');

                console.log("<enc>:", decryptedMessageAesKey);
            } catch (error) {
                console.error('BÅ‚Ä…d odszyfrowania:', error);
                throw error;
            }
            console.log("<enc>:", decryptedMessageAesKey);
            
        }

        function encryptAES(password, keyHex) {
            const key = CryptoJS.enc.Hex.parse(keyHex);
            const iv = CryptoJS.lib.WordArray.random(16);
            const encrypted = CryptoJS.AES.encrypt(password, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const ivCiphertext = iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
            
            return ivCiphertext;
        }

        const passwordEncrypted = encryptAES(password, decryptedMessageAesKey).toString();
        const loginEncrypted    = encryptAES(login, decryptedMessageAesKey).toString();
        ws = "ws://" + url + ":" + port + "?room=" + encodeURIComponent(passwordEncrypted) + "&session=" + encodeURIComponent(session) + "&login=" + encodeURIComponent(loginEncrypted);
        //ws = "wss://enlightenment.xaa.pl:443?room=" + encodeURIComponent(passwordEncrypted) + "&session=" + encodeURIComponent(session);
        console.log(ws) 

        socket = new WebSocket(ws);

        socket.addEventListener("open", function(event) {        
            socket.send("<tb>backend219</tb>");
            connFlag = 1;
        });
        console.log("login END");

        document.getElementById("you").innerHTML = login;
        globalLogin = login;

        socket.addEventListener("message", function(event) {
            let response = event.data; 
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response, "text/xml" );

            let instance = xmlDoc.getElementsByTagName("instance")[0].childNodes[0].nodeValue;
            console.log ("Otrzymano wiadomosc: " + response);
            console.log("Typ wiadomosci: " + instance);

            let clientListHTML = "";
            switch (instance){
                case ("you"):
                    let myId = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    document.getElementById("my").innerHTML = myId;
                    break;

                case ("clients"):

                    let ids = xmlDoc.getElementsByTagName("id");
                    loginTemp = globalLogin;

                    for (let i = 0; i < ids.length; i++) {
                        let clientName = ids[i].childNodes[0].nodeValue;
                        if(clientName == loginTemp){
                            continue;
                        }         
                        console.log(clientName);
                        clientListHTML += "<button class='cli btn-clients' onclick=\"getInner('"
                                + clientName + "')\">";
                        clientListHTML += clientName + "</br>";
                        clientListHTML += "</button>";
                    }
                    document.getElementById("clients").innerHTML = clientListHTML;                    
                    break;

                case ("send"):
                    console.log("(send): " +response);   
                    break;

                case ("msg"):
                    let id = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    let msg = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    console.log("(msg): " + response);
                    privKey = document.getElementById("myPrivKey").innerHTML;
                    crypt.setPrivateKey(privKey);
                    decryptedText = crypt.decrypt(msg);
                    
                    let msgReObj = GetRecipient (id);
                    
                    ProvideChatWindow (msgReObj);
                    IncomingMessage (msgReObj, decryptedText);

                    /*
                    STARY KOD WYŒWIETLAJ¥CY WIADOMOŒÆ
                    
                    var client = document.getElementById(id);
                    if(client){
                        //client.innerHTML += "<div>" + id + ": " + decryptedText + "</div>";                        

                        if(id == globalLogin){
                            client.innerHTML += "<div class='cloud-msg'><span class='cloud-msg-header'>" + id + "</span><span class='cloud-msg-content'>" + decryptedText + "</span></div>";
                        }else{
                            client.innerHTML += "<div class='cloud-msg'><span class='cloud-msg-header recive'>" + id + "</span><span class='cloud-msg-content'>" + decryptedText + "</span></div>";
                        }

                        windowChat.push(id);
                        scrollToBottom();
                    }else{
                        var messagesDiv = document.getElementById("messages");
                        if (messagesDiv) {
                            messagesDiv.innerHTML += "<div class='window-msg' id=" + id + "><div class='cloud-msg'><span class='cloud-msg-header'>" + id + "</span><span class='cloud-msg-content'>" + decryptedText + "</span></div></div>";
                        } else {
                            console.error('Element o id "messages" nie zostaÅ‚ znaleziony.');
                        }
                    }
                    */
                    break;

                case ("pls"):
                    clientId = xmlDoc.getElementsByTagName("mid")[0].childNodes[0].nodeValue;
                    myPubKey = document.getElementById("myPubKey").innerHTML;
                    console.log("pls: " + clientId);
                    tb = "<tb>";
                    tb += "<instance>key</instance>";
                    tb += "<id>" + clientId + "</id>";
                    tb += "<msg>" + myPubKey + "</msg>";
                    tb += "<mid>" + clientId + "</mid>";
                    tb += "</tb>";
                    socket.send(tb);
                    break;

                case ("key"):
                    console.log(response);
                    let reciverPubKey = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    document.getElementById("reciverPubKey").innerHTML = reciverPubKey;
                    break;   

                default:
                    console.log(response);
                    break;
            }
        });

        socket.addEventListener("close", function(event) {
            console.log("conn closed");
            let content = document.getElementById("content");
            content.style.display = "none"; 

            content = document.getElementById("loginWindow");
            content.style.display = "block";
        });

        socket.addEventListener("error", function(event) {
            console.log("error");
        });
    })
    .catch(error => {
        console.error('Error getServerKey:', error);
    });    
}

function send(){
    clientId = document.getElementById("client").value;
    msg = document.getElementById("msg").value;
    my = document.getElementById("my").innerHTML;

    var crypt = new JSEncrypt();
    pubKey = document.getElementById("reciverPubKey").innerHTML;
    crypt.setPublicKey(pubKey);
    var encryptedText = crypt.encrypt(msg);

    tb  = "<tb>";
    tb += "<instance>send</instance>";
    tb += "<id>" + clientId + "</id>";
    tb += "<msg>" + encryptedText + "</msg>";
    tb += "<mid>" + my + "</mid>";
    tb += "</tb>";
    console.log ("Wysylanie wiadomosci: " + tb);
    socket.send(tb);

    var client = document.getElementById(clientId);
    if(client){
        client.innerHTML += "<div class='cloud-msg'><span class='cloud-msg-header'>" + my + "</span><span class='cloud-msg-content'>" + msg + "</span></div>";
        windowChat.push(clientId);
        scrollToBottom();
    }else{
        var messagesDiv = document.getElementById("messages");
        if (messagesDiv) {
            messagesDiv.innerHTML += "<div class='window-msg' id=" + clientId + "><div class='cloud-msg'><span class='cloud-msg-header'>" + clientId + "</span><span class='cloud-msg-content'>" + msg + "</span></div></div>";
        } else {
            console.error('Element o id "messages" nie zostaÅ‚ znaleziony.');
        }
    }
}

function plsKey(){
    myId  = document.getElementById("my").innerHTML;
    clientId = document.getElementById("client").value;
    tb  = "<tb>";
    tb += "<instance>pls_key</instance>";
    tb += "<id>" + clientId + "</id>";
    tb += "<msg>" + "" + "</msg>";
    tb += "<mid>" + myId + "</mid>";
    tb += "</tb>";
    socket.send(tb);
}

async function getServerKey() {
    try {
        // Inicjalizacja zmiennych lokalnych
        let publicKeyPem = "";
        let privateKeyPem = "";

        // Generowanie pary kluczy RSA
        var rsa = forge.pki.rsa;

        const generateKeyPair = () => {
            return new Promise((resolve, reject) => {
                rsa.generateKeyPair({ bits: 2048, e: 0x10001 }, (err, keypair) => {
                    if (err) {
                        reject(err);
                    } else {                        
                        publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
                        privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

                        console.log("Public Key (PEM format):\n", publicKeyPem);
                        console.log("Private Key (PEM format):\n", privateKeyPem);

                        globalPublicKeyPem = publicKeyPem;
                        globalPrivateKeyPem = privateKeyPem;
                        globalKeypair = keypair

                        resolve();
                    }
                });
            });
        };

        await generateKeyPair();

        let encodedPublicKey = encodeURIComponent(btoa(publicKeyPem));

        let response = await fetch(`http://` + url + `/room407/deliveryKey.php?pk=${encodedPublicKey}`);
        if (!response.ok) {
            throw new Error('BÅ‚Ä…d: ' + response.status);
        }

        let text = await response.text();

        return text;
    } catch (error) {
        console.error('WystÄ…piÅ‚ bÅ‚Ä…d: ' + error);
        throw error;
    }
}

function clients(){
    tb  = "<tb>";
    tb += "<instance>clients</instance>";
    tb += "<id></id>";
    tb += "<msg></msg>";
    tb += "<mid></mid>";
    tb += "</tb>";
    socket.send(tb);
}

function clean(){
    windowChat.forEach(el => {
        console.log(el.innerHTML);
        if (clientId == el) {
            document.getElementById(el).innerHTML = '';       
        } else {
            document.getElementById(el).innerHTML = '';       
        }
    });
}

var ActiveChatWindow = null; // Aktywne okno czatu
function ChActiveWnd (newChat) {
    // Zmieñ aktywne okno czatu, tak aby tylko jedno by³o widoczne naraz.
    if (ActiveChatWindow)
        HideElement (ActiveChatWindow);
    ShowElement (ActiveChatWindow = newChat);
}

function getInner(clientId){
    console.log("getInner");
    document.getElementById("client").value = clientId;
    document.getElementById("receiver").innerHTML = clientId;
    
    ProvideChatWindow (SelectedRecipient = GetRecipient (clientId));
    ChActiveWnd (SelectedRecipient.windowElement);
    SignalChatRead (SelectedRecipient);
    
    /* windowChat.forEach(el => {
        console.log(el.innerHTML);
        if (clientId == el) {
            document.getElementById(el).style.display = 'block';       
        } else {
            document.getElementById(el).style.display = 'none';
        }
    }); */
    
    plsKey();
}

function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
}

window.onload = function() {
    /*
    connect();
    var checkConnFlagInterval = setInterval(function() {
    if (connFlag === 1) {
            console.log("connFlag == 1");
            clients();
            clearInterval(checkConnFlagInterval);
        }
    }, 100);*/
}
