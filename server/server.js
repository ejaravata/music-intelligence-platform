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

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
