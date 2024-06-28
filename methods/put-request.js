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

// Declare fileUploads object
let fileUploads = {};

/**
 * Handles PUT requests for various endpoints.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function putReq(req, res) {
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
          await updateDefunt(jsonData, id)
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
              saveLogs(`Error 60 - put - cannot update Defunt :  ${err}`);
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
        saveLogs(`Error 75 - put - Defunt :  ${err}`);
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
            saveLogs(`Error - put 93 : ${err}`);
           return res.status(400).send(err.message);
          }
          else if (err) {
            saveLogs(`Error - put 96 : ${err}`);
            return  res.status(500).send({ error: "Internal Server Error", message: err });
          }

          if (req.file) {
            const chunkIndex = parseInt(req.body.chunkIndex, 10); // Parse as a base-10 integer
            const totalChunks = parseInt(req.body.totalChunks, 10);
            const fileChunk = req.file;
            const defuntId = id;
            const { fileName } = req.query;

            if ((totalChunks === 0 && chunkIndex === 0 )|| chunkIndex > totalChunks  ) {
              //delete a file
              // const result = await uploadFile(defuntId, fileName, { fileIsNull: true });
              // return res.send({ message: "delete-file-successful", result: result });
              return  res.status(400).send({ error: "Error in request format", message: 'Check chunkIndex and totalChunks' });
            }

            // Create a folder for chunks if it doesn't exist
            if (!fs.existsSync(chunksFolder)) {
                  fs.mkdirSync(chunksFolder, { recursive: true });
            }

            // Initialize the file upload tracking if it doesn't exist
            if (!fileUploads[fileName]) {
                  fileUploads[fileName] = { receivedChunks: [], totalChunks: totalChunks };
            }

            // Move the chunk to the chunks folder with a unique name
            const chunkPath = path.join( chunksFolder, `${defuntId}-${fileName}-chunk-${chunkIndex}`);

            try {
              fs.renameSync(fileChunk.path, chunkPath);
            } catch (renameErr) {
              saveLogs(`Error renaming chunk file: ${renameErr}`);
              await cleanUpChunks(defuntId, fileName);
              return res.status(500).send({ error: "Internal Server Error", message: renameErr });
            }


            // Track the received chunk
            fileUploads[fileName].receivedChunks.push({ chunkIndex, chunkPath });

            // Check if all chunks are received
            if (fileUploads[fileName].receivedChunks.length === totalChunks) {
              // All chunks received, reassemble the file in upload Folder
              // Create a folder for chunks if it doesn't exist
              if (!fs.existsSync(uploadFolder)) {
                fs.mkdirSync(uploadFolder, { recursive: true });
              }

              const finalFilePath = path.join(uploadFolder, `${defuntId}-${fileName}`);

              reassembleFile(finalFilePath, fileUploads[fileName].receivedChunks, totalChunks, async (err) => {
                    if (err) {
                      await cleanUpChunks(defuntId, fileName); //todo test
                      saveLogs(`Error reassembling file 150 put : ${err}`);
                      if (fs.existsSync(finalFilePath)) {
                        try {
                          // Attempt to delete the file if it exists
                          await fs.promises.unlink(finalFilePath);
                        } catch (deleteErr) {
                          saveLogs(`Error deleting file put 156: ${deleteErr}`);
                        }
                      }
                      return res.status(500).send({error: "Error reassembling file", message: err.message,
                              title:`${fileName}`}); //todo : ?
                      }

                    try {
                      // Once the file is reassembled, pass it to the uploadFile function
                      const result = await uploadFile(defuntId, fileName, {path: finalFilePath,});
                      res.send({ message: "File-upload-complete", result: result });
                      await fs.promises.unlink(finalFilePath);
                    }
                    catch (error) {
                      saveLogs(`Error 175 - put read file ${fileName}: ${error}`)
                      await cleanUpChunks(defuntId, fileName);
                      if (fs.existsSync(finalFilePath)) {
                        try {
                          await fs.promises.unlink(finalFilePath);
                        } catch (err) {
                          saveLogs(`Error deleting file put 175: ${err}`);
                        }
                      }
                      return res.status(500).send({ error: "Error processing file", message: error.message });
                    }
                    // Clean up
                    delete fileUploads[fileName];
                  });
                } else {
                  res.send({ message: `Received chunk ${fileUploads[fileName].receivedChunks.length} of ${totalChunks}`,});
                }
          } else {
            res.status(404).send({ error: "No file uploaded." });
          }
        });
      } catch (err) {
        saveLogs(`Error - upload-file-chunk 190 : ${err}`);
        res.status(500).send({ error: "Request Json is not valid", message: err.message });
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
  }
}

/**
 * Uploads a file for a specific 'defunt' and updates/inserts it into the database.
 *
 * @param {object} jsonData - The defunt json data.
 * @param {number} defuntId - The ID of the defunt.
 * @returns {Promise<string>} A promise that resolves when the update is successfully done.
 */
async function updateDefunt(jsonData, defuntId) {
  return new Promise(async (resolve, reject) => {
    let connection;
    const tablesNames = Object.keys(jsonData);
    try {
      connection = await pool.acquire();

      for (let tableName of tablesNames) {
        let table = jsonData[tableName];
        if (table != null) {
          const tableFields = Object.keys(table);

          let query = `SELECT * FROM ${tableName} WHERE numeroDefunt = ?`;
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
            updateQuery = updateQuery.slice(0, -2) + " WHERE numeroDefunt = ?";
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
      saveLogs(`TimeoutError in update defunt ${defuntId} : ${err}`);
      return reject({
        error: 'TimeoutError',
        msg: `${err.message}`
      });
    }

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
    // check if this 'defunt' exists in uploaded_documents
    connection = await pool.acquire();
    const [rows] = await connection.execute("SELECT * FROM uploaded_documents WHERE numeroDefunt = ?", [numeroDefunt]);
    await pool.release(connection);

    const query = rows.length > 0
        ? `UPDATE uploaded_documents SET ${fileName} = ? WHERE numeroDefunt = ?`
        : `INSERT INTO uploaded_documents (${fileName}, numeroDefunt) VALUES (?, ?)`;


    const fileDataBuffer = fileData.fileIsNull ? null : await fs.promises.readFile(fileData.path);
    connection = await pool.acquire();
    await connection.execute(query, [fileDataBuffer, numeroDefunt]);
    return 'upload-successful';
  } catch (err) {
    saveLogs(`Error 350 - put file : ${err}`)
    try {
      if (connection) await connection.rollback();
    } catch (rollbackErr) {
      console.error(`Rollback error: ${rollbackErr}`);
    }
    throw err;
  }
  finally {
    if (connection && pool.isBorrowedResource(connection)) {
      await pool.release(connection);
    }
  }
}

function reassembleFile(finalFilePath, chunks, totalChunks, callback) {
  try {
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex); // Ensure correct order
    const writeStream = fs.createWriteStream(finalFilePath);

    // File has been successfully written //// No error, callback with null
    writeStream.on("finish", () => callback(null));

    writeStream.on("error", (err) => {
      saveLogs(`Error writeStream file put 377 : ${err}`);
      callback(err);
    });


    const writeChunks = async () => {
      for (let chunk of chunks) {
        try {
          const chunkData = await fs.promises.readFile(chunk.chunkPath);
          writeStream.write(chunkData);
          await fs.promises.unlink(chunk.chunkPath);
        } catch (err) {
          saveLogs(`Error processing chunk file: ${err}`);
          callback(err);
          return;
        }
      }
      writeStream.end();
    };

    writeChunks()
        .then(() => {
          // Handle successful completion if needed
        })
        .catch(err => {
          saveLogs(`Error in writeChunks: ${err}`);
          callback(err);
        });

  } catch (err) {
    saveLogs(`Error in reassembleFile 466: ${err}`);
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


/**
 * Cleans up chunk files for a specific user and file name.
 *
 * @param {number} defuntId - The ID of the defunt.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<void>} - A promise that resolves when cleanup is complete.
 */
async function cleanUpChunks(defuntId, fileName) {
  const chunkPattern = new RegExp(`${defuntId}-${fileName}-chunk-`);
  try {
    const files = await readdir(chunksFolder);
    const chunkFiles = files.filter(file => chunkPattern.test(file));
    const unlinkPromises = chunkFiles.map(file => unlink(path.join(chunksFolder, file)));
    await Promise.all(unlinkPromises);
    console.log(`Cleaned up chunks for ${fileName}`);
  } catch (err) {
    console.error(`Error cleaning up chunks: ${err}`);
    saveLogs(`Error cleaning up chunks: ${err}`);
  }
}





module.exports = {
  checkDefuntExists,
  putReq
};