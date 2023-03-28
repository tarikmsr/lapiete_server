const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');


const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'lapiete'
});

module.exports = {
  pool: pool
};
