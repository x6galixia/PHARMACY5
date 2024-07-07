const express = require('express')
const router = express.Router()
const pool = require('../models/databases/pg')
const methodOverride = require('method-override')
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const path = require('path')

router.use(methodOverride('_method'))
router.use(setUserData)

router.get('/records', checkAuthenticated, async (req, res) => {
    const viewListRecords = await getAllListOfRecords()

    res.render('records', {
        viewListPatientsRecords: viewListRecords
    })
})

router.get('/records/download', checkAuthenticated, async (req, res) => {
    const viewListRecords = await getAllListOfRecords()

    const csvWriter = createCsvWriter({
        path: 'csvFiles/records.csv',
        header: [
            {id: 'rq_id', title: 'RQ_ID'},
            {id: 'pt_name', title: 'Patient Name'},
            {id: 'rp_name', title: 'Relative Name'},
            {id: 'rp_relationship', title: 'Relationship'},
            {id: 'pt_gender', title: 'Gender'},
            {id: 'pt_age', title: 'Age'},
            {id: 'pt_contact', title: 'Contact'},
            {id: 'pt_address', title: 'Address'},
            {id: 'item_name', title: 'Item Name'},
            {id: 'brand', title: 'Brand'},
            {id: 'quantity', title: 'Quantity'}
        ]
    });

    await csvWriter.writeRecords(viewListRecords)
    .then(() => {
        console.log('CSV file was written successfully')
    })
    .catch(err => {
        console.error('Error writing CSV file', err)
    });

    res.download('csvFiles/records.csv', 'records.csv', (err) => {
        if (err) {
            console.error('Error sending CSV file', err)
        }
    });
})

//-----------------FUNCTIONS-------------------------------------------------//
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function setUserData(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.username = req.user.name
        res.locals.userType = req.user.usertype
    } else {
        res.locals.username = null
        res.locals.userType = null
    }
    next();
}

//------------------------------logout-------------------------------------//
router.delete('/logout', (req, res) => {
    req.logOut(err => {
        if (err) {
            return next(err)
        }
        res.redirect('/login')
    })
})

//---------------------------fetch data---------------------------------------//
async function getAllListOfRecords() {
    try {
        const ViewRecords = await pool.query("SELECT * FROM records")
        let ListRecords = []

        if (ViewRecords.rows.length > 0) {
            ListRecords = ViewRecords.rows.map(item => ({
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
            }))
        }
        return ListRecords
    } catch (err) {
        throw new Error(err.message)
    }
}

module.exports = router
