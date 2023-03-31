const requestBodyparser = require("../util/body-parser");
const writeToFile = require("../util/write-to-file");
const { pool } = require('../methods/connection');

const fs = require('fs');


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
        title: "Validation Failed",
        message: "UUID is not valid",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
    try {
      let body = await requestBodyparser(req);
      //TODO ://update
      res.write(await insertOrUpdateIntoDefunt(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(); //JSON.stringify(body)


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

      //   req.form[index] = { id, ...body };
      //   //call data base here

      //   writeToFile(req.form);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end();
      // }
    } catch (err) {
      console.log(err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: "Request body is not valid",
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};






async function insertOrUpdateIntoDefunt(jsonData) {
  const keysArray = Object.keys(jsonData);
  let result;
  let conn;

  //not working
  try {
    conn = await pool.getConnection();
    for (let tableName of keysArray) {
      let table = jsonData[tableName];
      const keys = Object.keys(table);

      if (tableName === 'defunt') {
        const numerodefunt = table.numerodefunt;
        const existingDefunt = await conn.query(
          `SELECT * FROM defunt WHERE numerodefunt = ?`,
          [numerodefunt]
        );
        if (existingDefunt.length > 0) {
          let updateQuery = `UPDATE defunt SET `;
          let values = [];
          for (let i = 0; i < keys.length; i++) {
            updateQuery += `${keys[i]} = ?, `;
            values.push(table[keys[i]]);
          }
          updateQuery = updateQuery.slice(0, -2) + ` WHERE numerodefunt = ?`;
          values.push(numerodefunt);
          result = await conn.query(updateQuery, values);
        } else {
          let query = `INSERT INTO defunt (numerodefunt, `;
          let values = [numerodefunt];
          for (let i = 1; i < keys.length; i++) {
            query += `${keys[i]}, `;
            values.push(table[keys[i]]);
          }
          query = query.slice(0, -2) + `) VALUES (?, `;
          for (let i = 1; i < keys.length; i++) {
            query += `?, `;
          }
          query = query.slice(0, -2) + `)`;
          result = await conn.query(query, values);
        }
      } else {
        let query = `INSERT INTO ${tableName} (`;
        let values = [];
        for (let i = 0; i < keys.length; i++) {
          query += `${keys[i]}, `;
          values.push(table[keys[i]]);
        }
        query = query.slice(0, -2) + `) VALUES (`;
        for (let i = 0; i < keys.length; i++) {
          query += `?, `;
        }
        query = query.slice(0, -2) + `)`;
        result = await conn.query(query, values);
      }
    }
    return result;
  } catch (err) {
    console.error(err);
    result.status(500).send('Error retrieving users from database');
  } finally {
    if (conn) conn.release();
  }
}
