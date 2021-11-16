import { Component, OnInit } from '@angular/core';
import { Snackbar } from "../snackbar.service"
import { GeneralSetting } from "../genralSetting.service"
import { VerifoneService } from '../verifone.service';
import * as CryptoJS from 'crypto-js';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor( private readonly verifoneService:VerifoneService){

  }

  ngOnInit(): void {

  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet;
  }


  async getKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["decrypt", "encrypt"]
    );

    return keyPair;
  }

  base64ToArrayBuffer(b64: any) {
    var byteString = window.atob(b64);
    var byteArray = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }

    return byteArray;
  }

  removeLines(str: any) {
    return str.replace("\n", "");
  }

  pemToArrayBuffer(pem: any) {
    var b64Lines = this.removeLines(pem);
    var b64Prefix = b64Lines.replace('-----BEGIN PRIVATE KEY-----', '');
    var b64Final = b64Prefix.replace('-----END PRIVATE KEY-----', '');

    return this.base64ToArrayBuffer(b64Final);
  }

  async importPrivateKeyFromPem(privateKeyPem: any) {


    let privateKeyArrayBuffer = this.pemToArrayBuffer(privateKeyPem);

    var key = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyArrayBuffer,
      {
        name: "RSA-OAEP",
        hash: {
          name: "SHA-256"
        }
      },
      true,
      ["decrypt"]
    );
    return key;
  }

  async exportPrivateKeyToPem(privateKey: any) {
    let exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    var b64 = this.addNewLines(this.arrayBufferToBase64(exportedPrivateKey));
    var pem = "-----BEGIN PRIVATE KEY-----\n" + b64 + "-----END PRIVATE KEY-----";

    return pem;
  }

  async exportPublicKeyToBase64(publicKey: any) {
    const exported = await window.crypto.subtle.exportKey(
      "spki",
      publicKey
    );

    const exportedAsString = this.ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);

    return exportedAsBase64;
  }

  async decryptMessageWithPrivateKey(privateKey: any, cypherByteArray: any) {
    var vector = crypto.getRandomValues(new Uint8Array(3));
    return await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
        iv: vector
      },
      privateKey,
      cypherByteArray
    );

  }

  async decryptMessageWithPrivateKeyCryptoJS(privateKey: any, cypherByteArray: any) {
    let key = this.arrayBufferToBase64(privateKey);

    var vector = CryptoJS.lib.WordArray.random(3);

    //let cypertext = CryptoJS.enc.Base64.parse(cypherByteArray);

    var decrypt = await CryptoJS.AES.decrypt(
      cypherByteArray,
      CryptoJS.enc.Base64.parse(key),
      {
        iv: vector,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      }
    );

    let decryptedMessage = CryptoJS.enc.Base64.stringify(decrypt);

    return decryptedMessage;
  }

  ab2str(buf: any) {
    return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
  }

  arrayBufferToBase64(arrayBuffer: any) {
    var byteArray = new Uint8Array(arrayBuffer);
    var byteString = '';
    for (var i = 0; i < byteArray.byteLength; i++) {
      byteString += String.fromCharCode(byteArray[i]);
    }
    var b64 = window.btoa(byteString);

    return b64;
  }

  addNewLines(str: any) {
    var finalString = '';
    while (str.length > 0) {
      finalString += str.substring(0, 64) + '\n';
      str = str.substring(64);
    }

    return finalString;
  }

  async doRegister() {

    this.getKeyPair().then(async (data: any) => {
      //this.verifoneService.getKeyPairFromServer().toPromise().then(async (data: any) => {
      GeneralSetting.setVerifonePrivateKey(await this.exportPrivateKeyToPem(data.privateKey));
      GeneralSetting.setVerifonePublicKey(await this.exportPublicKeyToBase64(data.publicKey));

      console.log("PublicKey :- " + GeneralSetting.getVerifonePublicKey());
      console.log("PrivateKey :- " + GeneralSetting.getVerifonePrivateKey().toString());

      const posPort = 5015;

      const posIp = "192.168.1.222";

      var registerClientReq = {
        posPort: posPort,
        posIp: posIp,
        code: 1111,
        publicKey: GeneralSetting.getVerifonePublicKey()
      }

      GeneralSetting.setVerifonePosIp(posIp);

      this.verifoneService.connectAndRegisterVerifoneClient(registerClientReq).subscribe(async (data: any) => {
        //var data = await xml2Js.parseStringPromise(xmlResponse, { explicitArray: false });

        GeneralSetting.setVerifoneRegisterDevice(JSON.stringify(data));

        if (data && data != '' && data.RESPONSE.RESULT == 'OK') {

          console.log("Register Res :- " + JSON.stringify(data));

          const macKey = data.RESPONSE.MAC_KEY;
          const macLabel = data.RESPONSE.MAC_LABEL;

          console.log("Mac Label :- " + macLabel);
          console.log("Mac Key:- " + macKey);

          GeneralSetting.setVerifoneMacLabel(macLabel);
          GeneralSetting.setVerifoneMacKey(macKey);

          let privateKeyImported = await this.importPrivateKeyFromPem(GeneralSetting.getVerifonePrivateKey());

          let message = this.base64ToArrayBuffer(GeneralSetting.getVerifoneMacKey());

          try {
            let decrypted = await this.decryptMessageWithPrivateKey(privateKeyImported, message);
          }
          catch (e:any) {
            console.log(e.message);
          }

          try {
            let decrypted = await this.decryptMessageWithPrivateKeyCryptoJS(this.pemToArrayBuffer(GeneralSetting.getVerifonePrivateKey()), GeneralSetting.getVerifoneMacKey());

            console.log("Decrypted Message base 64 :- " + decrypted);

            GeneralSetting.setVerifoneDecryptedMessage(decrypted);
          }
          catch (e:any) {
            console.log(e.message);
          }

          this.verifoneService.testMac().toPromise().then((testMacRes: any) => {

            if (!testMacRes.RESPONSE || testMacRes.RESPONSE.RESULT != "OK") {

              console.log("Test Mac Res :- " + JSON.stringify(testMacRes));
            }
            else {
              console.log("Test Mac Res :- " + JSON.stringify(testMacRes));
            }
          });
        }
        else {
          Snackbar.show("Can't register something went wrong", 2500);
        }
      }, error => {
        console.log(error);
        Snackbar.show("Can't register something went wrong", 2500);
      });

    }, error => {
      console.log(error);
      Snackbar.show("Something went wrong", 2500);
    });

  }

  async doRegisterV2() {
    async function generateRSAKeyPairFromSubtleCrypto() {
      var keyPair = null;
      keyPair = crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: {
            name: "SHA-256"
          }
        },
        true,
        ["encrypt", "decrypt"]
      );
      return await keyPair;
    }

    function convertPrivateKeyToPem(privateKey: any) {
      var privateKeyPem = null;
      var privateKeyBuffer = new Uint8Array(privateKey);
      var privateKeyBase64 = btoa(String.fromCharCode.apply(null, privateKeyBuffer as any));
      privateKeyPem = "-----BEGIN PRIVATE KEY-----\n" + privateKeyBase64 + "\n-----END PRIVATE KEY-----";
      return privateKeyPem;
    }

    async function changeSubtlePrivateKeyToPemString(keyPair: any) {
      var pemString = "";
      var privateKey = keyPair.privateKey;
      var exportedKey = await crypto.subtle.exportKey(
        "pkcs8",
        privateKey
      );
      pemString = convertPrivateKeyToPem(exportedKey);
      return pemString.trim();
    }

    // convert pem string to array buffer
    function convertPemStringToArrayBuffer(pemString:any) {
      var lines = pemString.split("\n");
      var encoded = lines[1];
      for (var i = 2; i < lines.length - 1; i++) {
        encoded += lines[i];
      }
      return base64ToArrayBuffer(encoded);
    }


    // base 64 to array buffer
    function base64ToArrayBuffer(base64: any) {
      var binary_string = window.atob(base64);
      var len = binary_string.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }

    // decrypt aes 128 encrypted message with rsa private key
    async function decryptAES128EncryptedMessageWithRSA(encryptedMessage: any, privateKey: any) {
      var decryptedMessage = null;
      decryptedMessage = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: {
            name: "SHA-256"
          }
        } as any,
        privateKey,
        encryptedMessage
      );
      return decryptedMessage;
    }

    // import private key from pem string
    async function importPrivateKeyFromPemString(pemString:any) {
      var privateKey = await crypto.subtle.importKey(
        "pkcs8",
        convertPemStringToArrayBuffer(pemString),
        {
          name: "RSA-OAEP",
          hash: {
            name: "SHA-256"
          }
        },
        true,
        ["decrypt"]
      );
      return privateKey;
    }



    var keyPair = await generateRSAKeyPairFromSubtleCrypto();

    var privateKeyPemString = await changeSubtlePrivateKeyToPemString(keyPair);

    var publicKey = await this.exportPublicKeyToBase64(keyPair.publicKey);

    GeneralSetting.setVerifonePublicKey(publicKey);
    GeneralSetting.setVerifonePrivateKey(privateKeyPemString);


    console.log("PublicKey :- " + GeneralSetting.getVerifonePublicKey());
    console.log("PrivateKey :- " + GeneralSetting.getVerifonePrivateKey().toString());

    const posPort = 5015;

    const posIp = "192.168.1.222";

    var registerClientReq = {
      posPort: posPort,
      posIp: posIp,
      code: 1111,
      publicKey: GeneralSetting.getVerifonePublicKey()
    }

    GeneralSetting.setVerifonePosIp(posIp);

    this.verifoneService.connectAndRegisterVerifoneClient(registerClientReq).subscribe(async (data: any) => {
      //var data = await xml2Js.parseStringPromise(xmlResponse, { explicitArray: false });

      GeneralSetting.setVerifoneRegisterDevice(JSON.stringify(data));

      if (data && data != '' && data.RESPONSE.RESULT == 'OK') {

        console.log("Register Res :- " + JSON.stringify(data));

        const macKey = data.RESPONSE.MAC_KEY;
        const macLabel = data.RESPONSE.MAC_LABEL;

        console.log("Mac Label :- " + macLabel);
        console.log("Mac Key:- " + macKey);

        GeneralSetting.setVerifoneMacLabel(macLabel);
        GeneralSetting.setVerifoneMacKey(macKey);

        let privateKeyImported = await this.importPrivateKeyFromPem(GeneralSetting.getVerifonePrivateKey());

        let message = this.base64ToArrayBuffer(GeneralSetting.getVerifoneMacKey());

        try {
          let importedPrivateKey = await importPrivateKeyFromPemString(GeneralSetting.getVerifonePrivateKey());
          let decryptedMessage = await decryptAES128EncryptedMessageWithRSA(message, importedPrivateKey);

          console.log(decryptedMessage);
        }
        catch (e:any) {
          console.log(e.message);
        }

        try {
          let decrypted = await this.decryptMessageWithPrivateKeyCryptoJS(this.pemToArrayBuffer(GeneralSetting.getVerifonePrivateKey()), GeneralSetting.getVerifoneMacKey());

          console.log("Decrypted Message base 64 :- " + decrypted);

          GeneralSetting.setVerifoneDecryptedMessage(decrypted);
        }
        catch (e:any) {
          console.log(e.message);
        }

        this.verifoneService.testMac().toPromise().then((testMacRes: any) => {

          if (!testMacRes.RESPONSE || testMacRes.RESPONSE.RESULT != "OK") {

            console.log("Test Mac Res :- " + JSON.stringify(testMacRes));
          }
          else {
            console.log("Test Mac Res :- " + JSON.stringify(testMacRes));
          }
        });

      }
      else {
        Snackbar.show("Can't register something went wrong", 2500);
      }
    }, error => {
      console.log(error);
      Snackbar.show("Can't register something went wrong", 2500);
    });

  }


}
