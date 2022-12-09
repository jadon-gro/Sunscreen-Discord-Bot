import { config } from 'dotenv';
config();
import fs from 'fs';
import SerpApi from 'google-search-results-nodejs';
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

const params = {
  q: "sunscreen",
  tbm: "shop",
  location: process.env.CITY,
  hl: "en",
  gl: "us"
};

const callback = function(data) {
    const reducedData = {
        "index": 0,
        "shopping_results": data["shopping_results"]
    }
    const string = JSON.stringify(reducedData)
    fs.writeFile('Sunscreen_Search_Results.json', string, err => {
        if (err) {
            throw err;
        }
        console.log('Sunscreen Shopping Results Saved');
    });

};

export function dumpSunscreenToJson() {
    try {
        search.json(params, callback);
    } catch (err) {
        console.log(err);
    }
}