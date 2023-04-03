const { pool } = require('../methods/connection');
// const requestToJsonparser = require("../util/body-parser");

const tablesName =[
  'defunt',
  'decisionnaire',
  'filiation',
  'deces',
  'mise_en_biere',
  'situation_familiale',
  'cimetiere',
  'concession',
  'rapatriement',
  'vol',
  'documents',

];

module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  
  const regexNumbers = /^[0-9]+$/;

  // const regexV4 = new RegExp(
  // /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  // );


  if (req.url === "/api/form") {

    let jsonResult = JSON.stringify(await getAllDefuntsData());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(jsonResult);

  } else if (!regexNumbers.test(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Validation Failed",
        message: "UUID is not valid",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
    res.setHeader("Content-Type", "application/json");
    //get one by ID
    var result = await getOneDefuntById(id);
    if (result != null) {
      res.statusCode = 200;
      res.write(JSON.stringify(result));
      res.end();
     
    } else {
      res.statusCode = 404;
      res.write(
        JSON.stringify({ 
          title: "Not Found", 
          message: "data not found" })
      );
      res.end();
    }

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};


function getAllDefuntsData() {
  return new Promise(async (resolve, reject) => {
    try {
      const data = []; // array to store the separate data objects
      const conn = await pool.getConnection();

      for (let i = 0; i < tablesName.length; i++) {
        const table = tablesName[i];
        const query = `SELECT * FROM ${table}`;
        const rows = await conn.query(query);

        // data[table] = rows; 
        //// store all rows for the table
        ////change it to store all info in one json if table.numeroDefunt ==..

        for (let j = 0; j < rows.length; j++) {
          const rowData = rows[j];
          const dataObject = {
            [table]: rowData
          };
          const existingDataIndex = data.findIndex(obj => obj.defunt && obj.defunt.numeroDefunt === rowData.numeroDefunt);
          if (existingDataIndex === -1) {
            data.push(dataObject);
          } else {
            data[existingDataIndex][table] = rowData;
          }
        }

      }

      conn.release();
      resolve(data);

    } catch (err) {
      console.error(err);
      reject(new Error('Error retrieving data from database'));
    }
  });
}


/**
 * Retrieves a defunt and their associated data by their ID.
 *
 * @param {number} numeroDefunt - The ID of the defunt to retrieve.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getOneDefuntById(numeroDefunt){
  try {
    const data = {};
    const conn = await pool.getConnection();

    for (let i = 0; i < tablesName.length; i++) {
      const table = tablesName[i];
      const query = `SELECT * FROM ${table} WHERE numeroDefunt = ${numeroDefunt}`;
      const rows = await conn.query(query);
      data[table] = rows[0];
    }
    conn.release();
    return data;

  } catch (err) {
    console.error(err);
    throw new Error('Error retrieving data from database');
  }
}