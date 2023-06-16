const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const saveLogs = require('../util/logger');



let result = {};

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

        console.log("last id");
        console.log(rows);

        let paddedNumber;
        if(rows.length == 0){
          paddedNumber = 1;
        }
        paddedNumber = (rows[0].numeroDefunt).toString().padStart(11, "0");
        resolve(paddedNumber);
      } finally {
        if (connection) {
          await pool.release(connection);
        }
      }
    } catch (err) {
      saveLogs(`Error 51 - put - getLastDefuntId :  ${err}`);
      reject({
        error: 'Error-retrieving-database',
        // error: err,
        message: 'cannot get last id'
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

  if(req.url === "/api/login"){

    let jsonData = await requestToJsonparser(req);

    await login(jsonData)
    .then(result => {
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify(result);
      res.end(jsonResult);
    })
    .catch(err => {
      saveLogs(`Error 83 - put - login :  ${err}`);

      console.log(err)
      res.writeHead(404 , { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(err)                 
      );
    });

  }

  //autres routers
  try{
    //test token
    if(
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ){
      return res.status(422).json({
        message: "Please provide the token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, process.env.SECRET_KEY)

    if (!regexNumbers.test(id)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          // title: "Échec de la validation",
          error: "L'UUID n'est pas valide",
        })
      );
    }
    else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
      try {
        let jsonData = await requestToJsonparser(req);

        if(id === '0') {
          await getLastDefuntId()
          .then(id => {
            indexId = parseInt(id)+1;
          })
          .catch(err => {
            saveLogs(`Error 128 - put - getLastDefuntId :  ${err}`);
            console.log(err);
            indexId =  parseInt(getRandomInteger()) ;
          });

          await insertNewDefunt(jsonData)
          .then(result => {

            res.writeHead(200, { "Content-Type": "application/json" });
            let jsonResult = JSON.stringify({
              "message": "insertion-successful",
              "id": indexId,
            });
            res.end(jsonResult);
          })
          .catch(err => {
            saveLogs(`Error 51 - put - insertNewDefunt :  ${err}`);
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
              "message": "update-successful",
              // "message": result
            });
            res.end(jsonResult);
          })
          .catch(err => {
            saveLogs(`Error 51 - put - updateIntoDefunt :  ${err}`);

            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify(err)
            );
          });
        }


      } catch (err) {
        console.log(err);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Request Json is not valid : "+err,
          })
        );
      }
    }
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Not Found", error: "Route not found" }));
    }


  } catch (err) {
  if (err instanceof jwt.TokenExpiredError) {
    // Handle token expiration error
    return res.status(401).send({ msg: 'Token expired. Please log in again.' });
  }
  // Handle other errors
  // return res.status(401).send({ msg: 'Invalid token.' });
} finally{}

};



async function updateIntoDefunt(jsonData,id) {
  return new Promise(async (resolve, reject) => {
    
    console.log("-------------------------------------171------------------------------"); 
    console.log(jsonData); //!!

  let connection;
  const tablesNames = Object.keys(jsonData);

  try {
    
    connection = await pool.acquire();

      for (let tableName of tablesNames) {

        let table = jsonData[tableName];
        if(table != null){
        const tableFields = Object.keys(table);
        
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
            error:'Error-retrieving-database',
            // error: err
          });
        }

        if (isExistTableInDB.length > 0) { 

          let updateQuery = "UPDATE "+tableName+" SET ";  
          let values = [];

          // const startIndex = tableName === 'decisionnaire'? 2:1;
          for (let i = 1 ; i < tableFields.length; i++) { //i=1 //without numerodefunt --1 // 
            if ((tableName === 'generated_documents' || tableName === 'uploaded_documents') && !table[tableFields[i]]) {
              continue; // skip adding id field to updateQuery if value is null
            }
            updateQuery += `${tableFields[i]} = ?, `;
    
            if (Array.isArray(table[tableFields[i]]) && table[tableFields[i]].length === 0) {
              values.push(null);  
            } else {
              values.push(table[tableFields[i]]);
            }
          }

          updateQuery = updateQuery.slice(0, -2) + " WHERE numerodefunt = "+id;   

          try{
            // const [rows, fields] = await connection.execute(updateQuery,values);

            console.log("\n--------------------------------220-------------------------------------");
            console.log(table);23
            console.log("222--updateQuery");
            console.log(updateQuery);

            const stmt = await connection.prepare(updateQuery);

            if (tableName === 'generated_documents' || tableName === 'uploaded_documents') {
              for (let i = 0; i < values.length; i++) {  //start from 0 cz just the news values
                if (values[i]) { // Only set if value is not null
                  console.log(values[i]);

                  const byteValue = Buffer.from(values[i]); // ,'base64'
                  
                  console.log("byteValue");
                  console.log(byteValue);
                  values[i] = byteValue;           
                         
                } 
              }

            } 
            
            // console.log("\n---------------------------------------------------------------------");
            // console.log(`updateQuery - ${tableName}`);
            // console.log(updateQuery);

            // console.log("values");
            // console.log(values);
            // console.log("---------------------------------------------------------------------\n");



          const [rows, fields] = await stmt.execute(values);
            result = rows;
  
          }catch(err){
            console.log(err);
            reject({
              error:'unable-update-defunt',
              // error: err
            });
          }
          resolve(result); //status 200





          
        } else {

          let query = "INSERT INTO "+tableName+" ( numeroDefunt,"; //numeroDefunt, but what if the id n'exist pas //need to create defubnt first
          let values = [id]; //[];
          for (let i = 1; i < tableFields.length; i++) {
            query += `${tableFields[i]}, `;
            values.push(table[tableFields[i]]);
          }
          query = query.slice(0, -2) + `) VALUES (?, `;
          for (let i = 1; i < tableFields.length; i++) { //tableFields.length-1 because of numeroDefunt
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
        const [rows, fields] = await stmt.execute(values);
  
        result = rows;
        resolve(result); //add status 201
        }

        } //end if
      }


  } catch (err) {
    if (connection) await connection.rollback();
    console.log(err)
    reject({
      error:'Error-retrieving-database',
      // error: err
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
          error:'error-insert-defunt',
          // error: err['sqlMessage']
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
        console.log(err)
    
        if (connection) await connection.rollback();
        reject({
          error:'Error-retrieving-database',
          // error: err['sqlMessage']
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
    console.log(err);

    if (connection) await connection.rollback();

    reject({
      error:'Error-insert-database',
      // error: err['sqlMessage']
    });
  } finally {
    if (connection) {
      await pool.release(connection);
    }
  }

});

}



async function login(jsonData) {
  return new Promise(async (resolve, reject) => {

    let connection;
    try {
    connection = await pool.acquire();
    
    let query = `SELECT * FROM users WHERE email = ${connection.escape(jsonData.email)};`;
    const [result, fields] = await connection.execute(query);

      if (!result.length) {
        reject({
          error:'user-not-found',
        });      
      }
      bcrypt.compare( jsonData.password, result[0]['password'], (err, bResult) => {
                
        if (err) {
          console.log(err);
          reject({
            error:'Password filed not exist',     
          });     
        }
     
        if (bResult) {
          const token = jwt.sign({id:result[0].id}, process.env.SECRET_KEY ,{ expiresIn: '48h' });  
          connection.execute(`UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`);
                          
          resolve({
            message:'connection-succefull',
            token: token,
            user: result[0]
          });
        }  
        reject({
          error:'wrong-password',
        });

      });

  } catch (err) {
    console.log(err);
    if (connection) await connection.rollback();
    reject({
      error:'Erreur-with-database',
      // error: err['sqlMessage']
    });
  } finally {
    if (connection) {
      await pool.release(connection);
    }
  }

});

}
