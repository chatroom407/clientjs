class Request{   
    socket
    myInterface

    constructor(myInterface) {
        this.myInterface = myInterface
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
        var pubKey = document.getElementById("reciverPubKey").innerHTML;
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
    
    send(){
        var msgField = document.getElementById("msg"); 
        var msg = msgField.value;
        msgField.value = "";
        msgField.focus ();
        this.OutgoingMessage (msg);
    }
    
    plsKey(){
        let myId  = document.getElementById("my").innerHTML;
        let clientId = document.getElementById("client").value;
        let tb  = "<tb>";
        tb += "<instance>pls_key</instance>";
        tb += "<id>" + clientId + "</id>";
        tb += "<msg>" + "" + "</msg>";
        tb += "<mid>" + myId + "</mid>";
        tb += "</tb>";
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
        console.log("getInner");
        document.getElementById("client").value = clientId;
        document.getElementById("receiver").innerHTML = clientId;
        
        this.myInterface.ProvideChatWindow (SelectedRecipient = this.myInterface.GetRecipient (clientId));
        this.myInterface.ChActiveWnd (SelectedRecipient.windowElement);
        this.myInterface.xunreads.SignalChatRead (SelectedRecipient);
        this.plsKey();
    }
}