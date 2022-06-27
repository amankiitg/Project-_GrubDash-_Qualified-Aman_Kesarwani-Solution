const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      if(data[propertyName]!=""){
        return next();
      }
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}
                 
function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if(dishes){
    if((Array.isArray(dishes)) && (dishes.length>0)){
        return next();
    } else {
        next({
    status: 400,
    message: `Order must include at least one dish`,
  });
    }
  }
  next({
    status: 400,
    message: `Order must include a dish`,
  });
}

function quantityPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if(quantity) {
      if (!((quantity > 0) && (isInt(quantity)) && (typeof quantity === 'number')) ) {
        return next({
    status: 400,
    message: `Dish ${index} must have a quantity that is an integer greater than 0`});
       };
    }  else {
       return next({
    status: 400,
    message: `Dish ${index} must have a quantity that is an integer greater than 0`});
    }
  });
  return next();
}


function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  const newOrder = {
    id: nextId(), // Increment last id then assign as the current ID
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => Number(order.id) === Number(orderId));
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function match(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if(id) {
    if ((orderId === id)) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
  }
  return next();
  
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function update(req, res) {
  const foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  // Update the paste
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

function statusPropertyIsPending(req, res, next) {
  const foundOrder = res.locals.order;
  if (foundOrder.status==="pending") {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => Number(order.id) === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}


module.exports = {
  create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        create
  ],
  list,
  read: [orderExists, read],
  update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        statusPropertyIsValid,
        match,
        update],
   delete: [orderExists, statusPropertyIsPending, destroy],
};