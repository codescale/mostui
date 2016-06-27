var io = io();
var Stats = {
  cache: {},
  getCache: function (chart) {
    var index = chart.id;
    if (!Stats.cache[index]) {
      Stats.cache[index] = {
        update: 0,
        insert: 0,
        delete: 0,
        query: 0,
        getmore: 0,
        command: 0
      }
    };
    return Stats.cache[index];
  },
  updateStats: function (chart) {
    // If the Charts-Element is initialized it contains data
    if (chart._chart) {

      if (!chart._chart.series) {
        return;
      }

      var stats = this;
      var index = "pushData";
      var time = new Date().getTime();
      var cache = Stats.getCache(chart);

      chart[index](time, stats.opcounters.update - cache.update, 1);
      chart[index](time, stats.opcounters.insert - cache.insert, 2);
      chart[index](time, stats.opcounters.delete - cache.delete, 3);
      chart[index](time, stats.opcounters.query - cache.query, 4);
      chart[index](time, stats.opcounters.getmore - cache.getmore, 5);
      chart[index](time, stats.opcounters.command - cache.command, 6);

      cache.update = stats.opcounters.update;
      cache.insert = stats.opcounters.insert;
      cache.delete = stats.opcounters.delete;
      cache.query = stats.opcounters.query;
      cache.getmore = stats.opcounters.getmore;
      cache.command = stats.opcounters.command;
    }
  }
};

io.on('connect', function () {
  console.log('Connected to Web-Socket');
});
io.on('event', function (data) {
  console.log('event: ' + data);
});
io.on('mongostat', function (url, stats) {

  // Log statistics
  //  console.log('JSON: ' + JSON.stringify(stats.opcounters));

  // Get all Chart-Elements
  var charts = document.getElementsByName(url);
  charts.forEach(Stats.updateStats, stats);
});

$("#addServer").submit(function (event) {
  // Prevent the usual submit behavior
  event.preventDefault();

  var url = $(this).find("[name=url]").val();
  $.post('addServer', {
    url: url
  }, function () {
    console.log('Sucess');
  }).done(function () {}).fail(function () {});

  io.emit('registerForMongostat', url);
});

$('.server').click(function serverClicked() {
  $.post('removeServer', {
    url: $(this).text()
  }, function () {
    console.log('Sucess');
    location.reload();
  }).done(function () {}).fail(function () {});
});