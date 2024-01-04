const { pool } = require('../methods/connection');
const jsonP = require('../util/tojson-parser');
const { PDFDocument } = require('pdf-lib');
const fs = require("fs");
const saveLogs = require('../util/logger');
const jwt = require("jsonwebtoken");

const tablesName = [
  "defunt",
  "decisionnaire",
  "filiation",
  "situation_familiale",
  "deces",
  "mise_en_biere",
  "cimetiere",
  "concession",
  "rapatriement",
  "vol",

  "uploaded_documents",
  "generated_documents",
];


/**
 // * @param {Uint8List} file - The ID of the defunt to retrieve.
 * @returns {String} A String that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 */
function getFileExtension(file) {
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

  try {
    //test token
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer") ||
        !req.headers.authorization.split(" ")[1]
    ) {
      return res.status(422).json({
        message: "Please provide a valid token",
      });
    }
    const theToken = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(theToken, process.env.SECRET_KEY);


    if (req.url === "/api/user/" && regexNumbers.test(id)) {

      let userId =  decoded.id;
      await getUserData(userId)
          .then(data => {
            let jsonResult = JSON.stringify(data);
            // console.log(jsonResult)
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(jsonResult);
          })
          .catch(err => {
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(
                JSON.stringify(err)
            );
          });
    }
    else if (req.url === "/api/form") {

      await getAllDefuntsData()
          .then(data => {
            let jsonResult = JSON.stringify(data);
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(jsonResult);
          })
          .catch(err => {
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(
                JSON.stringify({
                  title: "Impossible d'obtenir les données des utilisateurs",
                  error: err.error['message'],
                })
            );
          });


    }
    else if (!regexNumbers.test(id) && !regexLetters.test(id)) {

      res.writeHead(404, {"Content-Type": "application/json"});
      res.end(
          JSON.stringify({
            error: "Échec de la validation",
            message: "L'UUID n'est pas valide ou l'itinéraire n'a pas été trouvé",
          })
      );
    }
    else if (baseUrl === "/api/form/docs/" && regexNumbers.test(req.url.split("?")[0].split("/")[4])) {

      let id = req.url.split("?")[0].split("/")[4];
      const {fileName} = req.query;
      await getOneUploadedFileDataById(id, fileName) //cni_fr_defunt
          .then(data => {
            const file_name = `${fileName}`;//${fileName}_${id}.bin
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
            res.send(data);

          })
          .catch(err => {
            console.log(err)
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(JSON.stringify(err));
          });

    }
    else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {

      //check token
      // console.log(92)

      await getOneDefuntDataById(id)
          .then(data => {
            let jsonResult = JSON.stringify(data);
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(jsonResult);
          })
          .catch(err => {
            console.log(err)

            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(
                JSON.stringify(err)
            );
          });

    }
    else if (baseUrl === "/api/form/check_download_files/" && regexNumbers.test(req.url.split("?")[0].split("/")[4])) {
      const defuntId = req.url.split("?")[0].split("/")[4];
      const { index } = req.query;

      await checkDownloadedFilesById(defuntId, index)
          .then((data) => {
            let jsonResult = JSON.stringify(data);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(jsonResult);
          })
          .catch((err) => {
            console.log(err);
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify(err));
          });
    }
    else if (baseUrl === "/api/form/download/" && regexNumbers.test(req.url.split("?")[0].split("/")[4])) {
      const defuntId = req.url.split("?")[0].split("/")[4];
      const { index } = req.query; //from parametre

      await getGeneratedFolderFileById(defuntId, index, decoded.id)
          .then(async (filePDFPath) => {

            const fileName = filePDFPath.split("/").pop();
            const fileStream = fs.createReadStream(filePDFPath.toString());
            const stat = fs.statSync(filePDFPath);
            const fileSize = stat.size;

            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${fileName}`
            );
            res.setHeader("Content-Length", fileSize);
            fileStream.pipe(res);
            await sleep(1000); //wait until download done

            fs.unlinkSync(filePDFPath);

            saveLogs(`user:${decoded.id} generate folder:${index} for defunt :${defuntId}.`);
          })
          .catch((err) => {
            console.log(err);
            saveLogs(`Error get download folder ${index} - defunt ${defuntId} : ${err}`)
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify(err));
          });
    }
    else if (baseUrl === "/api/form/" && regexLetters.test(id)) {

      await getDefuntDataByName(id)
          .then(data => {
            let jsonResult = JSON.stringify(data);
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(jsonResult);
          })
          .catch(err => {
            console.log(err)
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(
                JSON.stringify(err)
            );
          });
    }
    else {
      res.writeHead(404, {"Content-Type": "application/json"});
      res.end(JSON.stringify({message: "Not Found", error: "Route not found"}));
    }

  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401)
          .send({ msg: "Token expired. Please log in again." });
    }
    return res.status(401).send({ msg: "Invalid token." });
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

        const [rows] = await connection.execute(query);


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
        if(i === tablesName.length - 1) {
          resolve(data);
        }

      } //end first for
    } catch (err) {
      reject({
        title:'Erreur lors de la récupération des données de la base de données',
        error: err
      });
    } finally {
      if (connection && pool.isBorrowedResource(connection)) {
        await pool.release(connection);
      }
    }
  });
}

/**
 * Retrieves a defunt and their uploaded docs associated data by their ID.
 *
 * @param {number} numeroDefunt - The ID of the defunt to retrieve.
 * @param {String} fileName - The file name of the defunt to retrieve.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getOneUploadedFileDataById(numeroDefunt, fileName){
  return new Promise(async (resolve, reject) => {
    let connection;
    try {
      connection = await pool.acquire();
      const query = `SELECT ${fileName}
      FROM uploaded_documents AS upd WHERE upd.numeroDefunt = ${numeroDefunt}`;

      const [rows] = await connection.execute(query);
      if(rows[0] != null){
        resolve(rows[0][`${fileName}`]);
      }else{
        resolve(null);
      }

    } catch (err) {
      if (connection) await connection.rollback();
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: err //
      });
    } finally {
      if (connection && pool.isBorrowedResource(connection)) {
        await pool.release(connection);
      }
    }
  });


}


function getFilesNameByIndex(index){
  return new Promise((resolve) => {
    let filesName = '';
    switch (index) {
      case '0': //mairie
        filesName = 'pouvoir, cni_fr_dec, cni_fr_defunt, act_naissance, declaration_deces, tm_apres_mb';
        break;
      case '1': //Prefecture
        filesName = 'demande_prefecture, pouvoir, cni_fr_dec, certificat_deces, act_deces, fermeture_cercueil';
        break;
      case '2': //consulat
        filesName = 'demande_consulaire, pouvoir, cni_origin_defunt, certificat_deces, attestation_covid, act_deces, mise_en_biere,attestation_honneur';
        break;
      case '3': //deroulement rap
        filesName = 'deroulement_rap';
        break;
      case '4': //fret
        filesName = 'page_garde_garde, pouvoir, cni_fr_dec, cni_fr_defunt, certificat_deces, attestation_covid, act_deces, fermeture_cercueil, mise_en_biere, autorisation_prefecture, autorisation_consulaire';
        break;
      case '5': //ambilance
        filesName = 'page_garde_garde, certificat_deces, attestation_covid, act_deces, autorisation_prefecture, autorisation_consulaire, deroulement_rap, confirmation_vol';
        break;
      case '6': //assurance //Dossier famille
        filesName = 'page_garde_garde, page_condoleance, deroulement_rap, pouvoir, cni_fr_dec, cni_origin_defunt, certificat_deces, attestation_covid, act_deces, autorisation_prefecture, autorisation_consulaire';  //, deroulement_rap //page_garde_garde, page_condoleance,
        break;
      case '7': //assuranse2 //Accompagnateur
        filesName = 'attestation_accompagnateurs, passport1, passport2, act_deces, justification_lien_parente, deroulement_rap';
        break;
      case '8'://21://
        filesName = 'pouvoir, cni_fr_dec, cni_fr_defunt, act_naissance, declaration_deces, tm_apres_mb';
        break;
      case '9'://22://Cimetiere inh
        filesName = 'pouvoir, cni_fr_dec, certificat_deces, act_deces, fermeture_cercueil, achat_concession, bon_travaux'; //if achat_concession, bon_travaux null check achat_de_concession, bon_de_travaux in generated
        break;
      case '10'://23://Deroulement inh
        filesName = 'deroulement_inh';
        break;
      case '11': //24://Dossier famille
        filesName = 'page_garde_garde, page_condoleance, deroulement_inh, pouvoir, cni_fr_dec, cni_origin_defunt, certificat_deces, act_deces';
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
async function checkDownloadedFilesById(numeroDefunt, index) {
  return new Promise(async (resolve, reject) => {
    let connection;
    let result = [];
    try {
      connection = await pool.acquire();
      let filesName = "";

      await getFilesNameByIndex(index)
          .then((_filesName) => {
            filesName = _filesName;
          })
          .catch((error) => {
            console.log("Error:", error);
          });

      if (filesName !== "") {
        let listFilesName = filesName.split(",").map((value) => value.trim());
        const query = `SELECT ${filesName}
        FROM uploaded_documents AS upd
        LEFT JOIN generated_documents AS gd ON upd.numeroDefunt = gd.numeroDefunt
        WHERE upd.numeroDefunt = ?`;
        let value = [numeroDefunt];
        const [rows,] = await connection.execute(query, value);

        if (rows.length > 0) {
          for (const fileName of listFilesName) {
            if (rows[0][fileName] != null && (rows[0][fileName]).toString('utf8') !== '[]') {
              result.push(fileName);
            }
          }
          resolve({
            expected: listFilesName,
            received: result,
            folder_index: index,
            numeroDefunt: numeroDefunt
          });
        } else {
          reject({
            error: "Error-Check-File",
            message: `defunt with id : ${numeroDefunt} has no file uploded`,
          });
        }
      } else {

        // saveLogs(`Note 470 - Check-File index : ${index} incorrect`);

        reject({
          error: "Error-Check-File",
          message: `index : ${index} incorrect`,
        });
      }
    } catch (err) {
      saveLogs(`Error 503 - check GeneratedFileById :  ${err}`);
      if (connection) await connection.rollback();
      console.log(err);
      reject({
        error: "Error-Check-File",
        message: err, //!
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
 * @param {number} index - The case number of the folder to generate.
 * @param {number} userId - The case number of the folder to generate.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getGeneratedFolderFileById(numeroDefunt,index,userId) {
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
          }).catch(error => {
            console.log("Error:", error);
          });

      if (filesName === "") {
        reject({
          error: "Error-Generation-PDF",
          msg: `index : ${index} incorrect`,
        });
      }

        let listFilesName = filesName.split(',').map(value => value.trim())

        const query = `SELECT defuntNom ,${filesName}
                              From defunt as d
                              LEFT JOIN uploaded_documents AS upd ON d.numeroDefunt = upd.numeroDefunt
                              LEFT JOIN generated_documents AS gd ON d.numeroDefunt = gd.numeroDefunt
                              WHERE upd.numeroDefunt = ?`;
        const [rows] = await connection.execute(query, [numeroDefunt]); //

        if (rows.length === 0) {
          reject({
            error: "Error-Generation-PDF",
            msg: `Defunt with id: ${numeroDefunt} has no file uploaded or does not exist`,
          });
        }

        const mergedDoc = await PDFDocument.create();
        mergedDoc.setTitle(`Dossier_${foldersTitle[index]}_${rows[0]['defuntNom']}`);
        mergedDoc.setProducer('Lapiete'); // Set the Producer name
        mergedDoc.setCreator(`user_${userId}`); //admin_Id

        for (const fileName of listFilesName) {
            if (rows[0][`${fileName}`] != null) {

              let fileBuffer = Buffer.from(rows[0][`${fileName}`]);
              let extension = getFileExtension(fileBuffer);

              if (fileBuffer != null && extension !== 'pdf') {
                const imageDoc = await PDFDocument.create();
                const imagePage = imageDoc.addPage();
                let image;
                if (extension === 'jpg' || extension === 'jpeg')
                  image = await imageDoc.embedJpg(fileBuffer);
                if (extension === 'png')
                  image = await imageDoc.embedPng(fileBuffer);
                imagePage.drawImage(image, {x: 0, y: 0, width: image.width, height: image.height});
                const imageBytes = await imageDoc.save();

                // Merge the converted image PDF with the main merged document
                const imagePdf = await PDFDocument.load(imageBytes);
                const pages = await mergedDoc.copyPages(imagePdf, [0]);
                pages.forEach((page) => mergedDoc.addPage(page));

              } else if (extension === "pdf") {
                // Add the PDF file as a byte array to the main merged document
                const pdf = await PDFDocument.load(fileBuffer,{ ignoreEncryption: true });
                const pages = await mergedDoc.copyPages(pdf, pdf.getPageIndices());
                pages.forEach((page) => mergedDoc.addPage(page));

              }
            }
          }
        // Save the PDF in local
        const filePDFPath = `${tmpDirectoryPath}dossier_${foldersTitle[index]}_${rows[0]['defuntNom']}.pdf`;

        const finalPdfBytes = await mergedDoc.save();
        fs.writeFileSync(filePDFPath, finalPdfBytes);
        resolve(filePDFPath);


    } catch (err) {
       saveLogs(`Error in getGeneratedFolderFileById: ${err}`);
      reject({
        error:'Error-Generation-PDF',
        msg:`Error in generating PDF: ${err.message}`
      });
    } finally {
      if (connection && pool.isBorrowedResource(connection)) {
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

      const [rows,] = await connection.execute(query);

      let jsonData;
      if (rows.length > 0) {
        jsonData = await jsonP(rows, numeroDefunt);
      } else {
        jsonData = {};
      }
      resolve(jsonData);

    } catch (err) {
      saveLogs(`Error 646 - getOneDefuntDataById : ${err}`);
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: `Error in  getOneDefuntDataById :${err}`,
      });
    } finally {
      if (connection && pool.isBorrowedResource(connection)) {
        await pool.release(connection);
      }
    }
  });
}


/**
 * @param {string} lastName - The last name of the defunt to retrieve.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an object containing the
 * retrieved data, with keys for each table name and values for the corresponding
 * row data.
 * @throws {Error} If there is an error retrieving data from the database.
 */
async function getDefuntDataByName(lastName) {
  return new Promise(async (resolve, reject) => {
    let connection;
    try {
      const tableName = 'defunt';
      connection = await pool.acquire();

      // Using parameterized query to prevent SQL injection
      const query = `SELECT * FROM ${tableName} WHERE LOWER(defuntNom) LIKE LOWER(?)`;
      const queryParams = [`%${decodeURIComponent(lastName)}%`];

      const [rows] = await connection.execute(query,queryParams);

      try {
        if(rows.length === 1){
          let id = rows[0]['numeroDefunt'];
          if (connection && pool.isBorrowedResource(connection)) {
            await pool.release(connection);
          }

          await getOneDefuntDataById(id)
              .then(data => {
                resolve(data);
              })
              .catch(err => {
                saveLogs(`Error 592 - getDefuntDataByName :  ${err}`);
                console.log(err)
                reject({
                  error:'Error-retrieving-database',
                  msg: err
                });

              });
        }
        else{
          resolve(rows);
        }
      } catch (err) {
        saveLogs(`Error 775 - getDefuntDataByName :  ${err}`);
        reject({
          error: "Error-retrieving-database",
          msg: err, //!
        });

      }
    } catch (err) {
      console.log("err- 714 -",err);
      saveLogs(`Error 715 - getDefuntDataByName :  ${err}`);
      reject({
        error:'Error-retrieving-database',
        msg: `${err}`
      });
    }
    finally {
      if (connection && pool.isBorrowedResource(connection)) {
        await pool.release(connection);
      }
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
        const [rows, ] = await connection.execute(query);
        resolve(rows[0]);

      } finally {
        if (connection && pool.isBorrowedResource(connection)) {
          await pool.release(connection);
        }
      }

    } catch (err) {
      saveLogs(`Error 757 - getUserData :  ${err}`);
      console.log(err);
      reject({
        error:'Error-retrieving-database',
        msg: `${err}`
      });
    }
  })
}


