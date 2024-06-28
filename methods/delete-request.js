const { pool } = require('../methods/connection');
const jwt = require("jsonwebtoken");
const saveLogs = require('../util/logger');
const { checkDefuntExists } = require('../methods/put-request');
const url = require('url');

const childTableNames = ['decisionnaire', 'filiation', 'deces', 'mise_en_biere', 'situation_familiale', 
'cimetiere', 'concession', 'rapatriement', 'vol', 
'generated_documents','uploaded_documents'];


module.exports = async (req, res) => {
  const parsedUrl = url.parse(req.url, true); // Parse the URL with query string
  const baseUrl = parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf("/") + 1);
  const id = parsedUrl.pathname.split("/")[3]; // Extract the id from the URL path
  const regexNumbers = /^[0-9]+$/;

  try {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ) {
      return res.status(422).json({
        message: "Please provide the token",
      });
    }
    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, process.env.SECRET_KEY)

    if (!regexNumbers.test(id)) {
      res.writeHead(404, {"Content-Type": "application/json"});
      res.end(
          JSON.stringify({
            message: "Validation Failed",
            error: "UUID is not valid",
          })
      );
    }
    else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

      try {
        deleteDefunt(id)
            .then(result => {
              res.writeHead(200, {"Content-Type": "application/json"});
              let jsonResult = JSON.stringify({
                "message": result > 0 ? "Supprission du defunt avec succès" : "defunt with id doesn't exist",
              });
              res.end(jsonResult);
              saveLogs(`user:${decoded.id} deleted defunt :${id}.`);
            })
            .catch(err => {
              res.writeHead(404, {"Content-Type": "application/json"});
              res.end(
                  JSON.stringify({
                    error: "échec de la suppression du defunt",
                    // error: err.error['message'],
                  })
              );
            })
            .catch(err => {
              res.writeHead(404, {"Content-Type": "application/json"});
              res.end(
                  JSON.stringify({
                    error: "échec de la suppression du defunt",
                    // error: err.error['message'],
                  })
              );
            });
      } catch (err) {
        res.writeHead(404, {"Content-Type": "application/json"});
        res.end(
            JSON.stringify({
              error: "échec de la suppression",
              // message: `${err.text}`,
            })
        );
      }

    } else if (baseUrl === "/api/delete-file/" && regexNumbers.test(id)) {
      try {
        // Check if defuntId exists in the defunt table
        const defuntExists = await checkDefuntExists(id);
        if (!defuntExists) {
          return res.status(404).send({error: 'Defunt not found', message: `Defunt with ID ${id} does not exist`});
        }

        // Check if fileName is provided
        const defuntId = id;
        const {fileName} = req.query;

        if (!fileName) {
          return res.status(400).send({
            error: 'Missing fileName parameter',
            message: 'Please provide the fileName parameter'
          });
        }

        // Call your delete file function here
        const result = await deleteFile(defuntId, fileName);
        return res.send({message: "delete-file-successful", result: result});

      } catch (err) {
        saveLogs(`Error - delete-file API: ${err}`);
        return res.status(500).send({error: "Internal Server Error", message: err.message});
      }
    } else {
      res.writeHead(404, {"Content-Type": "application/json"});
      res.end(JSON.stringify({message: "Not Found", error: "Route not found"}));
    }

  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401)
          .send({msg: "Token expired. Please log in again."});
    }
    //handle other errors
    return res.status(401).send({msg: 'Invalid token.'});
  } finally {
  }

};

/**
 * Deletes a defunt record and its associated child records from the database.
 * @param {number} id - The ID of the defunt to delete.
 * @returns {Promise<Object>} A promise that resolves to the result of the delete operation.
 * @throws {Error} If there is an error during the delete operation.
 */
async function deleteDefunt(id) {
  return new Promise(async (resolve, reject) => {
  let connection;
  try {
    connection = await pool.acquire();

    // Start a transaction
    await connection.beginTransaction();

    // Delete data from child tables
    for (let tableName of childTableNames) {
      const query = `DELETE FROM ${tableName} WHERE numerodefunt = ?`;
      await connection.execute(query,[id]);
    }

    // Delete data from parent table
    const parentTableQuery = 'DELETE FROM defunt WHERE numerodefunt = ?';
    const [result] = await connection.execute(parentTableQuery,[id]);

    // Commit the transaction
    await connection.commit();

    resolve(result['affectedRows']);
  }
  catch (err) {
    saveLogs(`Error in delete defunt :${err}.`);
    // Rollback the transaction in case of error
    try {
      if (connection) await connection.rollback();
    } catch (rollbackErr) {
      console.error(`Rollback error: ${rollbackErr}`);
    }
    reject({
      error:'Error-retrieving-database',
      // error: err
    });  
  }
  finally {
    if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
  }
});

}


/**
 * Deletes a file reference for a specific 'defunt' from the database.
 *
 * @param {number} numeroDefunt - The ID of the defunt.
 * @param {string} fileName - The name of the file field to delete.
 * @returns {Promise<string>} A promise that resolves when the file reference is successfully deleted.
 */
async function deleteFile(numeroDefunt, fileName) {
  let connection = null;
  try {
    // Delete file reference from the database
    const query = `UPDATE uploaded_documents SET ${fileName} = NULL WHERE numeroDefunt = ?`;

    connection = await pool.acquire();
    await connection.execute(query, [numeroDefunt]);
    return 'delete-file-successful';
  } catch (err) {
    saveLogs(`Error - delete File From DB function: ${err}`);
    try {
      if (connection) await connection.rollback();
    } catch (rollbackErr) {
      console.error(`Rollback error: ${rollbackErr}`);
    }
    throw err;
  } finally {
    if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
  }
}
