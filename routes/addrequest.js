const express = require('express');
const router = express.Router();
const pool = require('../models/databases/pg');
const multer = require("multer");
const fs = require('fs');
const path = require('path');
const methodOverride = require('method-override');

router.use(methodOverride('_method'));
router.use(setUserData);

//-------------------------LOGOUT--------------------------------//
router.delete('/logout', (req, res) => {
  req.logOut(err => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

//------------------------------------MULTER CONFIGURATION--------------------------//
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';

    // Create the 'uploads' directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use("/uploads", express.static("uploads"));

//--------------------------RENDER REQUEST----------------------------//
router.get("/addrequest", checkAuthenticated, (req, res) => {
  res.render("addrequest");
});

//---------------------------------ADDING A REQUEST--------------------------//
router.post("/addrequest", checkAuthenticated, upload.fields([
  { name: "pt_prescription", maxCount: 1 },
  { name: "rp_valid_id", maxCount: 1 },
]), async (req, res) => {
  const {
    pt_name,
    pt_age,
    pt_gender,
    pt_contact,
    pt_address,
    rp_name,
    rp_age,
    rp_relationship,
    rp_contact,
    rp_address,
  } = req.body;

  const pt_prescription = req.files["pt_prescription"]
    ? req.files["pt_prescription"][0].filename : null;
  const rp_valid_id = req.files["rp_valid_id"]
    ? req.files["rp_valid_id"][0].filename : null;

  const rq_id = generateRequestId();

  try {
    await pool.query(
      "INSERT INTO request (rq_id, pt_name, pt_age, pt_gender, pt_contact, pt_address, pt_prescription, rp_name, rp_age, rp_relationship, rp_contact, rp_address, rp_valid_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
      [
        rq_id,
        pt_name,
        pt_age,
        pt_gender,
        pt_contact,
        pt_address,
        pt_prescription,
        rp_name,
        rp_age,
        rp_relationship,
        rp_contact,
        rp_address,
        rp_valid_id,
      ]
    );
    res.redirect('/');
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).json({ error: err.message });
  }
});

//------------------------------FUNCTIONS---------------------------------///
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


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


function generateRequestId() {
  return "RQ" + Date.now();
}

module.exports = router;
