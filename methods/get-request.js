const { pool } = require('../methods/connection');
// require('dotenv').config();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const connection = require('../methods/connection');

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

  'uploaded_documents',
  'generated_documents',

];

module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  
  const regexNumbers = /^[0-9]+$/;
  // const regexLetters = /^[a-zA-Z]+$/;
  const regexLetters = /^[a-zA-Z0-9_-]+$/;



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
    // console.log(jsonResult)
    res.end(jsonResult);
  })
  .catch(err => {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(err)
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
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Impossible d'obtenir les données des utilisateurs",
          error: err.error['message'],
        })
      );
    });


  } else if (!regexNumbers.test(id) && !regexLetters.test(id)) {

    console.log("test url 81 get ");
    console.log(!regexNumbers.test(id));
    console.log(!regexLetters.test(id));

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Échec de la validation",
        message: "L'UUID n'est pas valide ou l'itinéraire n'a pas été trouvé",
      })
    );
  } else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {


    //check token
    // console.log(92)

    await getOneDefuntDataById(id)
    .then(data => {      
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify(data);
      res.end(jsonResult);
    })
    .catch(err => {
      console.log(err)

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(err)
      );
    });

  } else if (baseUrl === "/api/form/" && regexLetters.test(id)) {    

    //check token
    // console.log(109)

    console.log("test - 118");
        
    console.log(id);



    await getDefuntDataByName(id)
    .then(data => {      
      res.writeHead(200, { "Content-Type": "application/json" });
      let jsonResult = JSON.stringify(data);
      res.end(jsonResult);
    })
    .catch(err => {
      console.log(err)

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(err)
      );
    });


  } else
  
  {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Not Found", error: "Route not found" }));
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


        if (rows && rows.length > 0 ) {
          const row = rows[0];
          const fields = Object.keys(row);
          for (let j = 0; j < fields.length; j++) {
            const field = fields[j];
            if (row[field] && j > 0 && (table === 'generated_documents' || table === 'uploaded_documents')) {
              const byteValue = Buffer.from(row[field]);
              try{
                row[field] = Array.from(byteValue);
              }catch(err){
                console.log(err);
              }
            }
          }
          rows[0] = row;  //test it later
        } 
        
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
async function getOneDefuntDataById(numeroDefunt){
  return new Promise(async (resolve, reject) => {

    let connection;
  try {
    let data = {};
     connection = await pool.acquire();

    for (let i = 0; i < tablesName.length; i++) {
      const table = tablesName[i];
      const query = `SELECT * FROM ${table} WHERE numeroDefunt = ${numeroDefunt}`;

      const [rows, fields] = await connection.execute(query);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const fields = Object.keys(row);
        for (let j = 0; j < fields.length; j++) {
          const field = fields[j];
          if (row[field] && j > 0 && (table === 'generated_documents' || table === 'uploaded_documents')) {
            const byteValue = Buffer.from(row[field]);
            try{
              row[field] =  Array.from(byteValue.toJSON().data);
            }catch(err){
              console.log(err);
            }
          }
        }
        data[table] = row;

        

      } else
       if(table == tablesName[0]){
        reject({
          error:'defunt-doesnot-exist',
        });

       }else  
      {
        data[table] = {};
      }

      if (i == tablesName.length - 1) {
        data['error'] = null;
        resolve(data);
      }
    } //end for

  } catch (err) {
    if (connection) await connection.rollback();
    console.log(err);
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


/**
* @param {string} lastName - The last name of the defunt to retrieve.
* @returns {Promise<Object>} A Promise that resolves to an object containing the
* retrieved data, with keys for each table name and values for the corresponding
* row data.
* @throws {Error} If there is an error retrieving data from the database.
*/
async function getDefuntDataByName(lastName) {

  return new Promise(async (resolve, reject) => {
    try {

      const tableName = 'defunt';
      let query = `SELECT * FROM ${tableName} WHERE LOWER(defuntNom) LIKE LOWER('%${lastName}%')`;
      var results = [];

      const connection = await pool.acquire();
      try {
        const [rows, fields] = await connection.execute(query);
        results = rows;
        console.log(rows);
        console.log(rows.length == 1);
        if(rows.length == 1){
          var id = rows[0]['numeroDefunt'];
           if (connection) { //end the first
          await pool.release(connection);
          }

          await getOneDefuntDataById(id)
          .then(data => {   
            console.log("data");
            console.log(data);

            resolve(data);
          })
          .catch(err => {
            console.log(err)
            reject({
              error:'Error-retrieving-database',
              msg: err //
            });
    
          });

        }else{
          
          resolve(rows);
        }

      } finally {
        if (connection && results.length != 1) {
          try{ //don't excute if search by name
            await pool.release(connection);
         } catch (err) {
          console.log(err);

        }
        }
      }

    } catch (err) {
      console.log("err-339");
      console.log(err);

      reject({
        error:'Error-retrieving-database',
        // error: err
      });
    }
  })
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
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        // error: err
      });
    }
  })
}


