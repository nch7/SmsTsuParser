var http = require('http');
var async = require('async');
var cheerio = require('cheerio');
var fs = require('fs');
var querystring = require('querystring');
var options = {
  host: 'sms.tsu.ge',
  path: '/sms/Students/StudentMain.aspx'
};

var firstname = "სახელი";
var lastname = "გვარი";
var password= "პაროლი";

var req = http.get(options, function(res) {
  // console.log('STATUS: ' + res.statusCode);
  // console.log('HEADERS: ' + JSON.stringify(res.headers));

  // Buffer the body entirely for processing as a whole.
  var bodyChunks = [];
  res.on('data', function(chunk) {
    // You can process streamed parts here...
    bodyChunks.push(chunk);
  }).on('end', function() {
    var body  = Buffer.concat(bodyChunks);
    $ = cheerio.load(body);
    var viewstate = $('input[name="__VIEWSTATE"]').val();
    var viewstategen = $('input[name="__VIEWSTATEGENERATOR"]').val();
    var eventval = $('input[name="__EVENTVALIDATION"]').val();

    async.waterfall([
    	function(callback){
    		var postData = querystring.stringify({
			  '__EVENTTARGET' : '',
			  '__EVENTARGUMENT' : '',
			  '__VIEWSTATE': viewstate,
			  '__VIEWSTATEGENERATOR' : viewstategen,
			  '__EVENTVALIDATION': eventval,
			  'ctl00$ContentPlaceHolder1$NameText': firstname,
			  'ctl00$ContentPlaceHolder1$FumilyText':lastname,
			  'ctl00$ContentPlaceHolder1$PasswordText':password,
			  'ctl00$ContentPlaceHolder1$LogIn':'შესვლა'
			});
    		var options2 = {
			  host: 'sms.tsu.ge',
			  path: '/sms/Students/StudentMain.aspx',
			  method: 'POST',
			  headers: {
			    'Content-Type': 'application/x-www-form-urlencoded',
			    'Content-Length': postData.length,
			    'connection': 'keep-alive'
			  }
			};


			var req = http.request(options2, function(res){
					// console.log('STATUS',res.statusCode);
					// console.log(res.headers);
					callback(null ,JSON.stringify(res.headers));
					res.setEncoding('utf8');
				res.on('data', function(chunk){
					// console.log('BODY:'+ chunk);
				});
				res.on('end', function(){
					// console.log('No more data in response.')
				});
			});

			req.on('error', function(e){
				// console.log('problem with request: ' + e.message);
			});

			// write data to request body
			req.write(postData);
			req.end();
    	},
    	function(prev, callback){
    		var resp = JSON.parse(prev);
    		resp['set-cookie'] = resp['set-cookie'][0];
    		// console.log(resp);
    		var options = {
				host: 'sms.tsu.ge',
				path: '/sms/Students/StudBarati.aspx',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					'Cookie': resp['set-cookie'],
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1'
				}
			};
			// console.log(options);

			var req2 = http.get(options, function(res) {
					// console.log('STATUS: ' + res.statusCode);
					// console.log(res.headers);
					callback(null, JSON.stringify(options.headers), resp);
					var bodyChunks = [];
					res.on('data', function(chunk) {
					bodyChunks.push(chunk);
				}).on('end', function(){
						var body = Buffer.concat(bodyChunks);
						// console.log('BODY: ' + body);
                        var $ = cheerio.load(body);
                        var json = [];
                        for(var i = 1; i<=$('#ctl00_C1_GridView1').children('tr').length-1; i++){

                            var finals = $('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(9).html();
                            var jQ = cheerio.load(finals);

                            var final1 = jQ('span').eq(0).text().length?parseInt(jQ('span').eq(0).text()) : 0;
                            var final2 = jQ('span').eq(1).text().length?parseInt(jQ('span').eq(1).text()) : 0;
                            var grades = [
                                    parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(4).text())?parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(4).text()):0,
                                    parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(5).text())?parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(5).text()):0,
                                    parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(6).text())?parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(6).text()):0,
                                    parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(7).text())?parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(7).text()):0,
                                    parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(8).text())?parseInt($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(8).text()):0,
                                    final1+final2
                                ];
                            function add(a,b){
                                return a+b;
                            }
                            var sum = grades.reduce(add,0);
                            json.push({
                                name : $('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(1).text(),
                                grades : grades,
                                sum : sum
                            });
                            // console.log($('#ctl00_C1_GridView1').children('tr').eq(i).children('td').eq(1).text());
                        }
                        console.log("DONE!");
                        fs.writeFile('grades.json', JSON.stringify(json), function(err){
                          if (err) throw err;
                          console.log('It\'s saved!');
                        });
                        // console.log($('#ctl00_C1_GridView1').children('tr').length)

					});
				});

			req2.on('error', function(e) {
			console.log('ERROR: ' + e.message);
			});


    	},function(headers,prev, callback){
   //  		prev['set-cookie'] = prev['set-cookie'][0];
   //  		// console.log(prev);
   //  		var options = {
			// 	host: 'sms.tsu.ge',
			// 	path: '/sms/Students/StudBarati.aspx',
			// 	headers: {
			// 		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			// 		'Accept-Language': 'en-US,en;q=0.5',
			// 		'Accept-Encoding': 'gzip, deflate',
			// 		'Cookie': prev['set-cookie'],
			// 		'Connection': 'keep-alive',
			// 		'Upgrade-Insecure-Requests': '1'
			// 	}
			// };
			// // console.log(options);

			// var req2 = http.get(options, function(res) {
			// 		// console.log('STATUS: ' + res.statusCode);
			// 		// console.log(res.headers);
			// 		var bodyChunks = [];
			// 		res.on('data', function(chunk) {
			// 		bodyChunks.push(chunk);
			// 	}).on('end', function(){
			// 			var body = Buffer.concat(bodyChunks);
			// 			console.log('BODY: ' + body);
			// 		});
			// 	});

			// req2.on('error', function(e) {
			// console.log('ERROR: ' + e.message);
			// });
			callback(null, 'done');
    	}
	],function(err,result){
		// console.log(err);
	});


  });
});

req.on('error', function(e) {
  console.log('ERROR: ' + e.message);
});
