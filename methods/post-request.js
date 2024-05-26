const requestToJsonparser = require("../util/body-parser");
const { pool } = require('../methods/connection');
const {  loginValidation } = require('../util/validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const saveLogs = require("../util/logger");
require('dotenv').config();

let indexId = 1;


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

        if(rows[0] != null){
          const paddedNumber = (rows[0].numeroDefunt).toString().padStart(11, "0");
          resolve(paddedNumber);
        }else{
          const paddedNumber = 0;
          resolve(paddedNumber);
        }
      } finally {
        if (connection) {
          await pool.release(connection);
        }
      }
    } catch (err) {
      reject({
        error: 'Error-retrieving-database',
        // error: err,
      });
    }
  });
}


module.exports = async (req, res) => {

  if(req.url === "/api/login"){
    let jsonData = await requestToJsonparser(req);
    await login(jsonData)
    .then(result => {
      let jsonResult = JSON.stringify(result);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(jsonResult);
      saveLogs(`Success: login for user : ${jsonData['email']}`)

    })
    .catch(err => {
      console.log(err)
      res.writeHead(404 , { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(err)                 
      );
    });

  }
  else if(req.url === "/api/register"){
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "not created yet", error: "Route not found" }));
  }
  else {

    //autres routers
    try {
      //test token
      if (
          !req.headers.authorization ||
          !req.headers.authorization.startsWith("Bearer") ||
          !req.headers.authorization.split(" ")[1]
      ) {
        return res.status(422).json({
          message: "Please provide the token",
        });
      }
      const theToken = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(theToken, process.env.SECRET_KEY);

    if (req.url === "/api/form") {
      try {
        await getLastDefuntId()
            .then(id => {
              indexId = parseInt(id)+1;
            })
            .catch(err => {
              console.log(err);
            });


        let jsonData = await requestToJsonparser(req);
        await insertNewDefunt(jsonData)
            .then(result => {
              console.log(result)
              let jsonResult = JSON.stringify({
                "message": "insertion-successful",
                "id": indexId
              });
              console.log(jsonResult)
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(jsonResult);
              saveLogs(`Success: insert new defunt id :${indexId} by user :${decoded.id}`);
            })
            .catch(err => {
              console.log(err)
              res.writeHead(404 , { "Content-Type": "application/json" });
              res.end(
                  JSON.stringify(err)
              );
            });

      } catch (err) {
        console.log(err)
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
              error: "Échec de l'insertion",
              // message: `${err.text}`,
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
        return res.status(401)
            .send({ msg: "Token expired. Please log in again." });
      }
    }
    finally {
    }
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
        try {
          if (connection) await connection.rollback();
        } catch (rollbackErr) {
          console.error(`Rollback error: ${rollbackErr}`);
        }
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
            } else {
              // const byteValue = Buffer.from('[]', 'base64');
              const byteValue= null;

              values[i] = byteValue;
            }
          }
        } 
      const [result, fields] = await stmt.execute(values);

      res[1] = result;
      resolve(res);

      }catch(err){
        console.log(err)
        saveLogs(err);
        try {
          if (connection) await connection.rollback();
        } catch (rollbackErr) {
          console.error(`Rollback error: ${rollbackErr}`);
        }
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
    console.log("error post 290");
    console.log(err);

    try {
        if (connection) await connection.rollback();
    } catch (rollbackErr) {
        console.error(`Rollback error: ${rollbackErr}`);
    }

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
      if (!connection) {
        throw new Error('Connection is null');
      }

      let query = `SELECT * FROM users WHERE email = ${connection.escape(jsonData.email)};`;
    const [result, fields] = await connection.execute(query);

      if (!result.length) {
        reject({
          error:'user-not-found',
        });      
      }
      bcrypt.compare( jsonData.password, result[0]['password'], async (err, bResult) => {

        if (err) {
          console.log(err);
          reject({
            error: 'Password filed not exist',
          });
        }

        if (bResult) {
          const token = jwt.sign({id: result[0].id}, process.env.SECRET_KEY, {expiresIn: '48h'});
          try {
            await connection.execute('UPDATE users SET last_login = now() WHERE id = ?', [result[0].id]);
          } catch (updateErr) {
            console.error('Error updating last_login:', updateErr);
            //reject ?
          }
          resolve({
            message: 'connection-succefull',
            token: token,
            user: result[0]
          });
        }
        reject({
          error: 'wrong-password',
        });

      });

  } catch (err) {
    saveLogs(`Login, ${err}`);
      reject({ error:'Erreur-with-database', msg: err.message || err });
  } finally {
    if (connection) {
      try {
        await pool.release(connection);
      } catch (releaseErr) {
        console.error('Error releasing the connection:', releaseErr);
      }
    }
  }

});

}
