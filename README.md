# Nodejs RestFul CRUD API Project 
> This is a REST API backend app gets data from Mysql DB.
# Version: Mai 2024 


## Routes
```bash

GET      /api/user
GET      /api/user/:id

GET      /api/form/:defuntId
GET      /api/form/:defuntName
GET      /api/form/docs/:defuntId
GET      /api/form/download/:defuntId ? index: folderIndex
GET      /api/user/:defuntId
GET      /form/docs/{defuntId}/filename?${filename}                   // get one file by Id
GET      /form/check_download_files/${defuntId}/index?${folderIndex}  // check if folder s files
GET      /form/download/${defuntId}/index?${folderIndex}


POST     /api/form   //insert new deunt
POST     /api/login
POST     /api/register  //use token , should be authentified before


PUT      /api/form/:defuntId                  // update deunt
PUT      /upload-file-chunk/${defuntId}      // upload file chunk


DELETE   /api/form/:defuntId


```

## Installation

```bash
# Install dependencies
npm install

# Run in develpment
npm run dev
nodemon server.js 

# Run in production
npm start
node server.js

```