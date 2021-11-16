/**
 * @AUTHOR: mario.cecena@samsung.com
 * @description: Node Menu.
 */

var Logic = function () {
    var portServer = 8080;
    var express = null;
    var app = null;
    var server = null;
    var io = null;
    var fs = null;
    var path = null;
    var globalSocket = null;
    var fetch = null;
    var cors = null;
    var querystring;
    var request = null;
    var bodyParser = null;
    var net = null;
    var verifoneClient = null;
    var xmlToJsonParser = null;
    var crypto = null;

    try {
        express = require("express");
        app = express();
        server = require("http").Server(app);
        io = require("socket.io")(server);
        fs = require("fs");
        path = require("path");
        fetch = require("node-fetch");
        cors = require("cors");
        querystring = require("querystring");
        request = require("request");
        bodyParser = require("body-parser");
        net = require('net');
        crypto = require("crypto");
        xmlToJsonParser = require('xml2json-light');

    } catch (e) {
        console.error(e);
    }

    verifone();
    verifone.setXmlToJsonParser(xmlToJsonParser);
    verifone.setFirstTimeLoad(false);
    verifone.setIsTransaction(false);
    verifone.setVerifoneApiRes(null);
    verifone.setNetPackage(net);
    verifone.setCryptoPackage(crypto);


    var info = process.versions;

    app.io = io;

    // app.use(express.json()) // for parsing application/json
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(cors());
    app.use(express.json()); // for parsing application/json

    app.use("/static", express.static("/opt/usr/home/owner/content/Downloads"));

    app.use("", express.static(path.join(__dirname, "", "Menu")));

    app.get("/data", function (req, res) {
        var ip = (
            req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            ""
        )
            .split(",")[0]
            .trim();
        req.app.io.emit("consoleLog", "[MENU/DATA] Requested FW info from: " + ip);
        var x = __dirname.split("/");
        res.sendFile(
            path.join(
                __dirname,
                "../../../../../home/owner/apps_rw/" + x[4] + "/data",
                "datasource.txt"
            )
        );
    });

    //Start servers
    server.listen(portServer, function () { });

    app.post("/proxy", function (req, res) {
        io.emit("requestData", req.body);

        var newBody = {
            grant_type: "client_credentials",
            client_id: req.body.username,
            client_secret: req.body.secret,
            scope: "marketplace",
        };

        var formData = querystring.stringify(newBody);
        var contentLength = formData.length;

        request(
            {
                headers: {
                    "Content-Length": contentLength,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                uri: req.body.url,
                body: formData,
                method: "POST",
            },
            function (err, response, body) {
                if (err) {
                    res.send(err);
                } else if (response.statusCode == 200) {
                    res.send(body);
                } else {
                    res.send("error");
                }
            }
        );
    });

    // Verifone Offline Payment Senario 

    app.post("/verifoneRegisterDevice", function (req, res) {
        var reqData = req.body;

        verifone.setVerifoneApiRes(res);

        verifone.verifoneCreateConnection(reqData.posPort, reqData.posIp, reqData.code, reqData.publicKey);
    });

    app.post("/testMacVerifone", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);

        verifone.doTestMac(reqData.message, reqData.counter, reqData.macLable);
    });

    app.post("/doStartVerifoneSession", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);

        verifone.doStartVerifoneSession(reqData.message, reqData.counter, reqData.macLable, reqData.Invoice,reqData.posIp);
    });

    app.post("/doEndVerifoneSession", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);
        // var hash = reqData.MAC;
        // var decriptedMessage = new Buffer(reqData.message);

        verifone.doEndVerifoneSession(reqData.message, reqData.counter, reqData.macLable);
    });

    app.post("/doVerifoneTransaction", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);

        verifone.doVerifoneTransaction(reqData.message, reqData.counter, reqData.macLable, reqData.amount);
    });

    app.post("/doVerifoneCounter", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);

        verifone.getVerifoneCounter();
    });

    app.post("/doQueryVerifoneOfflineTransaction", function (req, res) {
        var reqData = req.body;
        verifone.setVerifoneApiRes(res);

        verifone.queryOfflineTransactions(reqData.message, reqData.counter, reqData.macLable);
    });

    // Verifone Offline Senario

    return "Loaded";
};

module.exports = Logic;


function verifone() {
    //public method set
    verifone.setVerifoneClient = setVerifoneClient;
    verifone.verifoneCreateConnection = verifoneCreateConnection;
    verifone.setIsTransaction = setIsTransaction;
    verifone.setVerifoneApiRes = setVerifoneApiRes;
    verifone.setFirstTimeLoad = setFirstTimeLoad;
    verifone.setXmlToJsonParser = setXmlToJsonParser;
    verifone.setNetPackage = setNetPackage;
    verifone.setCryptoPackage = setCryptoPackage;
    verifone.doTestMac = doTestMac;
    verifone.doStartVerifoneSession = doStartVerifoneSession;
    verifone.doEndVerifoneSession = doEndVerifoneSession;
    verifone.doVerifoneTransaction = doVerifoneTransaction;
    verifone.getVerifoneCounter = getVerifoneCounter;
    verifone.queryOfflineTransactions = queryOfflineTransactions;

    // public method set end

    var isTransaction = false;
    var verifoneClient = null;
    var verifoneApiRes = null;
    var firstTimeLoad = false;
    var xmlToJsonParser = true;
    var netPackage = null;
    var cryptoPackage = null;
    var transactionResArray = [];
    var transactionDataBuilder = "";

    function setIsTransaction(value) {
        isTransaction = value;
    }

    function setVerifoneApiRes(apiResRef) {
        verifoneApiRes = apiResRef;
    }

    function setFirstTimeLoad(value) {
        firstTimeLoad = value;
    }

    function setXmlToJsonParser(xmlToJsonParserRef) {
        xmlToJsonParser = xmlToJsonParserRef;
    }

    function setNetPackage(netRef) {
        netPackage = netRef;
    }

    function setCryptoPackage(crypto) {
        cryptoPackage = crypto;
    }

    function verifoneCreateConnection(port, posIp, registerCode, publicKey) {
        try {
            isTransaction = false;
            verifoneClient = netPackage.createConnection({
                port: port,
                // host: '192.168.1.227'
                host: posIp
            }, () => {
                var verifoneRegisterReq = ` 
                <TRANSACTION>
                  <FUNCTION_TYPE>SECURITY</FUNCTION_TYPE>
                  <COMMAND>REGISTER</COMMAND>
                  <ENTRY_CODE>${registerCode}</ENTRY_CODE>
                  <KEY>${publicKey}</KEY>
                </TRANSACTION>`;

                if (verifoneClient) {
                    verifoneClient.write(verifoneRegisterReq);
                }
            });

            setVerifoneClient();
        }
        catch (e) {
            var errorRes = {
                isError: true,
                error: "Some Error"
            }

            verifoneApiRes.send(errorRes);
        }
    }

    function setVerifoneClient() {

        var errorRes = {
            isError: true,
            error: "Some Error"
        }

        if (verifoneClient) {
            try {
                // res.send(Object.keys(verifoneClient).toString());
                // res.send("Connection Created");
                verifoneClient.on('data', (data) => {
                    verifoneDataRes(data);
                });
            }
            catch (e) {
                res.send(errorRes);
            }
        }
        else {
            verifoneApiRes.send(errorRes);
        }
    }

    function verifoneDataRes(data) {
        if (isTransaction) {
            if (firstTimeLoad) {
                console.log("first time ");
                firstTimeLoad = false;
                setTimeout(() => {
                    transactionUpdate(data);
                }, 0);
            }
            else {
                console.log("second Time");
                setTimeout(() => {
                    transactionUpdate(data);
                }, 100);
            }

            return;
        }
        else {
            try {
                var verifoneRes = xmlToJsonParser.xml2json(data.toString());

                var jsonResult = JSON.parse(JSON.stringify(verifoneRes));
                verifoneApiRes.send(jsonResult);
            }
            catch (e) {
                var resError = {
                    isError: true,
                    error: e.message
                }

                verifoneApiRes.send(resError);
            }
        }
    }

    function transactionUpdate(data) {

        console.log("Current Transaction Data :- " + data.toString());

        transactionResArray = transactionResArray.concat(data);

        transactionDataBuilder += data.toString();

        try {
            console.log("transactionDataBuilder :- " + transactionDataBuilder);

            var xmlToJsonData = xmlToJsonParser.xml2json(transactionDataBuilder);

            var jsonResult = JSON.parse(JSON.stringify(xmlToJsonData));

            isTransaction = false;

            verifoneApiRes.send(jsonResult);
        }
        catch (e) {
            console.log("In Transaction Error :- " + transactionResArray.toString());

            isTransaction = true;
        }

    }

    function doTestMac(cypherText, counter, macLable) {
        var message = new Buffer(cypherText, 'base64');

        var MAC = cryptoPackage.createHmac("sha256", message).update(counter.toString()).digest('base64');
        isTransaction = false;
        var verifoneTestMAC = ` 
        <TRANSACTION>
          <FUNCTION_TYPE>SECURITY</FUNCTION_TYPE>
          <COMMAND>TEST_MAC</COMMAND>
          <MAC_LABEL>${macLable}</MAC_LABEL>
          <MAC>${MAC}</MAC>
          <COUNTER>${counter}</COUNTER>
        </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

    function doStartVerifoneSession(cypherText, counter, macLable, invoice,posIp) {
        var message = new Buffer(cypherText, 'base64');

        var MAC = cryptoPackage.createHmac("sha256", message).update(counter.toString()).digest('base64');

        isTransaction = false;
        transactionResArray = [];
        transactionDataBuilder = "";

        var date = new Date();
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().length < 2 ? "0" + (date.getMonth() + 1) : "" + (date.getMonth() + 1);
        var day = date.getDate().toString().length < 2 ? "0" + date.getDate() : "" + date.getDate();
        var businessDate = year + month + day;
        

        var verifoneTestMAC = ` 
        <TRANSACTION>
          <FUNCTION_TYPE>SESSION</FUNCTION_TYPE>
          <COMMAND>START</COMMAND>
          <BUSINESSDATE>${businessDate}</BUSINESSDATE>
          <SWIPE_AHEAD>1</SWIPE_AHEAD>
          <TRAINING_MODE>0</TRAINING_MODE>
          <INVOICE>134533</INVOICE>
          <POS_IP>${posIp}</POS_IP>
          <POS_PORT>5015</POS_PORT>
          <COUNTER>${counter}</COUNTER>
          <MAC_LABEL>${macLable}</MAC_LABEL>
          <MAC>${MAC}</MAC>
          <NOTIFY_SCA_EVENTS>FALSE</NOTIFY_SCA_EVENTS>
    
        </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

    function doEndVerifoneSession(cypherText, counter, macLable) {
        var message = new Buffer(cypherText, 'base64');

        var MAC = cryptoPackage.createHmac("sha256", message).update(counter.toString()).digest('base64');
        isTransaction = false;
        var verifoneTestMAC = ` 
        <TRANSACTION>
          <FUNCTION_TYPE>SESSION</FUNCTION_TYPE>
          <COMMAND>FINISH</COMMAND>
          <COUNTER>${counter}</COUNTER>
          <MAC_LABEL>${macLable}</MAC_LABEL>
          <MAC>${MAC}</MAC>
        </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

    function doVerifoneTransaction(cypherText, counter, macLable, amount) {
        var message = new Buffer(cypherText, 'base64');

        var MAC = cryptoPackage.createHmac("sha256", message).update(counter.toString()).digest('base64');

        isTransaction = true;
        transactionResArray = [];
        transactionDataBuilder = "";

        var verifoneTestMAC = ` 
                  <TRANSACTION>
                    <FUNCTION_TYPE>PAYMENT</FUNCTION_TYPE>
                    <COMMAND>CAPTURE</COMMAND>
                    <PAYMENT_TYPE></PAYMENT_TYPE>
                    <TRANS_AMOUNT>${amount}</TRANS_AMOUNT>
                    <MANUAL_ENTRY>FALSE</MANUAL_ENTRY>
                    <FORCE_FLAG>FALSE</FORCE_FLAG>
                    <MAC_LABEL>${macLable}</MAC_LABEL>
                    <MAC>${MAC}</MAC>
                    <COUNTER>${counter}</COUNTER>
                  </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

    function getVerifoneCounter() {
        isTransaction = false;

        var verifoneTestMAC = `                
                <TRANSACTION>
                    <FUNCTION_TYPE>ADMIN</FUNCTION_TYPE>
                    <COMMAND>GET_COUNTER</COMMAND>
                </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

    function queryOfflineTransactions(cypherText, counter, macLable) {
        var message = new Buffer(cypherText, 'base64');

        var MAC = cryptoPackage.createHmac("sha256", message).update(counter.toString()).digest('base64');
        
        isTransaction = false;

        var verifoneTestMAC = `                
                <TRANSACTION>
                        <FUNCTION_TYPE>SAF</FUNCTION_TYPE>
                        <COMMAND>QUERY</COMMAND>
                        <COUNTER>${counter}</COUNTER>
                        <MAC>${MAC}</MAC>
                        <MAC_LABEL>${macLable}</MAC_LABEL>
                        <SAF_STATUS>PROCESSED</SAF_STATUS>
                </TRANSACTION>`;

        verifoneClient.write(verifoneTestMAC);
    }

}

Logic();