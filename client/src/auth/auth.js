const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { connection } = require('../routes');

passport.use(new GoogleStrategy({
  clientID: '24877399208-6ma7c58jvfstb7u7ga98mohpm24sebct.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:8080/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  connection.query(
    `SELECT * FROM users WHERE google_id = $1`,
    [profile.id],
    (err, data) => {
      if (err) return done(err);

      if (data.rows.length) {
        return done(null, data.rows[0]);
      }

      connection.query(
        `INSERT INTO users (email, google_id, name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          profile.emails[0].value,
          profile.id,
          profile.displayName
        ],
        (err, result) => {
          if (err) return done(err);
          return done(null, result.rows[0]);
        }
      );
    }
  );
}));

passport.serializeUser((user, done) => {
  console.log("serializeUser user:", user);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  connection.query(
    `SELECT * FROM users WHERE id = $1`,
    [id],
    (err, data) => {
      if (err) return done(err);
      return done(null, data.rows[0]);
    }
  );
});

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect('/login');
  next();
}

module.exports = { passport, requireAuth };
