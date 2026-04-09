const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js
app.get('/billboard/trending_songs', routes.billboard_trending_songs);
app.get('/billboard/artists', routes.billboard_artists);
app.get('/grammys/genres', routes.grammys_genres);
app.get('/songs/search?q={song_name}', routes.search_by_song_name);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
