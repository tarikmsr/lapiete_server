const { pool } = require('../methods/connection');
// const writeToFile = require("../util/write-to-file");
module.exports = (req, res) => {
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
        title: "Validation Failed",
        message: "UUID is not valid",
      })
    );  
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

    try {

    deleteDefunt(id)
    .then(result => {

      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify({
        "title": "delete defunt with successful",
        "message": result
      });
      res.end(jsonResult);
    })
    .catch(err => {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Can not delete defunt",
          error: err.error['message'],
        })
      );
    });


  } catch (err) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "delete failed",
        message: `${err.text}`,
      })
    );
  }

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};


async function deleteDefunt(id) {
  return new Promise(async (resolve, reject) => {

  const childTableNames = ['decisionnaire', 'filiation', 'deces', 'mise_en_biere', 'situation_familiale', 
  'cimetiere', 'concession', 'rapatriement', 'vol', 'documents', 'generated_documents','uploaded_documents'];
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
