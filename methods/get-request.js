  const { pool } = require('../methods/connection');
  const jsonP = require('../util/tojson-parser');
  const PDFDocument = require('pdfkit');


  const hummus = require('hummus');

  const { fromBuffer } = require("pdf2pic");
  // const pdf = require("pdf-page-counter");
  const fs = require("fs");
  // const stream = require("stream");



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
    'generated_documents',

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
  
  function pdfBytesToImageBytes (pdfBytes)  { //async
    try {

      // const options = {
      //   format: 'png', // Change this to the desired image format (e.g., 'jpeg')
      //   singleFile: true,
      //   prefix: 'image',
      //   page: null // Convert all pages. Specify a specific page number (e.g., 1) to convert a single page.
      // };
  
      // const images =  poppler.pdf2img(pdfBytes, options); //await
      // const imageBytes = images[0].data; // Assuming only one image is generated
  
      // console.log('PDF converted to image successfully!');
      // return imageBytes;


    } catch (error) {
      console.error('Error converting PDF to image:', error);
      return null;
    }


  };


  //  function pdfBytesToImageBytes (pdfBytes)  { //async
  //   try {
  //     const options = {
  //       format: 'png', // Change this to the desired image format (e.g., 'jpeg')
  //       singleFile: true,
  //       prefix: 'image',
  //       page: null // Convert all pages. Specify a specific page number (e.g., 1) to convert a single page.
  //     };
  
  //     const images =  poppler.pdf2img(pdfBytes, options); //await
  //     const imageBytes = images[0].data; // Assuming only one image is generated
  
  //     console.log('PDF converted to image successfully!');
  //     return imageBytes;
  //   } catch (error) {
  //     console.error('Error converting PDF to image:', error);
  //     return null;
  //   }
  // };

  module.exports = async (req, res) => {
    
    let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
    let id = req.url.split("/")[3];
    
    const regexNumbers = /^[0-9]+$/;
    // const regexLetters = /^[a-zA-Z]+$/;
    // const regexLetters = /^[a-zA-Z0-9_-]+$/;
    // const regexLetters = /^[\p{L}\d_-]+$/u;

    const regexLetters = /^[a-zA-Z0-9_-\u00C0-\u017F%]+$/;



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
      await getOneDefuntuploadedDataById(id,fileName) ///cni_fr_defunt
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

      const defuntID = regexNumbers.test(req.url.split("?")[0].split("/")[4]);
      const { index } = req.query; //from parametre

      await getGeneratedFileById(defuntID,index)
      .then(pdfDoc => {

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="___337__.pdf"`);//${pdfDoc.info.Title}
        res.send(pdfDoc);


        // const chunks = [];
        // pdfDoc.on('data', chunk => {
        //   chunks.push(chunk);
        // });
        //
        // pdfDoc.on('end', () => {
        //   const buffer = Buffer.concat(chunks);
        //   res.setHeader('Content-Type', 'application/octet-stream');
        //   res.setHeader('Content-Disposition', `attachment; filename="${pdfDoc.info.Title}.pdf"`);
        //   res.end(buffer);
        // });
        //
        // pdfDoc.end();
        console.log("----end--");

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
   * Retrieves a defunt and their uploaded docs associated data by their ID.
   *
   * @param {number} numeroDefunt - The ID of the defunt to retrieve.
   * @returns {Promise<Object>} A Promise that resolves to an object containing the
   * retrieved data, with keys for each table name and values for the corresponding
   * row data.
   * @throws {Error} If there is an error retrieving data from the database.
   */
  async function getOneDefuntuploadedDataById(numeroDefunt, fileName){
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
  async function getGeneratedFileById(numeroDefunt,index) {
    return new Promise(async (resolve, reject) => {

      let connection;
    try {
      connection = await pool.acquire();

      
  const foldersTitle = ['Mairie','Préfecture','Consulat','Déroulement','Fret','Ambulance','Assurance','Accompagnateur', ]; //rap //inh ??

      let firstPage = false;
      let filesName = '';
      //switch  //cni_fr_defunt, act_naissance , cni_fr_dec
      filesName = 'cni_origin_defunt, act_naissance'; //,act_naissance, , cni_fr_defunt, cni_fr_dec'; //, cni_origin_defun, tact_naissance , cni_origin_defunt , cni_fr_dec
      //what if 

      const query = `SELECT defuntNom, ${filesName}
      From defunt as d
      LEFT JOIN uploaded_documents AS upd ON d.numeroDefunt = upd.numeroDefunt
      WHERE upd.numeroDefunt = ${numeroDefunt}`;
      const [rows, fields] = await connection.execute(query);
      console.log("408-- rows-",rows);        
    
      if(rows.length > 0){ 
      let doc = new PDFDocument();
      const doc2 = hummus.createWriter(`output_999_2.pdf`);

        doc.info.Title = `Dossier_${foldersTitle[index]}_${rows[0]['defuntNom']}`; //depand index _ nameDefunt
      doc.info.Author = 'Lapiete';
      doc.info.Producer = 'Lapiete';
      doc.info.Creator = 'Lapiete';//admin_Id


      var listFilesName = filesName.split(',').map(value => value.trim());

      listFilesName //array of files name
      .forEach(fileName => {

        if(rows[0][`${fileName}`] != null){
        let file = Buffer.from(rows[0][`${fileName}`]);
        let extension = getFileExtension(file);

        console.log(`--------------\nextension of ${fileName}`,extension);
        // console.log("file",file,'---------------');


        if(file != null && extension != 'pdf'){ 
          firstPage ? doc.addPage():{};
          doc.image(Buffer.from(rows[0][`${fileName}`]), {fit: [500, 500]});
          firstPage = true;
        }else
        {
          let pdfBytes = rows[0][`${fileName}`];

          console.log("46000---pdfBytes length ---:",pdfBytes.length);

          let pdfStream =  new hummus.PDFRStreamForBuffer(pdfBytes);
          let pdfReader =  hummus.createReader(pdfStream);
          const pageCount = pdfReader.getPagesCount();
          console.log("4670---readPdfpageCount---:",pageCount);
          console.log("46000---doc2 length ---:",pdfReader);

          // let writer = [];
          // for (let i = 0; i < pageCount; i++) {
          //   console.log("--- 477 ::  ",i);
          //   doc2.createPDFCopyingContext(pdfReader).appendPDFPageFromPDF(i)
            // console.log("--- 477 ::  ",i);
            // doc2.end();
          // }
          // console.log("\n\n479--doc -",doc2.info);

          doc2.createPDFCopyingContext(pdfReader).appendPDFPageFromPDF(0);
          doc2.createPDFCopyingContext(pdfReader).appendPDFPageFromPDF(1);
          doc2.end();

          // doc2.appendPDFPagesFromPDF(pdfReader.getParserStream())
          console.log("46000---doc2 length ---:",doc2);



        }//end else
      }

      });



      // console.log("\n\n484--doc buffer-",doc.info);
      resolve(doc2);

    }//end if rows

    } catch (err) {
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
      let data = {};
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
          // console.log(rows.length == 1);


          if(rows.length == 1){
            var id = rows[0]['numeroDefunt'];
            if (connection) { //end the first
              console.log("350-- search byName realise connection----");

            await pool.clear(connection);
            await pool.release(connection);
            }

            await getOneDefuntDataById(id)
            .then(data => {   
              console.log("------");
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
              console.log("377-- finally realise connection----");
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
        console.log(err);
        reject({
          error:'Error-retrieving-database',
          msg: err
        });
      }
    })
  }


