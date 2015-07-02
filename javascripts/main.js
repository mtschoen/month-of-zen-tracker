/**
 * @file MOZTracker main script
 * @author Matt Schoen
 * @version 0.1
 *
 * @namespace moztrack
 */
var moztrack = moztrack || {};
(function(){
	var db;
	var progress;
	
	var startDate = new Date(2015, 5, 27, 12);
	var endDate = new Date(2015, 7, 6, 19, 17);
	
	var episodeNum = 2659;
	
	var showStartDate = new Date(1999, 0, 11);
	var showEndDate = new Date(2015, 7, 6);
	
	var showTime, realTime;
	
	/**
	 * json lists of episodes (by year) Data copied from Wikipedia, and converted with
	 * Google Docs and http://www.convertcsv.com/csv-to-json.htm
	 */
	var episodeLists = [
		"1999"
	];
	
	$(document).ready(function() {
		//Setup local DB
		moztrack.createLocalStorage();
		
		console.log("Stream started at ", startDate);
		console.log("Stream ends at ", endDate);
		console.log("Stream duration: ", (endDate - startDate) / (60 * 60 * 1000), " hours");
		var perEpisode = (endDate - startDate) / episodeNum;
		console.log((perEpisode / (60 * 1000)) +  " minutes per episode");
		
		//Create tracker
		var content = document.getElementById("moztrack-content");
		progress = Div();
		
		showTime = Input({},[],{"onkeyup":function(){
			var date = new Date(this.value);
			moztrack.getRealTime(date, function(date){
				realTime.value = date.format("Y-m-d H:i:s");
			});
		}});
		
		realTime = Input({},[],{"onkeyup":function(){
			var date = new Date(this.value);
			moztrack.getShowTime(date, function(date){
				showTime.value = date.format("Y-m-d H:i:s");
			});
		}});
		
		content.appendChild(Div({},[
			Div({},[
				"Show Time: ", showTime,
				"Real Time: ", realTime
			]),
			Elm("button", {"type":"button"}, ["Reset Local Storage"], {"onclick":moztrack.clearLocalStorage}),
			progress
		]));
	});
	moztrack.createLocalStorage = function(){
		db = openDatabase('moztrack', '0.1', 'Daily show episodes', 1*1024*1024);
		//If table exists, assume we've done this before
		doIfTableNotExist(db, "episodes", function(){
			db.transaction(function(tx){
				tx.executeSql('CREATE TABLE IF NOT EXISTS "episodes" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , "guest" VARCHAR, "date" DATETIME NOT NULL, "realtime" DATETIME NOT NULL );', [],
					function(tx, results){
						//TODO: non-blocking solution
						$.ajax({
							//Use absolute URL for local testing, Chrome blocks ajax requests to file:///
							"url":"http://mtschoen.github.io/month-of-zen-tracker/episodes/all.json",
							//"url":"http://mtschoen.github.io/month-of-zen-tracker/episodes/" + 1999 + ".json",
							//"url":"episodes/" + episodeLists[i] + ".json",
							"crossDomain":true,
							"success":function(data){
								episodeNum = data.length - 1;	//-1 for sept11
								var perEpisode = (endDate - startDate) / episodeNum;
								var streamTime = 0;
								var query = "INSERT INTO episodes (guest,date,realtime) VALUES (?,?,?)";
								episodeNum = 0;
								for(var j in data){
									if(data[j].extra == "sept11")
										continue;
									episodeNum++;
									data[j].date = new Date(data[j].date);
									
									progress.innerHTML = j;
									
									var realtime = new Date(startDate.getTime() + streamTime);
									tx.executeSql(query, [data[j].guest, data[j].date.format("Y-m-d"), realtime],
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
		db.transaction(function(tx){
			tx.executeSql("DROP TABLE IF EXISTS episodes;",[],
			function(){
				
			},
			function(tx, error){
				throw error;
			});
		});
		moztrack.createLocalStorage();
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
		db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE date = ?", [date.format("Y-m-d")],
			function(tx, results){
				console.log(results);
				if(results.rows.length > 0){
					//realTime.value = new Date(startDate.getTime() + results.rows[0].startms).format("Y-m-d H:i:s");
					realTime.value = results.rows[0].realtime;
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
		db.transaction(function(tx){
			tx.executeSql("SELECT * FROM episodes WHERE date = ?", [date.format("Y-m-d")],
			function(tx, results){
				console.log(results);
				if(results.rows.length > 0){
					realTime.value = new Date(startDate.getTime() + results.rows[0].startms).format("Y-m-d H:i:s");
				} else {
					console.log("no results?");
				}
			},
			function(tx, error){
				console.log(error);
				throw error;
			});
		})
	};
})();
