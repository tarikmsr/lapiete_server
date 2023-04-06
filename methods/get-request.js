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
    console.log(err);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Validation Failed",
        message: "UUID user is not valid",
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
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: "UUID defunts are not found",
        })
      );
    });


  } else if (!regexNumbers.test(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Validation Failed",
        message: "UUID is not valid",
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
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: "UUID defunt id is not found",
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
    try {
      const data = []; 

      pool.connect((err) => {
        if (err) throw err;
        console.log('Connected to MySQL database! : ');
      });

      for (let i = 0; i < tablesName.length; i++) {
        const table = tablesName[i];
        const query = `SELECT * FROM ${table}`;

        pool.query(query, (err, rows, fields) => {
          if (err) throw err;
  
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
        });

      } //end first for

   

    } catch (err) {
      console.error(err);
      reject(new Error('Error retrieving data from database'));
    }
    finally {
      pool.end((err) => {
        if (err) throw err;
        console.log('Connection closed!');
      });  
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

  try {
    let data = {};

    pool.connect((err) => {
      if (err) throw err;
      console.log('Connected to MySQL database! : ');
    });

    for (let i = 0; i < tablesName.length; i++) {
      const table = tablesName[i];
      const query = `SELECT * FROM ${table} WHERE numeroDefunt = ${numeroDefunt}`;
      pool.query(query, (err, results, fields) => {
        if (err) throw err;

        data[table] = results != [] ? results[0] : {};
        if(i == tablesName.length - 1) {
          resolve(data);
        }
      });

    } //end for

  } catch (err) {
    console.error(err);
    reject(new Error('Error retrieving data from database : '+err));
  }    
  finally {
    pool.end((err) => {
      if (err) throw err;
      console.log('Connection closed!');
    });  
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


      // const [rows, fields] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]); 
      const [results] = await pool.promise().query(query);

      console.log("result")
      console.log(results) 
                              
      resolve(results[0]);




      // pool.query(query, (err, results, fields) => {
      //   if (err) {
      //     reject(new Error(`Error executing query: ${err.message}`));
      //   } else {
      //     resolve(results[0]);
      //   }
      // });



    } catch (err) {
      console.error(err);
      reject(Error(`Error retrieving data from database: ${err.message}`));
    }
  })
    .finally(() => {
      pool.end((err) => {
        if (err) {
          console.error(`Error closing connection: ${err.message}`);
        } else {
          console.log('Connection closed!');
        }
      });
    });
}
