const { pool } = require('../methods/connection');
const jwt = require("jsonwebtoken");
// const writeToFile = require("../util/write-to-file");


const childTableNames = ['decisionnaire', 'filiation', 'deces', 'mise_en_biere', 'situation_familiale', 
'cimetiere', 'concession', 'rapatriement', 'vol', 
'documents', //?
'generated_documents','uploaded_documents'];

module.exports = (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];


  const regexNumbers = /^[0-9]+$/;

  // const regexV4 = new RegExp(
    // /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  // );

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
          "message": "Supprission du defunt avec succès",
        });
        res.end(jsonResult);
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

    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        // Handle token expiration error
        return res.status(401).send({ msg: 'Token expired. Please log in again.' });
      }
      // Handle other errors
      return res.status(401).send({ msg: 'Invalid token.' });
    } finally{}

};


async function deleteDefunt(id) {
  return new Promise(async (resolve, reject) => {


  let connection;

  try {
    connection = await pool.acquire();

    // Delete data from child tables
    for (let tableName of childTableNames) {
      const query = `DELETE FROM ${tableName} WHERE numerodefunt = ?`;
      const [result, fields] = await connection.execute(query,[id]);
    
    }

    // Delete data from parent table
    const query = 'DELETE FROM defunt WHERE numerodefunt = ?';
    const [result, fields] = await connection.execute(query,[id]);

    resolve(result);
  } catch (err) {
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
