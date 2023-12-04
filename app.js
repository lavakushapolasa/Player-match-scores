const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDetailsToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertPlayerMatchScoreToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    player_id: dbObject.player_id,
    match_id: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//API 1 Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details;`;
  const playerArray = await db.all(getPlayerQuery);
  //console.log(playerArray);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDetailsToResponseObject(eachPlayer)
    )
  );
});
//API 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE 
    player_id = ${playerId};
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsToResponseObject(player));
});

//API 3 Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details 
    SET 
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT * FROM match_details
    WHERE 
    match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchDetailsToResponseObject(matchDetails));
});

//API 5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM player_match_score
    NATURAL JOIN match_details
    WHERE 
    player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachPlayer) =>
      convertMatchDetailsToResponseObject(eachPlayer)
    )
  );
});

//API 6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT * FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const playerArray = await db.all(getMatchPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDetailsToResponseObject(eachPlayer)
    )
  );
});

//API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) As totalSixes
        FROM player_match_score
        NATURAL JOIN player_details
        WHERE 
        player_id = ${playerId};`;
  const playerMatchDetails = await db.get(getMatchPlayerQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
