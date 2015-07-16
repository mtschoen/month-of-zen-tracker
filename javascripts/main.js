/**
 * @file MOZTracker main script
 * @author Matt Schoen
 * @version 0.1
 *
 * @namespace moztrack
 */
var moztrack = moztrack || {};
(function(){
	var progress;
	
	var startDate = new Date(2015, 5, 26, 12);
	var endDate = new Date(2015, 7, 6, 19, 17);
	
	var episodeNum = 2659;
	
	var showStartDate = new Date(1999, 0, 11);
	var showEndDate = new Date(2015, 8, 6);
	
	var showTime, realTime;
	
	var perEpisode = 28;
	var perEpisodeOverride = 24;
	moztrack.startOverride = new Date(2015,5,25,14,00);
	
	$(document).ready(function() {
		//Setup local DB
		moztrack.db = openDatabase('moztrack', '0.1', 'Daily show episodes', 1*1024*1024);
		//moztrack.createLocalStorage();
		//Screw it, just reset every time
		moztrack.clearLocalStorage();
		
		//Create tracker
		var content = document.getElementById("moztrack-content");
		progress = Div();
		
		content.appendChild(Div({}, ["Stream started at " + startDate]));
		content.appendChild(Div({}, ["Stream ends at " + endDate]));
		content.appendChild(Div({}, [sprintf("Stream duration: %.2f hours", (endDate - startDate) / (60 * 60 * 1000))]));
		content.appendChild(Div({}, ["Episode count: " + episodeNum]));
		perEpisode = (endDate - startDate) / episodeNum;
		content.appendChild(Div({}, [sprintf("Computed %.2f minutes per episode", ((perEpisode / (60 * 1000))))]));
		content.appendChild(Div({}, ["Episode length overridden to: " + perEpisodeOverride]));
		var realEpCount = ((endDate - startDate) / (60 * 1000) / perEpisodeOverride);
		content.appendChild(Div({}, [sprintf("Actual stream length: %.2f episodes", realEpCount)]));
		content.appendChild(Div({}, [sprintf("Skipped about %.2f episodes", (episodeNum - realEpCount))]));
		var overDiff = (startDate - moztrack.startOverride) / (24 * 60 * 1000);
		content.appendChild(Div({}, [sprintf("Start time override: " + moztrack.startOverride + ", which means %.2f/180 skipped episodes so far", overDiff)]));
		
		showTime = Input({},[],{"onkeyup":function(){
			var date = new Date(this.value);
			moztrack.getRealTime(date);
		}});
		
		realTime = Input({},[],{"onkeyup":function(){
			var date = new Date(this.value);
			moztrack.getShowTime(date);
		}});
		
		content.appendChild(Div({"style":"margin-top:25px;"},[
			Div({},[
				"Show Time: ", showTime,
				" Real Time: ", realTime
			]),
			Elm("button", {"type":"button"}, ["Reset Local Storage"], {"onclick":moztrack.clearLocalStorage}),
			progress
		]));
		
		//start on a delay for the first load
		// setTimeout(function(){
			// realTime.value = new Date().format("Y-m-d H:i:s");
			// moztrack.getShowTime(new Date());
		// }, 1500);
	});
	moztrack.createLocalStorage = function(){
		//If table exists, assume we've done this before
		doIfTableNotExist(moztrack.db, "episodes", function(){
			moztrack.db.transaction(function(tx){
				tx.executeSql('CREATE TABLE IF NOT EXISTS "episodes" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , "guest" VARCHAR, "date" DATETIME NOT NULL, "realtime" DATETIME NOT NULL );', [],
					function(tx, results){
						//TODO: non-blocking solution
						$.ajax({
							//Use absolute URL for local testing, Chrome blocks ajax requests to file:///
							"url":"http://mtschoen.github.io/month-of-zen-tracker/episodes/all.json",
							//"url":"http://mtschoen.github.io/month-of-zen-tracker/episodes/" + 1999 + ".json",
							//"url":"episodes/" + episodeLists[i] + ".json",
							"crossDomain":true,
							"async":false,
							"success":function(data){
								episodeNum = data.length - 1;	//-1 for sept11
								var perEpisode = (endDate - startDate) / episodeNum;
								
								perEpisode = perEpisodeOverride * 60 * 1000;
								var streamTime = 0;
								var query = "INSERT INTO episodes (guest,date,realtime) VALUES (?,?,?)";
								episodeNum = 0;
								console.log(moztrack.startOverride);
								for(var j in data){
									//Skip over the unaired sept11 episode
									if(data[j].extra == "sept11")
										continue;
									episodeNum++;
									data[j].date = new Date(data[j].date);
									
									progress.innerHTML = j;
									
									var realtime = moztrack.startOverride.getTime() + streamTime;
									tx.executeSql(query, [data[j].guest, data[j].date.getTime(), realtime],
										function(tx, results){
											
										},
										function(tx, error){
											console.log(error);
											console.log(query);
											console.log(data[j].guest, data[j].date.format("Y-m-d"));
											throw error;
										}
									);
									streamTime += perEpisode;
								}
							}
						});
					},
					function(tx, error){
						console.log(error);
						throw error;
					}
				);
			});
		});
	};
	moztrack.clearLocalStorage = function(){
		moztrack.db.transaction(function(tx){
			tx.executeSql("DROP TABLE IF EXISTS episodes;",[],
			function(){
				
			},
			function(tx, error){
				throw error;
			});
		});
		moztrack.createLocalStorage();
		setTimeout(function(){
			realTime.value = new Date().format("Y-m-d H:i:s");
			moztrack.getShowTime(new Date());
		}, 1000);
		ga('send', 'event', 'clearStorage');
	};
	
	function doIfTableNotExist(db, table, callback){
		db.transaction(function(tx){
			tx.executeSql("SELECT COUNT(*) FROM sqlite_master WHERE type = ? AND name = ?", ["table", table],
				function(tx, results){
					if(results.rows[0]["COUNT(*)"] == 0)
						callback();
				},
				function(tx, error){
					throw error;
				}
			);
		});
	}
	
	moztrack.getRealTime = function(date){
		if(date < showStartDate || date > showEndDate){
			console.log("Invalid show date: ", date, showStartDate);
			ga('send', 'event', 'getRealTimeInvalid', date.format("Y-m-d H:i:s"));
			return;
		}
		ga('send', 'event', 'getRealTime', date.format("Y-m-d"));
		ga('send', 'event', 'getRealTimeFull', date.format("Y-m-d H:i:s"));
		moztrack.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE date >= ? ORDER BY date LIMIT 1", [date.getTime()],
			function(tx, results){
				if(results.rows.length > 0){
					progress.innerHTML = "Guest: <a href='https://www.google.com/search?q=" + results.rows[0].guest + "'>" + results.rows[0].guest + "</a>";
					realTime.value = new Date(results.rows[0].realtime).format("Y-m-d H:i:s");
				} else {
					console.log("no results?");
				}
			},
			function(tx, error){
				console.log(error);
				throw error;
			});
		});
	};
	moztrack.getShowTime = function(date){
		if(date < startDate || date > endDate){
			console.log("Invalid real date");
			ga('send', 'event', 'getShowTimeInvalid', date.format("Y-m-d H:i:s"));
			return;
		}
		ga('send', 'event', 'getShowTimeFull', date.format("Y-m-d H:i:s"));
		moztrack.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE realtime <= ? ORDER BY date DESC LIMIT 1", [date.getTime()],
			function(tx, results){
				if(results.rows.length > 0){
					progress.innerHTML = "Guest: <a href='https://www.google.com/search?q=" + results.rows[0].guest + "'>" + results.rows[0].guest + "</a>";
					showTime.value = new Date(results.rows[0].date).format("Y-m-d");
				} else {
					console.log("no results?");
				}
			},
			function(tx, error){
				console.log(error);
				throw error;
			});
		});
	};
})();
