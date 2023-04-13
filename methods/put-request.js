const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');
let result;


/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The random integer generated.
 */
function getRandomInteger(min =1, max = 99999) {
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString().padStart(11, "0");
}


/**
 * Retrieves the last numeroDefunt value from the defunt table.
 * @returns {Promise<number>} A Promise that resolves to the last numeroDefunt value.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getLastDefuntId() {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `SELECT numeroDefunt FROM defunt ORDER BY numeroDefunt DESC LIMIT 1`;
      const connection = await pool.acquire();
      try {
        const [rows, fields] = await connection.execute(query);

        const paddedNumber = (rows[0].numeroDefunt).toString().padStart(11, "0");
        resolve(paddedNumber);
      } finally {
        if (connection) {
          await pool.release(connection);
        }
      }
    } catch (err) {
      reject({
        title: 'Error retrieving data from database',
        error: err,
      });
    }
  });
}


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
      let jsonData = await requestToJsonparser(req);  


      if(id === '0') {
        await getLastDefuntId()
        .then(id => {
          indexId = parseInt(id)+1;
        })
        .catch(err => {
          console.log(err);
          indexId =  parseInt(getRandomInteger()) ;
        });

        await insertNewDefunt(jsonData)
        .then(result => {
         
          res.writeHead(200, { "Content-Type": "application/json" });
          let jsonResult = JSON.stringify({
            "title": "insérsion du défunt avec succès",
            "id": indexId,
            "message":result,
          });
          res.end(jsonResult);
        })
        .catch(err => {
          console.log(err)
          res.writeHead(404 , { "Content-Type": "application/json" });
          res.end(
            JSON.stringify(err)                 
          );
        });





      }else{
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
      }
    

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

        if (id === 0 || isExistTableInDB.length > 0) {

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



//test
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
        // Use auto-increment for the primary key in defunt tabl
        tableData[primaryKey] = indexId; 

      let query = `INSERT INTO ${tableName} (${tableKeys.join(', ')})  VALUES (`;
      for (let i = 0; i < tableKeys.length; i++) {
        query += "?, ";
      }
      query = query.slice(0, -2) + ")";
      const values = Object.values(tableData);
      try {
        const [result, fields] = await connection.execute(query,values);
        res[0] = result;

        resolve(res);

      }catch(err){
        console.log(err);
        if (connection) await connection.rollback();
        reject({
          title:'Erreur lors de l\'insersion des données de la base de données 300',
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

      res[1] = result;
      resolve(res);

      }catch(err){

        console.log(121)
        console.log(err)
    
        if (connection) await connection.rollback();
        reject({
          title:'Erreur lors de l\'insersion des données de la base de données 360',
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