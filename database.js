var database = {};

database.pouch_db = null;

database.init = function(){
    this.pouch_db = new PouchDB('racebox_races_db');
}

database.addRaceResults = function(race_data){
    var t = {
        _id: new Date().toISOString(),
        race_data: race_data,
    };
  this.pouch_db.put(t, function callback(err, result) {
    if (!err) {
      console.log('database added race data!');
    }
  });
}