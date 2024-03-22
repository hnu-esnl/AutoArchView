export { getSvgData };
let xlsx = require("node-xlsx");
const fs = require("fs");


import Vue from 'vue'
const vm = new Vue();


/**排序函数 */
function cmp(obj1, obj2) {
    var val1 = parseInt(obj1.rtePosition);
    var val2 = parseInt(obj2.rtePosition);
    // console.log(val1,val2,"xxxx")
    if (val1 < val2) {
        return -1;
    } else if (val1 > val2) {
        return 1;
    } else {
        return 0;
    }

}

/**导入xlsx文件函数 */
function onImportExcel(file, selectedNode) {
    let priorityArray = []; //读出来的优先级的数组，里面是很多对象{osName,priority}  
    let sheets = xlsx.parse(fs.readFileSync(file));
    // 获取上传的文件对象
    // console.log(sheets, '我是sheet');
    // 遍历 sheet
    let sheet = sheets[0].data; //默认一个excel表只有一个sheet所以我们取它的sheet[0] 
    let taskObject = {}
    // console.log('我是selectedNode',selectedNode);
    for (let i = 1; i < sheet.length; i++) {

        selectedNode.forEach(item => {
            // console.log(item)

            let swcName = sheet[i][0];
            if (item.hasOwnProperty('father')) {
                if (item['father'] === swcName) //如果有爸爸属性
                {
                    let itemOstask = sheet[i][2].split("/").slice(-1)[0]; //得到task的后缀
                    if (item['label'] === itemOstask) { //ostask也匹配上了
                        let runnableName = sheet[i][1];
                        let rtePosition = sheet[i][3];
                        let swcObj = { swcName, runnableName, rtePosition }
                        if (taskObject.hasOwnProperty(itemOstask)) {
                            //说明已经有这个ostask的属性了,给他push一个对象  
                            taskObject[itemOstask].push(swcObj);
                        } else //说明这个task第一次出现，则新增一个task{
                            taskObject[itemOstask] = [swcObj];
                    }
                }

            }
        })
    }
    return taskObject

}

function getSvgData(selectedNode, filepath, systemPath) {
    let osPriorityPath = systemPath + '\\OS PRIORITY.xlsx';
    let priorityArray = [];
    return new Promise((res, rej) => {
        let str = "";
        fs.access(osPriorityPath, (err) => {
            if (err) {
                vm.$alert('没有提供osTask的优先级将按照默认顺序排序！', '提示', {
                    confirmButtonText: '确定',
                    callback: action => { }
                });
            } else {
                let prioritySheet = xlsx.parse(fs.readFileSync(osPriorityPath))[0].data;

                for (let i = 2; i < prioritySheet.length; i++) {
                    let priorityObj = {}
                    priorityObj['osName'] = prioritySheet[i][0];
                    priorityObj['priority'] = prioritySheet[i][1];
                    priorityArray.push(priorityObj)
                }
            }

            let taskList = [];
            let taskObject = onImportExcel(filepath, selectedNode)
            // let priorityArray =  onImportExcel(filepath, selectedNode, systemPath)['priorityArray']
            console.log(taskObject, '我是taskObject')
            console.log('我是优先级', priorityArray)
            for (let task in taskObject) {
                //   console.log(task)
                taskObject[task].sort(cmp) //对每一个task数组按照rteposition排序
            }

            //默认排序，如果说没有给优先级那张表格，给taskObject按照时间排序,得到的是排好序的task的数组
            if (priorityArray.length === 0) {
                // console.log('我没有进来')
                taskList = Object.keys(taskObject).sort(
                    (a, b) => {
                        let String_a = a.split('_')[1];
                        let String_b = b.split('_')[1];
                        return String_a - String_b;
                    }
                )



            }
            //说明给了os的优先级那张表格有priorityArray
            else {
                console.log('我进来优先级排序啦啦啦')
                taskList = Object.keys(taskObject).sort(
                    (a, b) => {
                        let aPosition = -1;
                        let bPosition = -1;
                        priorityArray.forEach(item => {
                            if (a === item['osName']) {
                                aPosition = parseInt(item['priority'])
                                console.log(a, aPosition)
                            }
                            if (b === item['osName']) {
                                bPosition = parseInt(item['priority'])
                                console.log(b, bPosition)
                            }
                        })

                        return bPosition - aPosition; //osTask按照从大到小方式修改
                    })
                // console.log(taskList,'ingljglagj')
            }

            taskList.forEach(item => {
                console.log(item)
                // console.log(taskName[-1], "XSLGJLA")
                str += 'participant ' + item + '\n';
            })
            taskList.forEach(elem => {
                //    console.log(task)
                taskObject[elem].forEach(item => {
                    str += 'Note over ' + (elem + ": " + item['runnableName'] + '\n');
                    str += (elem + '--> ' + item['swcName'] + ' :' + item['runnableName'] + '\n ');
                })
            })
            // console.log(str)
            res(str)
            rej()
        });


    })
}