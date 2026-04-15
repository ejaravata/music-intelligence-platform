import config from "./config.json";

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { connection } = require('../routes');

/*
// Google OAuth
*/
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '${config.frontend_url}/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  connection.query(
  `SELECT * FROM users WHERE google_id = $1 OR email = $2`,
  [profile.id, profile.emails?.[0]?.value],
  (err, data) => {
    if (err) return done(err);

    if (data.rows.length) {
      const existingUser = data.rows[0];

      if (!existingUser.google_id) {
        connection.query(
          `UPDATE users
           SET google_id = $1
           WHERE id = $2
           RETURNING *`,
          [profile.id, existingUser.id],
          (updateErr, updateResult) => {
            if (updateErr) return done(updateErr);
            return done(null, updateResult.rows[0]);
          }
        );
        return;
      }

      return done(null, existingUser);
    }

    connection.query(
      `INSERT INTO users (email, google_id, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [profile.emails?.[0]?.value, profile.id, profile.displayName],
      (insertErr, result) => {
        if (insertErr) return done(insertErr);
        return done(null, result.rows[0]);
      }
    );
  }
);
}));

/*
// GitHub OAuth
*/
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '${config.frontend_url}/auth/github/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      const githubEmail = profile.emails?.[0]?.value || null;
      const githubName = profile.displayName || profile.username || 'GitHub User';

      connection.query(
        `SELECT * FROM users WHERE github_id = $1 OR email = $2`,
        [profile.id, githubEmail],
        (err, data) => {
          if (err) return done(err);

          if (data.rows.length) {
            const existingUser = data.rows[0];

            // Link GitHub if missing
            if (!existingUser.github_id) {
              connection.query(
                `UPDATE users
                SET github_id = $1
                WHERE id = $2
                RETURNING *`,
                [profile.id, existingUser.id],
                (updateErr, updateResult) => {
                  if (updateErr) return done(updateErr);
                  return done(null, updateResult.rows[0]);
                }
              );
              return;
            }

            return done(null, existingUser);
          }

          // Insert new user
          connection.query(
            `INSERT INTO users (email, github_id, name)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [githubEmail, profile.id, githubName],
            (insertErr, result) => {
              if (insertErr) return done(insertErr);
              return done(null, result.rows[0]);
            }
          );
        }
      );
    }
  )
);

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
