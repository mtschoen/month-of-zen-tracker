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
	
	var startDate = new Date(2015, 5, 27, 12);
	var endDate = new Date(2015, 7, 6, 19, 17);
	
	var episodeNum = 2659;
	
	var showStartDate = new Date(1999, 0, 11);
	var showEndDate = new Date(2015, 8, 6);
	
	var showTime, realTime;
	
	var perEpisode = 28;
	var perEpisodeOverride = 24;
	moztrack.startOverride = new Date(2015,5,26,11,25);
	
	$(document).ready(function() {
		//Setup local DB
		moztrack.createLocalStorage();
		
		//Create tracker
		var content = document.getElementById("moztrack-content");
		progress = Div();
		
		content.appendChild(Div({}, ["Stream started at " + startDate]));
		content.appendChild(Div({}, ["Stream ends at " + endDate]));
		content.appendChild(Div({}, ["Stream duration: " + (endDate - startDate) / (60 * 60 * 1000), " hours"]));
		content.appendChild(Div({}, ["Episode count: " + episodeNum]));
		perEpisode = (endDate - startDate) / episodeNum;
		content.appendChild(Div({}, ["Computed " + ((perEpisode / (60 * 1000)) +  " minutes per episode")]));
		content.appendChild(Div({}, ["Episode length overridden to: " + perEpisodeOverride]));
		content.appendChild(Div({}, ["Using start time: " + moztrack.startOverride]));
		
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
				"Real Time: ", realTime
			]),
			Elm("button", {"type":"button"}, ["Reset Local Storage"], {"onclick":moztrack.clearLocalStorage}),
			progress
		]));
		content.appendChild(Div({"style":"margin-top:25px;"},[
			"The math is still not perfect. I'm thinking that they cut some episodes from the stream, or that the problem has something to do with my data set.  We'll see how far off it drifts over time.  I timed the episodes from the stream at 24 minutes even, meaning that about 240 episodes were cut.  But which ones?!  I've introduced a start offset to try to account for this.  It will probably have to be adjusted over time unless I can fix the dataset.",
			Br(),
			"Feel free to ", A({"href":"mailto:matt@matt-schoen.com"}, ["contact me"]), " with questions or corrections, or fork this project on github!"
		]));
		
		//start on a delay for the first load
		setTimeout(function(){
			realTime.value = new Date().format("Y-m-d H:i:s");
			moztrack.getShowTime(new Date());
		}, 1500);
	});
	moztrack.createLocalStorage = function(){
		moztrack.db = openDatabase('moztrack', '0.1', 'Daily show episodes', 1*1024*1024);
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
			return;
		}
		moztrack.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE date >= ? ORDER BY date LIMIT 1", [date.getTime()],
			function(tx, results){
				if(results.rows.length > 0){
					progress.innerHTML = "Guest: " + results.rows[0].guest;
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
			return;
		}
		moztrack.db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE realtime <= ? ORDER BY date DESC LIMIT 1", [date.getTime()],
			function(tx, results){
				if(results.rows.length > 0){
					progress.innerHTML = "Guest: " + results.rows[0].guest;
					showTime.value = new Date(results.rows[0].date).format("Y-m-d H:i:s");
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
