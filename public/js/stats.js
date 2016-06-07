var io = io();
var Stats = {
  cache: {
    update: 0,
    insert: 0,
    delete: 0,
    query: 0,
    getmore: 0,
    command: 0
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

  // Get the Charts-Element
  var chart = document.getElementById(url);
  if (!chart) {
    return;
  }

  // If the Charts-Element is initialized it contains data
  if (chart._chart) {

    if (chart._chart.series && chart._chart.series.length < 7) {
      return;
    }

    var index = "pushData";
    var time = new Date().getTime();

    chart[index](time, stats.opcounters.update - Stats.cache.update, 1);
    chart[index](time, stats.opcounters.insert - Stats.cache.insert, 2);
    chart[index](time, stats.opcounters.delete - Stats.cache.delete, 3);
    chart[index](time, stats.opcounters.query - Stats.cache.query, 4);
    chart[index](time, stats.opcounters.getmore - Stats.cache.getmore, 5);
    chart[index](time, stats.opcounters.command - Stats.cache.command, 6);

    Stats.cache.update = stats.opcounters.update;
    Stats.cache.insert = stats.opcounters.insert;
    Stats.cache.delete = stats.opcounters.delete;
    Stats.cache.query = stats.opcounters.query;
    Stats.cache.getmore = stats.opcounters.getmore;
    Stats.cache.command = stats.opcounters.command;
  }
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