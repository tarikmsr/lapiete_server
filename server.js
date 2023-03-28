const http = require("http");
const getReq = require("./methods/get-request");
const postReq = require("./methods/post-request");
const putReq = require("./methods/put-request");
const deleteReq = require("./methods/delete-request");
let constData = require("./data/data.json");

const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');

const PORT = process.env.PORT || 5001;

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});



const app = express();
app.use(bodyParser.json());


// Define a route that queries the database
app.get('api/users', async (req, res) => {
  try {
      const conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM users');
      conn.release();
      console.log(rows[0]);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(rows));
      console.log('38');

      
      // Send the response
      // res.send(JSON.stringify(rows));

      console.log('42');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error retrieving users from database');
  }
});


app.listen(5000, () => {
  console.log('Server listening on port 5000');
});


const server = http.createServer((req, res) => {
  req.form = constData;  
  console.log("55- movies");

  switch (req.method) {
    case "GET":
      getReq(req, res);
      break;
    case "POST":
      postReq(req, res);
      break;
    case "PUT":
      putReq(req, res);
      break;
    case "DELETE":
      deleteReq(req, res);
      break;
    default:
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.write(
        JSON.stringify({ title: "Not Found", message: "Route not found" })
      );
      res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Server started on port : ${PORT}`);
});
