const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');

let lastId = 1;
let result;

function generateAutoIncrementId() {
  lastId++;
  const paddedNumber = lastId.toString().padStart(11, "0");
  return paddedNumber;
}

module.exports = async (req, res) => {
  if (req.url === "/api/form") {
    try {

      let jsonData = await requestToJsonparser(req);
      res.write(await insertNewDefunt(jsonData));
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end();
    } catch (err) {
      console.log("res -- 22");
      console.log(result.error);

      res.writeHead(400, { "Content-Type": "application/json" });

      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: `${result.error}`,
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};



async function insertNewDefunt(jsonData){

  const keysArray = Object.keys(jsonData);
  let conn;

  try {
    conn = await pool.getConnection(); 
    for (let tableName of keysArray) {
    let table = jsonData[tableName];
    const keys = Object.keys(table);
    let query = "INSERT INTO "+tableName+" (";
    let values = [];
    for (let i = 0; i < keys.length; i++) {


      query += `${keys[i]}, `;

      //what if decisionaire //same number 
      if(i == 0 && keys[i] == 'numeroDefunt'){
      values.puch(generateAutoIncrementId())
    }else{ 
      values.push(table[keys[i]]);
     }

    }
    query = query.slice(0, -2) + ") VALUES (";
    for (let i = 0; i < keys.length; i++) {
      query += "?, ";
    }
    query = query.slice(0, -2) + ")";
      (async () => {
        try { 
         result = await conn.query(query,values);
        // console.log(result); //OkPacket { affectedRows: 1, insertId: 0n, warningStatus: 1 } //succes
        } catch (err) {
          console.log("err.text : ");
          console.log(err.text);
          console.error(err);
          throw err;
        } finally {
          if (conn) conn.release(); // release connection back to pool
        }

      })();
  }

  console.log("result--");
  console.log(result);

   return result;
 } catch (err) {
   console.error(err);
   result.status(500).send('Error retrieving users from database');
 }
};
