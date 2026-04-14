const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const connection = routes.connection;
const session = require('express-session');
const { passport, requireAuth } = require('./middleware/auth');
const bcrypt = require('bcrypt');

const app = express();
const path = require("path");
app.use(cors({
  origin: '*',
  credentials: true
}));

// Serve React build
app.use(express.static(path.join(__dirname, "../client/dist"))); // Vite

//Manual Login
app.use(express.urlencoded({ extended: true }));

//Session
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true only if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

//Passport
app.use(passport.initialize());
app.use(passport.session());

//Middleware
app.use((req, res, next) => {
  if (
    req.path.startsWith('/auth') ||
    req.path === '/manual-login' ||
    req.path === '/login'
  ) {
    return next();
  }

  return next();
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Google login
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

//Me
app.get('/me', (req, res) => {
  console.log("SESSION USER:", req.user); // 👈 ADD THIS

  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json(req.user);
  }

  return res.status(401).json(null);
});


// Callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    return res.redirect('/');
  }
);

// Logout
app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

//Middleware - Authentication
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

  app.post('/manual-login', (req, res) => {
  const { email, password } = req.body;

  connection.query(
    `SELECT * FROM users WHERE email = $1 AND password_hash IS NOT NULL`,
    [email],
    async (err, data) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (!data.rows.length) {
        return res.json({
          success: false,
          message: "No account found. Try Google login."
        });
      }

      const user = data.rows[0];

      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return res.json({
          success: false,
          message: "Incorrect password"
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.json({
            success: false,
            message: "Login failed"
          });
        }

        return res.json({
          success: true
        });
      });
    }
  );
});

//Create an Account
app.post('/register', async (req, res) => {
  const { first, last, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const name = first + " " + last;

    await connection.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)`,
      [name, email, hash]
    );

    res.json({ success: true });

  } catch (err) {
    if (err.code === '23505') {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/billboard/trending_songs', routes.billboard_trending_songs);
app.get('/billboard/artists', routes.billboard_artists);
app.get('/billboard/annual_top_songs', routes.billboard_top_five);
app.get('/billboard/genre_popularity_over_time', routes.billboard_genre_trends);
app.get('/grammys/genres', routes.grammys_genres);
app.get('/grammys/top_winning_artists', routes.grammys_top_artists);
app.get('/grammys/top_winning_genres', routes.grammys_top_genres);
app.get('/search', routes.search);
app.get('/artist/:id', routes.artist_info);
app.get('/song/:id', routes.song_info);
app.get('/artist_songs', routes.artist_songs);
app.get('/related', routes.related);
app.get('/songs/:song_id/recommendations/genres', routes.recs_from_genres);
app.get('/songs/:song_id/recommendations/audio_attributes', routes.recs_from_audio_attributes);
app.get('/stats/song_count', routes.unique_song_count);
app.get('/stats/artist_count', routes.unique_artist_count);
app.get('/stats/album_count', routes.unique_album_count);
app.get('/user/top_genres/:user_id', routes.user_top_genres);
app.get('/user/top_albums/:user_id', routes.user_top_albums);
app.get('/user/top_artists/:user_id', routes.user_top_artists);
app.get('/user/favorite_songs/:user_id', routes.user_favorite_songs);
app.get('/user/most_energetic_songs/:user_id', routes.user_most_energetic_songs);
app.get('/user/most_sad_songs/:user_id', routes.user_most_sad_songs);
app.get('/user/music_profile/:user_id', routes.user_music_profile);
app.get('/awards/years', routes.get_award_years);
app.get('/awards/winners', routes.get_award_winners);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
