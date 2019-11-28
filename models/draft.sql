use patashala;

DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS college;
DROP TABLE IF EXISTS user;

-- creation
CREATE TABLE user(

	User_id INT AUTO_INCREMENT PRIMARY KEY,
	Fname VARCHAR(20) not null,
	Lname VARCHAR(20) not null,
	Mobile BIGINT(15) not null,
	Email VARCHAR(30) not null,
	Password VARCHAR(20) not null,
	Address VARCHAR(100) not null,
	unique(Email),
	unique(Mobile)

);



CREATE TABLE college(

	College_id INT AUTO_INCREMENT PRIMARY KEY,
	Name VARCHAR(50) not null,
	Logo VARCHAR(200) not null,
	Description VARCHAR(400) not null,
	Rating int(2) not null,
	City varchar(30) not null,
	Area varchar(30) not null
);

CREATE TABLE department(

	Department_id INT AUTO_INCREMENT PRIMARY KEY,
	Department_name Varchar(50) not null,
	HOD  Varchar(50) not null,
	College_id INT,
	Description VARCHAR(400) not null,
	FOREIGN KEY(College_id) REFERENCES college(College_id) ON DELETE CASCADE

);

CREATE TABLE course(

	course_id INT AUTO_INCREMENT PRIMARY KEY,
	Name VARCHAR(50) not null,
	Description VARCHAR(50) not null,
	CreditPoints INT(5) not null,
	Duration VARCHAR(50) not null,
	Department_id INT not null,
	FOREIGN KEY(Department_id) REFERENCES department(Department_id) ON DELETE CASCADE
);


CREATE TABLE review(

	Review_id INT AUTO_INCREMENT PRIMARY KEY,
	Review_date DATE not null,
	Review VARCHAR(100) not null,
	Rating INT(2) not null,
	User_id INT not null,
	College_id INT not null,
	FOREIGN KEY(User_id) REFERENCES user(User_id) ON DELETE CASCADE,
	FOREIGN KEY(College_id) REFERENCES college(College_id) ON DELETE CASCADE
);
-- correct procedure and trigger

-- delimiter //
-- drop PROCEDURE IF EXISTS onNewRestaurant//
-- CREATE PROCEDURE onNewRestaurant()
-- BEGIN
--    Insert into menu ( Department_name, College_id) values("Default Menu", (select max(College_id) from restaurant));
-- END//

-- drop procedure IF EXISTS onNewMenu//
-- CREATE PROCEDURE onNewMenu()
-- BEGIN
-- 	INSERT into menu_item(Name, Image, Veg, Price, Serves, Department_id)
-- 		VALUES("Default Name", "http://clipartwork.com/wp-content/uploads/2017/02/food-clipart.jpeg", 1, 50, 2, (select max(Department_id) from menu));
-- END//

-- drop trigger if EXISTS onNewRestaurantTrigger//
-- CREATE TRIGGER onNewRestaurantTrigger
-- AFTER INSERT ON restaurant
-- FOR EACH ROW
-- BEGIN
-- CALL onNewRestaurant();
-- END//

-- drop trigger if EXISTS onNewMenuTrigger//
-- CREATE TRIGGER onNewMenuTrigger
-- AFTER INSERT ON menu
-- FOR EACH ROW
-- BEGIN
-- CALL onNewMenu();
-- END//



