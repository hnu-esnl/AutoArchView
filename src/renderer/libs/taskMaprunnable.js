/**os的task和runnable的匹配**/

var fs = require('fs');
var path = require('path'); //解析需要遍历的文件夹

// const { mainModule } = require('process');
const xml2js = require('xml2js');


/**获取文件夹列表**/
async function getFileList(filePath) {
    var patt = /_swc/
    var fileList = []
    return new Promise((resolve, reject) => {
        fs.readdir(filePath, function(err, files) {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                // console.log('xxxx',files,typeof(files))
                files.forEach(function(filename) {
                    //去掉ASW里面的ARXML的_swc的后缀，才能匹配到ecu_ecu里面的内容
                    // console.log(filename)
                    if (patt.test(filename)) {
                        fileList.push(filename.slice(0, -10))
                    } else {
                        fileList.push(filename.slice(0, -6))
                    }

                });
            }
            resolve(fileList)
        })
    })
}
async function readFiletoXml(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err)
                reject(err)
            resolve(data)
        })
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
            if (!error)
                fs.writeFile('./testFalse.json', JSON.stringify(result), (err) => {
                    if (!err) {
                        // console.log(result)
                        resolve(result);
                    } else reject(error)
                })

        })
    })

}

function taskMapRunnable(ecuObject, fileList) {
    let patt = /_EcuSwComposition/

    // console.log(ecuObject['SHORT-NAME'])
    if (patt.test(ecuObject['SHORT-NAME'][0])) {

        let mapObject = {}
        let swcName = ecuObject['SHORT-NAME'][0].slice(0, -17); //去掉名字后面的_ECUcomposition后缀
        let runTotask = []
        if (fileList.findIndex(ele => ele === swcName) !== -1) {
            // console.log(shortname)
            ecuObject['SUB-CONTAINERS'][0]['ECUC-CONTAINER-VALUE'].forEach(item => {
                let runnableName = item['SHORT-NAME'][0]
                if (item.hasOwnProperty('REFERENCE-VALUES')) {
                    runTotaskObject = {}
                    item['REFERENCE-VALUES'][0]['ECUC-REFERENCE-VALUE'].forEach(item2 => {

                        if (item2['DEFINITION-REF'][0]['_attrkey']['DEST'] === 'ECUC-REFERENCE-DEF') //这个值可能得去掉refencence
                        // if(item2['DEFINITION-REF'][0]['_attrkey']['DEST']==='ECUC-REFERENCE-DEF'||item2['DEFINITION-REF'][0]['_attrkey']['DEST']==='ECUC-FOREIGN-REFERENCE-DEF')  
                        {


                            runTotaskObject['runnableName'] = runnableName;
                            runTotaskObject['osTask'] = item2['VALUE-REF'][0]['_charkey'];

                        }
                        if (item2['DEFINITION-REF'][0]['_attrkey']['DEST'] === 'ECUC-FOREIGN-REFERENCE-DEF') {
                            // runTotaskObject['runnableName'] = runnableName;
                            runTotaskObject['eventName'] = item2['VALUE-REF'][0]['_charkey'];

                        }
                    })
                    if (item.hasOwnProperty('PARAMETER-VALUES')) {
                        item['PARAMETER-VALUES'][0]['ECUC-NUMERICAL-PARAM-VALUE'].forEach(item2 => {
                            if (item2['DEFINITION-REF'][0]['_attrkey']['DEST'] === 'ECUC-INTEGER-PARAM-DEF') {
                                runTotaskObject['RtePosition'] = item2['VALUE'][0];

                            }
                        })
                        if (!runTotaskObject.hasOwnProperty('RtePosition')) {
                            runTotaskObject['RtePosition'] = "NULL";
                        }
                    }

                    runTotask.push(runTotaskObject);
                }



            })
            mapObject['shortName'] = swcName;
            mapObject['runnableMapTask'] = runTotask
            return mapObject
        }
    }

}






async function main() {

    let aswMapList = [];
    /**获取runnable的object */
    //调用文件遍历方法
    let filePath = path.resolve('D:\\education\\CSP1\\ud\\Asw\\ARXML');
    let fileList = await getFileList(filePath);
    // let xmlString = await fileDisplay(filePath);
    // console.log(xmlString)
    // var runnableString = getRunnables(xmlString)
    // let runnableObject = await parseXmlString(runnableString);


    /** 获取rte文件的object **/
    let rteFilePath = path.resolve('D:\\education\\CSP1\\ud\\Conf\\MICROSAR\\Davinci\\Config\\ECUC\\Rte_Rte\\BDU8_1_Rte_Rte_ecuc.arxml')
    let rteXmlString = await readFiletoXml(rteFilePath);
    let rteObject = await parseXmlString(rteXmlString);
    // console.log(rteObject)
    let rteObject1 = rteObject['AUTOSAR']['AR-PACKAGES'][0]['AR-PACKAGE'][0]['ELEMENTS'][0]['ECUC-MODULE-CONFIGURATION-VALUES'][0]['CONTAINERS'][0]['ECUC-CONTAINER-VALUE'];

    rteObject1.forEach((item) => {
            // console.log(item)
            let mapObject = taskMapRunnable(item, fileList);
            if (mapObject) {
                aswMapList.push(mapObject)
            }

        })
        // console.log(aswMapList,aswMapList.length)
    fs.writeFile('mappingNew2.json', JSON.stringify(aswMapList), err => {
        if (!err) {
            console.log("ok")
        }
    })
    let writeData = JSON.stringify(runnableMsg);
    writeFile('runnalePort.json', writeData, (err, data) => {
        if (!err) {
            console.log('写入文件成功')
        } else {
            console.log(err);
        }
    })

}
main()