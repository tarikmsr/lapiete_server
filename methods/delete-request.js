const { pool } = require('../methods/connection');
const writeToFile = require("../util/write-to-file");
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


    res.writeHead(200, { "Content-Type": "application/json" });
    res.write( deleteDefunt(id) );
    res.end();

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

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};



async function deleteDefunt(id){

  const tableNames =['defunt','decisionnaire','filiation','deces','mise_en_biere','situation_familiale','cimetiere','concession','rapatriement','vol','documents'];
  let result;
  let conn;

  try {
    conn = await pool.getConnection(); 
    const result = await conn.query(query, [id]);

    for (let tableName of tableNames) {
      const query = `DELETE FROM ${tableName} WHERE numerodefunt = ?`;
      const result = await conn.query(query, [id]);
      return result; 
    }
   } catch (err) {
   console.error(err);
   result.status(500).send('Error retrieving users from database');
  }  finally {
   if (conn) conn.release();
  }
  return result; 
};
