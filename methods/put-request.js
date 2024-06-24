const requestToJsonparser = require("../util/body-parser");
const { pool } = require("../methods/connection");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { MulterError } = require("multer");
const jwt = require("jsonwebtoken");
const saveLogs = require("../util/logger");
const upload = require("../util/upload");

const chunksFolder = path.join(__dirname, "../util/cache/chunks"); // Folder to store chunks
const uploadFolder = path.join(__dirname, "../util/cache/uploads"); // Folder to store final files
const maxChunksExpected = 20; // Total number of chunks expected
// Declare fileUploads object
let fileUploads = {};

module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3].split("?")[0];
  const defuntId = req.url.split("?")[0].split("/")[3];

  const regexNumbers = /^[0-9]+$/;
  try {
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer") ||
      !req.headers.authorization.split(" ")[1]
    ) {
      return res.status(422).json({
        message: "Please provide the token",
      });
    }
    const theToken = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(theToken, process.env.SECRET_KEY);

    if (!regexNumbers.test(id)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        // title: "Échec de la validation",
        error: "L'UUID n'est pas valide",
      })
    );
  }
    else if (baseUrl === "/api/form/" && regexNumbers.test(id)) {
      try {
        if (req.body != null) {
          let jsonData = await requestToJsonparser(req);
          await updateIntoDefunt(jsonData, id)
            .then((result) => {
              let jsonResult = JSON.stringify({
                message: "update-successful",
                result: result,
              });
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(jsonResult);
              saveLogs(`success: update defunt : ${id} by user ${decoded.id}`);
            })
            .catch((err) => {
              saveLogs(`Error 67 - put - cannot update Defunt :  ${err}`);
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify(err));
            });
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Request Json is not valid",
            })
          );
        }
      } catch (err) {
        console.log(`81 ${err}`);
        saveLogs(`Error 82 - put - Defunt :  ${err}`);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Request Json is not valid : " + err,
          })
        );
      }
    }
    else if (baseUrl === "/api/upload-file-chunk/" && regexNumbers.test(id)) {
      try {
        // Check if defuntId exists in the defunt table
        const defuntExists = await checkDefuntExists(id);
        if (!defuntExists) {
          return res.status(404).send({ error: 'Defunt not found', message: `Defunt with ID ${id} does not exist` });
        }

        upload.single("file")(req, res, async function (err) {
          if (err instanceof MulterError) {
            saveLogs(`Error - put 132 : ${err}`);
            res.status(400).send(err.message);
          } else if (err) {
            saveLogs(`Error - put 135 : ${err}`);
            res.status(500).send({ error: "Internal Server Error", message: err });
          } else {

            if (req.file) {
              const chunkIndex = parseInt(req.body.chunkIndex, maxChunksExpected);
              const totalChunks = parseInt(req.body.totalChunks, maxChunksExpected);
              const fileChunk = req.file;
              const defuntId = id;
              const { fileName } = req.query;

              //delete a file
              if (totalChunks === 0 && chunkIndex === 0) {
                const result = await uploadFile(defuntId, fileName, {
                  fileIsNull: true,
                });
                res.send({ message: "delete-file-successful", result: result });
              }
              else {
                // Create a folder for chunks if it doesn't exist
                if (!fs.existsSync(chunksFolder)) {
                  fs.mkdirSync(chunksFolder, { recursive: true });
                }
                // Initialize the file upload tracking if it doesn't exist
                if (!fileUploads[fileName]) {
                  fileUploads[fileName] = {
                    receivedChunks: [], // Initialize an empty array for chunks
                    totalChunks: totalChunks,
                  };
                }

                // Move the chunk to the chunks folder with a unique name
                const chunkPath = path.join(
                  chunksFolder,
                  `${defuntId}-${fileName}-chunk-${chunkIndex}`
                );
                fs.renameSync(fileChunk.path, chunkPath);

                // Track the received chunk
                fileUploads[fileName].receivedChunks.push({
                  chunkIndex,
                  chunkPath,
                });
                // Check if all chunks are received
                if (fileUploads[fileName].receivedChunks.length === totalChunks
                ) {
                  // All chunks received, reassemble the file in upload Folder
                  // Create a folder for chunks if it doesn't exist
                  if (!fs.existsSync(uploadFolder)) {
                    fs.mkdirSync(uploadFolder, { recursive: true });
                  }

                  const finalFilePath = path.join(
                    uploadFolder,
                    `${defuntId}-${fileName}`
                  );

                  reassembleFile(
                      finalFilePath,
                      fileUploads[fileName].receivedChunks,
                      totalChunks,
                      async (err) => {
                        if (err) {
                        if (fs.existsSync(finalFilePath)) {
                          try {
                            fs.unlinkSync(finalFilePath); // Attempt to delete the file if it exists
                          } catch (deleteErr) {
                            console.error(`Error deleting file put 164: ${deleteErr}`);
                            saveLogs(`Error deleting file put 164: ${deleteErr}`);
                          }
                        }
                        return res
                          .status(500)
                            .send({
                              error: "Error reassembling file",
                              message: `${err}`,
                              title:`${fileName}`});
                      }else{
                          try {
                            // Once the file is reassembled, pass it to the uploadFile function
                            const result = await uploadFile(defuntId, fileName, {
                              path: finalFilePath,
                            });
                            res.send({
                              message: "File-upload-complete",
                              result: result,
                            });
                            fs.unlinkSync(finalFilePath); //test
                          } catch (error) {
                            saveLogs(`Error 175 - put read file ${fileName}: ${error}`)
                            if (fs.existsSync(finalFilePath)) {
                              try {
                                fs.unlinkSync(finalFilePath); // Attempt to delete the file if it exists
                              } catch (deleteErr) {
                                console.error(`Error deleting file put 190: ${deleteErr}`);
                                saveLogs(`Error deleting file put 190: ${deleteErr}`);
                              }
                            }
                            // res.status(500).send({
                            //   error: "Error processing file",
                            //   message: error.message,
                            // });
                          }
                        }

                      // Clean up
                      delete fileUploads[fileName]; // Remove tracking object
                    }
                  );

                  // res.send({ message: 'File upload complete' });
                } else {
                  res.send({
                    message: `Received chunk ${
                        fileUploads[fileName].receivedChunks.length
                    } of ${totalChunks}`,
                  });
                }
              }
            }
            else {
              res.status(404).send({ error: "No file uploaded." });
            }
          }
        });
      } catch (err) {
        console.log(err);
        saveLogs(`Error - upload-file-chunk 201 : ${err}`);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Request Json is not valid : " + err,
          })
        );
      }
    }
    else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Not Found", error: "Route not found" })
      );
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .send({ msg: "Token expired. Please log in again." });
    }
    return res.status(401).send({ msg: "Invalid token." });
  } finally {}
};

/**
 * Uploads a file for a specific 'defunt' and updates/inserts it into the database.
 *
 * @param {object} jsonData - The defunt json data.
 * @param {number} defuntId - The ID of the defunt.
 * @returns {Promise<string>} A promise that resolves when the update is successfully done.
 */
async function updateIntoDefunt(jsonData, defuntId) {
  return new Promise(async (resolve, reject) => {
    let connection;
    const tablesNames = Object.keys(jsonData);
    try {
      connection = await pool.acquire();

      for (let tableName of tablesNames) {
        let table = jsonData[tableName];
        if (table != null) {
          const tableFields = Object.keys(table);

          let query = `SELECT * FROM ${tableName} WHERE numerodefunt = ?`;
          let isExistTableInDB = (
            await connection.execute(query, [defuntId])
          )[0];

          if (isExistTableInDB.length > 0) {
            let updateQuery = "UPDATE " + tableName + " SET ";
            let values = [];
          const startIndex = tableName === 'decisionnaire'? 2:1;
            //i=1 //without numerodefunt --1 //
          for (let i = startIndex ; i < tableFields.length; i++) {
            updateQuery += `${tableFields[i]} = ?, `;
            values.push(table[tableFields[i]]);
          }
            updateQuery = updateQuery.slice(0, -2) + " WHERE numerodefunt = ?";
            values.push(defuntId);
            // Handling Buffer conversion
            if (
              tableName === "generated_documents" ||
              tableName === "uploaded_documents"
            ) {
              values = values.map((value) =>
                value ? Buffer.from(value) : value
              );
            }
            await connection.execute(updateQuery, values);
          } else {
            // Constructing an Insert query
            let query = "INSERT INTO " + tableName + " ( numeroDefunt,";
            //numeroDefunt, but what if the id n'exist pas
            // need to create defunt first and get the id
            let insertQuery = `INSERT INTO ${tableName} (${tableFields.join(
              ", "
            )}) VALUES (${tableFields.map(() => "?").join(", ")})`;

            let values = tableFields.map((field) => table[field]);
            console.log(
              `---277--id insertQuery: ${insertQuery} value = ${values.length}`
            );

            // Handling Buffer conversion
            if (
              tableName === "generated_documents" ||
              tableName === "uploaded_documents"
            ) {
              // values = values.map((value) => value ? Buffer.from(value, "base64") : value );

              values = values.map((value) => {
                if (
                  typeof value === "string" ||
                  value instanceof Buffer ||
                  ArrayBuffer.isView(value) ||
                  Array.isArray(value)
                ) {
                  return value ? Buffer.from(value, "base64") : value;
                } else {
                  console.error("Invalid value:", value);
                  return value;
                }
              });
            }

            await connection.execute(insertQuery, values);
          }
        }
      }
    resolve('update with success');
  }
  catch (err) {
    try {
      if (connection) await connection.rollback();
    } catch (rollbackErr) {
      console.error(`Rollback error: ${rollbackErr}`);
    }
    // Specific handling for TimeoutError by checking error code/message
    if (err.message && err.message.includes('ResourceRequest timed out')) {
      console.error(`TimeoutError in updateIntoDefunt: ${err}`);
      saveLogs(`TimeoutError in update defunt ${defuntId} : ${err}`);
      return reject({
        error: 'TimeoutError',
        msg: `${err.message}`
      });
    }

    console.error(`Error in updateIntoDefunt: ${err}`);

    saveLogs(`Error in update defunt ${defuntId} : ${err}`)
    reject({
      error:'Error updating defunt',
      msg: `${err}`
    });
  }
  finally {
      if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
    }
  });
}

/**
 * Uploads a file for a specific 'defunt' and updates/inserts it into the database.
 *
 * @param {number} numeroDefunt - The ID of the defunt.
 * @param {string} fileName - The name of the file field.
 * @param {object} fileData - The file data object from multer.
 * @returns {Promise<string>} A promise that resolves when the file is successfully uploaded.
 */
async function uploadFile(numeroDefunt, fileName, fileData) {
  let connection = null;

  try {
    // First, check if this 'defunt' exists in uploaded_documents
    connection = await pool.acquire();
    let query1 = "SELECT * FROM uploaded_documents WHERE numerodefunt = ?";
    let values1 = [numeroDefunt];

    const [rows] = await connection.execute(query1, values1);
    await pool.release(connection); // Release connection after use

    let query;
    if (rows.length > 0) {
      query = `UPDATE uploaded_documents SET ${fileName} = ? WHERE numerodefunt = ?`;
    } else {
      query = `INSERT INTO uploaded_documents (${fileName}, numerodefunt) VALUES (?, ?)`;
    }

    const fileDataBuffer = fileData.fileIsNull
      ? null
      : fs.readFileSync(fileData.path); // Read the reassembled file
    connection = await pool.acquire();
    const values = [fileDataBuffer, numeroDefunt];
    await connection.execute(query, values);
    //resolve {'message':'upload-successful'}
  } catch (err) {
    console.log(`Err 381 : ${err}`)
    saveLogs(`Error 381 - put file : uploaded_documents/${fileName}: ${err}`)
    try {
      if (connection) await connection.rollback();
    } catch (rollbackErr) {
      console.error(`Rollback error: ${rollbackErr}`);
    }
    throw err;
  } finally {
    if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
  }
}

function reassembleFile(finalFilePath, chunks, totalChunks, callback) {
  try {
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex); // Ensure correct order
    const writeStream = fs.createWriteStream(finalFilePath);

    writeStream.on("finish", () => {
      // File has been successfully written
      callback(null); // No error, callback with null
    });

    writeStream.on("error", (err) => {
      // Error writing file
      console.log(`Error writeStream file put 411  :${err}`);
      saveLogs(`Error writeStream file put 411 : ${err}`);
      writeStream.end(); // Ensure writeStream is closed
      callback(err); // Callback with error
    });
    const receivedChunks = [];

    for (let chunk of chunks) {
      try {
        if (fs.existsSync(chunk.chunkPath)) {
          const chunkData = fs.readFileSync(chunk.chunkPath);
          writeStream.write(chunkData);
          // Check if chunk file exists before attempting to delete
          fs.unlinkSync(chunk.chunkPath); // Delete chunk file after writing
          // Track the received chunk index
          receivedChunks.push(chunk.chunkIndex);
        } else {
          console.warn(`Chunk file does not exist put 431: ${chunk.chunkPath}`);
          saveLogs(`Chunk file does not exist put 431: ${chunk.chunkPath}`);
        }
      } catch (err) {
        console.error(`Error reading or deleting chunk file: ${err}`);
        saveLogs(`Error reading or deleting chunk file: ${err}`);
        callback(err); // Callback with error
        return; // Stop further processing
      }
    }

    // Check if all expected chunks have been received
    if (receivedChunks.length === totalChunks) {
      // All chunks received, proceed with file reassembly and upload
    } else {
      // Handle the case where not all chunks have been received
      console.warn(`450 put - Incomplete upload: received ${receivedChunks.length} of ${totalChunks} chunks.`);
      saveLogs(`450 put - Incomplete upload: received ${receivedChunks.length} of ${totalChunks} chunks.`);
      callback(new Error(`Incomplete upload: received ${receivedChunks.length} of ${totalChunks} chunks.`));
    }


    writeStream.end();
  } catch (err) {
    console.log(`Error in reassembleFile 425 :${err}`);
    saveLogs(`Error in reassembleFile 425: ${err}`);
    callback(err);
  }
}



/**
 * Checks if a defunt with the specified ID exists in the database.
 *
 * @param {number} defuntId - The ID of the defunt to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the defunt exists, false otherwise.
 */
async function checkDefuntExists(defuntId) {
  return new Promise(async (resolve, reject) => {
    let connection;
    try {
      connection = await pool.acquire();
      if (!connection) {
        throw new Error('Connection is null');
      }

      const query = 'SELECT COUNT(*) AS count FROM defunt WHERE numeroDefunt = ?';
      const [results] = await connection.execute(query, [defuntId]);

      if (results[0].count === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    } catch (err) {
      saveLogs(`CheckDefuntExists, ${err}`);
      reject(err);
    } finally {
      if (connection) {
        try {
          await pool.release(connection);
        } catch (releaseErr) {
          console.error('Error releasing the connection:', releaseErr);
        }
      }
    }
  });
}
