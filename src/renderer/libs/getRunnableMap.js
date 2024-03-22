/**读ARXML文件 */
const xml2js = require('xml2js');
const {
    readFileSync,
    readdirSync,
    writeFile,
    statSync,
    readFile,
    fstat
} = require("fs");
const path = require("path");

function readPavastFile(fullPath) {
    return new Promise((resolve, reject) => {
        readFile(fullPath, "utf8", (err, data) => {
            if (!err) {
                //  console.log(data);
                resolve(data);
            } else {
                console.log(err);
                reject(err)
            }

        });
    })
}

function parseXmlString(xmlString) {

    /**explicitArray参数：除根节点外，所有节点的孩子均构造为数组 */
    return new Promise((resolve, reject) => {
        xml2js.Parser({
            explicitArray: true,
            attrkey: "_attrkey",
            charkey: "_charkey",
            childkey: "_childkey"
        }).parseString(xmlString, (error, result) => {
            if (!error) {
                // console.log(result)
                resolve(result);
            } else reject(error)
        })
    })

}


async function getRunnableMap(fileLists) {
    let runnableMsg = {};
    var patt = /<RUNNABLES>[\s\S]*<\/RUNNABLES>/g;
    for (let i = 0; i < fileLists.length; i++) {
        let file = fileLists[i];
        let swcName = file.split('\\')[file.split('\\').length - 1].split(".")[0]; //得到对应的swc的名字
        let runnableList = [];

        // let swcName = portLists[i];
        let xmlString = await readPavastFile(file);
        // console.log(xmlString)
        var runnableXml = xmlString.match(patt); //匹配得到runnable那一段的Xml
        // console.log(n[0])
        if (runnableXml) {
            let runnableObject = await parseXmlString(runnableXml[0]); //解析xml标签为xml对象
            // console.log(runnableObject)
            // console.log(swcName)
            let runnableEntity = runnableObject['RUNNABLES']['RUNNABLE-ENTITY'];
            // console.log(runnableEntity, "xlsjglajg")

            runnableEntity.forEach(item => {
                let runnableDetailObject = {}
                runnableDetailObject['runnableName'] = item['SHORT-NAME'][0]; //将一个rrunnble的Name存入对象里面


                //找到dataReceive 也就是接受数据的rport
                if (item.hasOwnProperty('DATA-RECEIVE-POINT-BY-ARGUMENTS')) {
                    let rPort = item['DATA-RECEIVE-POINT-BY-ARGUMENTS'][0]['VARIABLE-ACCESS'];

                    let receiveInterface = [];
                    // console.log(pPort)
                    rPort.forEach(item2 => {
                        let rPortLong = item2['ACCESSED-VARIABLE'][0]['AUTOSAR-VARIABLE-IREF'][0]['PORT-PROTOTYPE-REF'][0]['_charkey'].split("/");
                        let length = rPortLong.length;
                        receiveInterface.push(rPortLong[length - 1]);
                        // console.log(rPort, "ASLGJ")
                    })
                    runnableDetailObject['receivePort'] = receiveInterface;
                }


                if (item.hasOwnProperty('DATA-SEND-POINTS')) {
                    let pPort = item['DATA-SEND-POINTS'][0]['VARIABLE-ACCESS'];

                    let sendInterface = [];
                    // console.log(pPort)
                    pPort.forEach(item2 => {
                        let pPortLong = item2['ACCESSED-VARIABLE'][0]['AUTOSAR-VARIABLE-IREF'][0]['PORT-PROTOTYPE-REF'][0]['_charkey'].split("/");
                        let length = pPortLong.length;
                        sendInterface.push(pPortLong[length - 1]);
                        // console.log(rPort, "ASLGJ")
                    })
                    runnableDetailObject['sendPort'] = sendInterface;
                }

                if (item.hasOwnProperty('SERVER-CALL-POINTS')) {
                    let rPort = item['SERVER-CALL-POINTS'][0]['SYNCHRONOUS-SERVER-CALL-POINT'];

                    let clientInterface = [];
                    // console.log(pPort)
                    rPort.forEach(item2 => {
                        let rPortLong = item2['OPERATION-IREF'][0]['CONTEXT-R-PORT-REF'][0]['_charkey'].split('/');
                        let length = rPortLong.length;
                        // let client = rPortLong[length - 1];
                        clientInterface.push(rPortLong[length - 1])
                            // console.log(rPort, "ASLGJ")
                    })
                    runnableDetailObject['clientPort'] = clientInterface;
                }

                runnableList.push(runnableDetailObject);
            })

        }

        runnableMsg[swcName] = runnableList;
    }
    console.log(runnableMsg)

    // console.log(portData);
    let writeData = JSON.stringify(runnableMsg);
    writeFile('runnalePort.json', writeData, (err, data) => {
        if (!err) {
            console.log('写入文件成功')
        } else {
            console.log(err);
        }
    })
    return portData;
}
getRunnableMap(['D:\\education\\CSP1\\ud\\Asw\\ARXML\\ALC_10ms.arxml', 'D:\\education\\CSP1\\ud\\Asw\\ARXML\\ANC_InputProcess.arxml'])

// export  function getXmlData(fileLists,portLists){
//     saveXmlString(fileLists,portLists).then(v=>{
//         console.log(v)
//         return v;
//     })
//    }