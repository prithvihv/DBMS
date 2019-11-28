var express = require("express")
var app = express()
var bodyParser = require("body-parser")
var methodOverride = require("method-override")
var mysql = require("mysql")
var connectionObject = {
	host: "localhost",
	user: 'root',
	password: 'pageupto123',
	database: 'patashala',
	port: 3306
};
var session = require("express-session")
var forEach = require('async-foreach').forEach

// =====================
//      APP CONFIG
// =====================

// tells express to convet ejs files to html files
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

// creates a session class
app.use(session({
	secret: "DBMS mini project",
	resave: false,
	saveUninitialized: false
}));

app.use(function (req, res, next) {
	res.locals.currentUser = req.session.user;
	next();
});

// ================
//   INDEX ROUTES
// ================

// ----------------------
// ROOT - show index page
// ----------------------
app.get("/", function (req, res) {
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err) {
		if (err) { console.log(err) }
		else {
			connection.query("SELECT DISTINCT City, Area FROM college", function (err2, locations, fields) {
				if (err2) { console.log(err2) }
				else {
					var cities = new Set();
					locations.forEach(function (element, index) {
						cities.add(element.City);
					});
					let citiesArray = Array.from(cities);
					console.log(JSON.stringify(citiesArray));
					connection.end();
					res.render("index", { cities: citiesArray, locations: locations });
				}
			});
		}
	});
});

app.post("/", function (req, res) {
	res.redirect("/college/" + req.body.city + "/" + req.body.area + "");
});

// -------
// LOGIN
// -------

//show login form
app.get("/login", function (req, res) {
	res.render("login");
});

//login logic
app.post("/login", function (req, res) {
	email = req.body.user.email;
	password = req.body.user.password;
	var query = "SELECT * FROM user WHERE email = ?";

	var connection = mysql.createConnection(connectionObject);
	connection.query(query, [email], function (err, results, fields) {
		if (err) { console.log(err); }
		else {
			if (results.length > 0) {
				if (results[0].Password == password) {
					req.session.user = results[0];
					res.redirect("/");
				} else {
					connection.end();
					res.send("email does not match password");
				}
			} else {
				connection.end();
				res.send("email does not exist");
			}
		}
	});
});

// ---------
// REGISTER
// ---------

// show form to register
app.get("/register", function (req, res) {
	res.render("register");
});

// register logic
app.post("/register", function (req, res) {

	fname = req.body.user.fname;
	lname = req.body.user.lname;
	mobile = req.body.user.mobile;
	email = req.body.user.email;
	password = req.body.user.password;
	address = req.body.user.address;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(async (err) => {
		if (err) {
			console.log(err)
		} else {
			var values = [[fname, lname, mobile, email, password, address]];
			var queryFields = "Fname, Lname, Mobile, Email, Password, Address";
			var query = "INSERT INTO user(" + queryFields + ") VALUES ?";
			await exeQuer(connection, query, values)
			connection.end();
			await
				res.redirect("/login");
		}
	});
});

let exeQuer = async (connection, q, values) => {
	return new Promise((res, rej) => {
		connection.query(q, [values], function (err, result, fields) {
			if (err) {
				console.log(err);
			} else {
				res()
			}
		})
	})
}

// ----------
//   LOGOUT
// ----------
app.get("/logout", function (req, res) {
	delete req.session.user;
	res.redirect("/");
});

// ======================
//   RESTAURANTS ROUTES
// ======================

// INDEX - show all restaurants
app.get("/college/:city/:area", function (req, res) {

	var finalColleges = [];
	var semifinalColleges = [];
	var city = req.params.city;
	var area = req.params.area;
	var location = { city: city, area: area };

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {

		if (err1) { console.log(err1); }
		else {
			var query1 = "SELECT * FROM college where City = '" + city + "' and Area = '" + area + "'";
			connection.query(query1, function (err2, colleges, fields) {

				if (err2) { console.log(err2); }
				else {

					forEach(colleges, function (college, index) {

						var query2 = "SELECT Department_name FROM department WHERE College_id = " + college.College_id;
						connection.query(query2, function (err3, menuNames, index) {
							if (err3) { console.log(err3); }
							else {
								college.menuNames = menuNames;
								semifinalColleges.push(college);
							}
						});
						var done = this.async();
						setTimeout(done, 50);
					},
						function (notAborted) {

							forEach(semifinalColleges, function (college, index) {

								var query3 = "SELECT COUNT(*) FROM review WHERE College_id =" + college.College_id;
								connection.query(query3, function (err4, noOfReviews, index) {
									if (err4) { console.log(err4); }
									else {
										college.noOfReviews = noOfReviews[0]["COUNT(*)"];
										finalColleges.push(college);
									}
								});
								var done = this.async();
								setTimeout(done, 50);
							},
								function (notAborted2) {
									console.log(JSON.stringify(finalColleges));
									connection.end();
									res.render("college/index", { colleges: finalColleges, location: location });
								});
						});
				}
			});
		}
	});
});

// NEW - form to create a new restaurant
app.get("/college/new", isLoggedIn, function (req, res) {
	res.render("college/new");
});

// CREATE - creates a new restaurants
app.post("/college", isLoggedIn, function (req, res) {

	var Name = req.body.college.Name;
	var Logo = req.body.college.Logo;
	var Description = req.body.college.Description;
	var Rating = req.body.college.Rating;
	var City = req.body.college.City;
	var Area = req.body.college.Area;
	var connection = mysql.createConnection(connectionObject);
	connection.connect(async (err1) => {
		if (err1) { console.log(err1); }
		else {
			// first insert into restaurant table then insert into user
			var values = [[Name, Logo, Description, Rating, City, Area]];
			var queryFields = "Name, Logo, Description, Rating, City, Area";
			var query = "INSERT INTO college(" + queryFields + ") VALUES ?";
			await exeQuer(connection, query, values)
			// then inset new user
			// values = [[Name, " ", 20 * Math.random(), `${Name}@gmail.com`, Name, `${Area} + ${City}`]];
			// queryFields = "Fname, Lname,Mobile, Email, Password, Address";
			// query = "INSERT INTO user(" + queryFields + ") VALUES ?";
			// await exeQuer(connection, query, values)
			connection.end();
			res.redirect("/");
		}
	});
});

// SHOW - shows more information about one restaurants
app.get("/college/:id", function (req, res) {

	restaurantId = req.params.id;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {
			var query1 = "SELECT * FROM college where College_id = " + restaurantId;
			connection.query(query1, function (err2, college, fields1) {

				if (err2) { console.log(err2); }
				else {
					college = college[0];

					var query2 = "SELECT * FROM department WHERE College_id = " + college.College_id;
					connection.query(query2, function (err3, department, fields2) {
						if (err3) { console.log(err3); }
						else {
							college.department = department;
							forEach(college.department, function (menu, index) {

								var query3 = "SELECT * FROM course WHERE Department_id = " + menu.Department_id;
								connection.query(query3, function (err4, course, fields3) {
									if (err4) { console.log(err4) } else {
										college.department[index].course = course;
									}
								});
								var done = this.async();
								setTimeout(done, 50);
							}, function (notAborted) {

								var query4 = "SELECT r.*,DATE_FORMAT(r.Review_date,'%d/%m/%Y') AS niceDate, u.Fname  FROM review r, USER u WHERE r.College_id = " + college.College_id + " and r.User_id = u.User_id";
								connection.query(query4, function (err5, reviews, fields4) {
									if (err5) { console.log(err5) } else {
										college.reviews = reviews;
										console.log(JSON.stringify(college));
										connection.end();
										console.log(college.department[0].course)
										res.render("college/show", { college: college });
									}
								});
							});
						}
					});
				}
			});
		}
	});
});

// =================
//   REVIEWS ROUTES
// =================

// NEW - form to create a new review for the particular restaurant
app.get("/college/:id/reviews/new", isLoggedIn, function (req, res) {
	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log("1" + err1); }
		else {
			var query = "SELECT * FROM college WHERE College_id = " + req.params.id;
			connection.query(query, function (err2, college, fields) {
				if (err2) { console.log(err2); } else {
					if (college.length <= 0) {
						res.send("restaurant does not exist");
					} else {
						console.log(college[0]);
						connection.end();
						res.render("reviews/new", { college: college[0], user: req.session.user });
					}
				}
			});
		}
	});
});

// CREATE - creates a new review
app.post("/college/:id/reviews", isLoggedIn, function (req, res) {

	var Review = req.body.review.Review;
	var Rating = req.body.review.Rating;
	var UserId = req.session.user.User_id;

	var College_id = req.params.id;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			var queryFields = "Review_date, Review, Rating, User_id, College_id";
			var query = "INSERT INTO review(" + queryFields + ") VALUES (CURDATE(), '" + Review + "', " + Rating + ", " + UserId + ", " + College_id + ")";
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("review created");
					connection.end();
					res.redirect("/college/" + College_id);
				}
			});
		}
	});
});

// ================
//   MENU ROUTES
// ================

// NEW - form to create a new menu for the particular restaurant
app.get("/college/:id/department/new", isLoggedIn, function (req, res) {

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			var query = "SELECT * FROM college WHERE College_id = " + req.params.id;
			connection.query(query, function (err2, College, fields) {
				if (err2) { console.log(err2); } else {
					if (College.length <= 0) {
						res.send("restaurant does not exist");
					} else {
						console.log(College[0]);
						connection.end();
						res.render("department/new", { college: College[0] });
					}
				}
			});
		}
	});
});

// CREATE - creates a new menu
app.post("/college/:id/department", isLoggedIn, function (req, res) {

	var departName = req.body.department.Department_name;
	var hod = req.body.department.HOD;
	var description = req.body.department.Description;
	var collegeid = req.params.id;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			var values = [[departName, hod, collegeid, description]];
			var queryFields = "Department_name,HOD ,College_id , Description";
			var query = "INSERT INTO department(" + queryFields + ") VALUES ?";

			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu created");
					connection.end();
					res.redirect("/college/" + collegeid);
				}
			});
		}
	});
});

// DELETE - Deletes an existing menu
app.delete("/restaurants/:restaurantId/menus/:menuId", isLoggedIn, function (req, res) {

	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			query = "DELETE FROM menu WHERE Menu_id=" + menuId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu deleted");
					connection.end();
					res.redirect("/restaurants/" + restaurantId);
				}
			});
		}
	});
});

// ===================
//   MENU_ITEM ROUTES
// ===================

// NEW - form to create a new menu_item for a particular restaurant
app.get("/college/:collegeid/department/:departmenid/course/new", isLoggedIn, function (req, res) {

	var collegeid = req.params.collegeid;
	var departmentid = req.params.departmenid;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			var query1 = "SELECT * FROM college WHERE College_id = " + collegeid;
			connection.query(query1, function (err2, colleges, fields) {
				if (err2) { console.log(err2); } else {
					if (colleges.length <= 0) {
						res.send("restaurant does not exist");
					} else {

						var query2 = "SELECT * FROM department WHERE Department_id = " + departmentid;
						connection.query(query2, function (err3, departments, fields) {
							if (err3) { console.log(err3); } else {
								if (departments.length <= 0) {
									connection.end();
									res.send("menu does not exist");
								} else {
									connection.end();
									res.render("course/new", { college: colleges[0], department: departments[0] });
								}
							}
						});
					}
				}
			});
		}
	});
});

// CREATE - creates a new menu_item for a particular restaurant
app.post("/college/:collegeid/department/:departmenid/course", isLoggedIn, function (req, res) {

	var collegeid = req.params.collegeid;
	var departmentid = req.params.departmenid;

	var Name = req.body.course.Name;
	var Description = req.body.course.Description;
	var CreditPoints = req.body.course.CreditPoints;
	var Duration = req.body.course.Duration;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {
			var values = [[Name, Description, CreditPoints, Duration, departmentid]];
			var queryFields = "Name ,Description ,CreditPoints ,Duration,Department_id";
			var query = "INSERT INTO course(" + queryFields + ") VALUES ?";

			connection.query(query, [values], function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu_item added");
					connection.end();
					res.redirect("/college/" + collegeid);
				}
			});
		}
	});

});

// DELETE - Deletes an existing menu
app.delete("/restaurants/:restaurantId/menus/:menuId/menu_items/:menuItemId", function (req, res) {
	var restaurantId = req.params.restaurantId;
	var menuId = req.params.menuId;
	var menuItemId = req.params.menuItemId;

	var connection = mysql.createConnection(connectionObject);
	connection.connect(function (err1) {
		if (err1) { console.log(err1); }
		else {

			query = "DELETE FROM menu_item WHERE Menu_item_id=" + menuItemId;
			connection.query(query, function (err2, results, fields) {
				if (err2) { console.log(err2); } else {
					console.log("menu item deleted");
					connection.end();
					res.redirect("/restaurants/" + restaurantId);
				}
			});
		}
	});

});

// =================
//   AUTH FUNCTION
// =================
function isLoggedIn(req, res, next) {
	if (req.session.user) {
		return next();
	} else {
		res.redirect("/login");
	}
}

// ================
//   RUN SERVER
// ================
app.listen(8080, function () {
	console.log("FPP server is running")
});




