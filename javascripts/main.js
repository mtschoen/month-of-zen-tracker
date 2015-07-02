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
	
	var startDate = new Date(2015, 6, 27, 12);
	var endDate = new Date(2015, 8, 6, 19, 17);
	
	var episodeNum = 2000;
	
	var showStartDate = new Date(1999, 1, 11);
	var showEndDate = new Date(2015, 8, 6);
	
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
		
		//Create tracker
		var content = document.getElementById("moztrack-content");
		progress = Div();
		
		var showTime = Input({},[],{"onkeyup":function(){
			var date = new Date(this.value);
			moztrack.getRealTime(date, function(date){
				realTime.value = date.format("Y-m-d H:i:s");
			});
		}});
		
		var realTime = Input({},[],{"onkeyup":function(){
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
				tx.executeSql('CREATE TABLE IF NOT EXISTS "episodes" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , "guest" VARCHAR, "date" DATETIME NOT NULL );', [],
					function(tx, results){
						//TODO: non-blocking solution
						for(var i in episodeLists){
							$.ajax({
								//Use absolute URL for local testing, Chrome blocks ajax requests to file:///
								"url":"http://mtschoen.github.io/month-of-zen-tracker/episodes/" + 1999 + ".json",
								//"url":"episodes/" + episodeLists[i] + ".json",
								"crossDomain":true,
								"async":false,
								"success":function(data){
									var query = "INSERT INTO episodes (guest,date) VALUES (?,?)"
									for(var j in data){
										data[j].date = new Date(data[j].date);
										data[j].date.setFullYear(episodeLists[i]);
										
										console.log(data[j].date.format("Y-m-d"));
										progress.innerHTML = j;
										tx.executeSql(query, [data[j].guest, data[j].date.format("Y-m-d")],
											function(tx, results){
												
											},
											function(tx, error){
												console.log(error);
												console.log(query);
												console.log(data[j].guest, data[j].date.format("Y-m-d"));
												throw error;
											}
										);
									}
								}
							});
						}
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
			console.log("Invalid show date");
			return;
		}
		db.transaction(function(tx){
			tx.executeSQL("SELECT * FROM epixodes WHERE date = ?", [date.format("Y-m-d")],
			function(tx, results){
				console.log(results);
			},
			function(tx, error){
				console.log(error);
				throw error;
			})
		});
	};
	moztrack.getShowTime = function(date){
		if(date < startDate || date > endDate){
			console.log("Invalid real date");
			return;
		}
	};
})();
