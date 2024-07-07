const express = require('express');
const router = express.Router();
const pool = require('../models/databases/pg');
const methodOverride = require('method-override');

router.use(methodOverride('_method'));
router.use(setUserData);

// Logout route
router.delete('/logout', (req, res, next) => {
    req.logOut(err => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

// Search by patient name
router.post('/search-name', checkAuthenticated, async (req, res) => {
    try {
        const { search } = req.body;
        const searchResult = await pool.query("SELECT * FROM request WHERE pt_name ILIKE $1", [`%${search}%`]);
        let result = [];

        if (searchResult.rows.length > 0) {
            result = searchResult.rows.map(rqst => ({
                rq_id: rqst.rq_id,
                pt_name: rqst.pt_name,
                pt_age: rqst.pt_age,
                pt_gender: rqst.pt_gender,
                pt_contact: rqst.pt_contact,
                pt_address: rqst.pt_address,
                pt_prescription: rqst.pt_prescription,
                rp_name: rqst.rp_name,
                rp_relationship: rqst.rp_relationship
            }));
        }

        const viewAll = await getViewOfMedicine();
        res.render('dispense', {
            viewAllRequests: result,
            viewList: viewAll
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// View table of requests
router.get('/dispense', checkAuthenticated, async (req, res) => {
    try {
        const viewAllRequests = await getViewofPatientsRequest();
        const viewList = await getViewOfMedicine();

        res.render('dispense', {
            viewList,
            viewAllRequests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search by medicine name
router.post('/search-medicine', checkAuthenticated, async (req, res) => {
    try {
        const { search } = req.body;
        const searchResult = await pool.query("SELECT * FROM inventory WHERE item_name ILIKE $1", [`%${search}%`]);
        let result = [];

        if (searchResult.rows.length > 0) {
            result = searchResult.rows.map(item => ({
                itemName: item.item_name,
                brand: item.brand,
                manufacturer: item.manufacturer,
                dosage: item.dosage,
                expiration: formatDate(item.expiration),
                quantity: item.quantity
            }));
        }

        const viewAllRequests = await getViewofPatientsRequest();
        res.render('dispense', {
            viewList: result,
            viewAllRequests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle records
router.post('/records', async (req, res) => {
    const { rq_id, pt_name, rp_name, rp_relationship, pt_gender, pt_age, pt_contact, pt_address, item_name, brand, quantity } = req.body;

    try {
        // Begin transaction
        await pool.query('BEGIN');
        console.log('Transaction started');

        // Insert data into records table for each medicine
        for (let i = 0; i < item_name.length; i++) {
            console.log(`Inserting record for item: ${item_name[i]}, brand: ${brand[i]}`);
            await pool.query(
                "INSERT INTO records (rq_id, pt_name, rp_name, rp_relationship, pt_gender, pt_age, pt_contact, pt_address, item_name, brand, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
                [rq_id, pt_name, rp_name, rp_relationship, pt_gender, pt_age, pt_contact, pt_address, item_name[i], brand[i], quantity[i]]
            );

            // Update inventory quantity
            console.log(`Updating inventory for item: ${item_name[i]}, brand: ${brand[i]}`);
            const existingMedicine = await pool.query("SELECT * FROM inventory WHERE item_name = $1 AND brand = $2", [item_name[i], brand[i]]);
            if (existingMedicine.rows.length > 0) {
                const currentQuantity = existingMedicine.rows[0].quantity;
                console.log(`Current quantity of ${item_name[i]} (brand: ${brand[i]}): ${currentQuantity}`);
                console.log(`Requested quantity to deduct: ${quantity[i]}`);
                const newQuantity = currentQuantity - quantity[i];
                if (newQuantity < 0) {
                    throw new Error(`Insufficient quantity in inventory for item: ${item_name[i]}, brand: ${brand[i]}. Current quantity: ${currentQuantity}, requested: ${quantity[i]}`);
                }
                await pool.query("UPDATE inventory SET quantity = $1 WHERE item_name = $2 AND brand = $3", [newQuantity, item_name[i], brand[i]]);
            } else {
                throw new Error(`Medicine not found in inventory: ${item_name[i]}, brand: ${brand[i]}`);
            }
        }

        // Delete request from request table
        console.log(`Deleting request with rq_id: ${rq_id}`);
        await pool.query("DELETE FROM request WHERE rq_id = $1", [rq_id]);

        // Commit transaction
        await pool.query('COMMIT');
        console.log('Transaction committed');

        // Fetch updated data to render the page
        const viewAllRequests = await getViewofPatientsRequest();
        const viewList = await getViewOfMedicine();
        const viewListRecords = await getAllListOfRecords();

        // Render the page with updated data
        res.render('records', {
            viewAllRequests,
            viewList,
            viewListPatientsRecords: viewListRecords
        });

    } catch (error) {
        // Rollback transaction in case of error
        await pool.query('ROLLBACK');
        console.error('Error handling POST /records:', error);
        res.status(500).send('Error processing data for /records.');
    }
});


// Authentication middleware
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Set user data middleware
function setUserData(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.name;
        res.locals.userType = req.user.usertype;
    } else {
        res.locals.username = null;
        res.locals.userType = null;
    }
    next();
}

// Fetch data functions
async function getViewOfMedicine() {
    try {
        const viewItems = await pool.query("SELECT item_name, brand, manufacturer, dosage, expiration, quantity FROM inventory");
        let viewAll = [];

        if (viewItems.rows.length > 0) {
            viewAll = viewItems.rows.map(item => ({
                itemName: item.item_name,
                brand: item.brand,
                manufacturer: item.manufacturer,
                dosage: item.dosage,
                expiration: formatDate(item.expiration),
                quantity: item.quantity
            }));
        }
        return viewAll;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getViewofPatientsRequest() {
    try {
        const viewRequests = await pool.query("SELECT pt_name, rp_name, rp_relationship, pt_age, pt_gender, pt_contact, pt_address, pt_prescription, rq_id FROM request");
        let viewOfRequests = [];

        if (viewRequests.rows.length > 0) {
            viewOfRequests = viewRequests.rows.map(rqst => ({
                rq_id: rqst.rq_id,
                pt_name: rqst.pt_name,
                rp_name: rqst.rp_name,
                rp_relationship: rqst.rp_relationship,
                pt_age: rqst.pt_age,
                pt_gender: rqst.pt_gender,
                pt_contact: rqst.pt_contact,
                pt_address: rqst.pt_address,
                pt_prescription: rqst.pt_prescription
            }));
        }
        return viewOfRequests;
    } catch (error) {
        throw new Error(error.message);
    }
}

function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
}

async function getAllListOfRecords() {
    try {
        const viewRecords = await pool.query("SELECT * FROM records");
        let listRecords = [];

        if (viewRecords.rows.length > 0) {
            listRecords = viewRecords.rows.map(item => ({
                rq_id: item.rq_id,
                pt_name: item.pt_name,
                rp_name: item.rp_name,
                rp_relationship: item.rp_relationship,
                pt_gender: item.pt_gender,
                pt_age: item.pt_age,
                pt_contact: item.pt_contact,
                pt_address: item.pt_address,
                item_name: item.item_name,
                brand: item.brand,
                quantity: item.quantity
            }));
        }
        return listRecords;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = router;
