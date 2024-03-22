/**
 * File: sqlite.js.
 * Author: W A P.
 * Email: 610585613@qq.com.
 * Datetime: 2018/07/24.
 */
 
 var fs = require('fs');
 var sqlite3 = require('sqlite3').verbose();
  
 var DB = DB || {};
  
 function SqliteDB (file){
     DB.db = new sqlite3.Database(file);
  
     DB.exist = fs.existsSync(file);
     if(!DB.exist){
         console.log("Creating db file!");
         fs.openSync(file, 'w');
     };
 };
  
 DB['printErrorInfo'] = function(err){
     console.log("Error Message:" + err.message + " ErrorNumber:" + errno);
 };
  
 SqliteDB.prototype.createTable = function (sql){
    
     DB.db.serialize(function(){
         DB.db.run(sql, function(err){
            // console.log('cuozaina')
             if(null != err){
                 DB.printErrorInfo(err);
                 return;
             }
         });
     });
 };
  
 /// tilesData format; [[level, column, row, content], [level, column, row, content]]
 SqliteDB.prototype.insertData = function(sql, objects){
     DB.db.serialize(function(){
         var stmt = DB.db.prepare(sql);
         for(var i = 0; i < objects.length; ++i){
             stmt.run(objects[i]);
         }
     
         stmt.finalize();
     });
 };
  
 //查询数据库里面所有的满足条件的内容
 SqliteDB.prototype.queryData = function(sql, callback){
    //  console.log('nidaoshichaxuna')
     DB.db.all(sql, function(err, rows){
         if(null != err){
             DB.printErrorInfo(err);
             return;
         }
  
         /// deal query data.
         if(callback){
             callback(rows);
         }
     });
 };
  
 SqliteDB.prototype.executeSql = function(sql){
     DB.db.run(sql, function(err){
         if(null != err){
             DB.printErrorInfo(err);
         }
     });
 };
  
 SqliteDB.prototype.close = function(){
     DB.db.close();
 };
  
 export {SqliteDB}
//  exports.SqliteDB = DB.SqliteDB;