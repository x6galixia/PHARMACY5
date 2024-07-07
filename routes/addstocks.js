const express = require('express')
const router = express.Router()
const pool = require('../models/databases/pg')
const methodOverride = require('method-override')

router.use(methodOverride('_method'))
router.use(setUserData)

//------------------------------logout-------------------------------------//
router.delete('/logout', (req, res) => {
    req.logOut(err => {
      if (err) {
        return next(err)
      }
      res.redirect('/login')
    })
  })

//-----------------------------route to handle adding data-------------------------------------//
router.post('/addstocks', checkAuthenticated, async (req, res) => {
  const { itemName, brand, manufacturer, dosage, expiration, quantity } = req.body;
  
  try {
    await pool.query(
      "INSERT INTO inventory (item_name, brand, manufacturer, dosage, expiration, quantity) VALUES ($1, $2, $3, $4, $5, $6)",
      [itemName, brand, manufacturer, dosage, expiration, quantity]
    );
    
//-----------------------------------fetch data -------------------------------------------//
    const viewAll = await fetchInventoryItems();
    
//----------------------------------------render the view------------------------------//
    res.render('addstocks', { viewList: viewAll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//------------------------------------display table--------------------------------------//
router.get('/addstocks', checkAuthenticated, async (req, res) => {
  try {
    // Fetch current inventory items
    const viewAll = await fetchInventoryItems();
    
    // Render the view with current inventory
    res.render('addstocks', { viewList: viewAll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//-----------------------FUNCTIONS------------------------------------------//
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
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
  
  function formatDate(dateString) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', options)
  }

  // Function to fetch inventory items from the database
async function fetchInventoryItems() {
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
  } catch (err) {
    throw err;
  }
}
  
  module.exports = router