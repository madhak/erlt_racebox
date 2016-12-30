const version_str = "0.8b2"
const const_scanning_table_channel_index = 1;
const const_scanning_table_channel_strength = 2;
const const_time_tracking_channel_index = 1;
const const_time_tracking_channel_ms = 2;

var connection = new SerialConnection();
var time_tracking_data = [];
var scanning_data = [];
var connected = false;
var debug_mode = false;
var current_rssi_signal_strength = 0;
var time_tracking_enabled = false;
var fpv_sports_current_race_data = null;

var current_com_port = "";

var realtime_clock = $('.realtime-clock').FlipClock({
  autoStart: false,
  clockFace: 'MinuteCounter',
});

document.title = "EasyRaceLapTimer RaceBox v"+ version_str +" by AirBirds.de";

function build_menu_bar(){
  // Create an empty menubar
  var menu = new nw.Menu({type: 'menubar'});

  // Create a submenu as the 2nd level menu
  var submenu = new nw.Menu();
  mi_save_timing_data = new nw.MenuItem({ label: 'Export timing data to JSON' });
  mi_save_timing_data.click = save_timing_data;

  submenu.append(mi_save_timing_data);

  // Create and append the 1st level menu to the menubar
  menu.append(new nw.MenuItem({
    label: 'File',
    submenu: submenu
  }));

  var debug_sub_menu = new nw.Menu();
  mi_generate_sample_data = new nw.MenuItem({ label: 'generate sample data' });
  mi_generate_sample_data.click = fill_sample_time_data;
  debug_sub_menu.append(mi_generate_sample_data);

  menu.append(new nw.MenuItem({
    label: 'Debug',
    submenu: debug_sub_menu
  }));
  
  // Assign it to `window.menu` to get the menu displayed
  nw.Window.get().menu = menu;
}

function load_channel_data_for_sensors(){

  for(var c= 1; c <= 8; c++){
    var channel_select = document.getElementById("rb_settings_sensor_"+c+"_channel");
    channel_select.innerHTML = '';

    var html_data = '';
    for(var i = 0; i < channel_data.length; i++){
        html_data = html_data +'<option value="'+ i +'">' + channel_data[i] + '</option>';
    }

    html_data = html_data +'<option value="">Custom Frequency</option>';
    channel_select.innerHTML = html_data;
  }
}

function show_message(msg){
  $("#message_box").show();
  $("#message_box_content").html(msg);
}

$("#btn_message_box_close").click(function(){
  $("#message_box").hide();
});

function fill_sample_time_data(){
  for(var i = 0; i < time_tracking_adapter.listing().length; i++){
    for(var x = 0; x < 6; x++){
      if(Math.floor((Math.random() * 10) + 1) > 5){
        push_time_tracking_data(i, 1000 + (i*(200 + x)),Date.now);
      }
    }
  }
}

function push_time_tracking_data(pilot_index,ms,ts){
  time_tracking_adapter.push_time_tracking_data(pilot_index,ms,ts);
  update_time_tracking_table();
}

function convertMSToTimeString(input){
  var input_total = parseFloat(input);
  var t = input_total / 1000.0;

  return t.toFixed(2) + " seconds";
}

function convertRSSIToPercent(rssi_strength){
  return (parseFloat(rssi_strength) / 255.0) * 100.0
}

function playBeep(){
  var myAudio = new Audio();
  myAudio.src = "sfx/beep.mp3";
  myAudio.play();
}

function convertMStoKmh(input){
  var input_total = parseFloat(input);
  var t = input_total / 1000.0;

  var track_length = parseFloat($("#input_track_length").val());

  if(track_length > 0) {

      var km_h = (track_length / t) * 3.6;
      return km_h.toFixed(2) + " km/h";
  }

  return "";
}



function log(msg) {
  if(debug_mode == true){
    var buffer = document.querySelector('#serial_output');
    buffer.innerHTML += msg + '<br/>';
  }
  console.log(msg);
}

/* resets data */
function reset_time_tracking_data(){
  time_tracking_adapter.reset();
  update_time_tracking_table();
  $("#serial_output").html(""); // clear the logs
}

function waitForIO(writer, callback) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();
  // wait for a few seconds
  var reentrant = function() {
    if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
      setTimeout(reentrant, 100);
      return;
    }
    if (writer.readyState===writer.WRITING) {
      console.error("Write operation taking too long, aborting!"+
        " (current writer readyState is "+writer.readyState+")");
      writer.abort();
    }
    else {
      callback();
    }
  };
  setTimeout(reentrant, 100);
}

/* Function play beep countdown */
function play_beep_count(){
  var Beep_count = document.createElement("audio");
  Beep_count.src="./sfx/Beep_count.wav";
  Beep_count.volume=1.00;
  Beep_count.autoPlay=false;
  Beep_count.preLoad=true;
  Beep_count.play();
}


/*Function play beep start*/
function play_beep_start(){
  var Beep_start = document.createElement("audio");
  Beep_start.src="./sfx/Beep_start.wav";
  Beep_start.volume=1.00;
  Beep_start.autoPlay=false;
  Beep_start.preLoad=true;
  Beep_start.play();
}

/* Function Start random countdown */
function start_random_countdown(){
  var rand = Math.floor(Math.random() * 4) + 3;
    
  var t = 3 + rand;
  for(var i=3; i<=t; i++){
    setTimeout(play_beep_count(), 1000);
  } 
  
  setTimeout(play_beep_start(), 1000);
}


connection.onConnect.addListener(function() {
  log('connected');
});

connection.onReadLine.addListener(function(data) {
  console.log(data);
  data = data.replace("\r","");
  data = data.replace("#","");
  var cmd_data = data.replace("\n","").split(" ");

  log("------------------");
  log('data: ' + cmd_data);
  log("cmd: \"" + cmd_data[0]+ "\"");
  console.log("cmd: <" + cmd_data[0]+ ">");

  if(cmd_data[0] == "VTX_SENSOR"){ // showing firmware version
    $("#firmware_version").html(cmd_data[1]);
  }

  if(cmd_data[0] == "GRSSIS"){
    process_inc_saved_rssi_strength(cmd_data);
  }

  if(cmd_data[0] == "CRSSIS"){
    process_inc_current_rssi_strength(cmd_data);
  }

  if(cmd_data[0] == "GMLT"){
    process_inc_min_lap_time(cmd_data);
  }

  if(cmd_data[0] == "TT_CH"){
    if(time_tracking_enabled === true){
      process_inc_time_tracking(cmd_data);
    }
  }

  if(cmd_data[0] == "GSSS"){
      process_inc_smart_sense_strength(cmd_data);
  }
  if(cmd_data[0] == "GSSCO"){
      process_inc_smart_sense_cut_off(cmd_data);
  }

  if(cmd_data[0] == "CHANNEL"){
    process_inc_vtx_channel(cmd_data);
  }

});

var save_timing_data = function(){

 chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName:"race_box_export.json",accepts:[{extensions: ['json']}]}, function(theEntry) {
   if(chrome.runtime.lastError) {
    // Something went wrong
    console.warn("Whoops.. " + chrome.runtime.lastError.message);
    // Maybe explain that to the user too?
   }

   if (!theEntry) {
     console.log("nö");
     return;
   }
   // use local storage to retain access to this file
   //chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
   theEntry.createWriter(function(writer) {
     var d = time_tracking_adapter.results_for_saving();
     var blob = new Blob([d], {type: 'text/plain'});

    writer.onerror = function(e){console.log(e)};
    writer.onwriteend = function(){};


    writer.truncate(blob.size);
    waitForIO(writer, function() {
        writer.seek(0);
        writer.write(blob);
      });
   });
 });
}

function start_race_session(){
  
  realtime_clock.reset();
  realtime_clock.start(function(){});
  connection.send("RST_TIMING\n");
  $("#button_start_race").hide();
  $('#checkbox_random_startup').hide();
  $("#button_start_fpv_sports_io_race").hide();
  $("#button_stop_race").show();

  if($("#checkbox_random_startup").is(':checked')) {
     //checked
     start_random_countdown();
 }

  time_tracking_enabled = true;

  time_tracking_adapter.reset();
  reset_time_tracking_data();
  update_time_tracking_table();
}

function stop_race_ression(){
  realtime_clock.stop();
  $("#button_start_race").show();
  $("#button_start_fpv_sports_io_race").show();
  $('#checkbox_random_startup').show();
  $("#button_stop_race").hide();

  time_tracking_enabled = false;

  database.addRaceResults(time_tracking_adapter.time_tracking_data); // adding the data to the database for later usage

  // publish data to fpv-sports
  if(fpv_sports_current_race_data != null){
    var racing_event_id = $("#fpv_sports_racing_events").val();
    data = time_tracking_adapter.fpv_sports_results(fpv_sports_current_race_data);
    fpv_sports_api.publish_results(racing_event_id,data,function(success,msg){
      if(success){
        show_message("successfully pushed data to FPV-SPORTS.IO");
      }else{
        show_message("FAILED to pushed data to FPV-SPORTS.IO: " + msg);
      }
    });
  }
}

function process_inc_vtx_channel(data){
  var channel_select = document.getElementById("rb_settings_sensor_"+data[1]+"_channel");
  if(channel_select != null){
    var c = parseInt(data[2]);
    console.log("received channel " + c + " for sensor " + data[1]);

    if(c > 100){
      console.log("setting custom select");
      $('#rb_settings_sensor_'+data[1]+'_channel option:last-child').val(c);
      $('#rb_settings_sensor_'+data[1]+'_channel option:last-child').html("Custom: " + c + " Mhz");
      $('#rb_settings_sensor_'+data[1]+'_channel option:last-child').prop('selected', true);
    }else{
      channel_select.selectedIndex = c;
    }
    
  }
}

function process_inc_time_tracking(data){
  var channel = parseInt(data[1]) - 1;
  var ms = data[2];
  var timestamp = Date.now();

  push_time_tracking_data(channel,ms,timestamp);
  playBeep();
}

function update_time_tracking_table(){
  var html = "";

  var data = time_tracking_adapter.listing()
  for(var channel = 0; channel < 8; channel++){
    var t = data[channel];

    var t_html = "<tr>";
    var t_html = t_html + "<td>" + t['position'] + "</td>";
    var t_html = t_html + "<td>" + t['pilot_name'] + "</td>";


    for(var l = 0; l < t['lap_data'].length; l++){
      var t_html = t_html + "<td>" + convertMSToTimeString(t['lap_data'][l]['ms']) + "</td>";
    }

    var t_html = t_html + "</tr>";
    html = html + t_html;
  }
  $("#time_tracking_table_body").html(html);

}

function process_inc_smart_sense_strength(data){
  $("#rb_settings_sensor_"+ data[1] + "_smart_sense_strength").val(data[2]);
}

function process_inc_smart_sense_cut_off(data){
  $("#rb_settings_sensor_"+ data[1] + "_smart_sense_cut_off").val(data[2]);
}

function process_inc_min_lap_time(data){
  $("#rb_settings_sensor_"+ data[1] + "_min_lap_time").val(data[2]);
}


function process_inc_saved_rssi_strength(data){
  $("#rb_settings_sensor_"+ data[1] + "_saved_rssi").val(data[2]);
}

function process_inc_current_rssi_strength(data){
  $("#rb_settings_sensor_"+ data[1] + "_current_rssi").val(data[2]);
}

$("#button_connect").click(function(){
    current_com_port = $("#select_serial_port").val();
    connection.connect(current_com_port);
});

connection.onConnect.addListener(function(){
  connected = true;
  $("#connect_panel").hide();
  $("#control_panel").show();
  document.getElementById("connected_to_device").innerHTML = current_com_port;
  console.log("successfully connected");
  connection.send("INFO\n");
});

function setup_race_data_by_fpv_sports_race_data(data){
  fpv_sports_current_race_data = data;

  for(var i = 0; i < fpv_sports_current_race_data.pilots.length; i++){
    time_tracking_adapter.time_tracking_data[i].pilot_name = fpv_sports_current_race_data.pilots[i].pilot_name;
    time_tracking_adapter.time_tracking_data[i].fpv_sports_pilot_id = fpv_sports_current_race_data.pilots[i].pilot_id;

  }


  update_time_tracking_table();
}

function setDefaultChannelForSensor(sensor){
   var t = "S_VTX_CH " + sensor +  31;
   connection.send(t);
   console.log(t);
}

function setDefaultSmartSenseCutOffForSensor(sensor){
  var t = "SLAVES_SS_SCO " + sensor + " 10 \n";
  connection.send(t);
  console.log(t);
}

function reset_sensor_to_default_value(sensor){
  console.log("reset_sensor_to_default_value " + sensor);
  setDefaultChannelForSensor(sensor);
  
  window.setTimeout(function(){
    setDefaultSmartSenseCutOffForSensor(sensor);
  },500);
  

  if(sensor < 8){
    window.setTimeout(function(){
      reset_sensor_to_default_value(sensor +1)
    }, 1000);
  }
  
 
}

// EVENT HANLDER FOR GUI
$("#button_read_saved_rssi_strength").click(function(){
  connection.send("SLAVES_RSSI_STRENGTH\n");
});

$("#button_read_current_rssi_strength").click(function(){
  connection.send("SLAVES_CRSSI_STRENGTH\n");
});

$("#button_read_min_lap_time").click(function(){
  connection.send("SLAVES_MLT\n");
});

$(".btn_set_saved_rssi_strength").click(function(){
  connection.send("S_VTX_STR " + $(this).attr("rel") + " "+$("#rb_settings_sensor_"+$(this).attr("rel")+"_saved_rssi").val() +"\n");
  show_message("rssi strength saved");
}),

$(".btn_set_smart_sense_cut_off").click(function(){
  connection.send("SLAVES_SS_SCO " + $(this).attr("rel") + " "+$("#rb_settings_sensor_"+$(this).attr("rel")+"_smart_sense_cut_off").val() +"\n");
  show_message("SmartSense cut off saved");
});

$(".btn_set_channel").click(function(){
  var t = "S_VTX_CH " + $(this).attr("rel") + " "+$("#rb_settings_sensor_"+$(this).attr("rel")+"_channel").val() +"\n";
  console.log(t);
  connection.send(t);
  show_message("Channel saved");
});

$("#button_set_min_lap_time").click(function(){
  connection.send("SLAVES_SET_MLT "+ $("#input_min_lap_time").val()+"\n");
  show_message("min lap time saved");
});

$("#button_read_saved_channels").click(function(){
  connection.send("SLAVE_CHANNELS");
})

$("#button_disconnect").click(function(){
  connection.disconnect();
  $("#connect_panel").show();
  $("#control_panel").hide();
});

$("#button_reset_timing_data").click(function(){
  connection.send("RESET_TTIMES\n");
  show_message("timing data resetted");
});

if(debug_mode == true){
  $("#container_serial_output").show();
}

$("#button_start_race").click(function(){
  start_race_session();
});

$("#button_stop_race").click(function(){
  stop_race_ression();
});

$("#button_set_default_values").click(function(){
  reset_sensor_to_default_value(1);
});

$("#btn_fetch_fpv_sports_racing_events").click(function(){
  fpv_sports_api.list_racing_events(function(data){
    var h = '';

    for(var i = 0; i < data.length; i++){
      var h = h+"<option value="+data[i]['id']+">"+data[i]['title']+"</option>";
    }
    $("#fpv_sports_racing_events").html(h);
  });
});

$("#button_start_fpv_sports_io_race").click(function(){
  var racing_event_id = $("#fpv_sports_racing_events").val();
  fpv_sports_api.get_race_data(racing_event_id,function(data){
    start_race_session();
    setup_race_data_by_fpv_sports_race_data(data);
    //$("#button_start_fpv_sports_io_race").hide();
  });
})

$("#button_read_smart_sense").click(function(){
  connection.send("SLAVES_SS_GS\n");
})

$("#button_read_smart_sense_cutt_off").click(function(){
  connection.send("SLAVES_SS_GCO\n");
})

$(".btn_set_custom_channel").click(function(){
  var freq = prompt("Please enter Mhz frequency for the custom channel");

  var t = "S_VTX_CH " + $(this).attr("rel") + " "+ freq +"\n";
  console.log(t);
  connection.send(t);
  show_message("Custom Channel saved");
});

$("#fpv_sports_api_token").change(function(){
   chrome.storage.sync.set({
    fpv_sports_api_token: $(this).val()
  }, function() {
    console.log("saved token");
  });

  fpv_sports_api.api_token = $(this).val();
});

$("#setting_max_laps").change(function(){
  chrome.storage.sync.set({
    setting_max_laps: $(this).val()
  }, function() {
    console.log("saved token");
  });

  time_tracking_adapter.max_laps = $(this).val();
});

$("#btn_list_past_races").on("click",function(){
  database.pouch_db.allDocs({include_docs: true, descending: true}, function(err, doc) {
    document.getElementById("past_races_container").innerHTML = "";
    for(var row = 0; row < doc.rows.length; row++){
      
      var header = document.createElement("h2");
      header.innerHTML = moment(doc.rows[row].doc._id).format('MMMM Do YYYY, h:mm:ss a');
      document.getElementById("past_races_container").appendChild(header);

      var table = document.createElement("table");
      table.className = "table table-striped table-bordered";

      var html = "";
      html = html + '<thead><tr><th>Pos</th><th>Pilot</th><th>Lap 1</th><th>Lap 2</th><th>Lap 3</th><th>Lap 4</th><th>Lap 5</th><th>Lap 6</th></tr></thead><tbody>';
      for(var channel = 0; channel < 8; channel++){
        var t = doc.rows[row].doc.race_data[channel];

        var t_html = "<tr>";
        var t_html = t_html + "<td>" + t['position'] + "</td>";
        var t_html = t_html + "<td>" + t['pilot_name'] + "</td>";


        for(var l = 0; l < t['lap_data'].length; l++){
          var t_html = t_html + "<td>" + convertMSToTimeString(t['lap_data'][l]['ms']) + "</td>";
        }

        var t_html = t_html + "</tr>";
        html = html + t_html;
      }

      table.innerHTML = html + "</tbody>";
      document.getElementById("past_races_container").appendChild(table);
    }
  });

});

// initializing everything
reset_time_tracking_data();
load_channel_data_for_sensors();
build_menu_bar();
database.init();

// reading stored values
chrome.storage.sync.get({
    fpv_sports_api_token: '',
    setting_max_laps: 4
  }, function(items) {
    $("#fpv_sports_api_token").val(items.fpv_sports_api_token);
    fpv_sports_api.api_token = items.fpv_sports_api_token;
    $("#setting_max_laps").val(items.setting_max_laps);
});

chrome.serial.getDevices(function(ports){
  var html = "";
  for (var i=0; i<ports.length; i++) {
    html += '<option value="'+ports[i].path+'">'+ ports[i].path+'</option>';
  }
  $("#select_serial_port").html(html);
});
