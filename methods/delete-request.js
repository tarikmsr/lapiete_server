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

    res.writeHead(200, { "Content-Type": "application/json" });
    let result =  deleteDefunt(id); //await

    res.end(
      JSON.stringify({
        title: "delete defunt with successful",
        message: `${result}`, // affectedRows
      })          
  );

    // const index = req.form.findIndex((data) => {
    //   return data.id === id;
    // });
    // if (index === -1) {
    //   res.statusCode = 404;
    //   res.write(
    //     JSON.stringify({ title: "Not Found", message: "Data not found" })
    //   );
    //   res.end();
    // } else {

    //   req.form.splice(index, 1);
    //   writeToFile(req.form);
    //   res.writeHead(204, { "Content-Type": "application/json" });
    //   res.end(JSON.stringify(req.form));
    // }
  } catch (err) {
    console.log(err)
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
  const childTableNames = ['decisionnaire', 'filiation', 'deces', 'mise_en_biere', 'situation_familiale', 'cimetiere', 'concession', 'rapatriement', 'vol', 'documents'];
  let conn;

  try {
    conn = await pool.getConnection();

    // Delete data from child tables
    for (let tableName of childTableNames) {
      const query = `DELETE FROM ${tableName} WHERE numerodefunt = ?`;
      await conn.query(query, [id]);
    }

    // Delete data from parent table
    const query = 'DELETE FROM defunt WHERE numerodefunt = ?';
    const result = await conn.query(query, [id]);
    return result.affectedRows;
  } catch (err) {
    console.log(err);
    throw new Error('Error deleting data from database');
  } finally {
    if (conn) conn.release(); // release connection back to pool
  }
}



function deleteDefunt_old(id) {

    return new Promise(async (resolve, reject) => {
      const tableNames =['defunt','decisionnaire','filiation','deces','mise_en_biere','situation_familiale','cimetiere','concession','rapatriement','vol','documents'];
      let conn;
      let results = [];

      try {
      conn = await pool.getConnection();
    
      for (let tableName of tableNames) {
        const query = `DELETE FROM ${tableName} WHERE numerodefunt = ?`;
        const result = await conn.query(query, [id]);
       results.push(result);
      }
      resolve(results[0]['affectedRows']);

      } catch (err) {
      console.log(err);
      reject('Error retrieving data from database');
      } finally {
        if (conn) conn.release(); // release connection back to pool
      }
    });
}