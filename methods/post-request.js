const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');

let lastId = 16; //start increment 
let indexId = 0;

function generateAutoIncrementId() {
  lastId++;
  const paddedNumber = lastId.toString().padStart(11, "0");
  return paddedNumber;
}

module.exports = async (req, res) => {
  if (req.url === "/api/form") {
    try {

      let jsonData = await requestToJsonparser(req);

      await insertNewDefunt(jsonData)
      .then(result => {
        console.log("21");
        res.writeHead(200, { "Content-Type": "application/json" });
        let jsonResult = JSON.stringify({
          "title": "insérsion du défunt avec succès",
          "message": result
        });
        res.end(jsonResult);
      })
      .catch(err => {
        console.log("error")
        console.log(err)

        res.writeHead(404 , { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            title: "Impossible d'insérer ce défunt",
            error: err,
          })                 
        );
      });

    } catch (err) {
      console.log(err)
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Échec de l'insertion",
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
    
    let connection;
    let res = [];    
    try {
    connection = await pool.acquire();
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
      try {
        const [result, fields] = await connection.execute(query,values);
        res[0] = result;
      }catch(err){
        if (connection) await connection.rollback();
        reject({
          title:'Erreur lors de l\'insersion des données de la base de données',
          error: err['sqlMessage']
        });
      }
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
      
      try {
        const [result, fields] = await connection.execute(query,values);
        res[1] = result;
      }catch(err){

        // console.log(121)
        // console.log(err['sqlMessage'])
    
        if (connection) await connection.rollback();
        reject({
          title:'Erreur lors de l\'insersion des données de la base de données',
          error: err['sqlMessage']
        });
      }
      resolve(res[1]);
    }

    connection.commit((err) => {
      console.log("entry commit ");

      if (err) {
        return connection.rollback(() => {
          throw err;
        });
      }
      resolve(res);
      console.log('Transaction complete.');
    });


  } catch (err) {
    console.log("error post 160");
    console.log(err);

    if (connection) await connection.rollback();

    reject({
      title:'Erreur lors de l\'insersion des données de la base de données',
      error: err['sqlMessage']
    });
  } finally {
    if (connection) {
      await pool.release(connection);
    }
  }

});

}