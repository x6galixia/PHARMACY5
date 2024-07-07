const express = require('express')
const app = express()
const pool = require('./models/databases/pg')
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const flash = require('express-flash')
const passport = require('passport')
const initializePassport = require('./passportConfig')
const IndexRouter = require('./routes/index')
const loginRouter = require('./routes/login')
const addstocksRouter = require('./routes/addstocks')
const addrequestRouter = require('./routes/addrequest')
const dispenseRouter = require('./routes/dispense')
const recordsRouter = require('./routes/records')

// Database connection
pool.connect()
.then(() => console.log('Connected to database'))
.catch(err => console.error('Error connecting to database:', err));

// Passport configuration
initializePassport(passport)

// Middleware
app.set('view engine', 'ejs')
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(flash())

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}))

// Middleware to disable caching
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});


app.use('/uploads', express.static('uploads'));

//passport
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/', IndexRouter)
app.use('/', loginRouter)
app.use('/', addstocksRouter)
app.use('/', addrequestRouter)
app.use('/', dispenseRouter)
app.use('/', recordsRouter)

// Start server
app.listen(3000, () => {
  console.log("listening to port 3000...")
})
