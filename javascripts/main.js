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
	
	/**
	 * Pages on wikipedia with episode guides 
	 */
	var wikiPages = [
		"http://en.wikipedia.org/wiki/List_of_The_Daily_Show_episodes_(1999)"
	];
	
	$(document).ready(function() {
		moztrack.createLocalStorage();
		var content = document.getElementById("moztrack-content");
		content.appendChild(Div({},[
			"Trakcer goes here",
			Elm("button", {"type":"button"}, ["Reset Local Storage"], {"onclick":moztrack.clearLocalStorage})
		]));
	});
	moztrack.createLocalStorage = function(){
		db = openDatabase('moztrack', '0.1', 'Daily show episodes', 1*1024*1024);
		//If table exists, assume we've done this before
		doIfTableNotExist(db, "episodes", function(){
			db.transaction(function(tx){
				tx.executeSql('CREATE TABLE IF NOT EXISTS "episodes" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL  UNIQUE , "guest" VARCHAR, "date" DATETIME NOT NULL );', [],
					function(tx, results){
						for(var i in wikiPages){
							var episodes = scrapeWikiPage(wikiPages[i]);
							console.log(episodes);
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
			tx.executeSql("DROP TABLE IF EXISTS episodes;");
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
	
	/**
	 * Scrape a page and return an array of episodes
 	 * @param {Object} url
	 */
	function scrapeWikiPage(url){
		$.ajax(url);
		console.log($("#hidden"));
	}
})();
