const requestBodyparser = require("../util/body-parser");
const writeToFile = require("../util/write-to-file");
const { pool } = require('../methods/connection');


module.exports = async (req, res) => {
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("/") + 1);
  let id = req.url.split("/")[3];
  const regexV4 = new RegExp(
    /^[0-9]+$/
    // /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
  );
  if (!regexV4.test(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Validation Failed",
        message: "UUID is not valid",
      })
    );
  } else if (baseUrl === "/api/form/" && regexV4.test(id)) {
    try {
      let body = await requestBodyparser(req);

      //TODO :
      const index = req.form.findIndex((data) => {
        return data.id === id;
      });
      if (index === -1) {
        res.statusCode = 404;
        res.write(
          JSON.stringify({ title: "Not Found", message: "Data not found" })
        );
        res.end();
      } else {
        req.form[index] = { id, ...body };


        //call data base here

        writeToFile(req.form);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(req.form[index]));
      }
    } catch (err) {
      console.log(err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          title: "Validation Failed",
          message: "Request body is not valid",
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ title: "Not Found", message: "Route not found" }));
  }
};



async function insertIntoDefunt(defunt){

  try {
    conn = await pool.getConnection(); 
    const result = await conn.query('INSERT INTO defunt (`numeroDefunt`, `defuntCivilite`, `defuntNom`, `defuntPrenom`, `defuntNomJeuneFille`, `defuntDateDeNaissance`, `defuntLieuDeNaissance`, `defuntAdresse`, `defuntNationalite`, `defuntProfession`, `defuntNombreEnfants`) VALUES (1, `M`, `Doe`, `John`, NULL, `1980-01-01`, `New York`, `123 Main St.`, `American`, `Software Engineer`, 2');


    conn.release();
    conn.end();
   return result;

 } catch (err) {
   console.error(err);
   res.status(500).send('Error retrieving users from database');
 }


};