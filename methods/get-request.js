const { pool } = require('../methods/connection');

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
  'documents',//doc
  'generated_documents',
  'uploaded_documents',

];

module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  
  const regexNumbers = /^[0-9]+$/;

  // const regexV4 = new RegExp(
  // /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  // );


  if (req.url === "/api/user" ) {  //&& regexNumbers.test(id)
 
    const id = 1;
    //email +password ?    
    await getUserData(id)
  .then(data => {
    res.writeHead(200, { "Content-Type": "application/json" });
    let jsonResult = JSON.stringify(data);
    res.end(jsonResult);
  })
  .catch(err => {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Impossible d'obtenir les données de l'utilisateur",
        error: err.err.error['message'],
      })
    );
  });
  
  

  } else
  if (req.url === "/api/form") {

    await getAllDefuntsData()
    .then(data => {
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify(data);
      res.end(jsonResult);
    })
    .catch(err => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Impossible d'obtenir les données des utilisateurs",
          error: err.error['message'],
        })
      );
    });


  } else if (!regexNumbers.test(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Échec de la validation",
        message: "L'UUID n'est pas valide ou l'itinéraire n'a pas été trouvé",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

    await getOneDefuntById(id)
    .then(data => {
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify(data);
      res.end(jsonResult);
    })
    .catch(err => {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: `Impossible d'obtenir des données sur les défunts (numeroDefunt : ${id})`,
          error: err.error['message'],
        })
      );
    });

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};


function getAllDefuntsData() {
  return new Promise(async (resolve, reject) => {
    let connection;
    try {
      const data = []; 
       connection = await pool.acquire();

      for (let i = 0; i < tablesName.length; i++) {
        const table = tablesName[i];
        const query = `SELECT * FROM ${table}`;

        const [rows, fields] = await connection.execute(query);

        
        // data[table] = rows; 
        //// store all rows for the table
        ////change it to store all info in one json if table.numeroDefunt ==..
  
        for (let j = 0; j < rows.length; j++) {
          let rowData = rows[j]; 
          let dataObject = { [table]: rowData};
          const existingDataIndex = data.findIndex(obj => obj.defunt && obj.defunt.numeroDefunt === rowData.numeroDefunt);
          if (existingDataIndex === -1) {
            data.push(dataObject);
          } else {
            data[existingDataIndex][table] = rowData; // != [] ?
          }
        }
          if(i == tablesName.length - 1) {
            resolve(data);
          }

      } //end first for
    } catch (err) {
      reject({
        title:'Erreur lors de la récupération des données de la base de données',
        error: err
      });    
    } finally {
      if (connection) {
        await pool.release(connection);
      }
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
  return new Promise(async (resolve, reject) => {

    let connection;
  try {
    let data = {};
     connection = await pool.acquire();

    for (let i = 0; i < tablesName.length; i++) {
      const table = tablesName[i];
      const query = `SELECT * FROM ${table} WHERE numeroDefunt = ${numeroDefunt}`;
      const [rows, fields] = await connection.execute(query);
      data[table] = rows != [] ? rows[0] : {};
      if (i == tablesName.length - 1) {
        resolve(data);
      }
    } //end for

  } catch (err) {
    if (connection) await connection.rollback();

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



/**
* @param {number} id - The ID of the defunt to retrieve.
* @returns {Promise<Object>} A Promise that resolves to an object containing the
* retrieved data, with keys for each table name and values for the corresponding
* row data.
* @throws {Error} If there is an error retrieving data from the database.
*/
async function getUserData(id) {
  return new Promise(async (resolve, reject) => {
    try {

      const tableName = 'users';
      let query = `SELECT * FROM ${tableName} WHERE id=${id}`;

      const connection = await pool.acquire();
      try {
        const [rows, fields] = await connection.execute(query);
        resolve(rows[0]);

      } finally {
        if (connection) {
          await pool.release(connection);
        }
      }

    } catch (err) {
      reject({
        title:'Error retrieving data from database',
        error: err
      });
    }
  })
}
