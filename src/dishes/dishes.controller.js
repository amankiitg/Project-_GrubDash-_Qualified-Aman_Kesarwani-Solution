const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      if(data[propertyName]!=""){
        return next();
      }
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

function pricePropertyIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if ((price > 0) && (isInt(price)) && (typeof price === 'number')) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}

function create(req, res) {
  const { data: { name, description , price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(), // Increment last id then assign as the current ID
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => Number(dish.id) === Number(dishId));
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function match(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if(id) {
    if ((dishId === id)) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
  }
  return next();
  
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description , price, image_url } = {} } = req.body;

  // Update the paste
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
}

function destroy(req, res) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === Number(dishId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedDishes = dishes.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        create
  ],
  list,
  read: [dishExists, read],
  update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        match,
        update],
};