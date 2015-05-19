function emptyData() {
    // generate an array with default values
    var data = [],
        now = new Date().getTime();

    for (var i = 0; i < 160; i += 1) {
        data.push({
            x: now,
            y: 0
        });
    }
    return data;
}

function loadChart(host, port) {
    var containerId = host.replace(/\./g, "-") + "_" + port;

    // Define the chart obj which will be returned
    chart = {
        id: containerId
    };

    // Add a container
    container = document.createElement("div");
    container.id = containerId;
    container.className = "container";
    $('#charts').append(container);
    container = $('#' + containerId);

    // Add the text-statistic
    container.append("<div>");
    textStat = container.find("div");
    textStat.append('<p class="update">');
    textStat.append('<p class="insert">');
    textStat.append('<p class="query">');
    textStat.append('<p class="delete">');
    textStat.append('<p class="getmore">');
    textStat.append('<p class="pageFaults">');
    textStat.append('<a href="" alt="Close" class="closeChart">| x </a>');

    // Add statistics container
    statContainer = document.createElement("div");
    statContainer.className = "statistics";
    container.append(statContainer);
    statContainer = container.find(".statistics");

    // Add the chart
    statContainer.append('<div class="chart">');

    // Add the currentOps
    statContainer.append("<div class='currentOps'>");
    statContainer.find('.currentOps').append('<table class="display" cellspacing="0" width="420px">');

    $('div#' + containerId).find("table").dataTable({
        "order": [[3, 'desc']],
        "autoWidth": false,
        "scrollY": 100,
        "paging": false,
        "columns": [{
            "title": "opid",
            "width": "90px"
 }, {
            "title": "operation",
            "width": "90px"
 }, {
            "title": "ns",
            "width": "90px"
 }, {
            "title": "seconds",
            "width": "80px"
 }]
    });
    var dataTable = $('div#' + containerId).find("table").DataTable();
    dataTable.draw();

    var isCurrentOpsRequested = 0;
    currentOpIntervalId = setInterval(function () {
        // If we already requested the current ops
        // but there was no response yet. We just skip the new request
        if (isCurrentOpsRequested > 0) {
            --isCurrentOpsRequested;
            return;
        }
        isCurrentOpsRequested = 10;
        $.ajax({
            dataType: "json",
            timeout: 3000,
            url: "currentOps/" + host + "/" + port,
            success: function (ops) {

                isCurrentOpsRequested = 0;

                dataTable.rows().remove().draw();

                var tbl_body = "";
                var odd_even = false;
                for (var i = 0; i < ops.length; i++) {

                    opid = ops[i].opid;
                    op = ops[i].op;
                    ns = ops[i].ns;
                    secs_running = ops[i].secs_running;

                    if (!secs_running || secs_running < 1) {
                        continue;
                    }
                    dataTable.row.add([opid, op, ns, secs_running]).draw();
                }
            }
        });
    }, 5000);
    chart.currentOpIntervalId = currentOpIntervalId;

    $('div#' + containerId).find(".chart").highcharts({
        chart: {
            type: 'line',
            animation: false,
            events: {
                load: function () {
                    // set up the updating of the chart each second
                    var seriesUpdate = this.series[0];
                    var seriesInsert = this.series[1];
                    var seriesQuery = this.series[2];
                    var seriesDelete = this.series[3];
                    var seriesGetmore = this.series[4];
                    var seriesPageFaults = this.series[5];

                    var isStatRequested = 0;
                    mongoStatIntervalId = setInterval(function () {
                        // If we already requested the statistics
                        // but there was no response yet. We just skip the new request
                        if (isStatRequested > 0) {
                            --isStatRequested;
                            return;
                        }

                        isStatRequested = 10;
                        $.ajax({
                            dataType: "json",
                            timeout: 3000,
                            url: "mongoStat/" + host + "/" + port,
                            success: function (data) {
                                // We received a response
                                isStatRequested = 0;

                                // Update statistics
                                $('div#' + containerId).find(".update").text("update: " + data.update);
                                $('div#' + containerId).find(".insert").text("insert: " + data.insert);
                                $('div#' + containerId).find(".query").text("query: " + data.query);
                                $('div#' + containerId).find(".delete").text("delete: " + data.delete2);
                                $('div#' + containerId).find(".getmore").text("getmore: " + data.getmore);
                                $('div#' + containerId).find(".pageFaults").text("pageFaults: " + data.pageFaults);

                                var t = new Date().getTime();
                                seriesUpdate.addPoint([t, data.update], true, true);
                                seriesInsert.addPoint([t, data.insert], true, true);
                                seriesQuery.addPoint([t, data.query], true, true);
                                seriesDelete.addPoint([t, data.delete2], true, true);
                                seriesGetmore.addPoint([t, data.getmore], true, true);
                                seriesPageFaults.addPoint([t, data.pageFaults], true, true);
                            }
                        });
                    }, 1000);
                    chart.mongoStatIntervalId = mongoStatIntervalId;
                }
            }
        },
        title: {
            text: "MongoDB (" + host + ":" + port + ")"
        },
        legend: {
            layout: "vertical",
            align: "left",
            verticalAlign: "middle"
        },
        xAxis: {
            type: 'datetime',
        },
        yAxis: {
            min: 0
        },
        series: [{
            name: 'update',
            data: emptyData()
 }, {
            name: 'insert',
            data: emptyData()
 }, {
            name: 'query',
            data: emptyData()
 }, {
            name: 'delete',
            data: emptyData()
 }, {
            name: 'getmore',
            data: emptyData()
 }, {
            name: 'pageFaults',
            data: emptyData()
 }]
    });

    return chart;
};