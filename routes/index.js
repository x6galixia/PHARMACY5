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

//-----------------search----------------------------------------------------//
router.post('/search', checkAuthenticated, async(req, res) => {
  try {
    const { search } = req.body;
    const searchResult = await pool.query("SELECT * FROM inventory WHERE item_name ILIKE $1", [`%${search}%`])

    let result = []

    if (searchResult.rows.length > 0) {
      result = searchResult.rows.map(item => ({
        itemName: item.item_name,
        brand: item.brand,
        manufacturer: item.manufacturer,
        dosage: item.dosage,
        expiration: formatDate(item.expiration),
        quantity: item.quantity
      }));
    } else {
      console.log('No results found for:', search)
    }

    res.render('index', {
      viewList: result
    })
    
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
//----------------displaying the table-------------------------------------//
router.get('/', checkAuthenticated, async(req, res) => {
  try {
    const viewItems = await pool.query("SELECT item_name, brand, manufacturer, dosage, expiration, quantity FROM inventory")
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

    res.render('index', {
      viewList: viewAll
    });
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

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

function formatDate(dateString) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', options)
}

module.exports = router
