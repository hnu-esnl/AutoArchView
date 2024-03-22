const folderlist = [];
const xml2js = require('xml2js');
const {
    readFileSync,
    readdir,
    writeFile,
    statSync,
    readFile,
    stat,
    read,
    mkdir,
    fstat,
    readdirSync
} = require("fs");
let path = require('path');//path模块

/**读ARXML文件返回的是读取的xmlString */

const { mainModule } = require('process');
function readPavastFileSync(fullPath) {
    let xmlString = readFileSync(fullPath, {
        encoding: "utf8"
    });
    return xmlString;
}

/*解析xmlString*/
function parseXmlString(xmlString) {
   
    /**explicitArray参数：除根节点外，所有节点的孩子均构造为数组 */
    return new Promise((resolve,reject)=>{
        xml2js.Parser({
            explicitArray: true,
            attrkey: "_attrkey",
            charkey: "_charkey",
            childkey: "_childkey"
        }).parseString(xmlString, (error, result) => {
           if(!error)
                writeFile('./alc3.json',JSON.stringify(result),(err)=>{
                    if(!err)
                {
                    // console.log(result)
                    resolve( result);
                }
            else reject(error)
                })
                
            })
    })
 }

/**根据路径获取FC、BC name */
function getFCBCNameSync(fullPath) {
    let FCName;
    let BCName;
    let fullPathMatch = fullPath.split(/[\\\/]/);
    console.log(fullPathMatch);

    if (fullPathMatch.length >= 3) {
        BCName = fullPathMatch[fullPathMatch.length - 3];
        FCName = fullPathMatch[fullPathMatch.length - 2];
    } else if (fullPathMatch.length >= 2) {
        FCName = fullPathMatch[fullPathMatch.length - 2];
    }

    return {
        FCName,
        BCName
    };
}


/**找到指定的Asw文件夹"**/
function extractFileSync(Path, formatASW) {	   
    // let folderNew = `${folderTarget}_${format}`;
         let files = readdirSync(Path); 
            //遍历读取到的文件列表
            for(let i = 0;i<files.length;i++){
                let filePath = path.join(Path, files[i]);//完整的路径
                //  console.log(files[i],'->',filePath);
                let stats = statSync(filePath);  
                    if(stats.isDirectory())  //读取的是否是文件夹
                    {
                        if(files[i] === formatASW){ //判断读取的文件夹名称是否是ASW，如果是进入新一轮判断        
                           return(filePath);
                        }
                        else{ 
                            let fPath = filePath.replace(/\\/g,'\\\\');
                            // console.log(fPath,"=>",files[i])
                            let t = extractFileSync(fPath,formatASW); //递归直到找到ASW文件夹
                            if(t!=='cannot find file')
                            {
                                return t;
                            }
                        
                            
                        }
                    }
                }
            return 'cannot find file'
    }

/**提取一个目录文件夹里指定类型（如：同一后缀名）的文件,format是匹配规则，folderTarget是文件夹路径"**/   
function findARXML(filePath,format,pathlist){
    let filelist = readdirSync(filePath);
    filelist.forEach((fileitem)=>{       
        let filePath1 = path.join(filePath,fileitem);
        // console.log(filePath1)
        const stats =statSync(filePath1); 
        let isFile = stats.isFile();//是文件
        let isDir = stats.isDirectory(); //是文件夹
        if (isFile) {
            if (fileitem.split('.').pop().toLowerCase() === format) {
                pathlist.push(filePath1);
                // console.log(pathlist)
             }
         }
        else if(isDir){
            return findARXML(filePath1,format,pathlist); //递归调用
        }  
     })
     return pathlist;
}

function getFolder(path,format){
    //  let = {FC,BC}=getFCBCNameSync();
    // console.log(path);
    let filepath = extractFileSync(path,format);
    const pathList = findARXML(filepath,'arxml',[]);
    return pathList; 
}
	

export{getFolder}