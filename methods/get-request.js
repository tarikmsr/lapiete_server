const { pool } = require('../methods/connection');
const jsonP = require('../util/tojson-parser');
const { PDFDocument } = require('pdf-lib');
const fs = require("fs");
const saveLogs = require('../util/logger');


const tablesName =[
  'defunt',
  'decisionnaire',
  'filiation',
  'situation_familiale',
  'deces',
  'mise_en_biere',
  'cimetiere',
  'concession',
  'rapatriement',
  'vol',

  'uploaded_documents',
  'generated_documents'
];


function getFileExtension(file) { //Uint8List file
  if (file.length < 12) {
    return 'null';
  }

  if (file[0] === 0xFF && file[1] === 0xD8) {
    // Likely a JPEG/JPG
    return 'jpg';
  }

  if (
      file[0] === 0x89 &&
      file[1] === 0x50 &&
      file[2] === 0x4E &&
      file[3] === 0x47 &&
      file[4] === 0x0D &&
      file[5] === 0x0A &&
      file[6] === 0x1A &&
      file[7] === 0x0A
  ) {
    return 'png';
  }

  if (
      file[0] === 0x25 &&
      file[1] === 0x50 &&
      file[2] === 0x44 &&
      file[3] === 0x46
  ) {
    return 'pdf';
  }

  return '';
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = async (req, res) => {

  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];

  const regexNumbers = /^[0-9]+$/;
  const regexLetters = /^[a-zA-Z0-9_-\u00C0-\u017F%]+$/;

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



  } else if (req.url === "/api/form") {

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


  }
  else if (!regexNumbers.test(id) && !regexLetters.test(id)) {

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
        JSON.stringify({
          error: "Échec de la validation",
          message: "L'UUID n'est pas valide ou l'itinéraire n'a pas été trouvé",
        })
    );
  }
  else if (baseUrl === "/api/form/docs/" && regexNumbers.test(req.url.split("?")[0].split("/")[4]) ) {

    let id = req.url.split("?")[0].split("/")[4];
    const { fileName } = req.query;
    await getOneDefuntUploadedDataById(id,fileName) //cni_fr_defunt
        .then(data => {

          const file_name = `${fileName}`;//${fileName}_${id}.bin
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
          res.send(data);

        })
        .catch(err => {
          console.log(err)

          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
              JSON.stringify(err)
          );
        });



  }
  else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

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

  }
  else if (baseUrl === "/api/form/download/" && regexNumbers.test(req.url.split("?")[0].split("/")[4]) ) {

    const defuntId = req.url.split("?")[0].split("/")[4];
    const { index } = req.query; //from parametre

    console.log("175-- defuntId-",defuntId);


    await getGeneratedFolderFileById(defuntId,index)
        .then(async filePDFPath => {

          //// pdfkit  ////
          //   const chunks = [];
          //   pdfDoc.on('data', chunk => {
          // chunks.push(chunk);
          // });
          //
          // pdfDoc.on('end', () => {
          //   const buffer = Buffer.concat(chunks);
          //   res.setHeader('Content-Type', 'application/octet-stream');
          //   res.setHeader('Content-Disposition', `attachment; filename="${pdfDoc.info.Title}.pdf"`);
          //   res.end(buffer);
          // });
          // //
          // pdfDoc.end();


          ///// receive : filePDFPath
          const fileName = filePDFPath.split('/').pop();
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename=${fileName}`); //${pdfDoc.Title}
          const fileStream = fs.createReadStream(filePDFPath.toString());
          fileStream.pipe(res);

          await sleep(1000); //wait until transfert


          console.log("filePDFPath : ", filePDFPath);
          fs.unlinkSync(filePDFPath);
          console.log("--- end ---");


        })
        .catch(err => {
          console.log(err)
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
              JSON.stringify(err)
          );
        });

  }

  else if (baseUrl === "/api/form/" && regexLetters.test(id)) {

    //check token
    // console.log("test - 118");
    // console.log(id);


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
        // store all rows for the table
        //change it to store all info in one json if table.numeroDefunt ==..

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
 * Retrieves a defunt and their uploaded docs associated data by their ID.
 *
 * @param {number} numeroDefunt - The ID of the defunt to retrieve.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getOneDefuntUploadedDataById(numeroDefunt, fileName){
  return new Promise(async (resolve, reject) => {
    let connection;
    try {
      connection = await pool.acquire();
      const query = `SELECT ${fileName}
      FROM uploaded_documents AS upd WHERE upd.numeroDefunt = ${numeroDefunt}`;

      const [rows, fields] = await connection.execute(query);
      resolve(rows[0][`${fileName}`]);

    } catch (err) {
      if (connection) await connection.rollback();
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: err //
      });
    } finally {
      if (connection) {
        await pool.release(connection);
      }
    }
  });


}


function getFilesNameByIndex(index){
  return new Promise((resolve, reject) => {
    let filesName = '';
    switch (index) {
      case '0': //mairie
        filesName = ',pouvoir, cni_fr_dec, cni_fr_defunt, act_naissance, declaration_deces, tm_apres_mb'; 
        break;
      case '1': //Prefecture
        filesName = ',demande_prefecture, pouvoir, cni_fr_dec, certificat_deces, act_deces, fermeture_cercueil';
        break;
      case '2': //consulat
        filesName = ',demande_consulaire, pouvoir, cni_origin_defunt, certificat_deces, attestation_covid, act_deces, mise_en_biere,attestation_honneur'; 
        break;
      case '3': //deroulement rap
        filesName = ',deroulement_rap';          
        break;
      case '4': //fret
        filesName = ',page_garde_garde, pouvoir, cni_fr_dec, cni_fr_defunt, certificat_deces, attestation_covid, act_deces, fermeture_cercueil, mise_en_biere, autorisation_prefecture, autorisation_consulaire';  
        break;
      case '5': //ambilance
        filesName = ',page_garde_garde, certificat_deces, attestation_covid, act_deces, autorisation_prefecture, autorisation_consulaire, deroulement_rap, confirmation_vol';  
        break;
      case '6': //assurance //Dossier famille
        filesName = ',page_garde_garde, page_condoleance, deroulement_rap, pouvoir, cni_fr_dec, cni_origin_defunt, certificat_deces, attestation_covid, act_deces, autorisation_prefecture, autorisation_consulaire';  //, deroulement_rap //page_garde_garde, page_condoleance,
        break;
      case '7': //assuranse2 //Accompagnateur
        filesName = ',attestation_accompagnateurs, passport1, passport2, act_deces, justification_lien_parente, deroulement_rap';
        break;
      case '8'://21://
        filesName = ',pouvoir, cni_fr_dec, cni_fr_defunt, act_naissance, declaration_deces, tm_apres_mb'; 
        break;
      case '9'://22://Cimetiere inh
        filesName = ',pouvoir, cni_fr_dec, certificat_deces, act_deces, fermeture_cercueil, achat_concession, bon_travaux'; //if achat_concession, bon_travaux null check achat_de_concession, bon_de_travaux in generated                 
        break;
      case '10'://23://Deroulement inh
        filesName = ',deroulement_inh'; 
        break;
      case '11': //24://Dossier famille
        filesName = ',page_garde_garde, page_condoleance, deroulement_inh, pouvoir, cni_fr_dec, cni_origin_defunt, certificat_deces, act_deces'; 
        break;
      default:
        console.log("No index corresponding");
        break;
    }
    resolve(filesName);
  });
}


/**
 * Retrieves a defunt and their associated data by their ID.
 *
 * @param {number} numeroDefunt - The ID of the defunt to retrieve.
 * @param {number} index - The case number of the folder to generate.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getGeneratedFolderFileById(numeroDefunt,index) {
  return new Promise(async (resolve, reject) => {

    let connection;
    try {
      connection = await pool.acquire();

      const foldersTitle = ['Mairie_rap','Préfecture','Consulat','Déroulement_rap','Fret','Ambulance','Assurance','Accompagnateur','mairie_inh','Cimetiere','Deroulement_inh','Dossier_famille' ];
      let filesName = '';
      const tmpDirectoryPath = './util/cache/';



      // const fileLog = fs.createWriteStream(`${tmpDirectoryPath}logs_generatedFolder.txt`);

      await getFilesNameByIndex(index)
          .then(_filesName => {
            filesName = _filesName;
          }).catch(error => { console.log("Error:", error);});

      var listFilesName = filesName.split(',').map(value => value.trim())

      const query = `SELECT defuntNom ${filesName}
      From defunt as d
      LEFT JOIN uploaded_documents AS upd ON d.numeroDefunt = upd.numeroDefunt
      LEFT JOIN generated_documents AS gd ON d.numeroDefunt = gd.numeroDefunt
      WHERE upd.numeroDefunt = ?`;
      const [rows, fields] = await connection.execute(query , [numeroDefunt]); //

      console.log("443-- numeroDefunt-",numeroDefunt);

      console.log("445-- rows-",rows);



      if(rows.length > 0){

        const mergedDoc = await PDFDocument.create();

        mergedDoc.setTitle(`Dossier_${foldersTitle[index]}_${rows[0]['defuntNom']}`);
        mergedDoc.setProducer('Lapiete'); // Set the Producer name
        mergedDoc.setCreator('Lapiete'); //admin_Id

        for (const fileName of listFilesName) {
          if(rows[0][`${fileName}`] != null){

            let fileBuffer = Buffer.from(rows[0][`${fileName}`]);
            let extension = getFileExtension(fileBuffer);

            if(fileBuffer != null && extension != 'pdf'){

              const imageDoc = await PDFDocument.create();
              const imagePage = imageDoc.addPage();
              let image;
              if(extension == 'jpg' || extension == 'jpeg')
                image = await imageDoc.embedJpg(fileBuffer);
              if(extension == 'png')
                image = await imageDoc.embedPng(fileBuffer);

              imagePage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
              const imageBytes = await imageDoc.save();

              // Merge the converted image PDF with the main merged document
              const imagePdf = await PDFDocument.load(imageBytes);
              const pages = await mergedDoc.copyPages(imagePdf, [0]);
              pages.forEach((page) => mergedDoc.addPage(page));

            }else
            {
  
              // Add the PDF file as a byte array to the main merged document
              const pdf = await PDFDocument.load(fileBuffer);
              const pages = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
              pages.forEach((page) => mergedDoc.addPage(page));

            }//end else
          }
        }
        // Save the PDF in local
        const filePDFPath = `${tmpDirectoryPath}dossier_${foldersTitle[index]}_${rows[0]['defuntNom']}.pdf`;

        const finalPdfBytes = await mergedDoc.save();
        fs.writeFileSync(filePDFPath, finalPdfBytes);


        // console.log("--mergedDoc--");
        // console.log(mergedDoc);
        resolve(filePDFPath);
      }//end if rows

    } catch (err) {
       saveLogs(`Error 513 - getGeneratedFolderFileById :  ${err}`);
      if (connection) await connection.rollback();
      console.log(err);
      reject({
        error:'Error-Generation-PDF',
        msg: err //!
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
      connection = await pool.acquire();

      const query = `SELECT *
      FROM defunt AS d
      LEFT JOIN decisionnaire AS dcr ON d.numeroDefunt = dcr.numeroDefunt
      LEFT JOIN filiation AS f ON d.numeroDefunt = f.numeroDefunt
      LEFT JOIN situation_familiale AS sf ON d.numeroDefunt = sf.numeroDefunt
      LEFT JOIN deces AS dc ON d.numeroDefunt = dc.numeroDefunt
      LEFT JOIN mise_en_biere AS mb ON d.numeroDefunt = mb.numeroDefunt
      LEFT JOIN cimetiere AS cm ON d.numeroDefunt = cm.numeroDefunt
      LEFT JOIN concession AS cc ON d.numeroDefunt = cc.numeroDefunt
      LEFT JOIN rapatriement AS rp ON d.numeroDefunt = rp.numeroDefunt
      LEFT JOIN vol AS v ON d.numeroDefunt = v.numeroDefunt
      WHERE d.numeroDefunt = ${numeroDefunt}`;

      const [rows, fields] = await connection.execute(query);

      let jsonData = await jsonP(rows);

      resolve(jsonData);

    } catch (err) {
      saveLogs(`Error 562 - getOneDefuntDataById :  ${err}`);

      if (connection) await connection.rollback();
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: err //!
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
      console.log(`search on : ${lastName}`);

      const tableName = 'defunt';
      let query = `SELECT * FROM ${tableName} WHERE LOWER(defuntNom) LIKE LOWER('%${decodeURIComponent(lastName)}%')`;
      var results = [];

      const connection = await pool.acquire();
      try {
        const [rows, fields] = await connection.execute(query);
        results = rows;
        console.log(rows);

        if(rows.length == 1){
          var id = rows[0]['numeroDefunt'];
          if (connection) { //end the first
            console.log("350-- search byName realise connection----");
            saveLogs(`Note 606 - getDefuntDataByName connectection closed `);

            await pool.clear(connection);
            await pool.release(connection);
          }

          await getOneDefuntDataById(id)
              .then(data => {
                console.log("------",data);
                resolve(data);
              })
              .catch(err => {
                saveLogs(`Error 617 - getDefuntDataByName :  ${err}`);
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
            console.log("377-- finally realise connection----");
            
            await pool.release(connection);
          } catch (err) {
            console.log(err);
          }
        }
      }

    } catch (err) {
      console.log("err- 642 -",err);
      saveLogs(`Error 642 - getDefuntDataByName :  ${err}`);
      reject({
        error:'Error-retrieving-database',
        msg: err
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
      saveLogs(`Error 680 - getUserData :  ${err}`);

      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: err
      });
    }
  })
}


