const LocalStrategy = require('passport-local').Strategy;
const pool  = require("./models/databases/pg")

const authenticateUser = (username, password, done) => {
  pool.query(
    `SELECT * FROM users WHERE username = $1`, [username], (err, results) => {
      if (err) {
        return done(err)
      }
      if (results.rows.length > 0) {
        const user = results.rows[0]

        if (password === user.password) {
          return done(null, user)
        } else {
          return done(null, false, { message: "Password is incorrect" })
        }
      } else {
        return done(null, false, { message: "Username is not registered" })
      }
    }
  )
}

function initialize(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password"
      },
      authenticateUser
    )
  );

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
      const user = result.rows[0]
      if (user) {
        user.usertype = user.user_type
        done(null, user)
      } else {
        done(new Error('User not found'))
      }
    } catch (err) {
      done(err)
    }
  })

}


module.exports = initialize
