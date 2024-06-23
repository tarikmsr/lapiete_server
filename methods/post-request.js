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
        await createDefunt(jsonData)
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


async function createDefunt(jsonData) {
  return new Promise(async (resolve, reject) => {
    let connection;
    let res = [];

    try {
      connection = await pool.acquire();

      // Start a transaction
      await connection.beginTransaction();

      // Insert into the 'defunt' table
      for (let tableName in jsonData) {
        if (!jsonData.hasOwnProperty(tableName)) continue;

        let tableData = jsonData[tableName];
        const tableKeys = Object.keys(tableData);
        const primaryKey = tableKeys[0];

        if (tableName === 'defunt') {
          tableData[primaryKey] = indexId; // Assuming indexId is defined somewhere

          let query = `INSERT INTO ${tableName} (${tableKeys.join(', ')}) VALUES (${tableKeys.map(() => '?').join(', ')})`;
          const values = Object.values(tableData);

          try {
            const [result] = await connection.execute(query, values);
            res.push(result);
          } catch (err) {
            console.error(`Error inserting into defunt table: ${err}`);
            saveLogs(`Error inserting into defunt table: ${err}`);
            await connection.rollback();
            return reject({ error: 'error-insert-defunt', details: err.message });
          }
        }
      }

      // Insert into child tables
      for (let tableName in jsonData) {
        if (!jsonData.hasOwnProperty(tableName) || tableName === 'defunt') continue;

        let tableData = jsonData[tableName];
        const tableKeys = Object.keys(tableData);

        if (tableName === 'decisionnaire') {
          tableData['numeroDecisionnaire'] = indexId; // Assuming indexId is defined somewhere
        }

        const foreignKey = tableKeys.find(key => key.includes('numeroDefunt'));
        tableData[foreignKey] = indexId; // Assuming indexId is defined somewhere

        let query = `INSERT INTO ${tableName} (${tableKeys.join(', ')}) VALUES (${tableKeys.map(() => '?').join(', ')})`;
        const values = Object.values(tableData);

        // Special handling for 'generated_documents' and 'uploaded_documents' tables
        if (tableName === 'generated_documents' || tableName === 'uploaded_documents') {
          for (let i = 1; i < values.length; i++) {
            if (values[i]) {
              values[i] = Buffer.from(values[i], 'base64');
            } else {
              values[i] = null;
            }
          }
        }

        try {
          const [result] = await connection.execute(query, values);
          res.push(result);
        } catch (err) {
          console.error(`Error inserting into ${tableName} table: ${err}`);
          saveLogs(`Error inserting into ${tableName} table: ${err}`);
          await connection.rollback();
          return reject({ error: 'error-insert-child-table', details: `${tableName}: ${err.message}`});
        }
      }

      // Commit the transaction
      await connection.commit();
      resolve(res);

    } catch (err) {
      console.error(`Unexpected error: ${err}`);
      if (connection) await connection.rollback();
      reject({ error: 'error-insert-database', details: err.message });
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
