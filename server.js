const getReq = require("./methods/get-request");
const postReq = require("./methods/post-request");
const putReq = require("./methods/put-request");
const deleteReq = require("./methods/delete-request");
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors({
  origin: '*', //https://your-client-website.com
  methods: ['GET', 'PUT', 'POST', 'DELETE'] //'HEAD', 'PATCH',
}));



// const whitelist = ['https://www.lapiete.com/', 'https://lapiete3.000webhostapp.com'];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
// callback(new Error('Not allowed by CORS'))
//     }
//   }
// }
// app.use(cors(corsOptions));


app.use((req, res) => {

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

// const server = app.listen();
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${server.address().port}`);
});

