class Request{   
    socket
    myInterface

    constructor(myInterface) {
        this.myInterface = myInterface
        this.pipe = new Pipe()
    }
     
    setSocket(socket){
        this.socket = socket
    }

    setMyInterface(myInterface){
        this.myInterface = myInterface
    }

    clients(){
        console.log("Func: clients")

        var tb  = "<tb>"
        tb += "<instance>clients</instance>"
        tb += "<id></id>"
        tb += "<msg></msg>"
        tb += "<mid></mid>"
        tb += "</tb>"
        this.socket.send(tb)
    }
    
    OutgoingMessage (msg) {
        var crypt = new JSEncrypt();
        var pubKey = ReciverPubKey; ///document.getElementById("reciverPubKey").innerHTML;
        console.log("DSUFS:  " + pubKey)
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
            this.myInterface.BuildMsgCloud (my, msg, true)
        );
        this.myInterface.scrollToBottom ();
    }

            // Funkcja do unikania niebezpiecznych znaków XML
            escapeXML(unsafe) {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&apos;");
            }

    call(chunk){
        var crypt = new JSEncrypt();
        var pubKey = ReciverPubKey;
        console.log("DSUFS:  " + pubKey)
        crypt.setPublicKey(pubKey);
        //var encryptedText = crypt.encrypt(chunk);

        
        var encryptedText = chunk;
        encryptedText = this.pipe.transform(chunk);

        /*
        const byteArray = new Uint8Array(chunk);
        const base64String = btoa(String.fromCharCode(...byteArray));
        encryptedText = base64String;*/

        var my = document.getElementById("my").innerHTML;

        var tb;
        tb  = "<tb>";
        tb += "<instance>call</instance>";
        tb += "<id>" + SelectedRecipient.username + "</id>";
        tb += "<msg>" + encryptedText + "</msg>";
        tb += "<mid>" + my + "</mid>";
        tb += "</tb>";

        console.log("Call: " + tb);
        socket.send(tb);

        /*
        SelectedRecipient.windowElement.appendChild(
            this.myInterface.BuildMsgCloud(my, encryptedText, true)
        );
        this.myInterface.scrollToBottom();*/
    }
    
    send(){
        var msgField = document.getElementById("msg"); 
        var msg = msgField.value;
        msgField.value = "";
        msgField.focus ();
        this.OutgoingMessage (msg);
        console.log("send");
    }
    
    plsKey(){        
        let myId  = document.getElementById("my").innerHTML;
        let clientId = document.getElementById("receiver").innerHTML;
        let tb  = "<tb>";
        tb += "<instance>pls_key</instance>";
        tb += "<id>" + clientId + "</id>";
        tb += "<msg>" + "" + "</msg>";
        tb += "<mid>" + myId + "</mid>";
        tb += "</tb>";
        console.log(tb)
        socket.send(tb);        
    }
    
    async getServerKey() {
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
    
    getInner(clientId){
        const rightColumn = document.querySelector('.right-column');
        const leftColumn = document.querySelector('.left-column');

        const usersButtons = document.querySelectorAll('.cli');

        if (usersButtons.length > 0) {
            usersButtons.forEach(button => {
                const usersClickHandler = function () {
                    const rightColumn = document.querySelector('.right-column');
                    const leftColumn = document.querySelector('.left-column');
        
                    if (rightColumn && leftColumn) {
                        rightColumn.style.display = '';
                        leftColumn.style.display = 'none';
                        leftColumn.style.width = '20%';
                    }
        
                    button.removeEventListener('click', usersClickHandler);
                };
        
                button.addEventListener('click', usersClickHandler);
            });
        }


        console.log("getInner START");
        //document.getElementById("client").value = clientId;
        document.getElementById("receiver").innerHTML = clientId;
        
        this.myInterface.ProvideChatWindow (SelectedRecipient = this.myInterface.GetRecipient (clientId));
        this.myInterface.ChActiveWnd (SelectedRecipient.windowElement);
        this.myInterface.xunreads.SignalChatRead (SelectedRecipient);
        this.plsKey();
        console.log("getInner END");
    }
}