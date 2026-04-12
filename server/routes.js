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
  const chosen_song = req.query.q;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  //right now this only brings up song name and id - need to implement other elements later
  connection.query(`SELECT
                      s.song_id,
                      s.song_name,
                      STRING_AGG(a.artist_name, ', ') AS artists
                    FROM spotify_songs s
                      JOIN featured_in f ON s.song_id = f.song_id
                      JOIN spotify_artists a ON f.artist_id = a.artist_id
                      JOIN audio_attributes au ON s.song_id = au.song_id
                    WHERE s.song_name ILIKE '%' || $1 || '%'
                    GROUP BY
                      s.song_id,
                      s.song_name,
                      popularity
                    ORDER BY popularity DESC
                    LIMIT $2 OFFSET $3;`, [chosen_song, limit, offset],
                    (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

const search_by_artist_name = async function(req, res) {
  const chosen_artist = req.query.q;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  connection.query(`SELECT
                      artist_id,
                      artist_name
                    FROM spotify_artists
                    WHERE artist_name ILIKE '%' || $1 || '%'
                    ORDER BY popularity_score DESC
                    LIMIT $2 OFFSET $3;`, [chosen_artist, limit, offset],
                    (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      res.json(data.rows);
    }
  });
}

//Route 2: GET /billboard/annual_top_songs
const billboard_top_five = async function(req, res) {
/* Returns the top ranked five songs with the most billboard appearances per year. In addition, this will
 * also return the amount of appearances each song had over each timeframe.
 */

  connection.query(`
    WITH yearly_song_appearances AS (
      SELECT
          EXTRACT(YEAR FROM bc.week_ending_date)::INT AS year,
          bc.song_name,
          COUNT(*) AS appearances,
          ROW_NUMBER() OVER (
              PARTITION BY EXTRACT(YEAR FROM bc.week_ending_date)
              ORDER BY COUNT(*) DESC, bc.song_name ASC
              ) AS rn
      FROM billboard_chart bc
      GROUP BY
          EXTRACT(YEAR FROM bc.week_ending_date),
          bc.song_name
    )
    SELECT
        year,
        song_name,
        appearances
    FROM yearly_song_appearances
    WHERE rn <= 5
    ORDER BY year ASC, appearances DESC, song_name ASC;
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

//Route 4: GET /songs/:song_id/recommendations/genres
const recs_from_genres = async function(req, res) {
/* Returns songs and corresponding artists with similar genres as well as subset of subgenres to the Spotify
 * ID the current user inputs. This will sort the queried results by the popularity and subgenres to show the 
 * most relevant songs with a shared subset of subgenres.
 */
  const song_id = req.params.song_id;
  
  connection.query(`
    WITH wanted_song AS (
      SELECT
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ') AS artist_names
      FROM spotify_songs s
        JOIN featured_in f ON s.song_id = f.song_id
        JOIN spotify_artists sa ON f.artist_id = sa.artist_id
      WHERE s.song_id = $1
      GROUP BY s.song_name
    ),
    wanted_subgenres AS (
      SELECT subgenre
      FROM songs_subgenres
      WHERE song_id = $1
    ),
    candidate_songs AS (
      SELECT
        s.song_id,
        s.song_name,
        aa.genre,
        aa.popularity,
        COUNT(DISTINCT ss.subgenre) AS shared_subgenre_count,
        STRING_AGG(DISTINCT ss.subgenre, ', ') AS shared_subgenres
      FROM songs_subgenres ss
        JOIN wanted_subgenres ws ON ss.subgenre = ws.subgenre
        JOIN spotify_songs s ON s.song_id = ss.song_id
        JOIN audio_attributes aa ON aa.song_id = s.song_id
      WHERE ss.song_id <> $1
      GROUP BY
        s.song_id,
        s.song_name,
        aa.genre,
        aa.popularity
      ORDER BY shared_subgenre_count DESC, aa.popularity DESC
      LIMIT 100
    ),
    final_songs AS (
      SELECT
        cs.song_id,
        cs.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ') AS artist_names,
        cs.genre,
        cs.popularity,
        cs.shared_subgenre_count,
        cs.shared_subgenres
      FROM candidate_songs cs
        JOIN featured_in f ON cs.song_id = f.song_id
        JOIN spotify_artists sa ON sa.artist_id = f.artist_id
      GROUP BY
        cs.song_id,
        cs.song_name,
        cs.genre,
        cs.popularity,
        cs.shared_subgenre_count,
        cs.shared_subgenres
    ),
    deduped_songs AS (
      SELECT
        fs.*,
        ROW_NUMBER() OVER (
          PARTITION BY fs.song_name, fs.artist_names
          ORDER BY fs.shared_subgenre_count DESC, fs.popularity DESC, fs.song_id
        ) AS rn
      FROM final_songs fs
      WHERE NOT EXISTS (
        SELECT 1
        FROM wanted_song ws
        WHERE ws.song_name = fs.song_name
          AND ws.artist_names = fs.artist_names
      )
    )
    SELECT
      song_id,
      song_name,
      artist_names,
      genre,
      popularity,
      shared_subgenre_count,
      shared_subgenres
    FROM deduped_songs
    WHERE rn = 1
    ORDER BY shared_subgenre_count DESC, popularity DESC
    LIMIT 10;
  `, [song_id],
    (err, data) => {
      if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

//Route 5: GET /songs/:song_id/recommendations/audio_attributes
const recs_from_audio_attributes = async function(req, res) {
/* Returns top 10 recommended songs whose audio features are most similar to the input song. Similarity 
 * is computed using cosine distance and a pgvector embedding of audio attributes, including  
 * danceability, valence, and tempo, as well as additional features such as popularity.
 */
  const song_id = req.params.song_id;
  
  connection.query(`
    WITH wanted_song AS (
      SELECT embedding
      FROM audio_attributes
      WHERE song_id = $1
    ),
    nearest_songs AS (
      SELECT
        aa.song_id,
        aa.genre,
        aa.popularity,
        ROUND((aa.embedding <=> w.embedding)::numeric, 7) AS distance
      FROM audio_attributes aa
      CROSS JOIN wanted_song w
      WHERE aa.song_id <> $1
      ORDER BY distance ASC
      LIMIT 10
    )
    SELECT
      s.song_id,
      s.song_name,
      STRING_AGG(DISTINCT sa.artist_name, ', ') AS artist_names,
      n.genre,
      n.popularity,
      n.distance
    FROM nearest_songs n
      JOIN spotify_songs s ON n.song_id = s.song_id
      JOIN featured_in f ON s.song_id = f.song_id
      JOIN spotify_artists sa ON f.artist_id = sa.artist_id
    GROUP BY
      s.song_id,
      s.song_name,
      n.genre,
      n.popularity,
      n.distance
    ORDER BY n.distance ASC;
  `, [song_id],
    (err, data) => {
      if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

//Route 7: GET /billboard/genre_popularity_over_time
const billboard_genre_trends = async function(req, res) {
/* Tracks how each subgenre’s popularity changes over time using a normalized Billboard score based on
 * chart rankings. This showcases the visualization of rising and declining genre trends over time.
 */

  connection.query(`
    SELECT
      b.week_ending_date,
      a.genre,
      SUM(101 - b.current_rank) / COUNT(*) AS normalized_popularity_score
    FROM billboard_chart b
         JOIN spotify_artists a ON b.artist_id = a.artist_id
    WHERE a.genre IS NOT NULL
    GROUP BY b.week_ending_date, a.genre
    ORDER BY b.week_ending_date, normalized_popularity_score DESC;
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
                    JOIN audio_attributes aa ON s.song_id = aa.song_id
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

//Route 8b: GET /grammys/top_winning_artists
const grammys_top_artists = async function(req, res) {
  // Gets top 10 artists by number of Grammys won, but only artist, song, or album awards (no performances, 
  // music videos, and stuff like that.

  connection.query(`
    SELECT
      artist_name,
      SUM(grammy_wins) AS grammy_wins
    FROM (
        SELECT
          gs.artist_name,
          COUNT(*) AS grammy_wins
        FROM grammy_songs gs
        WHERE gs.winner = TRUE
          AND gs.artist_name IS NOT NULL
          AND LOWER(gs.artist_name) <> 'not available'
        GROUP BY gs.artist_name

        UNION ALL

        SELECT
          ga.artist_name,
          COUNT(*) AS grammy_wins
        FROM grammy_albums ga
        WHERE ga.winner = TRUE
          AND ga.artist_name IS NOT NULL
          AND LOWER(ga.artist_name) <> 'not available'
        GROUP BY ga.artist_name

        UNION ALL

        SELECT
          ga.artist_name,
          COUNT(*) AS grammy_wins
        FROM grammy_artists ga
        WHERE ga.winner = TRUE
          AND ga.artist_name IS NOT NULL
          AND LOWER(ga.artist_name) <> 'not available'
        GROUP BY ga.artist_name
    ) h
    GROUP BY artist_name
    ORDER BY grammy_wins DESC, artist_name ASC
    LIMIT 10;
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

//Route 8c: GET /grammys/top_winning_genres
const grammys_top_genres = async function(req, res) {
  // Gets top 10 genres by number of Grammys won, but only artist, song, or album awards (no performances, 
  // music videos, and stuff like that.


  connection.query(`
    SELECT
      genre,
      SUM(grammy_wins) AS grammy_wins
    FROM (
      SELECT
        genre,
        year,
        SUM(grammy_wins) AS grammy_wins
      FROM (
        SELECT
          aa.genre AS genre,
          gs.year AS year,
          COUNT(DISTINCT gs.award) AS grammy_wins
        FROM grammy_songs gs
        JOIN spotify_songs s ON gs.song_title = s.song_name
        JOIN audio_attributes aa ON s.song_id = aa.song_id
        WHERE gs.winner = TRUE
          AND aa.genre IS NOT NULL
        GROUP BY aa.genre, gs.year

        UNION ALL

        SELECT
          sa.genre AS genre,
          ga.year AS year,
          COUNT(DISTINCT ga.award) AS grammy_wins
        FROM grammy_albums ga
        JOIN album a ON ga.album_title = a.album_name
        JOIN spotify_artists sa ON a.artist_id = sa.artist_id
        WHERE ga.winner = TRUE
          AND sa.genre IS NOT NULL
        GROUP BY sa.genre, ga.year

        UNION ALL

        SELECT
          sa.genre AS genre,
          ga.year AS year,
          COUNT(DISTINCT ga.award) AS grammy_wins
        FROM grammy_artists ga
        JOIN spotify_artists sa ON ga.artist_name = sa.artist_name
        WHERE ga.winner = TRUE
          AND sa.genre IS NOT NULL
        GROUP BY sa.genre, ga.year
      ) yearly
      GROUP BY genre, year
    ) final_yearly
    GROUP BY genre
    ORDER BY grammy_wins DESC;
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

// Route 12: GET /user/top_genres
//List of top genres for a given user
const user_top_genres = async function(req, res) {
  const user_id = req.params.user_id;
 
  const query = `
    SELECT
      aa.genre,
      ss.subgenre,
      COUNT(DISTINCT uf.spotify_id) AS num_favorites
    FROM user_favorites uf
    JOIN audio_attributes aa ON uf.spotify_id = aa.song_id
    JOIN songs_subgenres ss ON uf.spotify_id = ss.song_id
    WHERE user_id = $1
      AND ss.subgenre IS NOT NULL
    GROUP BY aa.genre, ss.subgenre
    ORDER BY num_favorites DESC;
  `;
  connection.query(query, [user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      console.log(data.rows);
      res.json(data.rows);
    }
  });
}

// Route 13: GET /user/top_albums
//List of top albums for a given user
const user_top_albums = async function(req, res){
  const page = parseInt(req.query.page ?? '1');
  const pageSize = Math.min(parseInt(req.query.page_size ?? '10'), 50);
  const user_id = req.params.user_id;
  
  if(!page || page < 1){
    let query = `
      SELECT
        row_number() over (ORDER BY COUNT(DISTINCT s.song_id) DESC) AS row_number,
        a.album_name,
        COUNT(DISTINCT u.spotify_id) AS saved_count
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN album a
        ON s.album_id = a.album_id
      WHERE u.user_id = $1
      GROUP BY a.album_name
      ORDER BY saved_count DESC;
    `;

    connection.query(query, [user_id], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }else{
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT
        row_number() over (ORDER BY COUNT(DISTINCT u.spotify_id) DESC) AS row_number,
        a.album_name,
        COUNT(DISTINCT u.spotify_id) AS saved_count
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN album a
        ON s.album_id = a.album_id
      WHERE u.user_id = $1
      GROUP BY a.album_name
      ORDER BY saved_count DESC
      LIMIT $2
      OFFSET $3
    `;

    connection.query(query, [user_id, pageSize, offset], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }
}

// Route 14: GET /user/top_artists
//List of top artists for a given user
const user_top_artists = async function(req, res){
  const page = parseInt(req.query.page ?? '1');
  const pageSize = Math.min(parseInt(req.query.page_size ?? '10'), 50);
  const user_id = req.params.user_id;
  
  if(!page || page < 1){
    let query = `
      SELECT
        row_number() over (ORDER BY COUNT(DISTINCT s.song_id) DESC) AS row_number,
        sa.artist_name,
        COUNT(DISTINCT s.song_id) AS saved_count
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN public.featured_in fi
        ON s.song_id = fi.song_id
      JOIN public.spotify_artists sa
        ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY sa.artist_name
      ORDER BY saved_count DESC;
    `;

    connection.query(query, [user_id], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }else{
    const offset = (page - 1) * pageSize;

    let query = `
      SELECT
        row_number() over (ORDER BY COUNT(DISTINCT s.song_id) DESC) AS row_number,
        sa.artist_name,
        COUNT(DISTINCT s.song_id) AS saved_count
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN public.featured_in fi
        ON s.song_id = fi.song_id
      JOIN public.spotify_artists sa
        ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY sa.artist_name
      ORDER BY saved_count DESC
      LIMIT $2
      OFFSET $3
    `;

    connection.query(query,[user_id, pageSize, offset], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }
}

// Route 15: GET /user/favorite_songs
//List of favorite songs for a given user ordered by date added (desc)
const user_favorite_songs = async function(req, res){
  const page = parseInt(req.query.page ?? '1');
  const pageSize = Math.min(parseInt(req.query.page_size ?? '10'), 50);
  const user_id = req.params.user_id;
  
  if(!page || page < 1){
    let query = `
      SELECT
        row_number() over (ORDER BY u.date_added DESC) AS row_number,
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ' ORDER BY sa.artist_name) AS artists,
        a.album_name,
        u.date_added
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN album a
        ON s.album_id = a.album_id
      JOIN public.featured_in fi
        ON s.song_id = fi.song_id
      JOIN public.spotify_artists sa
        ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY s.song_id, s.song_name, a.album_name, u.date_added
      ORDER BY u.date_added DESC
    `;

    connection.query(query, [user_id], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }else{
    const offset = Math.max((page - 1) * pageSize, 0);

    let query = `
      SELECT
        row_number() over (ORDER BY u.date_added DESC) AS row_number,
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ' ORDER BY sa.artist_name) AS artists,
        a.album_name,
        u.date_added
      FROM user_favorites u
      JOIN spotify_songs s
        ON u.spotify_id = s.song_id
      JOIN album a
        ON s.album_id = a.album_id
      JOIN public.featured_in fi
        ON s.song_id = fi.song_id
      JOIN public.spotify_artists sa
        ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY s.song_id, s.song_name, a.album_name, u.date_added
      ORDER BY u.date_added DESC
      LIMIT $2
      OFFSET $3
    `;

    connection.query(query, [user_id, pageSize, offset], (err, data) => {
      if(err){
        console.log(err);
        res.json([]);
      }else{
        res.json(data.rows);
      }
    });
  }
}

// Route 16: GET /user/most_energetic_songs
//Top 10 most energetic songs for a given user
const user_most_energetic_songs = async function(req, res) {
  const user_id = req.params.user_id;
 
  const query = `
    SELECT
      s.song_name,
      STRING_AGG(DISTINCT sa.artist_name, ', ' ORDER BY sa.artist_name) AS artists,
      aa.energy
    FROM user_favorites u
    JOIN spotify_songs s
      ON u.spotify_id = s.song_id
    JOIN public.featured_in fi
      ON s.song_id = fi.song_id
    JOIN public.spotify_artists sa
      ON fi.artist_id = sa.artist_id
    JOIN audio_attributes aa
      ON s.song_id = aa.song_id
    WHERE u.user_id = $1
    GROUP BY s.song_id, s.song_name, aa.energy
    ORDER BY aa.energy DESC
    LIMIT 10;
  `;
  connection.query(query, [user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      console.log(data.rows);
      res.json(data.rows);
    }
  });
}

// Route 17: GET /user/most_sad_songs
//Top 10 most sad songs for a given user
const user_most_sad_songs = async function(req, res) {
  const user_id = req.params.user_id;
 
  const query = `
    SELECT
      s.song_name,
      STRING_AGG(DISTINCT sa.artist_name, ', ' ORDER BY sa.artist_name) AS artists,
      aa.valence
    FROM user_favorites u
    JOIN spotify_songs s
      ON u.spotify_id = s.song_id
    JOIN public.featured_in fi
      ON s.song_id = fi.song_id
    JOIN public.spotify_artists sa
      ON fi.artist_id = sa.artist_id
    JOIN audio_attributes aa
      ON s.song_id = aa.song_id
    WHERE u.user_id = $1
    GROUP BY s.song_id, s.song_name, aa.valence
    ORDER BY aa.valence ASC
    LIMIT 10;
  `;
  connection.query(query, [user_id], (err, data) => {
    if (err) {
      console.log(err);
      res.json({});
    } else {
      console.log(data.rows);
      res.json(data.rows);
    }
  });
}

// Route 18: GET /user/music_profile
//Combined endpoint that returns everything in one call instead of 6 separate calls
const user_music_profile = async function(req, res) {
  const user_id = req.params.user_id;

  try {
    const topGenresQuery = `
      SELECT aa.genre, ss.subgenre, COUNT(DISTINCT uf.spotify_id) AS count
      FROM user_favorites uf
      JOIN audio_attributes aa ON uf.spotify_id = aa.song_id
      JOIN songs_subgenres ss ON uf.spotify_id = ss.song_id
      WHERE uf.user_id = $1 AND ss.subgenre IS NOT NULL
      GROUP BY aa.genre, ss.subgenre
      ORDER BY count DESC
      LIMIT 10;
    `;

    const topArtistsQuery = `
      SELECT sa.artist_name, COUNT(DISTINCT u.spotify_id) AS count
      FROM user_favorites u
      JOIN spotify_songs s ON u.spotify_id = s.song_id
      JOIN featured_in fi ON s.song_id = fi.song_id
      JOIN spotify_artists sa ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY sa.artist_name
      ORDER BY count DESC
      LIMIT 10;
    `;

    const topAlbumsQuery = `
      SELECT a.album_name, COUNT(DISTINCT u.spotify_id) AS count
      FROM user_favorites u
      JOIN spotify_songs s ON u.spotify_id = s.song_id
      JOIN album a ON s.album_id = a.album_id
      WHERE u.user_id = $1
      GROUP BY a.album_name
      ORDER BY count DESC
      LIMIT 10;
    `;

    const recentSongsQuery = `
      SELECT
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ') AS artists,
        a.album_name,
        u.date_added
      FROM user_favorites u
      JOIN spotify_songs s ON u.spotify_id = s.song_id
      JOIN album a ON s.album_id = a.album_id
      JOIN featured_in fi ON s.song_id = fi.song_id
      JOIN spotify_artists sa ON fi.artist_id = sa.artist_id
      WHERE u.user_id = $1
      GROUP BY s.song_id, s.song_name, a.album_name, u.date_added
      ORDER BY u.date_added DESC
      LIMIT 10;
    `;

    const energeticQuery = `
      SELECT
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ') AS artists,
        aa.energy
      FROM user_favorites u
      JOIN spotify_songs s ON u.spotify_id = s.song_id
      JOIN featured_in fi ON s.song_id = fi.song_id
      JOIN spotify_artists sa ON fi.artist_id = sa.artist_id
      JOIN audio_attributes aa ON s.song_id = aa.song_id
      WHERE u.user_id = $1
      GROUP BY s.song_id, s.song_name, aa.energy
      ORDER BY aa.energy DESC
      LIMIT 10;
    `;

    const sadQuery = `
      SELECT
        s.song_name,
        STRING_AGG(DISTINCT sa.artist_name, ', ') AS artists,
        aa.valence
      FROM user_favorites u
      JOIN spotify_songs s ON u.spotify_id = s.song_id
      JOIN featured_in fi ON s.song_id = fi.song_id
      JOIN spotify_artists sa ON fi.artist_id = sa.artist_id
      JOIN audio_attributes aa ON s.song_id = aa.song_id
      WHERE u.user_id = $1
      GROUP BY s.song_id, s.song_name, aa.valence
      ORDER BY aa.valence ASC
      LIMIT 10;
    `;

    const summaryQuery = `
      SELECT
        COUNT(*) AS total_songs,
        COUNT(DISTINCT spotify_id) AS unique_songs
      FROM user_favorites
      WHERE user_id = $1;
    `;

    const [
      topGenres,
      topArtists,
      topAlbums,
      recentSongs,
      energeticSongs,
      sadSongs,
      summary
    ] = await Promise.all([
      connection.query(topGenresQuery, [user_id]),
      connection.query(topArtistsQuery, [user_id]),
      connection.query(topAlbumsQuery, [user_id]),
      connection.query(recentSongsQuery, [user_id]),
      connection.query(energeticQuery, [user_id]),
      connection.query(sadQuery, [user_id]),
      connection.query(summaryQuery, [user_id])
    ]);

    res.json({
      top_genres: topGenres.rows,
      top_artists: topArtists.rows,
      top_albums: topAlbums.rows,
      recent_songs: recentSongs.rows,
      most_energetic: energeticSongs.rows,
      most_sad: sadSongs.rows,
      summary: summary.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

//make sure to add functions to module exports here
module.exports = {
  billboard_trending_songs,
  billboard_artists,
  billboard_top_five,
  billboard_genre_trends,
  grammys_genres,
  grammys_top_artists,
  grammys_top_genres,
  search_by_song_name,
  search_by_artist_name,
  user_top_genres,
  user_top_albums,
  user_top_artists,
  user_favorite_songs,
  user_most_energetic_songs,
  user_most_sad_songs,
  user_music_profile,
  recs_from_audio_attributes,
  recs_from_genres
}
