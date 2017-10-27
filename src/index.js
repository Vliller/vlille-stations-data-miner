const client = require("mongodb").MongoClient;
const request = require("request");
const config = require("../config.json");

const DB_NAME = "vlille";
const VLILLE_API_BASE = `https://opendata.lillemetropole.fr/api/records/1.0/search/?dataset=vlille-realtime&rows=-1&apikey=${config.apiKey}`

client.connect("mongodb://localhost/" + DB_NAME, (error, db) => {
  if (error) {
    throw error;
  }

  request(VLILLE_API_BASE, { json: true }, (error, response, body) => {
    if (error) {
      throw error;
    }

    // manage data insertion
    storeDataToDb(body, db);
  });
});

function storeDataToDb(data, db) {
  if (!data.records) {
    throw "No data";
  }

  // formats entries
  data = prepareData(data);

  // count data insertion
  leftInsertCount = data.length;

  // insert entries into database
  data.forEach(element => {
    db.collection("station-" + element.id).insert(element, error => {
      if (error) {
        throw error;
      }

      // all data stored
      if (--leftInsertCount === 0) {
        db.close();
        process.exit(0);
      }
    });
  });
}

/**
 * Removes useless data from dataset
 *
 * @param {Array} data
 */
function prepareData(data) {
  return data.records.map(record => {
    return {
      id: record.fields.libelle,
      date: new Date(record.record_timestamp),
      bikes: record.fields.nbVelosDispo,
      docks: record.fields.nbPlacesDispo,
      status: record.fields.etat,
      connexionStatus: record.fields.etatConnexion
    };
  });
}