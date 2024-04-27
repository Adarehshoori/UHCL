// All APIs, logging in, registering, saving shows, retrieving shows, and other backend functions are all in this one file. 
// I'm using Node.js, Express.js, and MySQL, bcrypt, and JSON web tokens (JWT)
// I've not included my connection.js for the MySQL server for my own safety. Please message me if you're interested in this.

const mysql = require('mysql');
const express = require('express');
const app = express();

const path = require('path');
const { json } = require('body-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require('./connection.js');
const { Console } = require('console');
const { PORT = 8080} = process.env

// SECRET TOKEN generated upon logging in. Also used to compare your credentials to the server's to authenticate APIs.
// This will be changed for the actual live website so you're safe :)
const my_secret_token = "test";

app.listen(PORT, function() {
    console.log("Listening on port", PORT);
})

app.use(express.urlencoded( {extended: true} ));
app.use(express.json());


/* ------------POST COMMAND TO SAVE SHOWS TO DB WITH USERNAME AND SHOW JSON DATA ------------*/

app.post('/save', authenticateToken, (req, res) => {
    const user_name = req.user.theUser.userEmail;
    var show_data = JSON.stringify(req.body);
    var show_id = req.body.id;
    var existing_ids = [];
    console.log("save show request");

    connection.query(`SELECT * FROM savedshows WHERE email = ("${user_name}");`, async function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).json({status: 400, "message": "Error, Could not save show."})
        } else {
            for (var i = 0; i < result.length; i++) {
                var this_show = (result[i].information);
                this_show = JSON.parse(this_show);
                existing_ids.push(this_show.id);
            }

            if (existing_ids.includes(show_id)) {
                res.status(409).json({status: 409, "message": "Error, Show already saved."});
            } else {
                connection.query(`INSERT INTO savedshows (email, information) VALUES ("${user_name}", '${show_data}');`, async function (err, result) {
                    if (err) {
                        console.log(err);
                        res.status(400).json({status: 400, "message": "Error, Could not save show."});
                    } else {
                        res.status(200).json({status: 200, "message": "Show saved successfully."});
                    }
                })
            }
        }
    })
})

/* ------------ DELETE COMMAND TO DELETE SAVED SHOWS FROM THE DB WITH USER AUTHENTICATION ------------*/

app.delete('/delshow', authenticateToken, (req, res) => {
    const user_name = req.user.theUser.userEmail;
    const id = (req.body.id).toUpperCase();
    console.log("delete show request");

    connection.query(`DELETE FROM savedshows WHERE id="${id}" AND email=("${user_name}");`, async function (err, result) {
        if (err)  {
            console.log(err);
            res.status(400).json({status: 400, "message": "Error, Could not delete show."});
        } else {
            res.status(200).json({status: 200, "message": "Show deleted successfully."});
        }
    })
})

/* ------------ DELETE COMMAND TO DELETE SAVED ALL SHOWS FROM THE DB WITH USER AUTHENTICATION ------------*/

app.delete('/delallshows', authenticateToken, (req, res) => {
    const user_name = req.user.theUser.userEmail;
    console.log("delete all shows request!");

    connection.query(`DELETE FROM savedshows WHERE email=("${user_name}");`, async function (err, result) {
        if (err)  {
            console.log(err);
            res.status(400).json({status: 400, "message": "Error, Could not delete all shows."});
        } else {
            res.status(200).json({status: 200, "message": "All shows deleted successfully."});
        }
    })
})

/* ------------ GET COMMAND TO RETRIEVE USERS SAVED SHOWS FROM THE DB ------------*/

app.get('/myshows', authenticateToken, (req, res) => {
    const user_name = req.user.theUser.userEmail;
    console.log("get shows request");
    connection.query(`SELECT * FROM savedshows WHERE email = ("${user_name}");`, async function (err, result) {
        if (err)  {
            console.log(err);
            res.status(400).json({status: 400, "message": "Error, Could not retrieve shows."});
        } else {
            res.status(200).send(result);
        }
    })
})


/* ------------ EXPRESS POST ROUTING FOR CREATING USERS ------------*/

app.post('/register', async function (req, res) {

    const userEmail = (req.body.userEmail);
    const userPassword = await bcrypt.hash(req.body.userPassword, 10);

    if ((userEmail == "") || (userEmail == null) || (userPassword == "") || (userPassword == null) || (!userEmail.includes("@"))) {
        res.status(409).json({status: 409, "message": "Please insert a valid email address."});
    } else {
        await connection.query(`SELECT * FROM users WHERE email = "${userEmail}"`, async function (err, result) {
        
            if (err) {
                console.log("Failed", err);
            }
    
            if (result.length != 0) {
                console.log("User already exists!")
                res.status(409).json({status: 409, "message": "User already exists."})
            } else {
                await connection.query(`INSERT INTO users (email, password) VALUES ("${userEmail}", "${userPassword}");`, async function (err, result) {
                    if (err) {
                        console.log("Failed", err);
                    }
                    console.log(result.affectedRows + " user created");
                    res.status(200).json({status: 200, "message": "User created succesfully."});
                });
            }
    
        });
    } 

})


/* ------------ EXPRESS POST ROUTING FOR LOGGING IN USERS ------------*/

app.post('/login', async function (req, res) {

    const userEmail = (req.body.userEmail);
    const userPassword = (req.body.userPassword);

    await connection.query(`SELECT * FROM users WHERE email = "${userEmail}"`, async function (err, result) {

        if (err) {
            console.log("Failed", err);
        }

        if (result.length == 0) {
            console.log("Username or password is incorrect.");
            res.status(403).json({status: 403, "message": "Username or password is incorrect."})
        } else {
            await connection.query(`SELECT * FROM users WHERE email = "${userEmail}"`, async function (err, result) {

                if (err) {
                    console.log("Failed", err);
                }

                password = (result[0].password);

                // If login works.
                if (await bcrypt.compare(userPassword, password)) {

                    theUser = {
                        userEmail: userEmail,
                    };

                    const accessToken = jwt.sign({theUser}, my_secret_token);
                    res.json({ accessToken: accessToken })

                // If login fails.
                } else {
                    console.log("Username or password incorrect.");
                    res.status(403).json({status: 403, "message": "Username or password is incorrect."})
                }
            });
        }

    });

})

/* ------------ JWT TOKEN AUTHENTICATION FOR API ------------*/

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({status: 401, "message": "Please sign in to access this."});
    }

    jwt.verify(token, my_secret_token, (err, user) => {
        if (err)  {
            return res.status(403).json({status: 403, "message": "Could not authenticate user. Try again later."});
        }
        req.user = user;
        next();
    })
}


/* ------------ EXPRESS ROUTING TO HTML FILES ------------*/

app.use(express.static('public'))

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/views/home.html'));
});

app.get('/register', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/views/register.html'));
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/views/login.html'));
});

app.get('/saved', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/views/saved.html'));
});

app.get('/recommended', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/views/recommended.html'));
});
