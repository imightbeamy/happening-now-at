process.env.TZ = "America/Los_Angeles";

var ical = require('ical');
var _ = require('underscore');
var mustache = require('mustache');
var moment = require('moment');
var fs = require('fs'); 
var express = require("express");
var logfmt = require("logfmt");

function isComingUp(now) {
  return function(e) {
    if (e.start && e.end) {
      var start_diff = now.diff(e.start.getTime(), 'minute'),
      end_diff   = now.diff(e.end.getTime(), 'minute');
      return  start_diff < 30 && start_diff > -60 && end_diff < -5;
    }
    return false;
  }
}

function timeId(e) {
  return moment(e.start).format('LT') + moment(e.end).format('LT');
}

var tpl = fs.readFileSync("schedule.mustache", "utf8"),
    all_events = ical.parseFile('schedule.ics'),
    app = express();

app.use(logfmt.requestLogger());
app.get('/', function(req, res) {

  var now = moment().zone(7);
  events = _.filter(all_events, isComingUp(now));
  events = _.sortBy(events, 'start');
  times  = _.uniq(_.map(events, timeId));
  events = _.map(events, function(e) {
    return {
      start_time: moment(e.start).format('LT'),
      end_time: moment(e.end).format('LT'),
      room: e.location,
      description: e.description,
      title: e.summary,
      url: e.url,
      time_class: "time-" + times.indexOf(timeId(e)),
    }
  });

  var html = mustache.to_html(tpl, {
    events: events, 
    current_time: now.format('LT')
  });

  res.send(html);
});

var port = Number(process.env.PORT || 5000);
  app.listen(port, function() {
  console.log("Listening on " + port);
});