const config = require("../config.json");

const client = require("mongodb").MongoClient;
const request = require("request");

const VLILLE_API_BASE = `${config.dataset.apiBase}&rows=-1&apikey=${config.dataset.apiKey}`

client.connect(`${config.database.urlBase + config.database.name}`, (error, db) => {
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