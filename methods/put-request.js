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

      for (let tableName of tablesNames) {

        let table = jsonData[tableName];
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
          for (let i = 1; i < tableFiels.length; i++) { //i=1 //without numerodefunt --1 test
            updateQuery += `${tableFiels[i]} = ?, `;
            values.push(table[tableFiels[i]]);
          }

          updateQuery = updateQuery.slice(0, -2) + " WHERE numerodefunt = "+id;   

          const [rows, fields] = await connection.execute(updateQuery,values);
          result = rows;
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
          const [rows, fields] = await connection.execute(query,values);
          const result = rows; 
          resolve(result); //add status 201
        }
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
