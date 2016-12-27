var fpv_sports_api = {};

fpv_sports_api.api_token = "";

fpv_sports_api.api_host = "https://www.fpv-sports.io/"

fpv_sports_api.list_racing_events = function(callback){
    $.ajax({
        url: this.api_host+"/api/v1/racing_events",
        headers: {"Authorization": "Token " + this.api_token}
    })           
    .done(function (data) {
      callback(data);
    })
    .fail(function (jqXHR, textStatus) {
      alert("error: " + textStatus);
    });  
};

fpv_sports_api.get_race_data = function(racing_event_id,callback){
    $.ajax({
        url: this.api_host+"/api/v1/racing_events/" + racing_event_id + "/groups",
        headers: {"Authorization": "Token " + this.api_token}
    })           
    .done(function (data) {
      callback(data);
    })
    .fail(function (jqXHR, textStatus) {
      alert("error: " + textStatus);
    });  
};

fpv_sports_api.publish_results = function(racing_event_id,results,callback){
  $.ajax({
        url: this.api_host+"/api/v1/racing_events/" + racing_event_id + "/result",
        headers: {"Authorization": "Token " + this.api_token},
        method: 'POST',
        data: results,
        contentType: "application/json; charset=utf-8"
    })           
    .done(function (data) {
      callback(true,"");
    })
    .fail(function (jqXHR, textStatus) {
      console.log("error: " + textStatus);
      callback(false,textStatus);
    });
}