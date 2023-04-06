const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');

let lastId = 8; //start increment 
let indexId = 0;

function generateAutoIncrementId() {
  lastId++;
  const paddedNumber = lastId.toString().padStart(11, "0");
  return paddedNumber;
}

module.exports = async (req, res) => {
  if (req.url === "/api/form") {
    try {
      res.writeHead(201, { "Content-Type": "application/json" });

      let jsonData = await requestToJsonparser(req);
      console.log("19")
      let result = await insertNewDefunt(jsonData);

      console.log("result 19 : "+result)


      res.end(
          JSON.stringify({
            title: "Insert new defunt with successful",
            message: `${result}`, //!
          })          
      );

    } catch (err) {
      console.log(err)
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Insert failed",
          message: `${err.text}`,
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};



async function insertNewDefunt(jsonData) {
  return new Promise(async (resolve, reject) => {

  try {
    pool.connect((err) => {
      if (err) throw err;
      console.log('Connected to MySQL database! : ');
    });

    let res;

    // let conn;
    // conn = await pool.getConnection();
    // await conn.beginTransaction();
    

    // Insert into parent tables
    for (let tableName in jsonData) {
      if (!jsonData.hasOwnProperty(tableName)) continue;

      let tableData = jsonData[tableName];
      const tableKeys = Object.keys(tableData);
      const primaryKey = tableKeys[0];

      if (tableName === 'defunt') {
        // Use auto-increment for the primary key in defunt table
        indexId = parseInt(generateAutoIncrementId());
        tableData[primaryKey] = indexId; 

      let query = `INSERT INTO ${tableName} (${tableKeys.join(', ')})  VALUES (`;//?
      for (let i = 0; i < tableKeys.length; i++) {
        query += "?, ";
      }
      query = query.slice(0, -2) + ")";
      const values = Object.values(tableData);

      // await conn.query(query, values);

      pool.query(query, values,(err, results, fields) => {
        if (err) {
          return pool.rollback(() => {
            console.log("90 error : "+err)
            throw err;
          });
        }
        res = results.insertId;
        console.log("insert defint with succesfull user id: "+ results.insertId)
      });

    } //end if
  
  }

    // Insert into child tables
    for (let tableName in jsonData) {
      if (!jsonData.hasOwnProperty(tableName)) continue;
      if (tableName === 'defunt') continue;

      let tableData     = jsonData[tableName];
      if (tableName === 'decisionnaire') {
        tableData['numeroDecisionnaire'] = indexId; //??
      };
      const tableKeys   = Object.keys(tableData);
      const foreignKey  = Object.keys(tableData).find(key => key.includes('numeroDefunt'));
      tableData[foreignKey] = indexId; //!

      let query = `INSERT INTO ${tableName} (${Object.keys(tableData).join(', ')}) VALUES (`;
      for (let i = 0; i < tableKeys.length; i++) {
        query += "?, ";
      }
      query = query.slice(0, -2) + ")";
      const values = Object.values(tableData);
      
      // await conn.query(query, values);

      pool.query(query, values,(err, results, fields) => {
        if (err) {
          return pool.rollback(() => {
            throw err;
          });
        }        
        res = results.insertId;
        console.log("insert defint with succesfull : "+results.insertId)
      });

    }

    // await conn.commit();

    pool.commit((err) => {
      if (err) {
        return pool.rollback(() => {
          throw err;
        });
      }
      resolve(res);
      console.log('Transaction complete.');
    });


  } catch (err) {
    console.log("151 - catch error")
    console.error(err);
    reject(new Error('Error retrieving data from database : '+err));
  } finally {
    // if (conn) conn.release();

    pool.end((err) => {
      if (err) throw err;
      console.log('Connection closed!');
    });  
  }

});

}