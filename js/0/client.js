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

var MyUsername;
var RecipientTable;
var SelectedRecipient; 
var ActiveChatWindow;

function GetRecipient (username) {
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


function ProvideChatWindow (recipient) {
    
    if (recipient.windowElement)
        return; 
    
    let w; 
    w = document.createElement ("DIV");
    w.className = "window-msg";
    HideElement (w);
    
    document.getElementById("messages").appendChild (w);
    
    recipient.windowElement = w;
}


function IncomingMessage (recipient, msgText) {
    
    console.log ("Przyszla odszyfrowania wiadomosc");
    console.log ("Od: " + recipient.username);
    console.log ("Tresc: " + msgText);

    recipient.windowElement.appendChild (
        BuildMsgCloud (recipient.username, msgText, false)
    );
    scrollToBottom ();
    
    SignalNewUnread (recipient);
}

function TabActivated () {
    if (SelectedRecipient)
        SignalChatRead (SelectedRecipient);
}

function connect(){
    InitUnreadModule ();
    RecipientTable = new Array ();
    SelectedRecipient = null;
    ActiveChatWindow = null;
    document.getElementById ("messages").innerHTML = "";
    
    url = document.getElementById('url').value;
    port = document.getElementById('port').value;
    MyUsername = login = document.getElementById('login').value;
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
                var encryptedData = forge.util.decode64(encContent);
                var decryptedMessageAesKey = globalKeypair.privateKey.decrypt(encryptedData, 'RSA-OAEP');

                console.log("<enc>:", decryptedMessageAesKey);
            } catch (error) {
                console.error('Błąd odszyfrowania:', error);
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
                    break;

                case ("pls"):
                    clientId = xmlDoc.getElementsByTagName("mid")[0].childNodes[0].nodeValue;
                    myPubKey = document.getElementById("myPubKey").innerHTML;
                    console.log("pls: " + clientId);
                    tb = "<tb>";
                    tb += "<instance>key</instance>";
                    tb += "<id>" + clientId + "</id>";
                    tb += "<msg>" + myPubKey + "</msg>";
                    tb += "<mid>" + MyUsername + "</mid>";                    
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
            location.reload (false);
            /*
            let content = document.getElementById("content");
            content.style.display = "none"; 

            content = document.getElementById("loginWindow");
            content.style.display = "block";
            */
        });

        socket.addEventListener("error", function(event) {
            console.log("error");
        });
    })
    .catch(error => {
        console.error('Error getServerKey:', error);
    });    
}

function OutgoingMessage (msg) {
    var crypt = new JSEncrypt();
    pubKey = document.getElementById("reciverPubKey").innerHTML;
    crypt.setPublicKey(pubKey);
    var encryptedText = crypt.encrypt(msg);
    var my = document.getElementById("my").innerHTML;
    
    var tb;
    tb  = "<tb>";
    tb += "<instance>send</instance>";
    tb += "<id>" + SelectedRecipient.username + "</id>";
    tb += "<msg>" + encryptedText + "</msg>";
    tb += "<mid>" + my + "</mid>";
    tb += "</tb>";
    console.log ("Wysylanie wiadomosci: " + tb);
    socket.send(tb);
    
    SelectedRecipient.windowElement.appendChild (
        BuildMsgCloud (my, msg, true)
    );
    scrollToBottom ();
}

function send(){
    var msgField = document.getElementById("msg"); 
    msg = msgField.value;
    msgField.value = "";
    msgField.focus ();
    OutgoingMessage (msg);
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
        let publicKeyPem = "";
        let privateKeyPem = "";
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
            throw new Error('Błąd: ' + response.status);
        }

        let text = await response.text();

        return text;
    } catch (error) {
        console.error('Wystąpił błąd: ' + error);
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
    document.getElementsByClassName("window-msg")[0].innerHTML = ""
}

function ChActiveWnd (newChat) {
    if (ActiveChatWindow)
        HideElement (ActiveChatWindow);
    ShowElement (ActiveChatWindow = newChat);
}

function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTop = messages.scrollHeight;
}

function getInner(clientId){
    console.log("getInner");
    document.getElementById("client").value = clientId;
    document.getElementById("receiver").innerHTML = clientId;
    
    ProvideChatWindow (SelectedRecipient = GetRecipient (clientId));
    ChActiveWnd (SelectedRecipient.windowElement);
    SignalChatRead (SelectedRecipient);
    plsKey();
}
