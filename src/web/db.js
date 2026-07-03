import "dotenv/config";
import mysql from 'mysql2';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.getConnection((err) => {
    if (err) return console.log(err.message);
    console.log("connected successfully");
});

export default db;