const requestBodyparser = require("../util/body-parser");
const { pool } = require('../methods/connection');

const postReq = require("../methods/post-request");


// const writeToFile = require("../util/write-to-file");
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
        title: "Validation Failed",
        message: "UUID is not valid",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
    try {
      let body = await requestBodyparser(req);  

      console.log("start 30")
      res.write(await updateIntoDefunt(body));
      console.log("end 30")

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(); //

    } catch (err) {
      console.log(err);
      res.writeHead(400, { "Content-Type": "application/json" });
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





async function updateIntoDefunt(jsonData) {
  let conn;
  const keysJson = Object.keys(jsonData);

  try {
    conn = await pool.getConnection();


      for (let tableName of keysJson) {

        let table = jsonData[tableName];
        const keysTable = Object.keys(table);

        const isExistTableInDB = await conn.query(
          "SELECT * FROM "+tableName+" WHERE numerodefunt = ?",
          table['numeroDefunt']
        );

        console.log("numeroDefunt")

        console.log(table['numeroDefunt'])
        console.log("isExistTableInDB")
        console.log(""+isExistTableInDB+"")


        if (isExistTableInDB.length > 0) {
          let updateQuery = "UPDATE "+tableName+" SET ";  
          let values = [];
          for (let i = 1; i < keysTable.length; i++) { //i=1 //without numerodefunt
            updateQuery += `${keysTable[i]} = ?, `;
            values.push(table[keysTable[i]]);
          }
          updateQuery = updateQuery.slice(0, -2) + " WHERE numerodefunt = "+table['numeroDefunt'];         
          result = await conn.query(updateQuery, values);

        } else {

          let query = "INSERT INTO "+tableName+" ( numeroDefunt,"; //numeroDefunt, but what if the id n'exist pas //need to create defubnt first
          let values = [table['numeroDefunt']]; //[];
          for (let i = 1; i < keysTable.length; i++) {
            query += `${keysTable[i]}, `;
            values.push(table[keysTable[i]]);
          }
          query = query.slice(0, -2) + `) VALUES (?, `;
          for (let i = 1; i < keysTable.length-1; i++) { //-1 because of numeroDefunt
            query += `?, `;
          }
          query = query.slice(0, -2) + `)`;

          result = await conn.query(query, values);
          
        }
      }


  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}
