const { pool } = require('../methods/connection');
const requestBodyparser = require("../util/body-parser");

const tablesName =[
  'defunt',
  'decisionnaire',
  'affiliation',
  'deces',
  'mise_en_biere',
  'situation_familiale',
  'cimetiere',
  'concession',
  'rapatriement',
  'vol',
];

module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  
  const regexNumbers = /^[0-9]+$/;

  const regexV4 = new RegExp(
  /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  );



  if (req.url === "/api/form") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    //get all
    res.write(await getAllDefuntsData());
    res.end();

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
    var result = await getDefuntData(id);
    if (result != null) {
      res.statusCode = 200;
      res.write(JSON.stringify(result));
      res.end();
     
    } else {
      res.statusCode = 404;
      res.write(
        JSON.stringify({ title: "Not Found", message: "data not found" })
      );
      res.end();
    }

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};


async function getAllDefuntsData(){
  try {
    const data = {};
    const conn = await pool.getConnection();

    for (let i = 0; i < tablesName.length; i++) {
      const table = tablesName[i];
      const query = `SELECT * FROM ${table}`;
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


async function getDefuntData(numeroDefunt){
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

