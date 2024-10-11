//Shared varriable

var globalPublicKeyPem = "";
var globalPrivateKeyPem = "";
var globalKeypair = "";
var globalLogin = "";
var url = "";

var socket = "";
var connFlag = "";
var windowChat = [];                
var port = "";

var MyUsername = "";
var RecipientTable = "";
var SelectedRecipient = "";
var ActiveChatWindow = "";

var login = "";
var password = ""
var crypt;

var globalMyInterface = new Interface()

class ClientJs {
    constructor() {        
        //class
        this.myInterface = globalMyInterface
        this.request   = new Request(this.myInterface)
        //this.request   = new Request()
    }

    defliveryKey(){
        return "empty"
    }

    loop(socket){
        socket.addEventListener("message", function(event) {
            let response = event.data; 
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response, "text/xml" );

            let instance = xmlDoc.getElementsByTagName("instance")[0].childNodes[0].nodeValue;
            console.log ("Otrzymano wiadomosc: " + response);
            console.log("Typ wiadomosci: " + instance);

            let clientListHTML = ""
            let ids = null
            let loginTemp = ""
            let myId = null
            let i = 0
            let clientName = ""
            let id = 0
            let msg = ""
            let msgReObj = ""
            let reciverPubKey = ""
            let privKey = ""
            let decryptedText = ""
            let clientId = 0
            let tb = ""
            let myPubKey = ""
            
            switch (instance){
                case ("you"):
                    myId = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    document.getElementById("my").innerHTML = myId;
                    break;

                case ("clients"):

                    ids = xmlDoc.getElementsByTagName("id");
                    loginTemp = globalLogin;

                    for (i = 0; i < ids.length; i++) {
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
                    id = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    msg = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    console.log("(msg): " + response);
                    privKey = document.getElementById("myPrivKey").innerHTML;
                    crypt.setPrivateKey(privKey);
                    decryptedText = crypt.decrypt(msg);
                    
                    msgReObj = globalMyInterface.GetRecipient (id);
                    
                    globalMyInterface.ProvideChatWindow (msgReObj);
                    globalMyInterface.IncomingMessage (msgReObj, decryptedText);
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
                    reciverPubKey = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    document.getElementById("reciverPubKey").innerHTML = reciverPubKey;
                    break;   

                default:
                    console.log(response);
                    break;
            }
        });        
    }

    connect(){
        this.myInterface.unreads.InitUnreadModule ();
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
    
        this.request.getServerKey()
        .then(text => {
            console.log("Login start");
            crypt = new JSEncrypt();
    
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
            let ws = "ws://" + url + ":" + port + "?room=" + encodeURIComponent(passwordEncrypted) + "&session=" + encodeURIComponent(session) + "&login=" + encodeURIComponent(loginEncrypted);
            //ws = "wss://enlightenment.xaa.pl:443?room=" + encodeURIComponent(passwordEncrypted) + "&session=" + encodeURIComponent(session);
            console.log(ws) 

            socket = new WebSocket(ws);

            this.request.setSocket(socket)
    
            socket.addEventListener("open", function(event) {        
                socket.send("<tb>backend219</tb>");
                connFlag = 1;
            });
    
            console.log("login END");
    
            document.getElementById("you").innerHTML = login;
            globalLogin = login;
    
            this.loop(socket)
    
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
}
