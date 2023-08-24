# Nodejs RestFul CRUD API Project 
> This is a REST API backend app gets data from Mysql DB.

## Routes
```bash

GET      /api/user
GET      /api/user/:id

GET      /api/form
GET      /api/form/:defuntId
GET      /api/form/docs/:defuntId
GET      /api/form/download/:defuntId ? index: folderIndex
GET      /api/user/:defuntId

POST     /api/form
POST     /api/login

PUT      /api/form/:defuntId
DELETE   /api/form/:defuntId

```

## Installation

```bash
# Install dependencies
npm install

# Run in develpment
npm run dev

# Run in production
npm start
```
