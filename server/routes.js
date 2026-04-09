const { Pool, types } = require('pg');
const config = require('./config.json')

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10)); //DO NOT DELETE THIS

// Create PostgreSQL connection using database credentials provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

/******************
 * GROUP 4 PROJECT ROUTES *
 ******************/

//Route 1: GET /songs/search?q={song_name}
//Used in search and recommendation page
const search_by_song_name = async function(req, res) {
  // TODO (TASK 7): implement a route that given an album_id, returns all songs on that album ordered by track number (ascending)
  //get variable/id chosen
  const chosen_song = req.params.song_name;

  //right now this only brings up song name and id - need to implement other elements later
  connection.query(`SELECT
                        s.song_id,
                        s.song_name
                    FROM spotify_songs s
                    WHERE s.song_name ILIKE '%' || $1 || '%'
                    LIMIT 10;`, [chosen_song],
                    (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

//Route 8: GET /grammys/genres
//Used in _____
const grammys_genres = async function(req, res) {
/*
 * Aggregates the Grammy-winning songs, albums and artists by genre and year to show how awards are 
 * distributed across genres over time. This showcases which genres receive the most industry recognition.
 */
  connection.query(`SELECT
                    genre,
                    year,
                    SUM(grammy_wins) AS grammy_wins
                  FROM (
                    SELECT
                        aa.genre,
                        gs.year,
                        COUNT(DISTINCT gs.award) AS grammy_wins
                    FROM grammy_songs gs
                    JOIN spotify_songs s ON gs.song_title = s.song_name
                    JOIN audio_attributes aa ON s.spotify_id = aa.spotify_id
                    WHERE gs.winner = TRUE
                        AND aa.genre IS NOT NULL
                    GROUP BY aa.genre, gs.year


                    UNION ALL
                    SELECT
                        sa.genre,
                        ga.year,
                        COUNT(DISTINCT ga.award) AS grammy_wins
                    FROM grammy_albums ga
                    JOIN album a ON ga.album_title = a.album_name
                    JOIN spotify_artists sa ON a.artist_id = sa.artist_id
                    WHERE ga.winner = TRUE
                        AND sa.genre IS NOT NULL
                    GROUP BY sa.genre, ga.year


                    UNION ALL
                    SELECT
                        sa.genre,
                        ga.year,
                        COUNT(DISTINCT ga.award) AS grammy_wins
                    FROM grammy_artists ga
                    JOIN spotify_artists sa ON ga.artist_name = sa.artist_name
                    WHERE ga.winner = TRUE
                        AND sa.genre IS NOT NULL
                    GROUP BY sa.genre, ga.year
                  ) h
                  GROUP BY genre,  year
                  ORDER BY year ASC, grammy_wins DESC;
                  `, 
                    (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

//Route 9: GET /billboard/artists
//Used in _____
const billboard_artists = async function(req, res) {
/*
 * This evaluates each artists’ Billboard success by combining their total chart appearances with a 
 * normalized ranking score. This allows for a fair comparison between artists based on consistency 
 * and chart performance quality.
 */

  connection.query(`SELECT
                    a.artist_name,
                    COUNT(DISTINCT b.week_ending_date) AS total_entries,
                    SUM(101 - current_rank) / COUNT(DISTINCT b.week_ending_date) AS normalized_score
                  FROM billboard_chart b
                  JOIN spotify_artists a ON b.artist_id = a.artist_id
                  GROUP BY a.artist_name
                  ORDER BY total_entries DESC, normalized_score DESC;`, (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

// Route 10: GET /billboard/trending_songs - Lexi Implement Route
//Used in Home/Overview Page
const billboard_trending_songs = async function(req, res) {
  /*
   * Retrieves the most recent Billboard chart entries as of 2025 along with their current ranking 
   * and associated artists to highlight currently trending songs. This provides the user with a 
   * snapshot of what songs are popular right now. 
   */

  connection.query(`SELECT DISTINCT
                      s.song_name,
                      STRING_AGG(DISTINCT sa.artist_name, ', '),
                      b.current_rank,
                      b.week_ending_date
                    FROM billboard_chart b
                    JOIN spotify_songs s ON b.song_name = s.song_name
                    JOIN spotify_artists sa ON b.artist_id = sa.artist_id
                    WHERE b.week_ending_date = (SELECT MAX(b2.week_ending_date) FROM billboard_chart b2)
                    GROUP BY s.song_name, b.current_rank, b.week_ending_date
                    ORDER BY b.current_rank ASC;`, 
    (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      //I think this is the correct way to return multiple rows
      res.json(data.rows);
    }
  });
}




//make sure to add functions to module exports here
module.exports = {
  billboard_trending_songs,
  billboard_artists,
  grammys_genres,
  search_by_song_name
}
