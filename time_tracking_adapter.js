var time_tracking_adapter = {};

time_tracking_adapter.max_laps = 4
time_tracking_adapter.time_tracking_data = []

time_tracking_adapter.setup = function(){
  for(var i = 0; i < 8; i++){
    var t = {}
    t['pilot_name'] = "Pilot " + (i + 1);
    t['position'] = 0
    t['fpv_sports_pilot_id'] = null;
    t['lap_data'] = []
    this.time_tracking_data[i] = t
  }
};

time_tracking_adapter.reset = function(){
    this.setup();
}

time_tracking_adapter.push_time_tracking_data = function(pilot_index,ms,ts){
  t = {
    "ms": parseInt(ms),
    "ts": parseInt(ts)
  };

  if(this.time_tracking_data[pilot_index]['lap_data'].length < this.max_laps){
      this.time_tracking_data[pilot_index]['lap_data'].push(t);
  }
};

time_tracking_adapter.listing = function(){
    return this.time_tracking_data;
};

time_tracking_adapter.fpv_sports_results = function(race_group_data){
  data = {
    racing_event_id: race_group_data.racing_event_id,
    heat_id: race_group_data.heat_id,
    group_id: race_group_data.group_id,
    pilots: []
  }

  for(var i = 0; i < this.time_tracking_data.length; i++){
    var t_pilot = this.time_tracking_data[i];

    if(typeof(t_pilot.fpv_sports_pilot_id) !== "undefined" && t_pilot.fpv_sports_pilot_id != null){
      var t = {}
      t.id = t_pilot.fpv_sports_pilot_id
      t.total_time = this.total_time_of_pilot(i);
      t.fastest_lap_time = this.fastest_lap_time(i);
      t.fastest_lap_num = this.fastest_lap_num(i);
      t.finish_position = this.finish_position_for_pilot(i);
      t.lap_times = []

      for(var c = 0; c < t_pilot.lap_data.length; c++){
        t.lap_times.push({lap_num: c+1, lap_time_in_ms: t_pilot.lap_data[c]['ms'],timestamp: t_pilot.lap_data[c]['ts']})
      }
    }

    data.pilots.push(t);
  }

  console.log(data);
  var json = JSON.stringify(data);

  return json;
}

time_tracking_adapter.results_for_saving = function(){
  data = {
    pilots: []
  }

  for(var i = 0; i < this.time_tracking_data.length; i++){
    var t_pilot = this.time_tracking_data[i];

    var t = {}
    t.total_time = this.total_time_of_pilot(i);
    t.fastest_lap_time = this.fastest_lap_time(i);
    t.fastest_lap_num = this.fastest_lap_num(i);
    t.finish_position = this.finish_position_for_pilot(i);
    t.pilot_name = this.time_tracking_data[i].pilot_name;
    t.lap_times = []

    for(var c = 0; c < t_pilot.lap_data.length; c++){
      t.lap_times.push({lap_num: c+1, lap_time_in_ms: t_pilot.lap_data[c]['ms'],timestamp: t_pilot.lap_data[c]['ts']})
    }

    data.pilots.push(t);
  }

  console.log(data);
  var json = JSON.stringify(data);

  return json;
}

time_tracking_adapter.total_time_of_pilot = function(index){
  var t = 0
  for(var i = 0; i < this.time_tracking_data[index].lap_data.length; i++){
    t += this.time_tracking_data[index].lap_data[i].ms;
  }
  return t;
}

time_tracking_adapter.fastest_lap_time = function(index){
  var t = this.time_tracking_data[index]['lap_data'][0]['ms'];

  for(var i = 0; i < this.time_tracking_data[index]['lap_data'].length; i++){
    if(this.time_tracking_data[index]['lap_data'][i]['ms'] < t){
      t = this.time_tracking_data[index]['lap_data'][i]['ms'];
    }
  }

  return t;
}

time_tracking_adapter.fastest_lap_num = function(index){
  var t = this.time_tracking_data[index]['lap_data'][0]['ms'];
  var lap_num = 0;

  for(var i = 0; i < this.time_tracking_data[index]['lap_data'].length; i++){
    if(this.time_tracking_data[index]['lap_data'][i]['ms'] < t){
      t = this.time_tracking_data[index]['lap_data'][i]['ms'];
      lap_num = i;
    }
  }

  return lap_num + 1;
}

time_tracking_adapter.finish_position_for_pilot = function(pilot_index){
  var pilots_with_reached_max_laps = [];

  for(var i = 0; i < this.time_tracking_data.length; i++){
    if(this.time_tracking_data[i]['lap_data'].length == this.max_laps){
      pilots_with_reached_max_laps.push({index: i, data: this.time_tracking_data[i]});
    }
  }

  //console.log("found pilots with max laps")
  //console.log(pilots_with_reached_max_laps);

  var sorted = pilots_with_reached_max_laps.sort(function(a, b){
    return a.data.lap_data[time_tracking_adapter.max_laps-1]['ms'] - b.data.lap_data[time_tracking_adapter.max_laps-1]['ms']
  });

  //console.log("sorted");
  //console.log(sorted);

  for(var i = 0; i < sorted.length; i++){
    if(sorted[i].index == pilot_index){
      return i+1;
    }
  }

  return 0;
}
