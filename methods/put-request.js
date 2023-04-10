const requestBodyparser = require("../util/body-parser");
const { pool } = require('../methods/connection');
// const fs = require('fs');
let result;


module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];

  const regexNumbers = /^[0-9]+$/;

  // const regexV4 = new RegExp(
    // /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  // );

  if (!regexNumbers.test(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Échec de la validation",
        message: "L'UUID n'est pas valide",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
    try {
      let jsonData = await requestBodyparser(req);  
      
      await updateIntoDefunt(jsonData,id)
      .then(result => {
        res.writeHead(200, { "Content-Type": "application/json" });
        let jsonResult = JSON.stringify({
          "title": "Mise à jour de defunt avec succès",
          "message": result
        });
        res.end(jsonResult);
      })
      .catch(err => {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            title: "Impossible de mettre à jour ce defunt",
            error: err.error['message']['info'],
          })                 
        );
      });


    } catch (err) {
      console.log(err);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: "Request Json is not valid : "+err,
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};

async function updateIntoDefunt(jsonData,id) {
  return new Promise(async (resolve, reject) => {
    
  let connection;
  const tablesNames = Object.keys(jsonData);

  try {
    
    connection = await pool.acquire();

    // console.log(jsonData)
    // console.log("put 78- fin")


      for (let tableName of tablesNames) {

            // console.log("put 81 - tableName :",tableName)

        let table = jsonData[tableName];
        if(table != null){
        const tableFiels = Object.keys(table);
        
        let query1 = "SELECT * FROM "+tableName+" WHERE numerodefunt = ?";
        let values1 =  [id];

        let isExistTableInDB;
        try {
          const [rows, fields] = await connection.execute(query1,values1);
           isExistTableInDB = rows;


        }catch(err){
          console.log(err);
          if (connection) await connection.rollback();
          reject({
            title:'Error retrieving data from database',
            error: err
          });
        }

        if (isExistTableInDB.length > 0) {

          let updateQuery = "UPDATE "+tableName+" SET ";  
          let values = [];
          // const startIndex = tableName === 'decisionnaire'? 2:1;
          for (let i = 1 ; i < tableFiels.length; i++) { //i=1 //without numerodefunt --1 // 
            updateQuery += `${tableFiels[i]} = ?, `;
            values.push(table[tableFiels[i]]);
          }

          updateQuery = updateQuery.slice(0, -2) + " WHERE numerodefunt = "+id;   

          try{
            // const [rows, fields] = await connection.execute(updateQuery,values);
            const stmt = await connection.prepare(updateQuery);

            if (tableName === 'generated_documents' || tableName === 'uploaded_documents') {
              for (let i = 0; i < values.length; i++) {  //start from 0 cz just the news values
                if (values[i]) { // Only set if value is not null
                  const byteValue = Buffer.from(values[i], 'base64');
                  values[i] = byteValue;
                } 
              }
            } 

          const [rows, fields] = await stmt.execute(values);
            result = rows;

          }catch(err){
            console.log(err);
            reject({
              title:'Error retrieving data from database',
              error: err
            });
          }


          resolve(result); //status 200

        } else {

          let query = "INSERT INTO "+tableName+" ( numeroDefunt,"; //numeroDefunt, but what if the id n'exist pas //need to create defubnt first
          let values = [id]; //[];
          for (let i = 1; i < tableFiels.length; i++) {
            query += `${tableFiels[i]}, `;
            values.push(table[tableFiels[i]]);
          }
          query = query.slice(0, -2) + `) VALUES (?, `;
          for (let i = 1; i < tableFiels.length-1; i++) { //-1 because of numeroDefunt
            query += `?, `;
          }
          query = query.slice(0, -2) + `)`;


          // const [rows, fields] = await connection.execute(query,values);
          const stmt = await connection.prepare(query);

          if (tableName === 'generated_documents' || tableName === 'uploaded_documents') {
            for (let i = 1; i < values.length; i++) { // Start at index 1 to skip the first column
              if (values[i]) { // Only set if value is not null
                const byteValue = Buffer.from(values[i], 'base64');
                values[i] = byteValue;
              } 
            }
          } 
        const [result, fields] = await stmt.execute(values);
  
        result.push(rows);
        resolve(result); //add status 201
        }

        } //end if
      }


  } catch (err) {
    if (connection) await connection.rollback();
    reject({
      title:'Error retrieving data from database',
      error: err
    });
  } finally {
    if (connection) {
      await pool.release(connection);
    }
  }
  
  });
}
