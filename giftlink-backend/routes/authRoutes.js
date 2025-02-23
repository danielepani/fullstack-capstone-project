//Step 1 - Task 2: Import necessary packages
const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
const { body, validationResult } = require('express-validator');

//Step 1 - Task 3: Create a Pino logger instance
const logger = pino();

dotenv.config();

//Step 1 - Task 4: Create JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `giftsdb` in MongoDB through `connectToDatabase` in `db.js`
         const db = await connectToDatabase();

        // Task 2: Access MongoDB collection
         const collection = await db.collection('users')

        //Task 3: Check for existing email
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email = req.body.email;

        const checkExisting = collection.findOne({email: email})

        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        }); //Task 4: Save user details in database
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET); //Task 5: Create JWT authentication with user._id as payload
        logger.info('User registered successfully');
        res.json({authtoken,email});
    } catch (e) {
         return res.status(500).send('Internal server error');
    }
});

// {Insert it along with other imports} Task 1: Use the `body`,`validationResult` from `express-validator` for input validation

router.put('/update', async (req, res) => {
        // Task 2: Validate the input using `validationResult` and return approiate message if there is an error.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Validation errors in update request', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
    try {
        // Task 3: Check if `email` is present in the header and throw an appropriate error message if not present.
         const email = req.headers.email;

        if (!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Email not found in the request headers" });
        }
        // Task 4: Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection("users");
        // Task 5: find user credentials in database
        const existingUser = await collection.findOne({email: email})

        existingUser.updatedAt = new Date();

        // Task 6: update user credentials in database
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );
        // Task 7: create JWT authentication using secret key from .env file
        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        
        res.json({authtoken});
    } catch (e) {
         return res.status(500).send('Internal server error');

    }
});

module.exports = router;