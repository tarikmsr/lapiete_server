const { pool } = require('../methods/connection');
const jwt = require("jsonwebtoken");
const saveLogs = require('../util/logger');

const childTableNames = ['decisionnaire', 'filiation', 'deces', 'mise_en_biere', 'situation_familiale', 
'cimetiere', 'concession', 'rapatriement', 'vol', 
'generated_documents','uploaded_documents'];

module.exports = (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  const regexNumbers = /^[0-9]+$/;

  try{
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
        message: "Validation Failed",
        error: "UUID is not valid",
      })
    );  
  }
  else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

    try {
    deleteDefunt(id)
    .then(result => {
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify({
        "message": result > 0 ? "Supprission du defunt avec succès" :  "defunt with id doesn't exist",
      });
      res.end(jsonResult);
      saveLogs(`user:${decoded.id} deleted defunt :${id}.`);
    })
        .catch(err => {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
              JSON.stringify({
                error: "échec de la suppression du defunt",
                // error: err.error['message'],
              })
          );
    })
    .catch(err => {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "échec de la suppression du defunt",
          // error: err.error['message'],
        })
      );
    });
  } catch (err) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "échec de la suppression",
        // message: `${err.text}`,
      })
    );
  }

  }
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found", error: "Route not found" }));
  }

  }
  catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401)
          .send({ msg: "Token expired. Please log in again." });
    }
    //handle other errors
    return res.status(401).send({ msg: 'Invalid token.' });
  }
  finally {
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
  } catch (err) {
    saveLogs(`Error in delete defunt :${err}.`);
    // Rollback the transaction in case of error
    if (connection) {
      await connection.rollback();
    }
    reject({
      error:'Error-retrieving-database',
      // error: err
    });  
  } finally {
    if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
  }
});

}
