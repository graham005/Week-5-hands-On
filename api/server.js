const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv')

app.use(express.json())
app.use(cors())
dotenv.config()

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
    
})

db.connect((err) => {
    if(err) return console.log("Error connecting to MYSQL")

    console.log("Connected to MYSQL: ", db.threadId);

    db.query('CREATE DATABASE IF NOT EXISTS expense_tracker', (err, result) =>{
        if(err) return console.log(err)
        
        console.log("Database expense_tracker created/checked")

        db.changeUser({database: 'expense_tracker'}, (err, result) =>{
            if(err) return console.log(err)

            console.log("expense_tracker is in use");
        })

        const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password  VARCHAR(255) NOT NULL
            )
        `;
        db.query(usersTable, (err, result) => {
            if(err) return console.log(err)
            
            console.log("User table created/checked");
        })
    } )

})

//user registration route
app.post('/api/register', async(req, res)=> {
    try{
        const users =  'SELECT* FROM users WHERE email = ?'
        //check if user exists 
        db.query(users, [req.body.email], (err, data)=>{
            if(data.length > 0) return res.status(400).json("User already exists");

            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            const newUser = 'INSERT INTO users(email,username,password) VALUES (?)'
            value = [ req.body.email, req.body.username, hashedPassword ]

            db.query(newUser, [value], (err, data) => {
                if(err) return res.status(400).json("something went wrong")

                return res.status(200).json("user created successfully")
            })
        })
    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

//user login route
app.post('/api/login', async(req, res) => {
    try{
        const users = 'SELECT * FROM users WHERE email = ?'
        db.query(users, [req.body.email], (err, data) => {
            if(data.length === 0) return res.status(404).json("User not found!")

            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

            if(!isPasswordValid) return res.status(400).json("Invalid email or password!")

            return res.status(200).json("Login Successful")
        })
    }
    catch(err){
        res.status(500).json("Internal Server Error")
    }
})

app.listen(3000, ()=> {
    console.log("Server is running on port 3000")
})