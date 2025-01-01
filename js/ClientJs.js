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

var ReciverPubKey = "NoNe";


var globalMyInterface = new Interface()

var CurrentFile = "";

class ClientJs {
    constructor() {        
        //class
        this.pipe = new Pipe();

        this.myInterface = globalMyInterface
        this.request   = new Request(this.myInterface)
        //this.request   = new Request()
        this.audioBlob = ""
        this.audioUrl = ""
        this.audio = ""        
        this.chunkId = 0;
        this.audioChunks = [];
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl  = URL.createObjectURL(this.audioBlob);
        this.audio     = new Audio(this.audioUrl);
        this.isPlaying = false;
        this.audioPlayingTime = 0;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.audioContext.createBufferSource();
        this.source.connect(this.audioContext.destination);
        //this.buffer = [];
        
        const tenMB = 10 * 1024 * 1024;
        this.buffer = new Uint8Array(tenMB)

        this.audioChunksBuffer = [];
        this.audioPlayer = new AudioPlayer();        
        this.mediaHandler = new MediaSourceHandler();
    }

    defliveryKey(){
        return "empty"
    }

    loadAndPlayChunk(audioChunk) {
        if (!(audioChunk instanceof ArrayBuffer)) {
            console.error('Dane audio nie są typu ArrayBuffer');
            //return;
        }
        this.audioContext.decodeAudioData(audioChunk)
            .then(audioBuffer => {
            
            this.source.buffer = audioBuffer;             

            this.source.onended = () => {
                console.log('Fragment zakończony');
            };
            })
            .catch(error => {
                console.error('Błąd przy dekodowaniu audio:', error);
            });
    }

    concatenateAudioBuffers(bufferArray) {
        const totalLength = bufferArray.reduce((acc, buffer) => acc + buffer.length, 0);
        const combinedBuffer = new Uint8Array(totalLength);
    
        let offset = 0;
        bufferArray.forEach(buffer => {
            combinedBuffer.set(buffer, offset);
            offset += buffer.length;
        });
    
        return combinedBuffer.buffer;
    }

    loop(socket){
        socket.addEventListener("message", (event) => {
            
            let response = event.data; 
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(response, "text/xml" );

            let instance = xmlDoc.getElementsByTagName("instance")[0].childNodes[0].nodeValue;
            if(instance != "call"){
                console.log ("Otrzymano wiadomosc: " + response);
                console.log("Typ wiadomosci: " + instance);
            }

            let clientListHTML = ""
            let ids = null
            let loginTemp = ""
            let myId = null
            let i = 0
            let id = 0
            let msg = ""
            let msgReObj = ""
            let reciverPubKey = ""
            let privKey = ""
            let decryptedText = ""
            let clientId = 0
            let tb = ""
            let myPubKey = ""
            let decryptedCall = ""
            let untransformArrayBuffer = ""
            
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


                        clientListHTML += "<div class='users'>"
                        clientListHTML += "<div class='avatar'>" + clientName[0] + "</div>"
                        clientListHTML += "<button class='cli btn-clients' onclick=\"client.request.getInner('"
                                + clientName + "')\">";
                        clientListHTML += clientName + "</br>";
                        clientListHTML += "</button>";
                        clientListHTML += "</div>"

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
                    privKey = globalPrivateKeyPem;
                    crypt.setPrivateKey(privKey);
                    decryptedText = crypt.decrypt(msg);
                    
                    msgReObj = globalMyInterface.GetRecipient (id);
                    
                    console.log(msgReObj);
                    globalMyInterface.ProvideChatWindow (msgReObj);
                    globalMyInterface.IncomingMessage (msgReObj, decryptedText);
                    break;

                case "call":
                    const id = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    const msg = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                
                    try {
                        if (!msg) {
                            console.error("Brak danych w wiadomości.");
                            break;
                        }
                
                        untransformArrayBuffer = this.pipe.untransform(msg)
                        this.audioChunks[this.chunkId] = untransformArrayBuffer;
                        this.chunkId += 1;
                        this.mediaHandler.addAudioFragment(untransformArrayBuffer);

                    } catch (error) {
                        console.error("Wystąpił błąd w obsłudze 'call':", error);
                    }
                    break;

                /*
                case "call":
                    const id = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    const msg = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                
                    try {
                        if (!msg) {
                            console.error("Brak danych w wiadomości.");
                            break;
                        }
                
                        const base64String = msg;
                        const binaryString = atob(base64String);
                        const byteArray = new Uint8Array(binaryString.length);
                
                        let j 
                        if(this.buffer.length == 0){
                            j = 0;
                        }else{
                            j = this.buffer.length
                        }

                        for (let i = 0; i < binaryString.length; i++) {
                            //byteArray[i] = binaryString.charCodeAt(i);
                            this.buffer[j]  = binaryString.charCodeAt(i);
                            j++;
                        }

                        this.audioChunks[this.chunkId] = byteArray;

                        this.chunkId += 1;

                        //this.buffer = this.loadAndPlayChunk(byteArray)

                        this.loadAndPlayChunk(this.buffer)                        
                        if(this.isPlaying == false){
                            this.source.start();
                            this.isPlaying = true;
                        }


                    } catch (error) {
                        console.error("Wystąpił błąd w obsłudze 'call':", error);
                    }
                    break;
                */

                /*
                case ("call"):
                    id = xmlDoc.getElementsByTagName("id")[0].childNodes[0].nodeValue;
                    msg = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    privKey = globalPrivateKeyPem;

                    decryptedCall = msg
                    const base64String = decryptedCall;
                    const binaryString = atob(base64String);
                    let byteArray = new Uint8Array(binaryString.length);

                    for (let i = 0; i < binaryString.length; i++) {
                        byteArray[i] = binaryString.charCodeAt(i);
                    }


                    if (byteArray instanceof ArrayBuffer) {
                        //console.log('ArrayBuffer length:', byteArray.byteLength);
                    } else {
                        console.error('decryptedCall nie jest ArrayBuffer!');
                    }

                    if (byteArray instanceof Uint8Array) {
                        //console.log('Uint8Array length:', byteArray.length);
                    }
                    
                    try {
                        //console.log(this.audioChunks);

                        
                        this.audioChunks[this.chunkId] = byteArray; 
                        this.chunkId += 1;
                    
                        
                        if (this.audio.currentTime > 0 && this.isPlaying) {
                            this.audioPlayingTime = this.audio.currentTime;
                            //this.audio.pause(); // Zatrzymujemy, aby dodać nowe kawałki
                        }
                    
                        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    
                        //this.audioUrl = URL.createObjectURL(this.audioBlob);
                        //this.audio = new Audio(this.audioUrl);

                        this.audio.src = URL.createObjectURL(this.audioBlob);
                    
                        if (this.audioPlayingTime > 0) {
                            this.audio.currentTime = this.audioPlayingTime; 
                            console.log("Time: " + this.audioPlayingTime)
                        }                        
                    
                        this.isPlaying = true;
                        this.audio.play().catch((error) => {
                            console.error("Błąd podczas odtwarzania audio:", error);
                        });
                    
                    } catch (error) {
                        console.error("Wystąpił błąd:", error);
                    }                                    
                    break;*/

                case ("pls"):
                    clientId = xmlDoc.getElementsByTagName("mid")[0].childNodes[0].nodeValue;
                    myPubKey = globalPublicKeyPem;
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
                    console.log("AAAAAAAAAAAAA:")
                    console.log(response);
                    reciverPubKey = xmlDoc.getElementsByTagName("msg")[0].childNodes[0].nodeValue;
                    //document.getElementById("reciverPubKey").innerHTML = reciverPubKey;
                    console.log("AAAAAAAAAAAAA:" + reciverPubKey)
                    ReciverPubKey = reciverPubKey
                    break;   

                default:
                    console.log(response);
                    break;
            }
        });        
    }

    connect(){

        function applyStyles() {
            const mediaQuery = window.matchMedia("(max-width: 1050px)");
            const textContainer = document.querySelector('.container-login');
            
            if (mediaQuery.matches) {
                if (textContainer) {
                    textContainer.style.display = 'none';
                }
            } else {
                if (textContainer) {
                    textContainer.style.display = '';
                }
            }
        }
        window.addEventListener('resize', applyStyles);
        applyStyles();


        this.myInterface.unreads.InitUnreadModule ();
        RecipientTable = new Array ();
        SelectedRecipient = null;
        ActiveChatWindow = null;
        //document.getElementById ("messages").innerHTML = "";
        
        url = document.getElementById('url').value;
        port = document.getElementById('port').value;
        MyUsername = login = document.getElementById('login').value;
        password = document.getElementById('password').value; 
        
        let content = document.getElementById("loginWindow");
        content.style.display = "none";

        content = document.getElementsByClassName("container")[0];
        content.style.display = "flex";   

        content = document.getElementById("particlesCanvas");
        content.style.display = "none";   


        /*
        function die(message) {
            throw new Error(message || "Execution stopped");
        }
        
        console.log("Kod przed die()");
        die("Zatrzymano kod!");
        console.log("Kod po die()");
        */
    
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
    
            //document.getElementById("you").innerHTML = login;
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
