# Mikuru Label-Tool

Download mongodb from https://www.mongodb.com/download-center or download mysql from https://dev.mysql.com/downloads/mysql/ (You need one of them)

Download nodejs from https://nodejs.org/en/

After install mongodb (or mysql) and nodejs

```
# clone the repository
git clone ...

# mkdir the data directory for database
mkdir data
mongodb --dppath=./data

# install requirements lib of nodejs
cd LabelServer
npm install 

# start server
npm start

# if you want to set the port of Mikuru, * is the port you perfer to
PORT=* npm start 

# if you want to start server back
PORT=* nohup npm start &
```



The config.js can set the database you perfer to

```
module.exports = {
  server: {
    host: "localhost",
    port: 3000
  },
  mg_path: "mongodb://localhost:27017/opprentice"
};
```

If you want to use mongo, set mg_path to like this

```
module.exports = {
  server: {
    host: "localhost",
    port: 3000
  },
  mysql_option: {
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Your password',
    database: 'Your database\'s name'
  }
};
```

If you want to use mysql, you could set it like this.