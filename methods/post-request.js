const requestBodyparser = require("../util/body-parser");
const writeToFile = require("../util/write-to-file");

let lastId = 1;

function generateAutoIncrementId() {
  lastId++;
  const paddedNumber = lastId.toString().padStart(11, "0");
  return paddedNumber;
}


module.exports = async (req, res) => {
  if (req.url === "/api/form") {
    try {
      let body = await requestBodyparser(req);
      body.id = generateAutoIncrementId();



      console.log("1body");
      console.log(body.id);
      console.log(body);

      // TODO: create one 



      req.form.push(body);
      writeToFile(req.form);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end();
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
