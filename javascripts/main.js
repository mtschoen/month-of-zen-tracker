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
	
	/**
	 * json lists of episodes (by year) 
	 */
	var episodeLists = [
		"1999"
	];
	
	$(document).ready(function() {
		moztrack.createLocalStorage();
		var content = document.getElementById("moztrack-content");
		progress = Div();
		content.appendChild(Div({},[
			"Trakcer goes here",
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
})();
